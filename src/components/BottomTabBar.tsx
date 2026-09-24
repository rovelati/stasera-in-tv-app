import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { Moon, Radio, Calendar, Tv, Heart } from 'lucide-react-native';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'stasera', label: 'Stasera', icon: Moon },
  { id: 'ora', label: 'Ora in TV', icon: Radio },
  { id: 'domani', label: 'Domani', icon: Calendar },
  { id: 'canali', label: 'Canali', icon: Tv },
  { id: 'preferiti', label: 'Preferiti', icon: Heart },
];

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, colors, reminders } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        const color = isActive ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={id}
            style={styles.tab}
            onPress={() => setActiveTab(id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Icon size={20} color={color} fill={isActive && id === 'preferiti' ? colors.primary : 'transparent'} />
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
                  fontWeight: isActive ? '800' : '500',
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  label: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
});
