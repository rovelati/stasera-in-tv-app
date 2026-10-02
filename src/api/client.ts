/**
 * ============================================================================
 * STASERA IN TV - MODULO CLIENT API & CACHING MULTI-LIVELLO
 * ============================================================================
 * 
 * Questo modulo rappresenta il layer di accesso ai dati (Data Access Layer)
 * dell'applicazione. È progettato per garantire le massime prestazioni su dispositivi
 * mobile, eliminando i blocchi del thread UI tramite:
 * 
 * 1. MULTI-TIER CACHE (RAM + Disk):
 *    - Livello 1 (In-Memory RAM): accesso a 0 ms per cambi di tab istantanei.
 *    - Livello 2 (AsyncStorage Disk): persistenza offline tra riavvii dell'app.
 *    - Livello 3 (Cloudflare Edge CDN): compressione gzip trasparente via OkHttp.
 * 
 * 2. INTEGRAZIONE CON SORRISI & LOCANDINE UFFICIALI:
 *    - Arricchimento automatico delle locandine da TV Sorrisi e Canzoni e TMDB.
 *    - Feed "In Onda Ora" sincronizzato in tempo reale per la giornata corrente.
 * 
 * 3. GESTIONE FUSO ORARIO E CONTINUITÀ NOTTURNA (Europe/Rome):
 *    - Risoluzione accurata dell'orario locale italiano (CET/CEST) minuto per minuto.
 *    - Ordinamento ciclico che sposta i programmi post-mezzanotte (00:00 - 05:59)
 *      in coda alla Prima/Seconda Serata, garantendo la corretta sequenza televisiva.
 * 
 * @module api/client
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Channel, ChannelSchedule, Program } from '../types';
import { fallbackChannels, fallbackStaseraSchedule } from './mockData';
import { fetchSorrisiStasera, fetchSorrisiOra, SorrisiProgram, SorrisiLiveEntry } from '../services/sorrisiService';
import { resolveProgramPoster } from '../utils/programImages';

/** URL base dell'infrastruttura backend (Cloudflare + Astro static/SSR API) */
const BASE_URL = 'https://www.intvstasera.it';

/** Chiavi di persistenza su disco AsyncStorage */
const CACHE_KEYS = {
  CHANNELS: '@intv_cache_channels_v4',
  STASERA: '@intv_cache_stasera_v4',
  ORA: '@intv_cache_ora_v4',
  DOMANI: '@intv_cache_domani_v4',
};

// ── 1. GESTIONE CACHE IN MEMORIA (RAM) & DISCO (ASYNCSTORAGE) ────────────────

const memoryCache: { [key: string]: { data: any; timestamp: number } } = {};

async function getCached<T>(key: string): Promise<T | null> {
  if (memoryCache[key]) {
    return memoryCache[key].data as T;
  }

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

  setTimeout(async () => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ timestamp, data }));
    } catch (err) {
      console.warn('[Cache] Errore scrittura AsyncStorage:', err);
    }
  }, 0);
}

/**
 * Normalizza un ID di canale rimuovendo trattini, caratteri speciali e spazi
 */
