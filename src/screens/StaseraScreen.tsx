/**
 * ============================================================================
 * STASERA IN TV - SCHERMATA PRINCIPALE (PRIMA & SECONDA SERATA)
 * ============================================================================
 * 
 * Questa vista costituisce il cuore dell'applicazione:
 * 
 * ARCHITETTURA DI RENDERING & OTTIMIZZAZIONE:
 * 1. FlatList Virtualizzata:
 *    - `initialNumToRender={10}`: monta a freddo solo i primi 10 canali per rendering < 50ms.
 *    - `maxToRenderPerBatch={10}` & `windowSize={5}`: streaming asincrono degli elementi successivi.
 *    - `removeClippedSubviews={true}`: dealloca le viste native fuori dall'area visibile su Android.
 * 
 * 2. Filtraggio Dinamico per Categoria:
 *    - Filtra in memoria le trasmissioni in base alla pillola selezionata
 *      (Film, Serie TV, Sport, Intrattenimento, Informazione, Bambini, Documentari).
 * 
 * 3. Header Contestuale Dinamico:
 *    - Mostra il giorno della settimana e la data formattata in italiano secondo il fuso di Roma.
 * 
 * @module screens/StaseraScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { ProgramCard } from '../components/ProgramCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { fetchStaseraProgramsApi } from '../api/client';
import { ChannelSchedule, Program, Channel } from '../types';
import { isFilmProgram } from '../utils/programImages';

export const StaseraScreen: React.FC = () => {
  const { colors, selectedCategory } = useApp();
  const [schedules, setSchedules] = useState<ChannelSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /**
   * Carica i palinsesti serali dalla cache RAM/disco o dalla rete.
   * Se i dati sono già presenti, il caricamento è istantaneo (0ms).
   */
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      const data = await fetchStaseraProgramsApi(isRefresh);
      setSchedules(data);
    } catch (err) {
      console.warn('[StaseraScreen] Errore caricamento programmi:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Gestione del gesto di Pull-to-Refresh per forzare la risincronizzazione */
  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Appiattimento e filtraggio dei programmi in base alla categoria attiva
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

    let channelProgCount = 0;
    for (const prog of item.programs) {
      if (channelProgCount >= 2) break; // Requisito: max 2 programmi per canale (Prima e Seconda Serata)

      const cat = (prog.category || '').toLowerCase();
      let matches = false;

      if (selectedCategory === 'Tutti') {
        matches = true;
      } else if (selectedCategory === 'Film') {
        matches = isFilmProgram(prog, channel.id);
      } else if (selectedCategory === 'Serie TV') {
        matches = cat.includes('serie') || cat.includes('fiction') || cat.includes('soap');
      } else if (selectedCategory === 'Sport') {
        matches = cat.includes('sport') || cat.includes('calcio') || cat.includes('motori');
      } else if (selectedCategory === 'Intrattenimento') {
        matches = cat.includes('intrattenimento') || cat.includes('show') || cat.includes('varieta') || cat.includes('spettacolo');
      } else if (selectedCategory === 'Informazione') {
        matches = cat.includes('informazione') || cat.includes('tg') || cat.includes('attualita') || cat.includes('notizie');
      } else if (selectedCategory === 'Bambini') {
        matches = cat.includes('bambini') || cat.includes('ragazzi') || cat.includes('animazione') || cat.includes('cartoni');
      } else if (selectedCategory === 'Documentari') {
        matches = cat.includes('doc') || cat.includes('cultura') || cat.includes('storia') || cat.includes('natura');
      }

      if (matches) {
        filteredItems.push({ program: prog, channel });
        channelProgCount++;
      }
    }
  }

  // Calcolo della data odierna localizzata a Roma
  const todayRome = new Date().toLocaleDateString('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedToday = todayRome.charAt(0).toUpperCase() + todayRome.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barra filtri categorie orizzontale a scorrimento */}
      <CategoryFilter />

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => `${item.channel.id}_${item.program.id}`}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={[styles.headerBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.bannerRow}>
                <Text style={[styles.bannerTitle, { color: colors.text }]}>
                  🌙 Stasera in TV · {formattedToday}
                </Text>
                <View style={[styles.badgePill, { backgroundColor: colors.primaryLight + '25', borderColor: colors.primary }]}>
                  <Text style={[styles.badgePillText, { color: colors.primary }]}>Prima Serata</Text>
                </View>
              </View>
              <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
                Programmi in onda a partire dalle 21:15 su tutti i canali TV nazionali e regionali.
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
