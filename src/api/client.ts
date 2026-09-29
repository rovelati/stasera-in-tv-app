import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, ChannelSchedule, Program } from '../types';
import { fallbackChannels, fallbackStaseraSchedule } from './mockData';

const BASE_URL = 'https://www.intvstasera.it';

const CACHE_KEYS = {
  CHANNELS: '@intv_cache_channels_v3',
  STASERA: '@intv_cache_stasera_v3',
  ORA: '@intv_cache_ora_v3',
  DOMANI: '@intv_cache_domani_v3',
};

// ── In-Memory Fast Cache (0ms instant retrieval) ─────────────────────────────
const memoryCache: { [key: string]: { data: any; timestamp: number } } = {};
const MEMORY_CACHE_TTL = 3 * 60 * 1000; // 3 minutes in-memory freshness

async function getCached<T>(key: string): Promise<T | null> {
  // 1. Check in-memory RAM cache first (instant)
  if (memoryCache[key]) {
    return memoryCache[key].data as T;
  }

  // 2. Fallback to AsyncStorage (disk)
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    memoryCache[key] = { data: parsed.data, timestamp: parsed.timestamp || Date.now() };
    return parsed.data as T;
  } catch {
    return null;
  }
}

async function setCached<T>(key: string, data: T): Promise<void> {
  const timestamp = Date.now();
  memoryCache[key] = { data, timestamp };

  // Write to disk asynchronously without blocking the UI thread
  setTimeout(async () => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ timestamp, data }));
    } catch (err) {
      console.warn('Failed to cache API response to disk:', err);
    }
  }, 0);
}

// ── Time & Sorting Helpers ───────────────────────────────────────────────────
export function getMinutesFromRomeMidnight(isoString: string): number {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 0;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return (hour % 24) * 60 + minute;
  } catch {
    return 0;
  }
}

export function getCurrentRomeMinutes(): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return (hour % 24) * 60 + minute;
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}

function sortEveningPrograms(programs: Program[]): Program[] {
  return [...programs].sort((a, b) => {
    const minA = getMinutesFromRomeMidnight(a.startTime);
    const minB = getMinutesFromRomeMidnight(b.startTime);

    const orderA = minA < 6 * 60 ? minA + 24 * 60 : minA;
    const orderB = minB < 6 * 60 ? minB + 24 * 60 : minB;

    return orderA - orderB;
  });
}

// ── Channels API ─────────────────────────────────────────────────────────────
export async function fetchChannelsApi(forceRefresh = false): Promise<Channel[]> {
  // Stale-while-revalidate: Return memory cache immediately if available
  if (!forceRefresh && memoryCache[CACHE_KEYS.CHANNELS]) {
    return memoryCache[CACHE_KEYS.CHANNELS].data;
  }

  const cached = await getCached<Channel[]>(CACHE_KEYS.CHANNELS);

  try {
    const response = await fetch(`${BASE_URL}/api/channels.json`, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.channels && Array.isArray(json.channels) && json.channels.length > 0) {
      await setCached(CACHE_KEYS.CHANNELS, json.channels);
      return json.channels;
    }
  } catch (error) {
    console.warn('Network error fetching channels, falling back to cache:', error);
  }

  if (cached && cached.length > 0) return cached;
  return fallbackChannels;
}

// ── Stasera Programs API ─────────────────────────────────────────────────────
export async function fetchStaseraProgramsApi(forceRefresh = false): Promise<ChannelSchedule[]> {
  // Instant in-memory return
  if (!forceRefresh && memoryCache[CACHE_KEYS.STASERA]) {
    return memoryCache[CACHE_KEYS.STASERA].data;
  }

  const cached = await getCached<ChannelSchedule[]>(CACHE_KEYS.STASERA);

  try {
    const response = await fetch(`${BASE_URL}/api/programs/stasera.json`, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.schedule && Array.isArray(json.schedule) && json.schedule.length > 0) {
      const sortedSchedule: ChannelSchedule[] = json.schedule.map((entry: ChannelSchedule) => {
        const sortedProgs = sortEveningPrograms(entry.programs || []);
        return {
          ...entry,
          programs: sortedProgs.map((p, idx) => ({
            ...p,
            isPrimaSerata: idx === 0,
            isSecondaSerata: idx === 1,
          })),
        };
      });

      await setCached(CACHE_KEYS.STASERA, sortedSchedule);
      return sortedSchedule;
    }
  } catch (error) {
    console.warn('Network error fetching stasera, falling back to cache:', error);
  }

  if (cached && cached.length > 0) return cached;
  return fallbackStaseraSchedule;
}