export function normalizeChannelId(id?: string | null): string {
  if (!id) return '';
  return String(id).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Mappatura loghi ufficiali HD ad alta risoluzione (da Quotidiano.net e broadcast ufficiali)
 */
export const OFFICIAL_CHANNEL_LOGOS: Record<string, string> = {
  'rai1': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/rai_1.png',
  'rai2': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/rai_2.png',
  'rai3': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/rai_3.png',
  'rai4': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/rai_4.png',
  'rai5': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/rai_5.png',
  'rete4': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/rete4.png',
  'canale5': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/canale5.png',
  'italia1': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/italia_1.png',
  'la7': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/la7.png',
  'tv8': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/tv8.png',
  'nove': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/nove.png',
  'iris': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/iris.svg',
  'italia2': 'https://guidatv.quotidiano.net/staticfiles/img/loghi_tv/italia2.svg',
};

/**
 * Converte un URL o percorso di logo relativo nel percorso CDN ufficiale Quotidiano / intvstasera.it
 */
export function resolveLogoUrl(logo?: string | null): string | null {
  if (!logo) return null;
  const trimmed = String(logo).trim();

  // Estrai l'identificatore del canale dal percorso o nome file per verificare se abbiamo il logo ufficiale HD
  const baseName = trimmed.split('/').pop()?.split('.')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  if (OFFICIAL_CHANNEL_LOGOS[baseName]) {
    return OFFICIAL_CHANNEL_LOGOS[baseName];
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${BASE_URL}${trimmed}`;
  }
  return `${BASE_URL}/channel-logos/${trimmed}`;
}

/**
 * Converte una stringa di orario (es. "14:30" o ISO 8601) in minuti da mezzanotte di Roma (0-1439).
 */
export function getTimeMinutes(timeStrOrIso?: string | null): number {
  if (!timeStrOrIso) return 0;
  const str = String(timeStrOrIso).trim();
  
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return (parseInt(h, 10) % 24) * 60 + parseInt(m, 10);
  }
  
  return getMinutesFromRomeMidnight(str);
}

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
 * Ordina i programmi serali preservando la naturale continuità televisiva:
 * - Prima Serata (20:30 - 23:00)
 * - Seconda Serata (23:00 - 23:59)
 * - Notte (00:00 - 05:59) traslata di +1440 min
 */
function sortEveningPrograms(programs: Program[]): Program[] {
  return [...programs].sort((a, b) => {
    const minA = getTimeMinutes(a.startTimeFormatted || a.startTime);
    const minB = getTimeMinutes(b.startTimeFormatted || b.startTime);

    const orderA = minA < 6 * 60 ? minA + 24 * 60 : minA;
    const orderB = minB < 6 * 60 ? minB + 24 * 60 : minB;

    return orderA - orderB;
  });
}

// ── 3. CHIAMATE API CON FALLBACK E ARRICCHIMENTO LOCANDINE ──────────────────

/**
 * Recupera l'elenco completo dei canali TV.
 * NOTA: Non impostiamo Accept-Encoding manuale per consentire a OkHttp di gestire la decompressione.
 */
export async function fetchChannelsApi(forceRefresh = false): Promise<Channel[]> {
  if (!forceRefresh && memoryCache[CACHE_KEYS.CHANNELS]) {
    return memoryCache[CACHE_KEYS.CHANNELS].data;
  }

  const cached = await getCached<Channel[]>(CACHE_KEYS.CHANNELS);

  try {
    const response = await fetch(`${BASE_URL}/api/channels.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.channels && Array.isArray(json.channels) && json.channels.length > 0) {
      const resolvedChannels: Channel[] = json.channels.map((ch: Channel) => ({
        ...ch,
        logo: resolveLogoUrl(ch.logo) || ch.logo,
      }));
      await setCached(CACHE_KEYS.CHANNELS, resolvedChannels);
      return resolvedChannels;
    }
  } catch (error) {
    console.warn('[API] Errore fetch canali, fallback su cache/mock:', error);
  }

  if (cached && cached.length > 0) return cached;
  return fallbackChannels.map(ch => ({
    ...ch,
    logo: resolveLogoUrl(ch.logo) || ch.logo,
  }));
}

/**
 * Recupera i programmi di stasera in TV (Prima e Seconda Serata).
 * Arricchisce automaticamente ogni programma con locandine ufficiali da Sorrisi o TMDB.
 */
