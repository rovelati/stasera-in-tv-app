/**
 * ============================================================================
 * STASERA IN TV - CHANNEL SCHEDULE MODAL (PALINSESTO DEL CANALE)
 * ============================================================================
 * 
 * Modale dedicata all'ispezione approfondita del palinsesto di un singolo canale TV:
 * 
 * CARATTERISTICHE:
 * 1. Switcher Sottoschede: "🌙 Stasera in TV" e "📅 Domani".
 * 2. Header Canale con LCN e pulsante Toggle Preferiti ❤️.
 * 3. Tasto Esteso Diretta Streaming Ufficiale.
 * 4. Lista Completa degli eventi televisivi con orario, genere e sinossi.
 * 5. Tap sul programma per aprire la scheda di dettaglio e impostare promemoria.
 * 
 * @module components/ChannelScheduleModal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Channel, Program } from '../types';
import { openLiveStream } from '../services/streaming';
import { fetchStaseraProgramsApi, fetchDomaniProgramsApi, fetchOraProgramsApi } from '../api/client';
import { X, Play, Heart, Clock, Film, Bell, Tv, ChevronRight } from 'lucide-react-native';

const { height } = Dimensions.get('window');

interface ChannelScheduleModalProps {
  channel: Channel | null;
  onClose: () => void;
}

export const ChannelScheduleModal: React.FC<ChannelScheduleModalProps> = ({ channel, onClose }) => {
  const { colors, isFavorite, toggleFavorite, setSelectedProgram, hasReminder } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'stasera' | 'domani'>('stasera');
  const [loading, setLoading] = useState<boolean>(false);
  const [channelPrograms, setChannelPrograms] = useState<Program[]>([]);

  useEffect(() => {
    if (!channel) return;

    let isMounted = true;
    setLoading(true);

    const loadChannelSchedule = async () => {
      try {
        if (activeSubTab === 'stasera') {
          const staseraData = await fetchStaseraProgramsApi();
          const found = staseraData.find(item => item.channel.id === channel.id);
          if (isMounted) {
            setChannelPrograms(found?.programs || []);
          }
        } else {
          const domaniData = await fetchDomaniProgramsApi();
          const found = domaniData.find(item => item.channel.id === channel.id);
          if (isMounted) {
            setChannelPrograms(found?.programs || []);
          }
        }
      } catch (err) {
        console.warn('Error loading channel schedule:', err);
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
              {channel.number > 0 && (
                <View style={[styles.numBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.numText}>LCN {channel.number}</Text>
                </View>
              )}
              {channel.logo ? (
                <Image source={{ uri: channel.logo }} style={styles.channelLogo} resizeMode="contain" />
              ) : null}
              <View>
                <Text style={[styles.channelTitle, { color: colors.text }]}>{channel.name}</Text>
                <Text style={[styles.channelSub, { color: colors.textSecondary }]}>
                  {channel.geo ? `${channel.geo.city} · ${channel.geo.region}` : 'Palinsesto TV'}
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

          {/* Action Row */}
          {channel.stream?.url && (
            <View style={styles.streamRow}>
              <TouchableOpacity
                style={[styles.streamFullBtn, { backgroundColor: '#dc2626' }]}
                onPress={() => openLiveStream(channel.stream?.url, channel.name)}
                activeOpacity={0.8}
              >
                <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.streamFullBtnText}>
                  Guarda Diretta Streaming Ufficiale ({channel.stream.label || 'Live'})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sub Tab Switcher */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle }]}>
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
                🌙 Stasera in TV
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
                  Caricamento guida {channel.name}...
                </Text>
              </View>
            ) : channelPrograms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Tv size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  Nessun programma trovato per questa fascia oraria.
                </Text>
              </View>
            ) : (
              channelPrograms.map((prog, index) => {
                const isReminded = hasReminder(prog.id);

                return (
                  <TouchableOpacity
                    key={`${prog.id}_${index}`}
                    style={[
                      styles.progItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.borderSubtle,
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
                        <Clock size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.timeLabel, { color: colors.text }]}>
                          {prog.startTimeFormatted || 'Orario'}
                        </Text>
                      </View>

                      {prog.isPrimaSerata && (
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
  numBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  numText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  channelLogo: {
    width: 32,
    height: 24,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  channelSub: {
    fontSize: 11,
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
    fontSize: 12.5,
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
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
    fontSize: 14.5,
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
