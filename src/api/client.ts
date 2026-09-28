import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, ChannelSchedule, Program } from '../types';
import { fallbackChannels, fallbackStaseraSchedule } from './mockData';

const BASE_URL = 'https://www.intvstasera.it';

const CACHE_KEYS = {
  CHANNELS: '@intv_cache_channels_v2',
  STASERA: '@intv_cache_stasera_v2',
  ORA: '@intv_cache_ora_v2',
  DOMANI: '@intv_cache_domani_v2',
};

// ── Cache Helpers ────────────────────────────────────────────────────────────
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

/**
 * Sorts evening TV programs in real chronological order:
 * 1. Prima Serata (20:30 – 23:00)
 * 2. Seconda Serata (23:00 – 00:00)
 * 3. Notte (00:00 – 05:59)
 */
function sortEveningPrograms(programs: Program[]): Program[] {
  return [...programs].sort((a, b) => {
    const minA = getMinutesFromRomeMidnight(a.startTime);
    const minB = getMinutesFromRomeMidnight(b.startTime);

    // Shift post-midnight programs (00:00-05:59) to appear after 23:59
    const orderA = minA < 6 * 60 ? minA + 24 * 60 : minA;
    const orderB = minB < 6 * 60 ? minB + 24 * 60 : minB;

    return orderA - orderB;
  });
}

// ── Channels API ─────────────────────────────────────────────────────────────
export async function fetchChannelsApi(): Promise<Channel[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/channels.json?t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
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

  const cached = await getCached<Channel[]>(CACHE_KEYS.CHANNELS);
  if (cached && cached.length > 0) return cached;

  return fallbackChannels;
}

// ── Stasera Programs API ─────────────────────────────────────────────────────
export async function fetchStaseraProgramsApi(): Promise<ChannelSchedule[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/programs/stasera.json?t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.schedule && Array.isArray(json.schedule) && json.schedule.length > 0) {
      // Clean and sort each channel's evening programs
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
    const response = await fetch(`${BASE_URL}/api/programs/ora.json?t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
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

  const cached = await getCached<any[]>(CACHE_KEYS.ORA);
  if (cached && cached.length > 0) {
    return processLivePrograms(cached);
  }

  // If no network or cache, derive live programs from stasera fallback
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

    // Sort chronologically by start time
    programs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    let currentProgram: Program | null = null;
    let nextProgram: Program | null = null;

    // Step 1: Match with exact UTC timestamp if dates match
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

    // Step 2: If no exact UTC timestamp match, match by Europe/Rome time of day (minutes from midnight)
    if (!currentProgram && programs.length > 0) {
      for (let i = 0; i < programs.length; i++) {
        const p = programs[i];
        const startMin = getMinutesFromRomeMidnight(p.startTime);
        const endMin = getMinutesFromRomeMidnight(p.endTime);

        let isLive = false;
        if (startMin <= endMin) {
          isLive = nowRomeMinutes >= startMin && nowRomeMinutes < endMin;
        } else {
          // Program crosses midnight (e.g. 23:15 - 01:20)
          isLive = nowRomeMinutes >= startMin || nowRomeMinutes < endMin;
        }

        if (isLive) {
          currentProgram = p;
          nextProgram = programs[i + 1] || null;
          break;
        }
      }
    }

    // Step 3: If still no match, find the closest program by time
    if (!currentProgram && programs.length > 0) {
      // Find the last program that started before nowRomeMinutes
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
export async function fetchDomaniProgramsApi(): Promise<ChannelSchedule[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/programs/domani.json?t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
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

  const cached = await getCached<ChannelSchedule[]>(CACHE_KEYS.DOMANI);
  if (cached && cached.length > 0) return cached;

  return [];
}
