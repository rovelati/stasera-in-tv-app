/**
 * ============================================================================
 * STASERA IN TV - SORRISI & CANZONI SCRAPER & IMAGE ENRICHER
 * ============================================================================
 * 
 * Recupera in tempo reale palinsesti aggiornati e locandine ufficiali
 * da TV Sorrisi e Canzoni (https://www.sorrisi.com/guidatv/).
 * 
 * Fornisce:
 * 1. Locandine ufficiali per serie, film e trasmissioni popolari.
 * 2. Palinsesto "In Onda Adesso" in tempo reale per la giornata odierna.
 * 3. Copertura completa della prima e seconda serata.
 * 
 * @module services/sorrisiService
 */

import { normalizeChannelId } from '../api/client';
import { Program, Channel } from '../types';

export interface SorrisiProgram {
  channelName: string;
  channelId: string;
  title: string;
  timeFormatted: string;
  category: string;
  imageUrl: string | null;
  description?: string;
  isPrimaSerata?: boolean;
}

export interface SorrisiLiveEntry {
  channelName: string;
  channelId: string;
  current: {
    title: string;
    timeFormatted: string;
    category: string;
    imageUrl: string | null;
  };
  next: {
    title: string;
    timeFormatted: string;
    category: string;
    imageUrl: string | null;
  } | null;
}

/** Cache in memoria con TTL di 10 minuti */
let cachedSorrisiStasera: SorrisiProgram[] | null = null;
let lastStaseraFetch = 0;

let cachedSorrisiOra: SorrisiLiveEntry[] | null = null;
let lastOraFetch = 0;

const TTL_MS = 10 * 60 * 1000; // 10 minuti

/**
 * Normalizza il nome del canale per match affidabile tra Sorrisi e ID canale interno.
 */
export function matchChannelIdFromName(name: string): string {
  const n = name.toLowerCase().replace(/stasera su\s*/i, '').trim();
  if (n.includes('rai 1') || n === 'rai 1' || n === 'rai1') return 'rai-1';
  if (n.includes('rai 2') || n === 'rai 2' || n === 'rai2') return 'rai-2';
  if (n.includes('rai 3') || n === 'rai 3' || n === 'rai3') return 'rai-3';
  if (n.includes('rete 4') || n === 'rete 4' || n === 'rete4') return 'rete-4';
  if (n.includes('canale 5') || n === 'canale 5' || n === 'canale5') return 'canale-5';
  if (n.includes('italia 1') || n === 'italia 1' || n === 'italia1') return 'italia-1';
  if (n.includes('la 7') || n.includes('la7')) return 'la7';
  if (n.includes('tv 8') || n.includes('tv8')) return 'tv8';
  if (n.includes('nove')) return 'nove';
  if (n.includes('20') || n.includes('canale 20')) return '20';
  if (n.includes('rai 4') || n === 'rai 4' || n === 'rai4') return 'rai-4';
  if (n.includes('iris')) return 'iris';
  if (n.includes('rai 5')) return 'rai-5';
  if (n.includes('rai movie')) return 'rai-movie';
  if (n.includes('rai premium')) return 'rai-premium';
  if (n.includes('cielo')) return 'cielo';
  if (n.includes('twenty seven') || n.includes('twentyseven')) return 'twentyseven';
  if (n.includes('tv 2000') || n.includes('tv2000')) return 'tv2000';
  if (n.includes('la 5') || n.includes('la5')) return 'la5';
  if (n.includes('real time')) return 'real-time';
  if (n.includes('food network')) return 'food-network';
  if (n.includes('cine34') || n.includes('cine 34')) return 'cine34';
  if (n.includes('focus')) return 'focus';
  if (n.includes('giallo')) return 'giallo';
  if (n.includes('top crime')) return 'top-crime';
  if (n.includes('rai gulp')) return 'rai-gulp';
  if (n.includes('italia 2')) return 'italia-2';
  if (n.includes('d max') || n.includes('dmax')) return 'dmax';
  if (n.includes('rai storia')) return 'rai-storia';
  if (n.includes('mediaset extra')) return 'mediaset-extra';
  return normalizeChannelId(n);
}

/**
 * Pulisce il testo HTML rimuovendo entità comuni e tag
 */
