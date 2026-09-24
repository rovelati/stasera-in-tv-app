import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { CategoryType } from '../types';
import { Film, Tv, Trophy, Sparkles, Newspaper, Baby, BookOpen, Layers } from 'lucide-react-native';

const CATEGORIES: { label: CategoryType; icon: any }[] = [
  { label: 'Tutti', icon: Layers },
  { label: 'Film', icon: Film },
  { label: 'Serie TV', icon: Tv },
  { label: 'Sport', icon: Trophy },
  { label: 'Intrattenimento', icon: Sparkles },
  { label: 'Informazione', icon: Newspaper },
  { label: 'Bambini', icon: Baby },
  { label: 'Documentari', icon: BookOpen },
];

export const CategoryFilter: React.FC = () => {
  const { selectedCategory, setSelectedCategory, colors } = useApp();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {CATEGORIES.map(({ label, icon: Icon }) => {
          const isSelected = selectedCategory === label;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => setSelectedCategory(label)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                  borderColor: isSelected ? colors.primaryDark : colors.border,
                },
              ]}
            >
              <Icon
                size={14}
                color={isSelected ? '#ffffff' : colors.textSecondary}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#ffffff' : colors.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
