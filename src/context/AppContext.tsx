/**
 * ============================================================================
 * STASERA IN TV - GLOBAL STATE & APPLICATION CONTEXT
 * ============================================================================
 * 
 * Questo modulo gestisce lo stato globale reattivo dell'applicazione:
 * 
 * 1. THEME ENGINE:
 *    - Gestione automatica e manuale della Dark Mode / Light Mode con palette semantica.
 * 
 * 2. NAVIGATION & FILTER STATE:
 *    - Tab attivo (`stasera`, `ora`, `domani`, `canali`, `preferiti`).
 *    - Filtro per categoria tematica (`Film`, `Serie TV`, `Sport`, `Informazione`, ecc.).
 *    - Query di ricerca canali / programmi.
 * 
 * 3. USER PREFERENCES & PERSISTENCE:
 *    - Canali Preferiti (identificati univocamente per ID canale).
 *    - Promemoria notifiche locali push con cancellazione e rischedulazione automatica.
 * 
 * 4. TELEMETRY & ANALYTICS:
 *    - Tracciamento eventi (apertura app, selezione programma, promemoria impostati).
 * 
 * @module context/AppContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { CategoryType, TabType, Program, ReminderItem, Channel } from '../types';
import { darkTheme, lightTheme, ThemeColors } from '../theme/colors';
import { getFavoriteChannelIds, saveFavoriteChannelIds, getSavedReminders, addReminder, removeReminder } from '../services/storage';
import { scheduleProgramReminder, cancelProgramReminder } from '../services/notifications';
import { trackAppOpen, trackSelectProgram, trackReminder } from '../services/analytics';
import { normalizeChannelId } from '../api/client';

/** Interfaccia contrattuale dello stato globale e delle relative mutazioni */
interface AppContextType {
  /** Stato corrente del tema (true = Dark Theme, false = Light Theme) */
  isDarkMode: boolean;
  /** Inverte la modalità tema */
  toggleTheme: () => void;
  /** Palette di colori semantici attivi per il rendering UI */
  colors: ThemeColors;
  /** Tab principale attualmente visualizzato */
  activeTab: TabType;
  /** Cambia il tab principale attivo */
  setActiveTab: (tab: TabType) => void;
  /** Categoria di filtro attiva nei palinsesti */
  selectedCategory: CategoryType;
  /** Imposta la categoria di filtro */
  setSelectedCategory: (cat: CategoryType) => void;
  /** Testo di ricerca corrente */
  searchQuery: string;
  /** Aggiorna il testo di ricerca */
  setSearchQuery: (q: string) => void;
  /** Elenco degli ID dei canali salvati nei preferiti */
  favorites: string[];
  /** Aggiunge o rimuove un canale dai preferiti e persiste su disco */
  toggleFavorite: (channelId: string) => Promise<void>;
  /** Verifica se un canale specifico è presente nei preferiti */
  isFavorite: (channelId: string) => boolean;
  /** Elenco dei promemoria attivi salvati dall'utente */
  reminders: ReminderItem[];
  /** Aggiunge o rimuove un promemoria per un programma e gestisce la notifica OS */
  toggleReminder: (program: Program, channelName: string, channelLogo: string) => Promise<boolean>;
  /** Verifica se un dato programma ha un promemoria attivo */
  hasReminder: (programId: string) => boolean;
  /** Programma attualmente selezionato per l'apertura del Bottom Sheet di dettaglio */
  selectedProgram: Program | null;
  /** Imposta o chiude il dettaglio del programma */
  setSelectedProgram: (prog: Program | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Provider globale che avvolge l'intera gerarchia dei componenti dell'app.
 * Inizializza le preferenze salvate su disco e ascolta i cambiamenti di tema.
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default dark per l'esperienza TV serale
  const [activeTab, setActiveTab] = useState<TabType>('stasera');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Tutti');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  useEffect(() => {
    // Caricamento asincrono iniziale da AsyncStorage e tracciamento sessione
    getFavoriteChannelIds().then(setFavorites);
    getSavedReminders().then(setReminders);
    trackAppOpen();
  }, []);

  /** Seleziona un programma e invia l'evento analitico */
  const handleSetSelectedProgram = (prog: Program | null) => {
    setSelectedProgram(prog);
    if (prog) {
      trackSelectProgram(prog.title, prog.channelName || 'Canale TV', prog.category);
    }
  };

  /** Commuta tra tema scuro e tema chiaro */
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const colors = isDarkMode ? darkTheme : lightTheme;

  /** Alterna la presenza di un canale nei preferiti e aggiorna la persistenza */
  const toggleFavorite = async (channelId: string) => {
    if (!channelId) return;
    const targetNorm = normalizeChannelId(channelId);
    const exists = favorites.some(fav => normalizeChannelId(fav) === targetNorm);
    const updated = exists
      ? favorites.filter(fav => normalizeChannelId(fav) !== targetNorm)
      : [...favorites, channelId];
    setFavorites(updated);
    await saveFavoriteChannelIds(updated);
  };

  /** Verifica se il canale è marcato come preferito tramite confronto normalizzato */
  const isFavorite = (channelId: string) => {
    if (!channelId) return false;
    const targetNorm = normalizeChannelId(channelId);
    return favorites.some(fav => normalizeChannelId(fav) === targetNorm);
  };

  /** Verifica se un programma possiede una notifica programmata */
  const hasReminder = (programId: string) => {
    return reminders.some(r => r.programId === programId);
  };

  /**
   * Gestisce il ciclo di vita di un promemoria:
   * 1. Se già presente: cancella la notifica dal sistema operativo e rimuove dal DB locale.
   * 2. Se non presente: schedula una notifica push (10 minuti prima dell'inizio) e salva su disco.
   * 
   * @returns true se il promemoria è stato attivato, false se è stato rimosso
   */
  const toggleReminder = async (
    program: Program,
    channelName: string,
    channelLogo: string
  ): Promise<boolean> => {
    const existing = reminders.find(r => r.programId === program.id);

    if (existing) {
      // Rimozione notifica OS se programmata
      if (existing.notificationId) {
        await cancelProgramReminder(existing.notificationId);
      }
      const updated = await removeReminder(program.id);
      setReminders(updated);
      trackReminder(program.title, channelName, 'remove');
      return false;
    } else {
      // Schedulazione allarme esatto OS
      const notificationId = await scheduleProgramReminder(program, channelName);
      const newReminder: ReminderItem = {
        id: `rem_${Date.now()}`,
        programId: program.id,
        programTitle: program.title,
        channelName,
        channelLogo,
        startTime: program.startTime,
        notificationId: notificationId || undefined,
        scheduledAt: new Date().toISOString(),
      };
      const updated = await addReminder(newReminder);
      setReminders(updated);
      trackReminder(program.title, channelName, 'add');
      return true;
    }
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        colors,
        activeTab,
        setActiveTab,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        favorites,
        toggleFavorite,
        isFavorite,
        reminders,
        toggleReminder,
        hasReminder,
        selectedProgram,
        setSelectedProgram: handleSetSelectedProgram,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook personalizzato per consumare lo stato dell'app con validazione sicura del contesto.
 * 
 * @throws Error se invocato al di fuori di un AppProvider
 * @returns Lo stato globale tipizzato e i metodi di mutazione
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
