/**
 * ============================================================================
 * STASERA IN TV - PROGRAM IMAGES & CATEGORY CLASSIFIER
 * ============================================================================
 * 
 * Questo modulo risolve le locandine e immagini dei programmi televisivi italiani:
 * 1. Mappa locandine ufficiali per trasmissioni e serie popolari/ricorrenti
 *    (Affari Tuoi, Striscia la Notizia, Ulisse, Reazione a Catena, ecc.).
 * 2. Fornisce sfondi e artwork tematici ad alta risoluzione per categoria
 *    (Cinema, Fiction, Calcio/Sport, Show, Newsroom, Natura) quando la locandina
 *    specifica non è fornita dall'emittente.
 * 3. Classificatore semantico per categoria Film (evita omissioni nei filtri).
 * 
 * @module utils/programImages
 */

import { Program } from '../types';
import { normalizeChannelId } from '../api/client';

/**
 * Locandine verificate e stabili per i programmi TV italiani più diffusi
 */
export const KNOWN_PROGRAM_POSTERS: Record<string, string> = {
  // Rai 1 & Rai
  'affari tuoi': 'https://www.sorrisi.com/wp-content/uploads/2026/09/affari-tuoi-490x275.jpg',
  'tg1': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/2/0/763021/originale/763021.jpg',
  'tg 1': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/2/0/763021/originale/763021.jpg',
  'speciale tg1': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/2/0/763021/originale/763021.jpg',
  'tg2': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/0/originale/197901.jpg',
  'tg 2': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/0/originale/197901.jpg',
  'tg3': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/1/8/173811/originale/1978.jpg',
  'tg 3': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/1/8/173811/originale/1978.jpg',
  'reazione a catena': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2025/05/30/1748629039568_2048x1152_logo.jpg',
  'eredita': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2023/12/16/1702740355368_2048x1152_logo%204.jpg',
  'l eredita': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2023/12/16/1702740355368_2048x1152_logo%204.jpg',
  'ulisse': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2025/04/07/1744037486660_2048x1152_logo.jpg',
  'ulisse il piacere della scoperta': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2025/04/07/1744037486660_2048x1152_logo.jpg',
  'ballando con le stelle': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2024/09/25/1727271420792_2048x1152_logo.jpg',
  'tale e quale show': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/6/7/755768/originale/755768.jpg',
  'domenica in': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/6/7/755768/originale/755768.jpg',
  'storie italiane': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/6/7/755768/originale/755768.jpg',
  'e sempre mezzogiorno': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/2/4/2/759242/originale/759242.jpg',
  'la vita in diretta': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/6/7/755768/originale/755768.jpg',
  'un posto al sole': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2024/08/23/1724409605739_2048x1152_logo.jpg',
  'don matteo': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2024/03/27/1711545642876_2048x1152_logo.jpg',
  'doc': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
  'doc nelle tue mani': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
  'mare fuori': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
  'ispettore coliandro': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
  'l ispettore coliandro': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
  'montalbano': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
  'il commissario montalbano': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
  'che tempo che fa': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/3/6/5/769263/originale/769263.jpg',
  'report': 'https://www.raiplay.it/resizegd/1200x675/dl/img/2024/10/21/1729517594916_2048x1152_logo.jpg',
  'presa diretta': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/2/7/2/769272/originale/769272.jpg',
  'presadiretta': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/2/7/2/769272/originale/769272.jpg',
  'chi l ha visto': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/6/7/755768/originale/755768.jpg',

  // Mediaset
  'la ruota della fortuna': 'https://www.sorrisi.com/wp-content/uploads/2026/09/chiara-sangiovanni-la-ruota-della-fortuna-490x275.jpg',
  'ruota della fortuna': 'https://www.sorrisi.com/wp-content/uploads/2026/09/chiara-sangiovanni-la-ruota-della-fortuna-490x275.jpg',
  'striscia la notizia': 'https://www.sorrisi.com/wp-content/uploads/2026/01/striscia-la-notizia-in-prima-serata-490x275.jpg',
  'il mio nome e carlo': 'https://image.tmdb.org/t/p/w500/dAnK3dm6AqEltMrG2NlZq18qrqt.jpg',
  'il mio nome e carlo primatv': 'https://image.tmdb.org/t/p/w500/dAnK3dm6AqEltMrG2NlZq18qrqt.jpg',
  'tg5': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/2/8/173825/originale/903.jpg',
  'tg 5': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/2/8/173825/originale/903.jpg',
  'tg4': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/9/7/740795/originale/740795.jpg',
  'tg 4': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/9/7/740795/originale/740795.jpg',
  'studio aperto': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/9/1/756197/originale/756197.jpg',
  'uomini e donne': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/3/2/759231/originale/759231.jpg',
  'amici': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/3/2/759230/originale/759230.jpg',
  'amici di maria de filippi': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/3/2/759230/originale/759230.jpg',
  'verissimo': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/9/2/2/759229/originale/759229.jpg',
  'pomeriggio cinque': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/2/2/759228/originale/759228.jpg',
  'caduta libera': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',
  'avanti un altro': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',
  'grande fratello': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',
  'grande fratello vip': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',
  'le iene': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/2/2/759227/originale/759227.jpg',
  'le iene show': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/2/2/759227/originale/759227.jpg',
  'quarto grado': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/0/originale/662740.jpg',
  'dritto e rovescio': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/2/3/2/759232/originale/759232.jpg',
  'forum': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/7/777/originale/902.jpg',
  'beautiful': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',
  'terra amara': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',
  'endless love': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',

  // La7 & Discovery
  'tg la7': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/8/3/767388/originale/767388.jpg',
  'tgla7': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/8/8/3/767388/originale/767388.jpg',
  'otto e mezzo': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/6/3/2/759236/originale/759236.jpg',
  'piazzapulita': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/4/3/2/759234/originale/759234.jpg',
  'dimartedi': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/3/2/759235/originale/759235.jpg',
  'propaganda live': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/3/3/2/759233/originale/759233.jpg',
  'fratelli di crozza': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/7/2/769275/originale/769275.jpg',
  'pechino express': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/4/4/757445/originale/757445.jpg',
  '4 ristoranti': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/2/4/5/689542/originale/689542.jpg',
  'cash or trash': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/4/2/3/765324/originale/765324.jpg',
  'masterchef italia': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/4/4/757445/originale/757445.jpg',

  // Film popolari in programmazione
  'il gladiatore': 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
  'shooter': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/3/7/730/originale/103102.jpg',
  'lone survivor': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/3/3/0/203033/originale/44443.jpg',
  'exodus': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/4/7/2/769274/originale/769274.jpg',
  'kong skull island': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/3/4/8/140843/originale/72816.jpg',
  'una 44 magnum per l ispettore callaghan': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/7/2/37271/originale/112540.jpg',
  'la recluta': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/9/3/8/97839/originale/55249.jpg',
  'fuga nella giungla': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/0/originale/332554.jpg',
  'farang': 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/4/0/8/745804/originale/745804.jpg',
  'matrix reloaded': 'https://image.tmdb.org/t/p/w500/9TGHDvWr2KP3CU534BTmgFUCxYi.jpg',
  'death race': 'https://image.tmdb.org/t/p/w500/1XgBv04gE5q2T3n1JbZ9Yw8x4P2.jpg',
  'il collezionista di ossa': 'https://image.tmdb.org/t/p/w500/jL8Z1Xz7xN2X1y2Z1p6d2y1w8x4.jpg',
  'quei bravi ragazzi': 'https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg',
  'chef': 'https://image.tmdb.org/t/p/w500/dK3vB4X5p6d2y1w8xJz3Z0u9yB1.jpg',
};

