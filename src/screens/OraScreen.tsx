import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { LiveProgramCard } from '../components/LiveProgramCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { fetchOraProgramsApi } from '../api/client';
import { Channel, Program } from '../types';

export const OraScreen: React.FC = () => {
  const { colors } = useApp();
  const [liveItems, setLiveItems] = useState<
    {
      channel: Channel;
      currentProgram: Program | null;
      nextProgram: Program | null;
      allPrograms: Program[];
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchOraProgramsApi();
      setLiveItems(data);
    } catch (err) {
      console.warn('Error loading live programs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={liveItems.filter(item => item.currentProgram !== null)}
          keyExtractor={item => item.channel.id}
          renderItem={({ item }) =>
            item.currentProgram ? (
              <LiveProgramCard
                channel={item.channel}
                currentProgram={item.currentProgram}
                nextProgram={item.nextProgram}
              />
            ) : null
          }
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
              title="Nessun canale in onda al momento"
              message="I palinsesti live sono in fase di sincronizzazione con l'emittente."
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