export async function fetchStaseraProgramsApi(forceRefresh = false): Promise<ChannelSchedule[]> {
  if (!forceRefresh && memoryCache[CACHE_KEYS.STASERA]) {
    return memoryCache[CACHE_KEYS.STASERA].data;
  }

  const cached = await getCached<ChannelSchedule[]>(CACHE_KEYS.STASERA);

  try {
    // Eseguiamo il fetch dell'API principale e contemporaneamente i dati Sorrisi per le locandine fresche
    const [apiRes, sorrisiList] = await Promise.allSettled([
      fetch(`${BASE_URL}/api/programs/stasera.json`, {
        headers: { Accept: 'application/json' },
      }).then(r => (r.ok ? r.json() : null)),
      fetchSorrisiStasera(),
    ]);

    const sorrisiData = sorrisiList.status === 'fulfilled' ? sorrisiList.value : [];
    const sorrisiImageMap = new Map<string, string>();
    for (const sp of sorrisiData) {
      if (sp.imageUrl) {
        const key = `${sp.channelId}_${sp.title.toLowerCase().trim()}`;
        sorrisiImageMap.set(key, sp.imageUrl);
        sorrisiImageMap.set(sp.title.toLowerCase().trim(), sp.imageUrl);
      }
    }

    const json = apiRes.status === 'fulfilled' ? apiRes.value : null;

    if (json?.schedule && Array.isArray(json.schedule) && json.schedule.length > 0) {
      const sortedSchedule: ChannelSchedule[] = json.schedule.map((entry: ChannelSchedule) => {
        const chNorm = normalizeChannelId(entry.channel.id);
        const sortedProgs = sortEveningPrograms(entry.programs || []);

        return {
          ...entry,
          channel: {
            ...entry.channel,
            logo: resolveLogoUrl(entry.channel.logo) || entry.channel.logo,
          },
          programs: sortedProgs.map((p, idx) => {
            const cleanTitle = (p.title || '').toLowerCase().trim();
            const sorrisiImg =
              sorrisiImageMap.get(`${chNorm}_${cleanTitle}`) ||
              sorrisiImageMap.get(cleanTitle) ||
              null;

            const finalPoster =
              sorrisiImg ||
              resolveProgramPoster(p.posterUrl, p.title, p.category, p.description);

            return {
              ...p,
              channelId: entry.channel.id,
              channelName: entry.channel.name,
              channelLogo: resolveLogoUrl(p.channelLogo || entry.channel.logo) || undefined,
              posterUrl: finalPoster,
              isPrimaSerata: idx === 0,
              isSecondaSerata: idx === 1,
            };
          }),
        };
      });

      await setCached(CACHE_KEYS.STASERA, sortedSchedule);
      return sortedSchedule;
    }

    // Se l'API principale non risponde ma abbiamo Sorrisi, costruiamo il palinsesto dai dati Sorrisi
    if (sorrisiData.length > 0) {
      const scheduleByChannel = new Map<string, Program[]>();
      const channelInfoMap = new Map<string, { id: string; name: string; logo: string }>();

      for (const sp of sorrisiData) {
        const chId = sp.channelId;
        if (!channelInfoMap.has(chId)) {
          channelInfoMap.set(chId, {
            id: chId,
            name: sp.channelName,
            logo: resolveLogoUrl(`${chId}.svg`) || `${chId}.svg`,
          });
        }

        const list = scheduleByChannel.get(chId) || [];
        list.push({
          id: `sorrisi_${chId}_${list.length + 1}`,
          title: sp.title,
          category: sp.category,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          startTimeFormatted: sp.timeFormatted,
          posterUrl: sp.imageUrl || resolveProgramPoster(null, sp.title, sp.category),
          isPrimaSerata: sp.isPrimaSerata ?? (list.length === 0),
          isSecondaSerata: list.length === 1,
        });
        scheduleByChannel.set(chId, list);
      }

      const sorrisiSchedules: ChannelSchedule[] = Array.from(channelInfoMap.entries()).map(([chId, chInfo]) => ({
        channel: {
          id: chId,
          name: chInfo.name,
          number: 0,
          logo: chInfo.logo,
        },
        programs: scheduleByChannel.get(chId) || [],
      }));

      if (sorrisiSchedules.length > 0) {
        await setCached(CACHE_KEYS.STASERA, sorrisiSchedules);
        return sorrisiSchedules;
      }
    }
  } catch (error) {
    console.warn('[API] Errore fetch stasera, fallback su cache locale:', error);
  }

  if (cached && cached.length > 0) return cached;
  return fallbackStaseraSchedule;
}

