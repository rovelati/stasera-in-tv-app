import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { LiveProgramCard } from '../components/LiveProgramCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { fetchOraProgramsApi } from '../api/client';
import { Channel, Program } from '../types';
import { Radio, Clock } from 'lucide-react-native';

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
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  const updateTimeHeader = useCallback(() => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('it-IT', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const dateFormatted = now.toLocaleDateString('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    setCurrentTimeStr(timeFormatted);
    setCurrentDateStr(dateFormatted);
  }, []);

  const loadData = useCallback(async () => {
    try {
      updateTimeHeader();
      const data = await fetchOraProgramsApi();
      setLiveItems(data);
    } catch (err) {
      console.warn('Error loading live programs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateTimeHeader]);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      updateTimeHeader();
    }, 10000);
    const apiInterval = setInterval(loadData, 60000); // Poll API every minute
    return () => {
      clearInterval(timer);
      clearInterval(apiInterval);
    };
  }, [loadData, updateTimeHeader]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const validLiveItems = liveItems.filter(item => item.currentProgram !== null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Informative Header Banner */}
      <View
        style={[
          styles.headerBanner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.bannerTopRow}>
          <View style={[styles.livePill, { backgroundColor: '#dc2626' }]}>
            <View style={styles.pulsingDot} />
            <Text style={styles.livePillText}>IN ONDA ADESSO</Text>
          </View>
          <View style={styles.clockRow}>
            <Clock size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.clockText, { color: colors.text }]}>
              {currentTimeStr ? `ore ${currentTimeStr}` : 'In tempo reale'}
            </Text>
          </View>
        </View>

        <Text style={[styles.bannerDate, { color: colors.text }]}>
          {currentDateStr ? currentDateStr.charAt(0).toUpperCase() + currentDateStr.slice(1) : 'Programmi in onda'}
        </Text>
        <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
          {validLiveItems.length > 0
            ? `${validLiveItems.length} canali TV in trasmissione in questo momento.`
            : 'Sincronizzazione della guida TV in corso...'}
        </Text>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={validLiveItems}
          keyExtractor={item => item.channel.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={30}
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
  headerBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  livePillText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockText: {
    fontSize: 12,
    fontWeight: '800',
  },
  bannerDate: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 6,
    paddingBottom: 24,
  },
});
