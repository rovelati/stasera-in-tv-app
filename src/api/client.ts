import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, ChannelSchedule, Program } from '../types';
import { fallbackChannels, fallbackStaseraSchedule } from './mockData';

const BASE_URL = 'https://www.intvstasera.it';

const CACHE_KEYS = {
  CHANNELS: '@intv_cache_channels_v1',
  STASERA: '@intv_cache_stasera_v1',
  ORA: '@intv_cache_ora_v1',
  DOMANI: '@intv_cache_domani_v1',
};

// ── Cache Helper ─────────────────────────────────────────────────────────────
async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch {
    return null;
  }
}

async function setCached<T>(key: string, data: T): Promise<void> {
  try {
    const payload = {
      timestamp: Date.now(),
      data,
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to cache API response:', err);
  }
}

// ── Channels API ─────────────────────────────────────────────────────────────
export async function fetchChannelsApi(): Promise<Channel[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/channels.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.channels && Array.isArray(json.channels)) {
      await setCached(CACHE_KEYS.CHANNELS, json.channels);
      return json.channels;
    }
  } catch (error) {
    console.warn('Network error fetching channels, falling back to cache:', error);
  }

  const cached = await getCached<Channel[]>(CACHE_KEYS.CHANNELS);
  if (cached && cached.length > 0) return cached;

  return fallbackChannels;
}

// ── Stasera Programs API ─────────────────────────────────────────────────────
export async function fetchStaseraProgramsApi(): Promise<ChannelSchedule[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/programs/stasera.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.schedule && Array.isArray(json.schedule)) {
      await setCached(CACHE_KEYS.STASERA, json.schedule);
      return json.schedule;
    }
  } catch (error) {
    console.warn('Network error fetching stasera, falling back to cache:', error);
  }

  const cached = await getCached<ChannelSchedule[]>(CACHE_KEYS.STASERA);
  if (cached && cached.length > 0) return cached;

  return fallbackStaseraSchedule;
}

// ── In Onda Ora API ──────────────────────────────────────────────────────────
export async function fetchOraProgramsApi(): Promise<{
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  allPrograms: Program[];
}[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/programs/ora.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.channels && Array.isArray(json.channels)) {
      await setCached(CACHE_KEYS.ORA, json.channels);
      return processLivePrograms(json.channels);
    }
  } catch (error) {
    console.warn('Network error fetching ora, falling back to cache:', error);
  }

  const cached = await getCached<any[]>(CACHE_KEYS.ORA);
  if (cached && cached.length > 0) {
    return processLivePrograms(cached);
  }

  return [];
}

function processLivePrograms(rawChannels: any[]): {
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  allPrograms: Program[];
}[] {
  const nowSec = Math.floor(Date.now() / 1000);

  return rawChannels.map(item => {
    const ch: Channel = item.channel;
    const programs: Program[] = (item.programs || []).map((p: any) => ({
      ...p,
      channelId: ch.id,
      channelName: ch.name,
      channelLogo: ch.logo,
      channelNumber: ch.number,
    }));

    let currentProgram: Program | null = null;
    let nextProgram: Program | null = null;

    for (let i = 0; i < programs.length; i++) {
      const p = programs[i];
      const start = p.startSec || Math.floor(new Date(p.startTime).getTime() / 1000);
      const end = p.endSec || Math.floor(new Date(p.endTime).getTime() / 1000);

      if (start <= nowSec && end > nowSec) {
        currentProgram = p;
        nextProgram = programs[i + 1] || null;
        break;
      }
    }

    // If no exact match (e.g. slight time drift), pick first upcoming
    if (!currentProgram && programs.length > 0) {
      currentProgram = programs[0];
      nextProgram = programs[1] || null;
    }

    return {
      channel: ch,
      currentProgram,
      nextProgram,
      allPrograms: programs,
    };
  }).filter(entry => entry.currentProgram !== null);
}

// ── Domani API ───────────────────────────────────────────────────────────────
export async function fetchDomaniProgramsApi(): Promise<ChannelSchedule[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/programs/domani.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.schedule && Array.isArray(json.schedule)) {
      await setCached(CACHE_KEYS.DOMANI, json.schedule);
      return json.schedule;
    }
  } catch (error) {
    console.warn('Network error fetching domani, falling back to cache:', error);
  }

  const cached = await getCached<ChannelSchedule[]>(CACHE_KEYS.DOMANI);
  if (cached && cached.length > 0) return cached;

  return [];
}
