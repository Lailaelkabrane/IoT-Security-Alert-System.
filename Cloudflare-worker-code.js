// ===================== Worker Cloudflare (Supabase + Brevo) =====================
// ENV requis : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BREVO_API_KEY, FROM_EMAIL, DEVICE_INGEST_SECRET

// ---------------------- Helpers communs ----------------------------------
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type,authorization,x-device-id,x-signature",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function genCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sha256Hex(s) {
  const buf = new TextEncoder().encode(s);
  const d = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyHmac(raw, secret, providedHex) {
  const keyData = new TextEncoder().encode(secret);
  const algoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const bodyData = new TextEncoder().encode(raw);
  const sigBuf = await crypto.subtle.sign("HMAC", algoKey, bodyData);
  const hex = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === String(providedHex).trim();
}

// ---------------------- Email sender (Brevo) -----------------------------
function parseFrom(fromStr) {
  const m = /^(.*)<\s*([^>]+)\s*>$/.exec(fromStr || "");
  if (m) return { name: m[1].trim().replace(/(^"|"$)/g, ""), email: m[2].trim() };
  return { name: undefined, email: (fromStr || "").trim() };
}

async function sendOtpEmail(env, to, subject, html) {
  if (!env.BREVO_API_KEY) throw new Error("BREVO_API_KEY missing");
  const fromParsed = parseFrom(env.FROM_EMAIL || "");
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromParsed.email, ...(fromParsed.name ? { name: fromParsed.name } : {}) },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
}

// ---------------------- Utils JWT (Firebase ID token) --------------------
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base + "===".slice((base.length + 3) % 4);
    return JSON.parse(atob(pad));
  } catch { return null; }
}

// ---------------------- Supabase Client ----------------------------------
function createSupabaseClient(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'return=minimal'
  };

  return {
    // --- Gestion des devices ---
    async upsertDevice(deviceId) {
      const response = await fetch(`${supabaseUrl}/rest/v1/devices`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: deviceId,
          label: `Device ${deviceId}`,
          created_at: Date.now()
        })
      });
      
      // Si conflit (device existe déjà), c'est OK
      if (response.status === 409) return { data: null, error: null };
      if (!response.ok) throw new Error(`Supabase devices error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    // --- Statut device ---
    async upsertDeviceStatus(deviceId, data) {
      const response = await fetch(`${supabaseUrl}/rest/v1/device_status`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          device_id: deviceId,
          last_seen: Date.now(),
          system_armed: !!data?.system_armed,
          led_red: !!data?.led_red,
          led_green: !!data?.led_green,
          buzzer: !!data?.buzzer
        })
      });
      
      if (!response.ok) throw new Error(`Supabase status error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    // --- Lectures capteurs ---
    async insertReading(deviceId, data, timestamp) {
      const response = await fetch(`${supabaseUrl}/rest/v1/readings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          device_id: deviceId,
          ts: timestamp || Date.now(),
          gas_value: data?.gas_value,
          fire_value: data?.fire_value,
          humidity_value: data?.humidity_value,
          keypad_status: data?.keypad_status
        })
      });
      
      if (!response.ok) throw new Error(`Supabase readings error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    // --- Événements ---
    async insertEvent(deviceId, eventType, value, timestamp) {
      const response = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          device_id: deviceId,
          ts: timestamp || Date.now(),
          type: eventType,
          value: value
        })
      });
      
      if (!response.ok) throw new Error(`Supabase events error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    // --- MFA Pending ---
    async getMfaPending(uid) {
      const response = await fetch(`${supabaseUrl}/rest/v1/mfa_pending?uid=eq.${uid}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (!response.ok) throw new Error(`Supabase mfa_pending get error: ${response.status}`);
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    },

    async upsertMfaPending(uid, data) {
      const response = await fetch(`${supabaseUrl}/rest/v1/mfa_pending`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          uid: uid,
          code_hash: data.code_hash,
          expires_at: data.expires_at,
          attempts: data.attempts || 0,
          last_sent: data.last_sent
        })
      });
      
      if (!response.ok) throw new Error(`Supabase mfa_pending upsert error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    async deleteMfaPending(uid) {
      const response = await fetch(`${supabaseUrl}/rest/v1/mfa_pending?uid=eq.${uid}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) throw new Error(`Supabase mfa_pending delete error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    // --- MFA State ---
    async upsertMfaState(uid, state) {
      const response = await fetch(`${supabaseUrl}/rest/v1/mfa_state`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          uid: uid,
          state: state,
          updated_at: Date.now()
        })
      });
      
      if (!response.ok) throw new Error(`Supabase mfa_state error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    async deleteMfaState(uid) {
      const response = await fetch(`${supabaseUrl}/rest/v1/mfa_state?uid=eq.${uid}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) throw new Error(`Supabase mfa_state delete error: ${response.status} ${await response.text()}`);
      return { data: null, error: null };
    },

    // --- Admins ---
    async getAdmin(uid) {
      const response = await fetch(`${supabaseUrl}/rest/v1/admins?uid=eq.${uid}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (!response.ok) throw new Error(`Supabase admins get error: ${response.status}`);
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    }
  };
}

