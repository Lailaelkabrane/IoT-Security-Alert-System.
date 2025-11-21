<<<<<<< HEAD
# IoT Security & Alert System 🔒

## 🧩 Description
An IoT-based system designed to monitor and secure home environments in real time.  
It detects fire, gas leaks, and intrusion attempts, and sends alerts through a connected **web dashboard (admin)** and **mobile application (user)**.

---

## ⚙️ Technologies Used
- **ESP32** (Microcontroller)
- **Firebase Realtime Database**
- **Firebase Authentication**
- **HTML / CSS / JavaScript**
- **Chart.js** for data visualization
- **Mobile App:** Android ( React Native)
- **Firebase Hosting** for web deployment

---

## 💻 Features
- Real-time monitoring of:
  - Gas and fire sensors  
  - Keypad access and system arming/disarming  
- Visual and sound alerts (LEDs & buzzer)
- Secure admin login via Firebase  
- **Web Dashboard** for admins:
  - Charts, logs, and alert history  
  - User and device management  
  - Threshold configuration  
- **Mobile Application** for users:
  - View live sensor data  
  - Receive instant alerts (gas, fire, intrusion)  
  - Check system status in real time  
=======
# 🏠 IoT Home Security System – ESP32 + Cloudflare Workers + Supabase + Firebase

Un système complet de sécurité domestique basé sur une architecture Cloud moderne.  
Le projet combine l’IoT (ESP32 + capteurs) avec un backend serverless (Cloudflare Worker), une base SQL cloud (Supabase), et une interface web admin sécurisée (Firebase Hosting + Firebase Auth + MFA).

---

## ⭐ Fonctionnalités principales

### 🔐 Sécurité & Contrôle d’accès
- Authentification Firebase (Email/Password + Google)
- MFA (code 6 chiffres envoyé par email via Resend)
- Whitelist UID pour restreindre l’accès au dashboard
- HMAC SHA-256 entre l’ESP32 et le Worker
- Communication sécurisée 100% en HTTPS

### 📡 IoT (ESP32)
- Lecture en temps réel :
  - Gaz (MQ-135)
  - Feu (capteur de flamme)
  - Fuite d’eau (capteur d’humidité)
  - Accès RFID (RFID RC522)
- Envoi JSON + signature HMAC
- Requête sécurisée vers le Cloudflare Worker

### ☁️ Cloudflare Worker (Backend Serverless)
- Vérification HMAC
- Vérification device_id
- Validation / sanitation des données
- Insertion dans Supabase (service-role key sécurisée)
- Gestion MFA (start + verify)

### 🗄 Base de données SQL : Supabase PostgreSQL
Tables principales :
- `devices`
- `readings`
- `events`
- `admins`
- `mfa_pending`
- `mfa_state`
- `device_status`

### 🖥 Dashboard Admin (React + Vite + Tailwind + Firebase Hosting)
- Page Login
- Page MFA
- Dashboard temps réel
- Visualisation des capteurs
- Historique filtrable
- Export CSV
- Logs de connexion (Stockés dans Supabase Storage)


## 🔧 Technologies utilisées

### **IoT**
- ESP32
- MQ-135 (gaz)
- Flame Sensor
- Soil Moisture Sensor (eau)
- RFID RC522

### **Backend**
- Cloudflare Workers (serverless)
- HMAC SHA-256
- MFA email (Resend)
- Supabase DB PostgreSQL
- Supabase Storage (logs)
- Firebase Authentication

### **Front-End**
- React.js
- Vite
- Tailwind CSS
- Firebase SDK (Auth + Hosting)

---

## 🔑 Sécurité du système

- Toutes les clés (`SERVICE_ROLE`, `HMAC_SECRET`, etc.) sont stockées dans :
  - **Cloudflare Secrets Vault**
- Aucune clé n’est exposée dans le front-end
- Le Worker est le seul composant autorisé à écrire dans Supabase
- MFA renforcé : codes stockés sous forme de hash

---

## 🚀 Déploiement

### 1. **Déploiement du front-end**
```sh
cd web
npm install
npm run build
firebase deploy --only hosting
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a

