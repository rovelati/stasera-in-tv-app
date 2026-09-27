import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Search, Moon, Sun, X, Bell } from 'lucide-react-native';

interface HeaderProps {
  showSearch?: boolean;
  onSearchToggle?: () => void;
  isSearching?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showSearch = true,
  onSearchToggle,
  isSearching = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode, toggleTheme, searchQuery, setSearchQuery, reminders, setActiveTab } = useApp();

  const getTodayFormatted = () => {
    const now = new Date();
    return now.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: insets.top > 0 ? insets.top + 6 : 14,
        },
      ]}
    >
      {isSearching ? (
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cerca film, serie, canali, sport..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onSearchToggle} hitSlop={10}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>Chiudi</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.titleContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Stasera In TV</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {getTodayFormatted()} · intvstasera.it
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            {reminders.length > 0 && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setActiveTab('preferiti')}
                activeOpacity={0.7}
              >
                <Bell size={18} color={colors.accent} />
                <View style={[styles.reminderBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.reminderCount}>{reminders.length}</Text>
                </View>
              </TouchableOpacity>
            )}

            {showSearch && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
                onPress={onSearchToggle}
                activeOpacity={0.7}
              >
                <Search size={18} color={colors.text} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              {isDarkMode ? (
                <Sun size={18} color="#f59e0b" />
              ) : (
                <Moon size={18} color="#475569" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reminderBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  reminderCount: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
});
