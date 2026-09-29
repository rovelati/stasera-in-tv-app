/**
 * ============================================================================
 * STASERA IN TV - DIRECTORY CANALI TV (NAZIONALI, REGIONALI & TEMATICI)
 * ============================================================================
 * 
 * Questa vista fornisce la guida completa e navigabile a tutti i canali TV:
 * 
 * SEZIONI TEMATICHE (SectionList):
 * 1. 📺 Canali Nazionali & Digitale Terrestre (Rai, Mediaset, Discovery, La7, TV8, Nove).
 * 2. 📍 Emittenti Regionali & Territoriali (con metadati geografici di città e regione).
 * 3. ⚽ Canali Tematici & Club Serie A (Inter TV, Milan TV, Juventus Creator Lab, ecc.).
 * 
 * INTERATTIVITÀ:
 * - Filtro di ricerca in tempo reale (nome, città o regione).
 * - Tap sul canale per aprire la modale con il palinsesto completo (`ChannelScheduleModal`).
 * - Tasto rapido per la diretta streaming ufficiale.
 * - Tasto preferiti ❤️ per salvare il canale.
 * 
 * @module screens/CanaliScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, SectionList, Text, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useApp } from '../context/AppContext';
import { ChannelRow } from '../components/ChannelRow';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ChannelScheduleModal } from '../components/ChannelScheduleModal';
import { fetchChannelsApi } from '../api/client';
import { Channel } from '../types';
import { Search } from 'lucide-react-native';

export const CanaliScreen: React.FC = () => {
  const { colors } = useApp();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  /** Carica l'elenco dei canali da cache o rete */
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      const data = await fetchChannelsApi(isRefresh);
      setChannels(data);
    } catch (err) {
      console.warn('[CanaliScreen] Errore caricamento canali:', err);
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
    loadData(true);
  };

  // Filtro canali in tempo reale su nome, città e regione
  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (ch.geo?.city && ch.geo.city.toLowerCase().includes(filterText.toLowerCase())) ||
    (ch.geo?.region && ch.geo.region.toLowerCase().includes(filterText.toLowerCase()))
  );

  // Ripartizione dei canali nelle 3 macro-sezioni
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
      {/* Barra di ricerca canali con icona */}
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
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={30}
          renderItem={({ item }) => (
            <ChannelRow
              channel={item}
              onPress={(channel) => setSelectedChannel(channel)}
            />
          )}
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

      {/* Modale con il palinsesto del canale selezionato */}
      <ChannelScheduleModal
        channel={selectedChannel}
        onClose={() => setSelectedChannel(null)}
      />
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