/**
 * Recupera i programmi in onda adesso su tutte le emittenti.
 * Sincronizza i dati live di `ora.json` e li arricchisce con le trasmissioni in diretta da Sorrisi.
 */
export async function fetchOraProgramsApi(forceRefresh = false): Promise<{
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  allPrograms: Program[];
}[]> {
  if (!forceRefresh && memoryCache[CACHE_KEYS.ORA]) {
    return processLivePrograms(memoryCache[CACHE_KEYS.ORA].data);
  }

  const cached = await getCached<any[]>(CACHE_KEYS.ORA);

  try {
    const [apiRes, sorrisiLive] = await Promise.allSettled([
      fetch(`${BASE_URL}/api/programs/ora.json`, {
        headers: { Accept: 'application/json' },
      }).then(r => (r.ok ? r.json() : null)),
      fetchSorrisiOra(),
    ]);

    const json = apiRes.status === 'fulfilled' ? apiRes.value : null;
    const sorrisiItems = sorrisiLive.status === 'fulfilled' ? sorrisiLive.value : [];

    let channelsData = json?.channels && Array.isArray(json.channels) && json.channels.length > 0
      ? json.channels
      : (cached && cached.length > 0 ? cached : null);

    if (channelsData) {
      // Arricchisci i canali principali con l'evento in onda adesso da Sorrisi (garantisce trasmissione odierna in tempo reale)
      if (sorrisiItems.length > 0) {
        const sorrisiMap = new Map<string, SorrisiLiveEntry>();
        for (const s of sorrisiItems) {
          sorrisiMap.set(s.channelId, s);
        }

        channelsData = channelsData.map((item: any) => {
          const chId = normalizeChannelId(item.channel?.id);
          const sorrisiLiveEntry = sorrisiMap.get(chId);
          if (!sorrisiLiveEntry) return item;

          // Se Sorrisi ha l'evento in onda per questo canale, lo inseriamo come programma in onda
          const sorrisiCurrent: Program = {
            id: `live_${chId}_now`,
            title: sorrisiLiveEntry.current.title,
            category: sorrisiLiveEntry.current.category,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            startTimeFormatted: sorrisiLiveEntry.current.timeFormatted,
            posterUrl: sorrisiLiveEntry.current.imageUrl || resolveProgramPoster(null, sorrisiLiveEntry.current.title, sorrisiLiveEntry.current.category),
          };

          const sorrisiNext: Program | null = sorrisiLiveEntry.next ? {
            id: `live_${chId}_next`,
            title: sorrisiLiveEntry.next.title,
            category: sorrisiLiveEntry.next.category,
            startTime: new Date(Date.now() + 3600000).toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString(),
            startTimeFormatted: sorrisiLiveEntry.next.timeFormatted,
            posterUrl: sorrisiLiveEntry.next.imageUrl || resolveProgramPoster(null, sorrisiLiveEntry.next.title, sorrisiLiveEntry.next.category),
          } : null;

          return {
            ...item,
            _overrideCurrent: sorrisiCurrent,
            _overrideNext: sorrisiNext,
          };
        });
      }

      await setCached(CACHE_KEYS.ORA, channelsData);
      return processLivePrograms(channelsData);
    }

    // Se l'API principale è offline ma abbiamo Sorrisi Ora
    if (sorrisiItems.length > 0) {
      const liveFromSorrisi = sorrisiItems.map(item => {
        const ch = fallbackChannels.find(c => normalizeChannelId(c.id) === item.channelId) || {
          id: item.channelId,
          name: item.channelName,
          number: 0,
          logo: resolveLogoUrl(`${item.channelId}.svg`) || `${item.channelId}.svg`,
        };

        const currentProg: Program = {
          id: `live_${item.channelId}_now`,
          title: item.current.title,
          category: item.current.category,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          startTimeFormatted: item.current.timeFormatted,
          posterUrl: item.current.imageUrl || resolveProgramPoster(null, item.current.title, item.current.category),
          channelId: ch.id,
          channelName: ch.name,
          channelLogo: ch.logo,
        };

        const nextProg: Program | null = item.next ? {
          id: `live_${item.channelId}_next`,
          title: item.next.title,
          category: item.next.category,
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          startTimeFormatted: item.next.timeFormatted,
          posterUrl: item.next.imageUrl || resolveProgramPoster(null, item.next.title, item.next.category),
          channelId: ch.id,
          channelName: ch.name,
          channelLogo: ch.logo,
        } : null;

        return {
          channel: ch,
          currentProgram: currentProg,
          nextProgram: nextProg,
          allPrograms: [currentProg, ...(nextProg ? [nextProg] : [])],
        };
      });

      return liveFromSorrisi;
    }
  } catch (error) {
    console.warn('[API] Errore fetch ora, fallback su cache locale:', error);
  }

  if (cached && cached.length > 0) {
    return processLivePrograms(cached);
  }

  // Fallback con programmi del mock arricchiti
  return processLivePrograms(fallbackStaseraSchedule.map(s => ({
    channel: s.channel,
    programs: s.programs,
  })));
}