function cleanText(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Recupera i programmi di stasera da TV Sorrisi e Canzoni (prime 3 pagine, ~36 canali principali).
 */
export async function fetchSorrisiStasera(): Promise<SorrisiProgram[]> {
  const now = Date.now();
  if (cachedSorrisiStasera && now - lastStaseraFetch < TTL_MS) {
    return cachedSorrisiStasera;
  }

  const allPrograms: SorrisiProgram[] = [];

  const pages = [
    'https://www.sorrisi.com/guidatv/stasera-in-tv/',
    'https://www.sorrisi.com/guidatv/stasera-in-tv/?pagina=2',
    'https://www.sorrisi.com/guidatv/stasera-in-tv/?pagina=3',
  ];

  try {
    const responses = await Promise.allSettled(
      pages.map(url =>
        fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            Accept: 'text/html,application/xhtml+xml',
          },
        }).then(r => r.text())
      )
    );

    for (const res of responses) {
      if (res.status !== 'fulfilled') continue;
      const html = res.value;
      const channelBlocks = html.split(/<div class="gtv-channel/);

      for (let i = 1; i < channelBlocks.length; i++) {
        const block = channelBlocks[i];
        const chNameRaw =
          (block.match(/<h2 class="gtv-channel-title">([\s\S]*?)<\/h2>/i) ||
            block.match(/alt="([^"]+)" class="gtv-channel-logo/i) ||
            [])[1] || '';
        const chName = cleanText(chNameRaw);
        if (!chName) continue;

        const chId = matchChannelIdFromName(chName);

        const titles = [...block.matchAll(/<h3 class="gtv-program-title"><a[^>]*>([\s\S]*?)<\/a><\/h3>/g)].map(m => cleanText(m[1]));
        const times = [...block.matchAll(/<time class="gtv-program-time"[^>]*>([\s\S]*?)<\/time>/g)].map(m => cleanText(m[1]));
        const cats = [...block.matchAll(/<div class="gtv-program-label[^"]*">([\s\S]*?)<\/div>/g)].map(m => cleanText(m[1]));
        const images = [...block.matchAll(/<figure class="gtv-program-image">\s*<a[^>]*>\s*<img src="([^"]+)"/g)].map(m => {
          let url = m[1].trim();
          if (url.startsWith('//')) url = 'https:' + url;
          return url;
        });

        for (let j = 0; j < titles.length; j++) {
          allPrograms.push({
            channelName: chName.replace(/stasera su\s*/i, '').trim(),
            channelId: chId,
            title: titles[j],
            timeFormatted: times[j] || '21:15',
            category: cats[j] || '',
            imageUrl: images[j] || null,
            isPrimaSerata: j === 0,
          });
        }
      }
    }

    if (allPrograms.length > 0) {
      cachedSorrisiStasera = allPrograms;
      lastStaseraFetch = now;
    }
  } catch (err) {
    console.warn('[Sorrisi] Errore fetch stasera:', err);
  }

  return allPrograms.length > 0 ? allPrograms : (cachedSorrisiStasera || []);
}

/**
 * Recupera i programmi attualmente "In Onda Ora" da TV Sorrisi e Canzoni.
 */
export async function fetchSorrisiOra(): Promise<SorrisiLiveEntry[]> {
  const now = Date.now();
  if (cachedSorrisiOra && now - lastOraFetch < 60000) { // cache 1 min per il live
    return cachedSorrisiOra;
  }

  const results: SorrisiLiveEntry[] = [];

  try {
    const res = await fetch('https://www.sorrisi.com/guidatv/ora-in-tv/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const channelBlocks = html.split(/<div class="gtv-channel/);

    for (let i = 1; i < channelBlocks.length; i++) {
      const block = channelBlocks[i];
      const chNameRaw =
        (block.match(/alt="([^"]+)" class="gtv-channel-logo/i) ||
          block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) ||
          [])[1] || '';
      const chName = cleanText(chNameRaw);
      if (!chName) continue;

      const chId = matchChannelIdFromName(chName);

      const titles = [...block.matchAll(/<h3 class="gtv-program-title"><a[^>]*>([\s\S]*?)<\/a><\/h3>/g)].map(m => cleanText(m[1]));
      const times = [...block.matchAll(/<time class="gtv-program-time"[^>]*>([\s\S]*?)<\/time>/g)].map(m => cleanText(m[1]));
      const cats = [...block.matchAll(/<div class="gtv-program-label[^"]*">([\s\S]*?)<\/div>/g)].map(m => cleanText(m[1]));
      const images = [...block.matchAll(/<figure class="gtv-program-image">\s*<a[^>]*>\s*<img src="([^"]+)"/g)].map(m => {
        let url = m[1].trim();
        if (url.startsWith('//')) url = 'https:' + url;
        return url;
      });

      if (titles.length > 0) {
        results.push({
          channelName: chName,
          channelId: chId,
          current: {
            title: titles[0],
            timeFormatted: times[0] || 'Ora',
            category: cats[0] || 'Attualità',
            imageUrl: images[0] || null,
          },
          next: titles.length > 1 ? {
            title: titles[1],
            timeFormatted: times[1] || '',
            category: cats[1] || '',
            imageUrl: images[1] || null,
          } : null,
        });
      }
    }

    if (results.length > 0) {
      cachedSorrisiOra = results;
      lastOraFetch = now;
    }
  } catch (err) {
    console.warn('[Sorrisi] Errore fetch ora:', err);
  }

  return results.length > 0 ? results : (cachedSorrisiOra || []);
}
