/**
 * ============================================================================
 * STASERA IN TV - CHANNEL SCHEDULE MODAL (PALINSESTO COMPLETO DEL CANALE)
 * ============================================================================
 * 
 * Modale dedicata all'ispezione approfondita del palinsesto di un singolo canale TV:
 * 
 * CARATTERISTICHE:
 * 1. Switcher a 3 Sottoschede: "📺 Oggi (24h)", "🌙 Stasera", "📅 Domani".
 * 2. Visualizzazione 24h completa con evidenziazione "🔴 IN ONDA ADESSO" sul programma corrente.
 * 3. Header Canale con logo ad alta risoluzione (ChannelLogo), LCN e pulsante Toggle Preferiti ❤️.
 * 4. Tasto Rapido Diretta Streaming Ufficiale.
 * 5. Scheda programma completa con orario di inizio/fine, genere, sinossi e link al dettaglio.
 * 
 * @module components/ChannelScheduleModal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Channel, Program } from '../types';
import { openLiveStream } from '../services/streaming';
import {
  fetchStaseraProgramsApi,
  fetchDomaniProgramsApi,
  fetchChannelDayScheduleApi,
  getCurrentRomeMinutes,
  getTimeMinutes,
  normalizeChannelId,
} from '../api/client';
import { ChannelLogo } from './ChannelLogo';
import { X, Play, Heart, Clock, Film, Bell, Tv, ChevronRight, Radio } from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface ChannelScheduleModalProps {
  channel: Channel | null;
  onClose: () => void;
}

export const ChannelScheduleModal: React.FC<ChannelScheduleModalProps> = ({ channel, onClose }) => {
  const { colors, isFavorite, toggleFavorite, setSelectedProgram, hasReminder } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'oggi' | 'stasera' | 'domani'>('oggi');
  const [loading, setLoading] = useState<boolean>(false);
  const [channelPrograms, setChannelPrograms] = useState<Program[]>([]);

  useEffect(() => {
    if (!channel) return;

    let isMounted = true;
    setLoading(true);

    const targetNorm = normalizeChannelId(channel.id);
    const matchesChannel = (ch: any) => {
      if (!ch) return false;
      if (normalizeChannelId(ch.id) === targetNorm) return true;
      if (channel.number > 0 && ch.number === channel.number) return true;
      if (ch.name && channel.name && ch.name.trim().toLowerCase() === channel.name.trim().toLowerCase()) return true;
      return false;
    };

    const loadChannelSchedule = async () => {
      try {
        if (activeSubTab === 'oggi') {
          const dayProgs = await fetchChannelDayScheduleApi(channel);
          if (isMounted) {
            setChannelPrograms(dayProgs);
          }
        } else if (activeSubTab === 'stasera') {
          const staseraData = await fetchStaseraProgramsApi();
          const found = staseraData.find(item => matchesChannel(item.channel));
          if (isMounted) {
            setChannelPrograms(found?.programs || []);
          }
        } else {
          const domaniData = await fetchDomaniProgramsApi();
          const found = domaniData.find(item => matchesChannel(item.channel));
          if (isMounted) {
            setChannelPrograms(found?.programs || []);
          }
        }
      } catch (err) {
        console.warn('[ChannelScheduleModal] Errore caricamento palinsesto:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadChannelSchedule();

    return () => {
      isMounted = false;
    };
  }, [channel, activeSubTab]);

  if (!channel) return null;

  const isFav = isFavorite(channel.id);
  const nowRomeMin = getCurrentRomeMinutes();

  return (
    <Modal
      visible={Boolean(channel)}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.channelMeta}>
              <ChannelLogo
                logoUrl={channel.logo}
                channelName={channel.name}
                size={42}
                style={{ marginRight: 2 }}
              />

              <View style={styles.headerTitleWrap}>
                <View style={styles.titleRow}>
                  <Text style={[styles.channelTitle, { color: colors.text }]} numberOfLines={1}>
                    {channel.name}
                  </Text>
                  {channel.number > 0 && (
                    <View style={[styles.numBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.numText}>LCN {channel.number}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.channelSub, { color: colors.textSecondary }]}>
                  {channel.geo ? `${channel.geo.city} (${channel.geo.region})` : 'Guida TV Ufficiale'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => toggleFavorite(channel.id)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Heart size={18} color={isFav ? '#ef4444' : colors.textSecondary} fill={isFav ? '#ef4444' : 'transparent'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
                onPress={onClose}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Direct Live Stream Button */}
          {channel.stream?.url && (
            <View style={styles.streamRow}>
              <TouchableOpacity
                style={[styles.streamFullBtn, { backgroundColor: '#dc2626' }]}
                onPress={() => openLiveStream(channel.stream?.url, channel.name)}
                activeOpacity={0.8}
              >
                <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.streamFullBtnText}>
                  Guarda Diretta Streaming ({channel.stream.label || 'Live Ufficiale'})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sub Tab Switcher: Oggi 24h, Stasera, Domani */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeSubTab === 'oggi' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setActiveSubTab('oggi')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeSubTab === 'oggi' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                📺 Oggi (24h)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeSubTab === 'stasera' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setActiveSubTab('stasera')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeSubTab === 'stasera' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                🌙 Stasera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeSubTab === 'domani' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setActiveSubTab('domani')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeSubTab === 'domani' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                📅 Domani
              </Text>
            </TouchableOpacity>
          </View>

          {/* Program List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Caricamento palinsesto {channel.name}...
                </Text>
              </View>
            ) : channelPrograms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Tv size={38} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Palinsesto non disponibile per {channel.name}
                </Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                  {channel.stream?.url
                    ? 'Puoi comunque seguire la trasmissione ufficiale in diretta streaming toccando il pulsante rosso sopra.'
                    : 'I dati di questa emittente verranno sincronizzati nelle prossime ore.'}
                </Text>
              </View>
            ) : (
              channelPrograms.map((prog, index) => {
                const isReminded = hasReminder(prog.id);

                // Calcolo se il programma è in onda adesso nel tab 24h
                let isCurrentlyLive = false;
                if (activeSubTab === 'oggi') {
                  const startMin = getTimeMinutes(prog.startTimeFormatted || prog.startTime);
                  let endMin = getTimeMinutes(prog.endTimeFormatted || prog.endTime);
                  if (endMin <= startMin && index + 1 < channelPrograms.length) {
                    endMin = getTimeMinutes(channelPrograms[index + 1].startTimeFormatted || channelPrograms[index + 1].startTime);
                  }
                  if (startMin <= endMin) {
                    isCurrentlyLive = nowRomeMin >= startMin && nowRomeMin < endMin;
                  } else {
                    isCurrentlyLive = nowRomeMin >= startMin || nowRomeMin < endMin;
                  }
                }

                return (
                  <TouchableOpacity
                    key={`${prog.id}_${index}`}
                    style={[
                      styles.progItem,
                      {
                        backgroundColor: isCurrentlyLive ? colors.primaryLight + '15' : colors.card,
                        borderColor: isCurrentlyLive ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose();
                      setSelectedProgram({
                        ...prog,
                        channelId: channel.id,
                        channelName: channel.name,
                        channelLogo: channel.logo,
                        channelNumber: channel.number,
                        streamUrl: channel.stream?.url,
                        streamLabel: channel.stream?.label,
                      });
                    }}
                  >
                    <View style={styles.progItemLeft}>
                      <View style={styles.timeTag}>
                        <Clock size={12} color={isCurrentlyLive ? colors.primary : colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.timeLabel, { color: isCurrentlyLive ? colors.primary : colors.text }]}>
                          {prog.startTimeFormatted || 'Orario'}
                          {prog.endTimeFormatted ? ` - ${prog.endTimeFormatted}` : ''}
                        </Text>
                      </View>

                      {isCurrentlyLive && (
                        <View style={[styles.liveBadgePill, { backgroundColor: '#dc2626' }]}>
                          <View style={styles.pulsingDot} />
                          <Text style={styles.liveBadgePillText}>IN ONDA</Text>
                        </View>
                      )}

                      {prog.isPrimaSerata && !isCurrentlyLive && (
                        <View style={[styles.badge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                          <Text style={[styles.badgeText, { color: colors.primary }]}>Prima Serata</Text>
                        </View>
                      )}

                      {prog.category ? (
                        <View style={[styles.catBadge, { backgroundColor: colors.badgeBg }]}>
                          <Text style={[styles.catText, { color: colors.badgeText }]} numberOfLines={1}>
                            {prog.category}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.progTitle, { color: colors.text }]} numberOfLines={2}>
                      {prog.title}
                    </Text>

                    {prog.description ? (
                      <Text style={[styles.progDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {prog.description}
                      </Text>
                    ) : null}

                    <View style={styles.progFooter}>
                      <Text style={[styles.detailLink, { color: colors.primary }]}>
                        Tocca per dettagli e trama
                      </Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  numBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  numText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  channelSub: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  streamFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  streamFullBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    borderRadius: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  progItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  progItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  liveBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 4,
  },
  pulsingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  liveBadgePillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  catText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  progTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  progDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  progFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  detailLink: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