/**
 * Algoritmo per individuare il programma attualmente in onda.
 * Evita di assegnare programmi serali (20:30) durante il giorno (14:30).
 */
export function processLivePrograms(rawChannels: any[]): {
  channel: Channel;
  currentProgram: Program | null;
  nextProgram: Program | null;
  allPrograms: Program[];
}[] {
  const nowRomeMinutes = getCurrentRomeMinutes();

  return rawChannels.map(item => {
    const rawCh = item.channel || {};
    const ch: Channel = {
      ...rawCh,
      logo: resolveLogoUrl(rawCh.logo) || rawCh.logo,
      streamUrl: rawCh.stream?.url || (rawCh as any).streamUrl || undefined,
      streamLabel: rawCh.stream?.label || (rawCh as any).streamLabel || undefined,
    };

    // Se presente un override live verificato da Sorrisi, lo applichiamo prioritariamente
    if (item._overrideCurrent) {
      return {
        channel: ch,
        currentProgram: item._overrideCurrent,
        nextProgram: item._overrideNext || null,
        allPrograms: [item._overrideCurrent, ...(item._overrideNext ? [item._overrideNext] : [])],
      };
    }

    const rawProgs = item.programs || [];

    const programs: Program[] = rawProgs.map((p: any) => ({
      ...p,
      channelId: ch.id,
      channelName: ch.name,
      channelLogo: ch.logo,
      channelNumber: ch.number,
      posterUrl: resolveProgramPoster(p.posterUrl, p.title, p.category, p.description),
      streamUrl: ch.stream?.url || (ch as any).streamUrl || undefined,
      streamLabel: ch.stream?.label || (ch as any).streamLabel || undefined,
    }));

    // Ordina tutti i programmi in ordine cronologico d'inizio
    programs.sort((a, b) => {
      const minA = getTimeMinutes(a.startTimeFormatted || a.startTime);
      const minB = getTimeMinutes(b.startTimeFormatted || b.startTime);
      return minA - minB;
    });

    let currentProgram: Program | null = null;
    let nextProgram: Program | null = null;

    if (programs.length > 0) {
      for (let i = 0; i < programs.length; i++) {
        const p = programs[i];
        const startMin = getTimeMinutes(p.startTimeFormatted || p.startTime);
        let endMin = getTimeMinutes(p.endTimeFormatted || p.endTime);
        
        if (endMin <= startMin && i + 1 < programs.length) {
          const nextStart = getTimeMinutes(programs[i + 1].startTimeFormatted || programs[i + 1].startTime);
          endMin = nextStart > startMin ? nextStart : startMin + 60;
        }

        let isLive = false;
        if (startMin <= endMin) {
          isLive = nowRomeMinutes >= startMin && nowRomeMinutes < endMin;
        } else {
          // Programma a cavallo di mezzanotte
          isLive = nowRomeMinutes >= startMin || nowRomeMinutes < endMin;
        }

        if (isLive) {
          currentProgram = p;
          nextProgram = programs[i + 1] || null;
          break;
        }
      }

      // Se non ancora trovato per buco nel palinsesto, cerca solo tra i programmi già iniziati (entro 3 ore fa)
      if (!currentProgram) {
        let bestIdx = -1;
        let maxStartBeforeNow = -1;

        for (let i = 0; i < programs.length; i++) {
          const startMin = getTimeMinutes(programs[i].startTimeFormatted || programs[i].startTime);
          if (startMin <= nowRomeMinutes && startMin > maxStartBeforeNow) {
            maxStartBeforeNow = startMin;
            bestIdx = i;
          }
        }

        // Se un programma è iniziato prima di ora ed è entro 180 minuti, consideralo ancora in onda
        if (bestIdx !== -1 && (nowRomeMinutes - maxStartBeforeNow) <= 180) {
          currentProgram = programs[bestIdx];
          nextProgram = programs[bestIdx + 1] || null;
        }
      }
    }

    return {
      channel: ch,
      currentProgram,
      nextProgram,
      allPrograms: programs,
    };
  }).filter(entry => entry.currentProgram !== null);
}

