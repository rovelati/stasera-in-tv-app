/**
 * ============================================================================
 * STASERA IN TV - PROGRAM DETAIL BOTTOM SHEET MODAL
 * ============================================================================
 * 
 * Scheda descrittiva approfondita per il singolo evento televisivo:
 * 
 * DESIGN & INTERAZIONI NATIVE:
 * 1. Chiusura 100% Robusta & Anti-Deadlock:
 *    - Tasto X in alto a destra con area di tocco allargata (HitSlop).
 *    - Tocco sul backdrop semitrasparente esterno.
 *    - Gesto Swipe-Down fluido sulla maniglia superiore.
 *    - Tasto fisico "Indietro" di Android supportato nativamente.
 * 2. Banner Locandina HD / Immagine di Copertina ad alta risoluzione.
 * 3. Condivisione mirata con link diretto alla pagina del canale su intvstasera.it.
 * 4. Pulsante "Guarda in Diretta" istantaneo e sicuro.
 * 5. Pulsante "Avvisami prima dell'inizio" con promemoria 10 minuti prima.
 * 
 * @module components/ProgramDetailModal
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { openLiveStream } from '../services/streaming';
import { ChannelLogo } from './ChannelLogo';
import { X, Play, Bell, Share2, Clock, Check } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export const ProgramDetailModal: React.FC = () => {
  const { selectedProgram, setSelectedProgram, colors, toggleReminder, hasReminder } = useApp();
  const panY = useRef(new Animated.Value(0)).current;

  // Ripristina la posizione iniziale del foglio all'apertura
  useEffect(() => {
    if (selectedProgram) {
      panY.setValue(0);
    }
  }, [selectedProgram]);

  /**
   * Chiusura affidabile e istantanea del modal.
   * Non utilizza flag booleani bloccanti per evitare qualsiasi deadlock su Android.
   */
  const handleClose = () => {
    Animated.timing(panY, {
      toValue: height,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedProgram(null);
    });
  };

  /**
   * Gestore del gesto di trascinamento swipe-down sulla maniglia
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  if (!selectedProgram) return null;

  const isReminded = hasReminder(selectedProgram.id);

  const handleShare = async () => {
    try {
      const channelSlug = selectedProgram.channelId || 'stasera';
      const programUrl = `https://www.intvstasera.it/${channelSlug}/`;
      const chName = selectedProgram.channelName || 'TV';
      const timeStr = selectedProgram.startTimeFormatted ? `alle ${selectedProgram.startTimeFormatted}` : 'stasera';

      await Share.share({
        title: `${selectedProgram.title} su ${chName}`,
        message: `Guarda "${selectedProgram.title}" in onda ${timeStr} su ${chName}!\nScopri i dettagli del programma su ${programUrl}`,
        url: programUrl,
      });
    } catch (err) {
      console.warn('[ProgramDetailModal] Errore condivisione:', err);
    }
  };

  return (
    <Modal
      visible={Boolean(selectedProgram)}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        {/* Tocco sull'area scura esterna per chiusura immediata */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropDismiss} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Maniglia di trascinamento swipe-down (PanResponder dedicato) */}
          <View {...panResponder.panHandlers} style={styles.sheetHeader}>
            <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />

            {/* Tasto X di Chiusura ad alta visibilità e hitSlop generoso */}
            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={handleClose}
              hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
              activeOpacity={0.7}
              accessibilityLabel="Chiudi scheda"
            >
              <X size={20} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Locandina / Immagine di copertina HD */}
            {selectedProgram.posterUrl ? (
              <Image
                source={{ uri: selectedProgram.posterUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : null}

            {/* Metadati Canale ed Emittente */}
            <View style={styles.metaHeader}>
              <View style={[styles.channelPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <ChannelLogo
                  logoUrl={selectedProgram.channelLogo}
                  channelName={selectedProgram.channelName || 'TV'}
                  size={26}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.channelName, { color: colors.text }]}>
                  {selectedProgram.channelName || 'Canale TV'}
                </Text>
                {selectedProgram.channelNumber && selectedProgram.channelNumber > 0 ? (
                  <View style={[styles.numBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.numText}>LCN {selectedProgram.channelNumber}</Text>
                  </View>
                ) : null}
              </View>

              {selectedProgram.category ? (
                <View style={[styles.categoryBadge, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.categoryText, { color: colors.badgeText }]}>
                    {selectedProgram.category}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Titolo Principale */}
            <Text style={[styles.title, { color: colors.text }]}>
              {selectedProgram.title}
            </Text>

            {/* Orario e Durata */}
            <View style={[styles.timeCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
              <Clock size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.timeText, { color: colors.text }]}>
                {selectedProgram.startTimeFormatted || 'Inizio'}
                {selectedProgram.endTimeFormatted ? ` - ${selectedProgram.endTimeFormatted}` : ''}
              </Text>
            </View>

            {/* Tasti di Azione Principali */}
            <View style={styles.actionRow}>
              {selectedProgram.streamUrl ? (
                <TouchableOpacity
                  style={[styles.mainActionBtn, { backgroundColor: '#dc2626' }]}
                  onPress={() => openLiveStream(selectedProgram.streamUrl, selectedProgram.channelName)}
                  activeOpacity={0.8}
                >
                  <Play size={16} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.mainActionText}>
                    Guarda in Diretta ({selectedProgram.streamLabel || 'Live'})
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.reminderActionBtn,
                  {
                    backgroundColor: isReminded ? colors.accent : colors.surfaceSubtle,
                    borderColor: isReminded ? colors.accent : colors.border,
                  },
                ]}
                onPress={() =>
                  toggleReminder(
                    selectedProgram,
                    selectedProgram.channelName || 'TV',
                    selectedProgram.channelLogo || ''
                  )
                }
                activeOpacity={0.8}
              >
                {isReminded ? (
                  <Check size={18} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 6 }} />
                ) : (
                  <Bell size={18} color={colors.text} style={{ marginRight: 6 }} />
                )}
                <Text
                  style={[
                    styles.reminderActionText,
                    { color: isReminded ? '#ffffff' : colors.text },
                  ]}
                >
                  {isReminded ? 'Promemoria Attivo (-10 min)' : 'Avvisami prima dell\'inizio'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sinossi / Trama Completa */}
            <View style={styles.descSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                TRAMA & DETTAGLI
              </Text>
              <Text style={[styles.description, { color: colors.text }]}>
                {selectedProgram.description ||
                  'Nessuna sinossi dettagliata disponibile per questo programma.'}
              </Text>
            </View>

            {/* Tasto Condividi */}
            <TouchableOpacity
              style={[styles.shareBtn, { borderColor: colors.borderSubtle }]}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Share2 size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.shareText, { color: colors.textSecondary }]}>
                Condividi programma
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: height * 0.90,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    position: 'relative',
    zIndex: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 4,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 44,
  },
  bannerImage: {
    width: '100%',
    height: 210,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#1e293b',
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  channelName: {
    fontSize: 12,
    fontWeight: '700',
  },
  numBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  numText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 27,
    marginBottom: 12,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    gap: 10,
    marginBottom: 20,
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  reminderActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  reminderActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  descSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
