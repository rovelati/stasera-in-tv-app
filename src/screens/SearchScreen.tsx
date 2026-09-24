import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { ProgramCard } from '../components/ProgramCard';
import { EmptyState } from '../components/EmptyState';
import { fetchStaseraProgramsApi, fetchOraProgramsApi, fetchDomaniProgramsApi } from '../api/client';
import { Program, Channel } from '../types';

export const SearchScreen: React.FC = () => {
  const { colors, searchQuery } = useApp();
  const [results, setResults] = useState<{ program: Program; channel: Channel }[]>([]);
  const [allData, setAllData] = useState<{ program: Program; channel: Channel }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAllPrograms() {
      try {
        const [stasera, domani] = await Promise.all([
          fetchStaseraProgramsApi(),
          fetchDomaniProgramsApi(),
        ]);

        const combined: { program: Program; channel: Channel }[] = [];
        const seen = new Set<string>();

        for (const item of [...stasera, ...domani]) {
          const ch: Channel = {
            id: item.channel.id,
            name: item.channel.name,
            number: item.channel.number,
            logo: item.channel.logo,
            stream: item.channel.streamUrl ? { url: item.channel.streamUrl, label: item.channel.streamLabel || undefined } : null,
            geo: item.channel.geo || null,
          };

          for (const prog of item.programs) {
            const key = `${ch.id}_${prog.id}_${prog.startTime}`;
            if (!seen.has(key)) {
              seen.add(key);
              combined.push({ program: prog, channel: ch });
            }
          }
        }

        setAllData(combined);
      } catch (err) {
        console.warn('Error loading search cache:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllPrograms();
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const filtered = allData.filter(
      item =>
        item.program.title.toLowerCase().includes(q) ||
        (item.program.description && item.program.description.toLowerCase().includes(q)) ||
        item.channel.name.toLowerCase().includes(q) ||
        (item.program.category && item.program.category.toLowerCase().includes(q))
    );

    setResults(filtered);
  }, [searchQuery, allData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.resultsInfo}>
        <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
          {searchQuery ? `${results.length} programmi trovati per "${searchQuery}"` : 'Digita per cercare tra tutti i programmi e canali TV'}
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => `${item.channel.id}_${item.program.id}_${item.program.startTime}`}
        renderItem={({ item }) => (
          <ProgramCard program={item.program} channel={item.channel} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          searchQuery.length > 1 ? (
            <EmptyState
              title="Nessun risultato trovato"
              message={`Nessun programma o canale corrisponde a "${searchQuery}". Prova con un termine più generale.`}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
});