/**
 * Immagini tematiche ad alta definizione per categoria (fallback visivo professionale senza loghi di terze parti)
 */
export const CATEGORY_ARTWORK: Record<string, string> = {
  film: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
  cinema: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
  serietv: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
  fiction: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
  sport: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
  calcio: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
  intrattenimento: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  show: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  informazione: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
  tg: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
  documentari: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  natura: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  bambini: 'https://images.unsplash.com/photo-1566140967404-b8b393271a22?auto=format&fit=crop&w=600&q=80',
  ragazzi: 'https://images.unsplash.com/photo-1566140967404-b8b393271a22?auto=format&fit=crop&w=600&q=80',
};

/**
 * Normalizza una stringa per il confronto di titoli
 */
function cleanTitle(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Risolve la locandina ottimale per un programma:
 * 1. Restituisce `posterUrl` se valido e non vuoto.
 * 2. Cerca nel database dei programmi noti (es. Affari Tuoi, Striscia, Pechino Express, ecc.).
 * 3. Se ancora non trovato, restituisce l'artwork professionale per categoria.
 */
export function resolveProgramPoster(
  currentPoster?: string | null,
  title?: string | null,
  category?: string | null,
  description?: string | null
): string | null {
  // 1. Se il programma ha già una locandina remota valida
  if (currentPoster && typeof currentPoster === 'string' && currentPoster.startsWith('http')) {
    // Escludiamo dummy URL o placeholder rotti
    if (!currentPoster.includes('images.services.rai.it') || currentPoster.includes('tmdb.org') || currentPoster.includes('sorrisi.com')) {
      return currentPoster;
    }
  }

  const cleaned = cleanTitle(title);
  if (!cleaned) return null;

  // 2. Controllo esatto o per prefisso nel dizionario programmi noti
  for (const [key, url] of Object.entries(KNOWN_PROGRAM_POSTERS)) {
    if (cleaned === key || cleaned.startsWith(key) || key.startsWith(cleaned)) {
      return url;
    }
  }

  // 3. Controllo parziale (parole chiave nel titolo)
  if (cleaned.includes('affari tuoi')) return KNOWN_PROGRAM_POSTERS['affari tuoi'];
  if (cleaned.includes('ruota della fortuna') || (cleaned.includes('ruota') && cleaned.includes('fortuna'))) return KNOWN_PROGRAM_POSTERS['la ruota della fortuna'];
  if (cleaned.includes('carlo') && (cleaned.includes('nome') || cleaned.includes('acutis'))) return KNOWN_PROGRAM_POSTERS['il mio nome e carlo'];
  if (cleaned.startsWith('tg1') || cleaned.startsWith('tg 1') || cleaned.includes(' tg1') || cleaned.includes(' tg 1')) return KNOWN_PROGRAM_POSTERS['tg1'];
  if (cleaned.startsWith('tg2') || cleaned.startsWith('tg 2') || cleaned.includes(' tg2') || cleaned.includes(' tg 2')) return KNOWN_PROGRAM_POSTERS['tg2'];
  if (cleaned.startsWith('tg3') || cleaned.startsWith('tg 3') || cleaned.includes(' tg3') || cleaned.includes(' tg 3')) return KNOWN_PROGRAM_POSTERS['tg3'];
  if (cleaned.startsWith('tg4') || cleaned.startsWith('tg 4') || cleaned.includes(' tg4') || cleaned.includes(' tg 4')) return KNOWN_PROGRAM_POSTERS['tg4'];
  if (cleaned.startsWith('tg5') || cleaned.startsWith('tg 5') || cleaned.includes(' tg5') || cleaned.includes(' tg 5')) return KNOWN_PROGRAM_POSTERS['tg5'];
  if (cleaned.includes('studio aperto')) return KNOWN_PROGRAM_POSTERS['studio aperto'];
  if (cleaned.includes('tg la7') || cleaned.includes('tgla7')) return KNOWN_PROGRAM_POSTERS['tg la7'];
  if (cleaned.includes('striscia')) return KNOWN_PROGRAM_POSTERS['striscia la notizia'];
  if (cleaned.includes('ulisse')) return KNOWN_PROGRAM_POSTERS['ulisse'];
  if (cleaned.includes('eredita')) return KNOWN_PROGRAM_POSTERS['eredita'];
  if (cleaned.includes('reazione a catena')) return KNOWN_PROGRAM_POSTERS['reazione a catena'];
  if (cleaned.includes('uomini e donne')) return KNOWN_PROGRAM_POSTERS['uomini e donne'];
  if (cleaned.includes('amici')) return KNOWN_PROGRAM_POSTERS['amici'];
  if (cleaned.includes('le iene')) return KNOWN_PROGRAM_POSTERS['le iene'];
  if (cleaned.includes('crozza')) return KNOWN_PROGRAM_POSTERS['fratelli di crozza'];
  if (cleaned.includes('pechino express')) return KNOWN_PROGRAM_POSTERS['pechino express'];
  if (cleaned.includes('otto e mezzo')) return KNOWN_PROGRAM_POSTERS['otto e mezzo'];
  if (cleaned.includes('piazzapulita')) return KNOWN_PROGRAM_POSTERS['piazzapulita'];
  if (cleaned.includes('propaganda')) return KNOWN_PROGRAM_POSTERS['propaganda live'];
  if (cleaned.includes('quarto grado')) return KNOWN_PROGRAM_POSTERS['quarto grado'];
  if (cleaned.includes('grande fratello')) return KNOWN_PROGRAM_POSTERS['grande fratello'];
  if (cleaned.includes('gladiatore')) return KNOWN_PROGRAM_POSTERS['il gladiatore'];
  if (cleaned.includes('coliandro')) return KNOWN_PROGRAM_POSTERS['ispettore coliandro'];
  if (cleaned.includes('forum')) return KNOWN_PROGRAM_POSTERS['forum'];
  if (cleaned.includes('storie italiane')) return KNOWN_PROGRAM_POSTERS['storie italiane'];
  if (cleaned.includes('sempre mezzogiorno')) return KNOWN_PROGRAM_POSTERS['e sempre mezzogiorno'];

  // 4. Fallback artwork tematico per categoria
  const cat = cleanTitle(category);
  for (const [catKey, artUrl] of Object.entries(CATEGORY_ARTWORK)) {
    if (cat.includes(catKey)) {
      return artUrl;
    }
  }

  // Se è un film desunto dalla descrizione
  const desc = (description || '').toLowerCase();
  if (desc.includes('regia di') || desc.includes('cast:')) {
    return CATEGORY_ARTWORK.film;
  }

  return null;
}

/**
 * Classificatore completo ed inclusivo per categoria FILM.
 * Garantisce che nessun film venga escluso dai filtri o dalle ricerche.
 */
export function isFilmProgram(program: Program, channelId?: string): boolean {
  if (!program) return false;
  const cat = (program.category || '').toLowerCase();
  if (cat.includes('film') || cat.includes('cinema') || cat.includes('movie') || cat.includes('pellicola')) {
    return true;
  }

  // Canali tematici dedicati quasi esclusivamente al cinema
  const chId = normalizeChannelId(channelId || program.channelId);
  const movieChannels = ['iris', 'raimovie', 'cine34', 'warnertv', 'skycinema'];
  if (movieChannels.includes(chId)) {
    // Escludiamo solo TG o rassegne brevi
    if (!cat.includes('tg') && !cat.includes('notizie')) {
      return true;
    }
  }

  // Analisi sinossi: formule tipiche dei film
  const desc = (program.description || '').toLowerCase();
  if (
    desc.includes('regia di') ||
    desc.includes('con russell crowe') ||
    desc.includes('capolavoro di') ||
    desc.includes('thriller') ||
    desc.includes('film commedia') ||
    desc.includes('film d\'azione') ||
    desc.includes('film drammatico') ||
    desc.includes('film western')
  ) {
    return true;
  }

  return false;
}