// ---------------------- Worker principal ---------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type,authorization,x-device-id,x-signature",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    }

    // ----------------- /ingest (POST) -----------------
    if (url.pathname === "/ingest" && request.method === "POST") {
      const rawBody = await request.text();
      const deviceId = request.headers.get("x-device-id");
      const signature = request.headers.get("x-signature");
      if (!deviceId || !signature) return json({ error: "Missing headers" }, 400);

      const ok = await verifyHmac(rawBody, env.DEVICE_INGEST_SECRET, signature);
      if (!ok) return json({ error: "Invalid signature" }, 401);

      let payload;
      try { payload = JSON.parse(rawBody); }
      catch { return json({ error: "Invalid JSON" }, 400); }

      const supabase = createSupabaseClient(env);

      try {
        // 1. S'assurer que le device existe
        await supabase.upsertDevice(deviceId);

        // 2. Mettre à jour le statut de l'appareil
        await supabase.upsertDeviceStatus(deviceId, payload?.data);

        // 3. Insérer les lectures des capteurs
        await supabase.insertReading(deviceId, payload?.data, payload?.timestamp);

        // 4. Insérer un événement si keypad_status présent
        if (payload?.data?.keypad_status) {
          await supabase.insertEvent(deviceId, "keypad", payload.data.keypad_status, payload?.timestamp);
        }

        return json({ ok: true, verified: true, device_id: deviceId });
      } catch (e) {
        return json({ error: "Database write error", detail: String(e) }, 500);
      }
    }

    // ----------------- /mfa/start (POST) -----------------
    if (url.pathname === "/mfa/start" && request.method === "POST") {
      try {
        const body = await request.json();
        const idToken = body?.idToken;
        const uid = body?.uid;
        const session = body?.session;
        let email = body?.email;

        if (!idToken) return json({ ok: false, error: "missing idToken" }, 400);
        if (!uid) return json({ ok: false, error: "missing uid" }, 400);
        if (session == null) return json({ ok: false, error: "missing session" }, 400);

        // Vérifier si l'utilisateur est admin
        const supabase = createSupabaseClient(env);
        const admin = await supabase.getAdmin(uid);
        if (!admin) return json({ ok: false, error: "not an admin" }, 403);

        // Si email non fourni, lire depuis le token Firebase
        if (!email) {
          const payload = decodeJwtPayload(idToken);
          if (payload && payload.email) email = payload.email;
        }
        if (!email) return json({ ok: false, error: "missing email" }, 400);

        // 🔥 SUPPRIMER TOUJOURS l'état MFA existant
        await supabase.deleteMfaState(uid);
        await supabase.deleteMfaPending(uid);

        // 2) vérifier si code encore valide
        const now = Date.now();
        const pending = await supabase.getMfaPending(uid);

        if (pending && pending.code_hash && pending.expires_at && now < pending.expires_at) {
          // throttling: renvoi au plus 1 fois / 60s
          if (!pending.last_sent || now - pending.last_sent > 60 * 1000) {
            await supabase.upsertMfaPending(uid, {
              code_hash: pending.code_hash,
              expires_at: pending.expires_at,
              attempts: pending.attempts,
              last_sent: now
            });
            await sendOtpEmail(env, email, "Your 2FA code", `<p>Your code is still valid.</p>`);
          }
          return json({ ok: true, already_pending: true });
        }

        // 3) générer un nouveau code
        const code = genCode6();
        const expiresAt = now + 5 * 60 * 1000;
        const codeHash = await sha256Hex(code);

        await supabase.upsertMfaPending(uid, {
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
          last_sent: now
        });

        await sendOtpEmail(env, email, "Your 2FA code",
          `<p>Hello,</p><p>Your one-time code is: <b>${code}</b></p><p>It expires in 5 minutes.</p>`);

        return json({ ok: true, created: true });
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500);
      }
    }

    // ----------------- /mfa/verify (POST) -----------------
    if (url.pathname === "/mfa/verify" && request.method === "POST") {
      try {
        const { idToken, uid, code, session } = await request.json();
        if (!idToken || !uid || !code || session == null)
          return json({ ok: false, error: "missing fields" }, 400);

        // Valider le Firebase ID token
        const payload = decodeJwtPayload(idToken);
        if (!payload) return json({ ok: false, error: "malformed idToken" }, 400);

        if (env.FIREBASE_PROJECT_ID && payload.aud && payload.aud !== env.FIREBASE_PROJECT_ID)
          return json({ ok: false, error: "wrong audience" }, 401);
        if (payload.exp && Date.now() >= payload.exp * 1000)
          return json({ ok: false, error: "idToken expired" }, 401);
        if (!payload.sub || payload.sub !== uid)
          return json({ ok: false, error: "uid mismatch" }, 401);

        const supabase = createSupabaseClient(env);

        // Vérifier si admin
        const admin = await supabase.getAdmin(uid);
        if (!admin) return json({ ok: false, error: "not an admin" }, 403);

        // Charger le pending
        const pending = await supabase.getMfaPending(uid);
        if (!pending || !pending.code_hash || !pending.expires_at)
          return json({ ok: false, error: "no pending code" }, 400);
        if (Date.now() > pending.expires_at)
          return json({ ok: false, error: "code expired" }, 400);

        // Vérifier les tentatives
        if (pending.attempts >= 5) {
          await supabase.deleteMfaPending(uid);
          return json({ ok: false, error: "too many attempts" }, 400);
        }

        // Code correct ?
        const codeHash = await sha256Hex(code);
        if (codeHash !== pending.code_hash) {
          // Incrémenter les tentatives
          await supabase.upsertMfaPending(uid, {
            code_hash: pending.code_hash,
            expires_at: pending.expires_at,
            attempts: (pending.attempts || 0) + 1,
            last_sent: pending.last_sent
          });
          return json({ ok: false, error: "invalid code" }, 400);
        }

        // OK → marquer état MFA
        await supabase.upsertMfaState(uid, "ok");
        await supabase.deleteMfaPending(uid);

        return json({ ok: true });
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500);
      }
    }

    // 404
    return json({ error: "Not found" }, 404);
  }
};
