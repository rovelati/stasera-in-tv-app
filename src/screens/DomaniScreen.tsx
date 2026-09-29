import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { ProgramCard } from '../components/ProgramCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { fetchDomaniProgramsApi } from '../api/client';
import { ChannelSchedule, Program, Channel } from '../types';

export const DomaniScreen: React.FC = () => {
  const { colors, selectedCategory } = useApp();
  const [schedules, setSchedules] = useState<ChannelSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchDomaniProgramsApi();
      setSchedules(data);
    } catch (err) {
      console.warn('Error loading domani programs:', err);
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
        matches = cat.includes('sport') || cat.includes('calcio');
      } else if (selectedCategory === 'Intrattenimento') {
        matches = cat.includes('intrattenimento') || cat.includes('show');
      } else if (selectedCategory === 'Informazione') {
        matches = cat.includes('informazione') || cat.includes('tg');
      } else if (selectedCategory === 'Bambini') {
        matches = cat.includes('bambini') || cat.includes('ragazzi');
      } else if (selectedCategory === 'Documentari') {
        matches = cat.includes('doc') || cat.includes('cultura');
      }

      if (matches) {
        filteredItems.push({ program: prog, channel });
      }
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowRome = tomorrow.toLocaleDateString('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedTomorrow = tomorrowRome.charAt(0).toUpperCase() + tomorrowRome.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CategoryFilter />

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => `${item.channel.id}_${item.program.id}`}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={30}
          ListHeaderComponent={
            <View style={[styles.headerBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.bannerRow}>
                <Text style={[styles.bannerTitle, { color: colors.text }]}>
                  📅 Programmi di Domani · {formattedTomorrow}
                </Text>
                <View style={[styles.badgePill, { backgroundColor: colors.primaryLight + '25', borderColor: colors.primary }]}>
                  <Text style={[styles.badgePillText, { color: colors.primary }]}>Guida TV</Text>
                </View>
              </View>
              <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
                Scopri in anteprima i programmi e i film in onda domani sui principali canali TV.
              </Text>
            </View>
          }
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
              title="Palinsesto di domani in arrivo"
              message="I programmi di domani saranno aggiornati nelle prossime ore."
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
  headerBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  listContent: {
    paddingVertical: 4,
    paddingBottom: 24,
  },
});