/**
 * Recupera i programmi di domani in TV (Prima e Seconda Serata).
 */
export async function fetchDomaniProgramsApi(forceRefresh = false): Promise<ChannelSchedule[]> {
  if (!forceRefresh && memoryCache[CACHE_KEYS.DOMANI]) {
    return memoryCache[CACHE_KEYS.DOMANI].data;
  }

  const cached = await getCached<ChannelSchedule[]>(CACHE_KEYS.DOMANI);

  try {
    const response = await fetch(`${BASE_URL}/api/programs/domani.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.schedule && Array.isArray(json.schedule) && json.schedule.length > 0) {
      const sortedSchedule: ChannelSchedule[] = json.schedule.map((entry: ChannelSchedule) => {
        const sortedProgs = sortEveningPrograms(entry.programs || []);
        return {
          ...entry,
          channel: {
            ...entry.channel,
            logo: resolveLogoUrl(entry.channel.logo) || entry.channel.logo,
          },
          programs: sortedProgs.map((p, idx) => ({
            ...p,
            channelLogo: resolveLogoUrl(p.channelLogo || entry.channel.logo) || undefined,
            posterUrl: resolveProgramPoster(p.posterUrl, p.title, p.category, p.description),
            isPrimaSerata: idx === 0,
            isSecondaSerata: idx === 1,
          })),
        };
      });

      await setCached(CACHE_KEYS.DOMANI, sortedSchedule);
      return sortedSchedule;
    }
  } catch (error) {
    console.warn('[API] Errore fetch domani, fallback su cache locale:', error);
  }

  if (cached && cached.length > 0) return cached;
  return fallbackStaseraSchedule;
}

/**
 * Recupera il palinsesto completo 24 ore di oggi per un canale specifico.
 */
export async function fetchChannelDayScheduleApi(channel: Channel): Promise<Program[]> {
  if (!channel) return [];
  const targetNorm = normalizeChannelId(channel.id);

  const matchesChannel = (ch: any) => {
    if (!ch) return false;
    if (normalizeChannelId(ch.id) === targetNorm) return true;
    if (channel.number > 0 && ch.number === channel.number) return true;
    if (ch.name && channel.name && ch.name.trim().toLowerCase() === channel.name.trim().toLowerCase()) return true;
    return false;
  };

  try {
    const oraData = await fetchOraProgramsApi();
    const foundOra = oraData.find(item => matchesChannel(item.channel));
    if (foundOra && foundOra.allPrograms && foundOra.allPrograms.length > 0) {
      return foundOra.allPrograms;
    }

    const staseraData = await fetchStaseraProgramsApi();
    const foundStasera = staseraData.find(item => matchesChannel(item.channel));
    if (foundStasera && foundStasera.programs && foundStasera.programs.length > 0) {
      return foundStasera.programs;
    }
  } catch (err) {
    console.warn('[API] Errore caricamento palinsesto 24h del canale:', err);
  }

  return [];
}
