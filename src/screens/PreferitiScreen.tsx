import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { ReminderItem } from '../types';
import { Bell, Trash2, Heart, Tv, Clock, Play } from 'lucide-react-native';

export const PreferitiScreen: React.FC = () => {
  const { colors, reminders, favorites, toggleReminder, toggleFavorite, setActiveTab } = useApp();

  const handleCancelReminder = (item: ReminderItem) => {
    Alert.alert(
      'Annulla promemoria',
      `Vuoi rimuovere il promemoria per "${item.programTitle}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: () => toggleReminder({ id: item.programId, title: item.programTitle, startTime: item.startTime, endTime: '' }, item.channelName, item.channelLogo),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={reminders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Section 1: Active Reminders Header */}
            <View style={styles.sectionTitleRow}>
              <Bell size={18} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Promemoria Attivi ({reminders.length})
              </Text>
            </View>
            {reminders.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Bell size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nessun promemoria attivo</Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  Tocca l'icona della campanella su qualsiasi programma per ricevere una notifica 10 minuti prima della messa in onda.
                </Text>
                <TouchableOpacity
                  style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setActiveTab('stasera')}
                >
                  <Text style={styles.browseBtnText}>Esplora programmi di stasera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const startDate = new Date(item.startTime);
          const timeFormatted = startDate.toLocaleTimeString('it-IT', {
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
                    <Text style={styles.fallbackText}>TV</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerSection: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 16,
  },
  browseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  channelLogo: {
    width: 32,
    height: 24,
    marginRight: 12,
  },
  fallbackLogo: {
    width: 32,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fallbackText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
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
