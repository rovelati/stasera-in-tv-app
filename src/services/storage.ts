import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderItem } from '../types';

const STORAGE_KEYS = {
  FAVORITES: '@intv_favorite_channels',
  REMINDERS: '@intv_active_reminders',
  THEME_PREFERENCE: '@intv_theme_pref',
};

// ── Favorites ────────────────────────────────────────────────────────────────
export async function getFavoriteChannelIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!raw) return ['rai-1', 'canale-5', 'italia-1', 'la7', 'tv8', 'nove', '20'];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveFavoriteChannelIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
  } catch (err) {
    console.warn('Error saving favorite channels:', err);
  }
}

export async function toggleFavoriteChannelId(id: string): Promise<string[]> {
  const current = await getFavoriteChannelIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter(item => item !== id) : [...current, id];
  await saveFavoriteChannelIds(updated);
  return updated;
}

// ── Reminders ────────────────────────────────────────────────────────────────
export async function getSavedReminders(): Promise<ReminderItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveReminders(reminders: ReminderItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (err) {
    console.warn('Error saving reminders:', err);
  }
}

export async function addReminder(reminder: ReminderItem): Promise<ReminderItem[]> {
  const current = await getSavedReminders();
  const filtered = current.filter(r => r.programId !== reminder.programId);
  const updated = [reminder, ...filtered];
  await saveReminders(updated);
  return updated;
}

export async function removeReminder(programId: string): Promise<ReminderItem[]> {
  const current = await getSavedReminders();
  const updated = current.filter(r => r.programId !== programId);
  await saveReminders(updated);
  return updated;
}
