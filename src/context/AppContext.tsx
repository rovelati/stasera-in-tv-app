import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { CategoryType, TabType, Program, ReminderItem, Channel } from '../types';
import { darkTheme, lightTheme, ThemeColors } from '../theme/colors';
import { getFavoriteChannelIds, toggleFavoriteChannelId, getSavedReminders, addReminder, removeReminder } from '../services/storage';
import { scheduleProgramReminder, cancelProgramReminder } from '../services/notifications';
import { trackAppOpen, trackSelectProgram, trackReminder } from '../services/analytics';

interface AppContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedCategory: CategoryType;
  setSelectedCategory: (cat: CategoryType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  favorites: string[];
  toggleFavorite: (channelId: string) => Promise<void>;
  isFavorite: (channelId: string) => boolean;
  reminders: ReminderItem[];
  toggleReminder: (program: Program, channelName: string, channelLogo: string) => Promise<boolean>;
  hasReminder: (programId: string) => boolean;
  selectedProgram: Program | null;
  setSelectedProgram: (prog: Program | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark for sleek TV guide experience
  const [activeTab, setActiveTab] = useState<TabType>('stasera');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Tutti');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  useEffect(() => {
    // Load initial stored preferences & track app open
    getFavoriteChannelIds().then(setFavorites);
    getSavedReminders().then(setReminders);
    trackAppOpen();
  }, []);

  const handleSetSelectedProgram = (prog: Program | null) => {
    setSelectedProgram(prog);
    if (prog) {
      trackSelectProgram(prog.title, prog.channelName || 'Canale TV', prog.category);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const colors = isDarkMode ? darkTheme : lightTheme;

  const toggleFavorite = async (channelId: string) => {
    const updated = await toggleFavoriteChannelId(channelId);
    setFavorites(updated);
  };

  const isFavorite = (channelId: string) => {
    return favorites.includes(channelId);
  };

  const hasReminder = (programId: string) => {
    return reminders.some(r => r.programId === programId);
  };

  const toggleReminder = async (
    program: Program,
    channelName: string,
    channelLogo: string
  ): Promise<boolean> => {
    const existing = reminders.find(r => r.programId === program.id);

    if (existing) {
      if (existing.notificationId) {
        await cancelProgramReminder(existing.notificationId);
      }
      const updated = await removeReminder(program.id);
      setReminders(updated);
      trackReminder(program.title, channelName, 'remove');
      return false;
    } else {
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

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
