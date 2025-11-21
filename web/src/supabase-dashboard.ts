// src/supabase-dashboard.ts
import { supabase } from './supabase';

export interface Reading {
  id: number;
  device_id: string;
  ts: number;
  gas_value: number;
  fire_value: number;
  humidity_value: number;
  keypad_status: string | null;
}

export interface DeviceStatus {
  device_id: string;
  last_seen: number;
  system_armed: boolean;
  led_red: boolean;
  led_green: boolean;
  buzzer: boolean;
}

export interface Event {
  id: number;
  device_id: string;
  ts: number;
  type: string;
  value: string;
}

export const dashboardService = {
<<<<<<< HEAD
  // Récupérer les dernières lectures (pour les jauges)
  async getLatestReadings(deviceId: string): Promise<Reading | null> {
    try {
=======
  // Récupérer les dernières lectures - CORRIGÉ
  async getLatestReadings(deviceId: string): Promise<Reading | null> {
    try {
      console.log('🔍 Fetching latest readings for device:', deviceId);
      
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false })
<<<<<<< HEAD
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest readings:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Exception in getLatestReadings:', error);
=======
        .limit(1);

      if (error) {
        console.error('❌ Error fetching latest readings:', error);
        return null;
      }
      
      // Retourner le premier élément du tableau ou null si vide
      const result = data && data.length > 0 ? data[0] : null;
      console.log('✅ Latest readings:', result);
      return result;
    } catch (error) {
      console.error('❌ Exception in getLatestReadings:', error);
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      return null;
    }
  },

<<<<<<< HEAD
  // Récupérer le statut actuel du device
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const { data, error } = await supabase
        .from('device_status')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (error) {
        console.error('Error fetching device status:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Exception in getDeviceStatus:', error);
=======
  // Récupérer le statut du device - CORRIGÉ
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      console.log('🔍 Fetching device status for:', deviceId);
      
      const { data, error } = await supabase
        .from('device_status')
        .select('*')
        .eq('device_id', deviceId);

      if (error) {
        console.error('❌ Error fetching device status:', error);
        return null;
      }
      
      // Retourner le premier élément ou null
      const status = data && data.length > 0 ? data[0] : null;
      console.log('✅ Device status:', status);
      
      if (!status) {
        console.log('📝 No device status found, creating default entry');
        return this.createDefaultDeviceStatus(deviceId);
      }
      
      return status;
    } catch (error) {
      console.error('❌ Exception in getDeviceStatus:', error);
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      return null;
    }
  },

<<<<<<< HEAD
  // Récupérer l'historique des lectures pour les graphiques
  async getHistoricalReadings(deviceId: string, hours: number = 24): Promise<Reading[]> {
    try {
      const since = Date.now() - (hours * 60 * 60 * 1000);
=======
  // Créer un statut par défaut si non existant - CORRIGÉ
  async createDefaultDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const defaultStatus = {
        device_id: deviceId,
        last_seen: Math.floor(Date.now() / 1000), // en secondes
        system_armed: false,
        led_red: false,
        led_green: false,
        buzzer: false
      };

      const { data, error } = await supabase
        .from('device_status')
        .insert([defaultStatus])
        .select();

      if (error) {
        console.error('❌ Error creating default device status:', error);
        return null;
      }

      console.log('✅ Created default device status:', data?.[0]);
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Exception in createDefaultDeviceStatus:', error);
      return null;
    }
  },

  // Récupérer l'historique des lectures pour les graphiques - CORRIGÉ
  async getHistoricalReadings(deviceId: string, hours: number = 24): Promise<Reading[]> {
    try {
      // Convertir en millisecondes puis en secondes (comme stocké en base)
      const since = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000);
      
      console.log(`🔍 Fetching historical data for ${hours}h, since:`, new Date(since * 1000));
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('device_id', deviceId)
        .gte('ts', since)
        .order('ts', { ascending: true });

      if (error) {
<<<<<<< HEAD
        console.error('Error fetching historical readings:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Exception in getHistoricalReadings:', error);
=======
        console.error('❌ Error fetching historical readings:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} historical readings`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getHistoricalReadings:', error);
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      return [];
    }
  },

<<<<<<< HEAD
  // Récupérer les événements récents
  async getRecentEvents(deviceId: string, limit: number = 10): Promise<Event[]> {
    try {
=======
  // Récupérer les événements récents - CORRIGÉ
  async getRecentEvents(deviceId: string, limit: number = 10): Promise<Event[]> {
    try {
      console.log('🔍 Fetching recent events for device:', deviceId);
      
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false })
        .limit(limit);

      if (error) {
<<<<<<< HEAD
        console.error('Error fetching events:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Exception in getRecentEvents:', error);
=======
        console.error('❌ Error fetching events:', error);
        return [];
      }
      
      console.log('✅ Recent events:', data);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getRecentEvents:', error);
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      return [];
    }
  },