// ── In Onda Ora API ──────────────────────────────────────────────────────────
export async function fetchOraProgramsApi(forceRefresh = false): Promise<{
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  allPrograms: Program[];
}[]> {
  const cached = await getCached<any[]>(CACHE_KEYS.ORA);

  try {
    const response = await fetch(`${BASE_URL}/api/programs/ora.json`, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.channels && Array.isArray(json.channels) && json.channels.length > 0) {
      await setCached(CACHE_KEYS.ORA, json.channels);
      return processLivePrograms(json.channels);
    }
  } catch (error) {
    console.warn('Network error fetching ora, falling back to cache:', error);
  }

  if (cached && cached.length > 0) {
    return processLivePrograms(cached);
  }

  return [];
}

export function processLivePrograms(rawChannels: any[]): {
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  allPrograms: Program[];
}[] {
  const now = new Date();
  const nowSec = Math.floor(now.getTime() / 1000);
  const nowRomeMinutes = getCurrentRomeMinutes();

  return rawChannels.map(item => {
    const ch: Channel = item.channel;
    const rawProgs = item.programs || [];

    const programs: Program[] = rawProgs.map((p: any) => ({
      ...p,
      channelId: ch.id,
      channelName: ch.name,
      channelLogo: ch.logo,
      channelNumber: ch.number,
      streamUrl: ch.stream?.url || ch.streamUrl || undefined,
      streamLabel: ch.stream?.label || ch.streamLabel || undefined,
    }));

    programs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    let currentProgram: Program | null = null;
    let nextProgram: Program | null = null;

    // Step 1: Match by exact timestamp
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

    // Step 2: Match by Europe/Rome time of day
    if (!currentProgram && programs.length > 0) {
      for (let i = 0; i < programs.length; i++) {
        const p = programs[i];
        const startMin = getMinutesFromRomeMidnight(p.startTime);
        const endMin = getMinutesFromRomeMidnight(p.endTime);

        let isLive = false;
        if (startMin <= endMin) {
          isLive = nowRomeMinutes >= startMin && nowRomeMinutes < endMin;
        } else {
          isLive = nowRomeMinutes >= startMin || nowRomeMinutes < endMin;
        }

        if (isLive) {
          currentProgram = p;
          nextProgram = programs[i + 1] || null;
          break;
        }
      }
    }

    // Step 3: Fallback closest
    if (!currentProgram && programs.length > 0) {
      let closestIdx = 0;
      let minDiff = 9999;
      for (let i = 0; i < programs.length; i++) {
        const startMin = getMinutesFromRomeMidnight(programs[i].startTime);
        const diff = Math.abs(nowRomeMinutes - startMin);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      currentProgram = programs[closestIdx];
      nextProgram = programs[closestIdx + 1] || null;
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
export async function fetchDomaniProgramsApi(forceRefresh = false): Promise<ChannelSchedule[]> {
  // Instant in-memory return
  if (!forceRefresh && memoryCache[CACHE_KEYS.DOMANI]) {
    return memoryCache[CACHE_KEYS.DOMANI].data;
  }

  const cached = await getCached<ChannelSchedule[]>(CACHE_KEYS.DOMANI);

  try {
    const response = await fetch(`${BASE_URL}/api/programs/domani.json`, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.schedule && Array.isArray(json.schedule) && json.schedule.length > 0) {
      const sortedSchedule: ChannelSchedule[] = json.schedule.map((entry: ChannelSchedule) => {
        const sortedProgs = sortEveningPrograms(entry.programs || []);
        return {
          ...entry,
          programs: sortedProgs.map((p, idx) => ({
            ...p,
            isPrimaSerata: idx === 0,
            isSecondaSerata: idx === 1,
          })),
        };
      });

      await setCached(CACHE_KEYS.DOMANI, sortedSchedule);
      return sortedSchedule;
    }
  } catch (error) {
    console.warn('Network error fetching domani, falling back to cache:', error);
  }

  if (cached && cached.length > 0) return cached;
  return [];
}
