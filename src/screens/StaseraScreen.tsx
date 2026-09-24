import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { ProgramCard } from '../components/ProgramCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { fetchStaseraProgramsApi } from '../api/client';
import { ChannelSchedule, Program, Channel } from '../types';

export const StaseraScreen: React.FC = () => {
  const { colors, selectedCategory } = useApp();
  const [schedules, setSchedules] = useState<ChannelSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchStaseraProgramsApi();
      setSchedules(data);
    } catch (err) {
      console.warn('Error loading stasera programs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Flatten & filter items according to selected category
  const filteredItems: { program: Program; channel: Channel }[] = [];

  for (const item of schedules) {
    const channel: Channel = {
      id: item.channel.id,
      name: item.channel.name,
      number: item.channel.number,
      logo: item.channel.logo,
      stream: item.channel.streamUrl ? { url: item.channel.streamUrl, label: item.channel.streamLabel || undefined } : null,
      geo: item.channel.geo || null,
    };

    for (const prog of item.programs) {
      const cat = (prog.category || '').toLowerCase();
      let matches = false;

      if (selectedCategory === 'Tutti') {
        matches = true;
      } else if (selectedCategory === 'Film') {
        matches = cat.includes('film') || cat.includes('cinema');
      } else if (selectedCategory === 'Serie TV') {
        matches = cat.includes('serie') || cat.includes('fiction');
      } else if (selectedCategory === 'Sport') {
        matches = cat.includes('sport') || cat.includes('calcio') || cat.includes('motori');
      } else if (selectedCategory === 'Intrattenimento') {
        matches = cat.includes('intrattenimento') || cat.includes('show') || cat.includes('varieta');
      } else if (selectedCategory === 'Informazione') {
        matches = cat.includes('informazione') || cat.includes('tg') || cat.includes('attualita');
      } else if (selectedCategory === 'Bambini') {
        matches = cat.includes('bambini') || cat.includes('ragazzi') || cat.includes('animazione');
      } else if (selectedCategory === 'Documentari') {
        matches = cat.includes('doc') || cat.includes('cultura') || cat.includes('storia');
      }

      if (matches) {
        filteredItems.push({ program: prog, channel });
      }
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CategoryFilter />

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => `${item.channel.id}_${item.program.id}`}
          renderItem={({ item }) => (
            <ProgramCard program={item.program} channel={item.channel} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={`Nessun programma in "${selectedCategory}"`}
              message="Prova a selezionare un'altra categoria o aggiorna la guida."
              onRetry={onRefresh}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 20,
  },
});
