import React, { useState, useEffect, useCallback } from 'react';
import { View, SectionList, Text, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useApp } from '../context/AppContext';
import { ChannelRow } from '../components/ChannelRow';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { fetchChannelsApi } from '../api/client';
import { Channel } from '../types';
import { Search } from 'lucide-react-native';

export const CanaliScreen: React.FC = () => {
  const { colors } = useApp();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchChannelsApi();
      setChannels(data);
    } catch (err) {
      console.warn('Error fetching channels:', err);
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

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (ch.geo?.city && ch.geo.city.toLowerCase().includes(filterText.toLowerCase())) ||
    (ch.geo?.region && ch.geo.region.toLowerCase().includes(filterText.toLowerCase()))
  );

  const nationalChannels = filteredChannels.filter(ch => !ch.geo?.isLocal && !ch.id.startsWith('seriea-'));
  const regionalChannels = filteredChannels.filter(ch => ch.geo?.isLocal && !ch.id.startsWith('seriea-'));
  const clubChannels = filteredChannels.filter(ch => ch.id.startsWith('seriea-') || ch.id.includes('-tv'));

  const sections = [
    { title: '📺 Canali Nazionali & Digitale Terrestre', data: nationalChannels },
    { title: '📍 Emittenti Regionali & Territoriali', data: regionalChannels },
    { title: '⚽ Canali Tematici & Club Serie A', data: clubChannels },
  ].filter(sec => sec.data.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInner, { backgroundColor: colors.surfaceSubtle }]}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Filtra canali per nome, città o regione..."
            placeholderTextColor={colors.textMuted}
            value={filterText}
            onChangeText={setFilterText}
          />
        </View>
      </View>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChannelRow channel={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>
                {title}
              </Text>
            </View>
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
              title="Nessun canale trovato"
              message="Nessuna emittente corrisponde alla ricerca inserita."
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
  searchBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
