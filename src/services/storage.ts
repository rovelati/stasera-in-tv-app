/**
 * ============================================================================
 * STASERA IN TV - LOCAL STORAGE & PERSISTENCE SERVICE
 * ============================================================================
 * 
 * Questo servizio incapsula tutte le operazioni di lettura e scrittura
 * su AsyncStorage (storage locale persistente del dispositivo).
 * 
 * DATI GESTITI:
 * 1. Canali Preferiti (con set predefinito dei canali nazionali principali).
 * 2. Promemoria Attivi (metadati dei programmi per cui l'utente ha impostato una sveglia).
 * 3. Preferenze Utente (tema chiaro/scuro).
 * 
 * @module services/storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderItem } from '../types';

/** Chiavi di isolamento per AsyncStorage */
const STORAGE_KEYS = {
  FAVORITES: '@intv_favorite_channels',
  REMINDERS: '@intv_active_reminders',
  THEME_PREFERENCE: '@intv_theme_pref',
};

// ── 1. CANALI PREFERITI ──────────────────────────────────────────────────────

/**
 * Recupera l'elenco degli ID dei canali preferiti salvati sul dispositivo.
 * Se l'utente apre l'app per la prima volta, restituisce un set di canali predefiniti.
 * 
 * @returns Array di ID canale (es. `['rai-1', 'canale-5', 'la7']`)
 */
export async function getFavoriteChannelIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!raw) return ['rai-1', 'canale-5', 'italia-1', 'la7', 'tv8', 'nove', '20'];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Salva l'array di ID canali preferiti su storage persistente.
 * 
 * @param ids Elenco aggiornato degli ID canali
 */
export async function saveFavoriteChannelIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
  } catch (err) {
    console.warn('[Storage] Errore salvataggio preferiti:', err);
  }
}

/**
 * Aggiunge o rimuove un canale dai preferiti in modalità toggle atomico.
 * 
 * @param id ID del canale da alternare
 * @returns Nuovo elenco aggiornato dei canali preferiti
 */
export async function toggleFavoriteChannelId(id: string): Promise<string[]> {
  const current = await getFavoriteChannelIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter(item => item !== id) : [...current, id];
  await saveFavoriteChannelIds(updated);
  return updated;
}

// ── 2. PROMEMORIA PROGRAMMI ──────────────────────────────────────────────────

/**
 * Recupera l'elenco di tutti i promemoria attualmente salvati.
 * 
 * @returns Array di oggetti ReminderItem
 */
export async function getSavedReminders(): Promise<ReminderItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Persiste l'elenco dei promemoria su disco.
 * 
 * @param reminders Lista completa dei promemoria
 */
export async function saveReminders(reminders: ReminderItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (err) {
    console.warn('[Storage] Errore salvataggio promemoria:', err);
  }
}

/**
 * Aggiunge un nuovo promemoria alla lista ed elimina eventuali duplicati pregressi.
 * 
 * @param reminder Oggetto promemoria da inserire
 * @returns Lista aggiornata con il nuovo elemento in cima
 */
export async function addReminder(reminder: ReminderItem): Promise<ReminderItem[]> {
  const current = await getSavedReminders();
  const filtered = current.filter(r => r.programId !== reminder.programId);
  const updated = [reminder, ...filtered];
  await saveReminders(updated);
  return updated;
}

/**
 * Rimuove un promemoria identificato dal programId.
 * 
 * @param programId ID del programma da eliminare
 * @returns Lista rimanente dei promemoria attivi
 */
export async function removeReminder(programId: string): Promise<ReminderItem[]> {
  const current = await getSavedReminders();
  const updated = current.filter(r => r.programId !== programId);
  await saveReminders(updated);
  return updated;
}
