import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { Moon, Radio, Calendar, Tv, Heart } from 'lucide-react-native';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'stasera', label: 'Stasera', icon: Moon },
  { id: 'ora', label: 'In Onda', icon: Radio },
  { id: 'domani', label: 'Domani', icon: Calendar },
  { id: 'canali', label: 'Canali', icon: Tv },
  { id: 'preferiti', label: 'Preferiti', icon: Heart },
];

export const BottomTabBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab, colors, reminders } = useApp();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 14),
        },
      ]}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        const color = isActive ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.tab,
              isActive && { backgroundColor: isDarkModeStyle(colors.primary) },
            ]}
            onPress={() => setActiveTab(id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Icon
                size={22}
                color={color}
                fill={isActive && id === 'preferiti' ? colors.primary : 'transparent'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {id === 'preferiti' && reminders.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeText}>{reminders.length}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontWeight: isActive ? '800' : '600',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const isDarkModeStyle = (primaryColor: string) => {
  return `${primaryColor}15`; // 8% opacity tint for active tab pill
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900',
  },
  label: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
});
