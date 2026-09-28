import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { ReminderItem, Channel } from '../types';
import { fetchChannelsApi } from '../api/client';
import { ChannelScheduleModal } from '../components/ChannelScheduleModal';
import { openLiveStream } from '../services/streaming';
import {
  Bell,
  Trash2,
  Heart,
  Tv,
  Clock,
  Play,
  Calendar,
  ChevronRight,
  Info,
} from 'lucide-react-native';

export const PreferitiScreen: React.FC = () => {
  const {
    colors,
    reminders,
    favorites,
    toggleReminder,
    toggleFavorite,
    setActiveTab,
  } = useApp();

  const [activeSegment, setActiveSegment] = useState<'channels' | 'reminders'>('channels');
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  useEffect(() => {
    fetchChannelsApi()
      .then(setAllChannels)
      .catch(err => console.warn('Error fetching channels for favorites:', err));
  }, []);

  const favoriteChannels = allChannels.filter(c => favorites.includes(c.id));

  const handleCancelReminder = (item: ReminderItem) => {
    Alert.alert(
      'Annulla promemoria',
      `Vuoi rimuovere il promemoria per "${item.programTitle}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: () =>
            toggleReminder(
              { id: item.programId, title: item.programTitle, startTime: item.startTime, endTime: '' },
              item.channelName,
              item.channelLogo
            ),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Segment Switcher: Canali Preferiti vs Promemoria */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.segmentTrack, { backgroundColor: colors.surfaceSubtle }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'channels' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveSegment('channels')}
            activeOpacity={0.8}
          >
            <Heart
              size={14}
              color={activeSegment === 'channels' ? '#ffffff' : colors.textSecondary}
              fill={activeSegment === 'channels' ? '#ffffff' : 'transparent'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === 'channels' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              Canali Preferiti ({favoriteChannels.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'reminders' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveSegment('reminders')}
            activeOpacity={0.8}
          >
            <Bell
              size={14}
              color={activeSegment === 'reminders' ? '#ffffff' : colors.textSecondary}
              fill={activeSegment === 'reminders' ? '#ffffff' : 'transparent'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === 'reminders' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              Promemoria ({reminders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tab Content */}
      {activeSegment === 'channels' ? (
        <FlatList
          data={favoriteChannels}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.infoBanner}>
              <Text style={[styles.infoBannerTitle, { color: colors.text }]}>
                ⭐ I tuoi Canali Salvati
              </Text>
              <Text style={[styles.infoBannerSubtitle, { color: colors.textSecondary }]}>
                Tocca un canale per consultare il palinsesto completo di Stasera e Domani, oppure avvia la diretta streaming.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Heart size={36} color={colors.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Nessun canale nei preferiti
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Tocca l'icona del cuoricino ❤️ su qualsiasi canale o programma per averlo sempre a portata di mano in questa schermata.
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab('canali')}
              >
                <Text style={styles.browseBtnText}>Sfoglia tutti i canali TV</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.channelCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
              onPress={() => setSelectedChannel(item)}
            >
              <View style={styles.channelLeft}>
                {item.number > 0 && (
                  <View style={[styles.numberBadge, { backgroundColor: colors.surfaceSubtle }]}>
                    <Text style={[styles.numberText, { color: colors.textSecondary }]}>
                      {item.number}
                    </Text>
                  </View>
                )}

                {item.logo ? (
                  <Image source={{ uri: item.logo }} style={styles.channelLogo} resizeMode="contain" />
                ) : (
                  <View style={[styles.fallbackLogo, { backgroundColor: colors.primary }]}>
                    <Text style={styles.fallbackLogoText}>{item.name.slice(0, 2)}</Text>
                  </View>
                )}

                <View style={styles.channelInfo}>
                  <Text style={[styles.channelName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.channelScheduleHint, { color: colors.primary }]}>
                    Tocca per vedere la programmazione
                  </Text>
                </View>
              </View>

              <View style={styles.channelActions}>
                {item.stream?.url && (
                  <TouchableOpacity
                    style={[styles.streamBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => openLiveStream(item.stream?.url, item.name)}
                    activeOpacity={0.8}
                  >
                    <Play size={11} color="#ffffff" fill="#ffffff" style={{ marginRight: 3 }} />
                    <Text style={styles.streamBtnText}>Diretta</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => toggleFavorite(item.id)}
                  hitSlop={10}
                  style={styles.favBtn}
                >
                  <Heart size={18} color="#ef4444" fill="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.infoBanner}>
              <Text style={[styles.infoBannerTitle, { color: colors.text }]}>
                🔔 I tuoi Promemoria Attivi
              </Text>
              <Text style={[styles.infoBannerSubtitle, { color: colors.textSecondary }]}>
                Riceverai una notifica push 10 minuti prima dell'inizio di ogni trasmissione programmata.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Bell size={36} color={colors.textMuted} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Nessun promemoria attivo
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Tocca la campanella 🔔 su un programma per impostare una notifica automatica prima della messa in onda.
              </Text>
              <TouchableOpacity
                style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab('stasera')}
              >
                <Text style={styles.browseBtnText}>Esplora programmi di stasera</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const startDate = new Date(item.startTime);
            const timeFormatted = isNaN(startDate.getTime())
              ? 'Orario'
              : startDate.toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });

            return (
              <View
                style={[
                  styles.reminderCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.reminderLeft}>
                  {item.channelLogo ? (
                    <Image source={{ uri: item.channelLogo }} style={styles.channelLogo} resizeMode="contain" />
                  ) : (
                    <View style={[styles.fallbackLogo, { backgroundColor: colors.primary }]}>
                      <Text style={styles.fallbackLogoText}>TV</Text>
                    </View>
                  )}
                  <View style={styles.reminderInfo}>
                    <Text style={[styles.programTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.programTitle}
                    </Text>
                    <View style={styles.metaRow}>
                      <Clock size={12} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.timeText, { color: colors.primary }]}>
                        {timeFormatted} · {item.channelName}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: colors.surfaceSubtle }]}
                  onPress={() => handleCancelReminder(item)}
                  hitSlop={10}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Schedule Modal for Favorited Channels */}
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
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
  },
  infoBanner: {
    marginBottom: 14,
  },
  infoBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoBannerSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 18,
  },
  browseBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  numberBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
    minWidth: 28,
    alignItems: 'center',
  },
  numberText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  channelLogo: {
    width: 32,
    height: 24,
    marginRight: 10,
  },
  fallbackLogo: {
    width: 32,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fallbackLogoText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  channelScheduleHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  channelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  streamBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  favBtn: {
    padding: 4,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  reminderInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
