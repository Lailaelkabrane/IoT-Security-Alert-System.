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

export interface Device {
  id: string;
  label: string;
  created_at: number;
}

export const dashboardService = {
  // Récupérer les dernières lectures - CORRIGÉ
  async getLatestReadings(deviceId: string): Promise<Reading | null> {
    try {
      console.log('🔍 Fetching latest readings for device:', deviceId);
      
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching latest readings:', error);
        return null;
      }
      
      const result = data && data.length > 0 ? data[0] : null;
      console.log('✅ Latest readings:', result);
      return result;
    } catch (error) {
      console.error('❌ Exception in getLatestReadings:', error);
      return null;
    }
  },

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
      
      const status = data && data.length > 0 ? data[0] : null;
      console.log('✅ Device status:', status);
      
      if (!status) {
        console.log('📝 No device status found, creating default entry');
        return this.createDefaultDeviceStatus(deviceId);
      }
      
      return status;
    } catch (error) {
      console.error('❌ Exception in getDeviceStatus:', error);
      return null;
    }
  },

  // Créer un statut par défaut si non existant
  async createDefaultDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const defaultStatus = {
        device_id: deviceId,
        last_seen: Math.floor(Date.now() / 1000),
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

  // Récupérer l'historique des lectures pour les graphiques - CORRIGÉ POUR L'ORDRE CHRONOLOGIQUE
   // Récupérer l'historique des lectures pour les graphiques - CORRIGÉ POUR L'ORDRE INVERSE
  async getHistoricalReadings(deviceId: string, hours: number = 24): Promise<Reading[]> {
   try {
    const since = Math.floor((Date.now() - (hours * 60 * 60 * 1000)) / 1000);
    
    console.log(`🔍 Fetching historical data for ${hours}h, since:`, new Date(since * 1000));
    
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('device_id', deviceId)
      .gte('ts', since)
      .order('ts', { ascending: false }); // 🔥 IMPORTANT: tri DESCENDANT pour graphique inversé

    if (error) {
      console.error('❌ Error fetching historical readings:', error);
      return [];
    }
    
    console.log(`✅ Found ${data?.length || 0} historical readings (sorted DESC)`);
    return data || [];
   } catch (error) {
    console.error('❌ Exception in getHistoricalReadings:', error);
    return [];
  }
},

  // Récupérer les événements récents - CORRIGÉ POUR TOUS LES ÉVÉNEMENTS
  async getRecentEvents(deviceId: string, limit: number = 10): Promise<Event[]> {
    try {
      console.log('🔍 Fetching recent events for device:', deviceId);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching events:', error);
        // Si la table events n'existe pas ou est vide, retourner des événements de test
        console.log('📝 No events found, returning empty array');
        return [];
      }
      
      console.log('✅ Recent events found:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getRecentEvents:', error);
      return [];
    }
  },

  // Récupérer tous les événements pour l'historique
  async getAllEvents(deviceId: string): Promise<Event[]> {
    try {
      console.log('🔍 Fetching all events for device:', deviceId);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all events:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} events`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getAllEvents:', error);
      return [];
    }
  },

  // Récupérer tous les readings pour l'historique
  async getAllReadings(deviceId: string): Promise<Reading[]> {
    try {
      console.log('🔍 Fetching all readings for device:', deviceId);
      
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('device_id', deviceId)
        .order('ts', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all readings:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} readings`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getAllReadings:', error);
      return [];
    }
  },

  // Vérifier si le device existe
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

  // Récupérer les informations du device
  async getDeviceInfo(deviceId: string): Promise<Device | null> {
    try {
      console.log('🔍 Fetching device info for:', deviceId);
      
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .limit(1);

      if (error) {
        console.error('❌ Error fetching device info:', error);
        return null;
      }
      
      const device = data && data.length > 0 ? data[0] : null;
      console.log('✅ Device info:', device);
      return device;
    } catch (error) {
      console.error('❌ Exception in getDeviceInfo:', error);
      return null;
    }
  },

  // Helper pour formater le type d'événement
  formatEventType(type: string): string {
    const types: Record<string, string> = {
      'keypad': 'Accès RFID',
      'gas': 'Gaz',
      'fire': 'Feu',
      'system': 'Système',
      'humidity': 'Humidité',
      'motion': 'Mouvement'
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
      'gas': 'Détection de gaz',
      'fire': 'Détection de feu',
      'system': 'État système modifié',
      'humidity': 'Mesure enregistrée',
      'motion': 'Mouvement détecté'
    };
    return actions[type] || 'Événement enregistré';
  }
};