<<<<<<< HEAD
  // Récupérer tous les événements pour l'historique
  async getAllEvents(deviceId: string): Promise<Event[]> {
    try {
=======
  // Récupérer tous les événements pour l'historique - CORRIGÉ
  async getAllEvents(deviceId: string): Promise<Event[]> {
    try {
      console.log('🔍 Fetching all events for device:', deviceId);
      
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false });

      if (error) {
<<<<<<< HEAD
        console.error('Error fetching all events:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Exception in getAllEvents:', error);
=======
        console.error('❌ Error fetching all events:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} events`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getAllEvents:', error);
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      return [];
    }
  },

<<<<<<< HEAD
  // NOUVELLE FONCTION : Récupérer tous les readings pour l'historique
  async getAllReadings(deviceId: string): Promise<Reading[]> {
    try {
=======
  // Récupérer tous les readings pour l'historique - CORRIGÉ
  async getAllReadings(deviceId: string): Promise<Reading[]> {
    try {
      console.log('🔍 Fetching all readings for device:', deviceId);
      
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false });

      if (error) {
<<<<<<< HEAD
        console.error('Error fetching all readings:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Exception in getAllReadings:', error);
=======
        console.error('❌ Error fetching all readings:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} readings`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getAllReadings:', error);
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
      return [];
    }
  },

<<<<<<< HEAD
=======
  // Vérifier si le device existe - CORRIGÉ
  async checkDeviceExists(deviceId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if device exists:', deviceId);
      
      const { data, error } = await supabase
        .from('devices')
        .select('id')
        .eq('id', deviceId)
        .limit(1);

      if (error) {
        console.error('❌ Error checking device existence:', error);
        return false;
      }
      
      const exists = data && data.length > 0;
      console.log('✅ Device exists:', exists);
      return exists;
    } catch (error) {
      console.error('❌ Exception in checkDeviceExists:', error);
      return false;
    }
  },

>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
  // Helper pour formater le type d'événement
  formatEventType(type: string): string {
    const types: Record<string, string> = {
      'keypad': 'Accès RFID',
      'gas': 'Gaz',
      'fire': 'Feu',
      'system': 'Système',
      'humidity': 'Humidité'
    };
    return types[type] || type;
  },

  // Helper pour déterminer le statut d'un événement
  getEventStatus(type: string, value: string): string {
    if (type === 'keypad') {
      return value.includes('granted') ? 'Accepté' : 'Refusé';
    }
    if (type === 'gas' && parseInt(value) > 70) return 'Alerte';
    if (type === 'fire' && parseInt(value) > 40) return 'Urgent';
    if (type === 'system') return 'Normal';
    return 'Normal';
  },

  // Helper pour déterminer l'action
  getEventAction(type: string): string {
    const actions: Record<string, string> = {
      'keypad': 'Accès vérifié',
      'gas': 'Alerte envoyée',
      'fire': 'Alerte envoyée',
      'system': 'État modifié',
      'humidity': 'Mesure enregistrée'
    };
    return actions[type] || 'Événement enregistré';
<<<<<<< HEAD
  },

  // NOUVEAU : Vérifier si le device existe
  async checkDeviceExists(deviceId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id')
        .eq('id', deviceId)
        .single();

      if (error) {
        console.error('Error checking device existence:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Exception in checkDeviceExists:', error);
      return false;
    }
  },

  // NOUVEAU : Envoyer une commande de contrôle
  async sendControlCommand(deviceId: string, command: string, value: boolean): Promise<boolean> {
    try {
      const updateData: Partial<DeviceStatus> = {};

      switch (command) {
        case 'led_green':
          updateData.led_green = value;
          break;
        case 'led_red':
          updateData.led_red = value;
          break;
        case 'buzzer':
          updateData.buzzer = value;
          break;
        case 'system_armed':
          updateData.system_armed = value;
          break;
        default:
          console.error('Unknown command:', command);
          return false;
      }

      const { error } = await supabase
        .from('device_status')
        .update(updateData)
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error sending control command:', error);
        return false;
      }

      // Enregistrer l'événement
      await supabase
        .from('events')
        .insert({
          device_id: deviceId,
          ts: Date.now(),
          type: 'system',
          value: `${command}:${value ? 'on' : 'off'}`
        });

      return true;
    } catch (error) {
      console.error('Exception in sendControlCommand:', error);
      return false;
    }
  }
};
=======
  }
};
>>>>>>> 616d06371d46bd4b8a219dfc61aaec59c7eb679a
