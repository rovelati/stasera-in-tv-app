/**
 * ============================================================================
 * STASERA IN TV - PROGRAM DETAIL BOTTOM SHEET MODAL (HARDENED & THREAD-SAFE)
 * ============================================================================
 * 
 * Scheda descrittiva approfondita per il singolo evento televisivo:
 * 
 * DESIGN & INTERAZIONI NATIVE RESILIENTI:
 * 1. Chiusura 100% Robusta & Anti-Deadlock:
 *    - Utilizza il meccanismo nativo Android Window Manager (`animationType="slide"`).
 *    - Elimina completamente nodi `Animated.Value` orfani che bloccavano la seconda apertura della card.
 *    - Tasto X in alto a destra con area di tocco allargata (HitSlop 25px).
 *    - Tocco sul backdrop semitrasparente esterno per chiusura istantanea.
 *    - Gesto Swipe-Down fluido con PanResponder non bloccante.
 *    - Tasto fisico "Indietro" di Android supportato nativamente tramite `onRequestClose`.
 * 2. Guard di stato `isClosingRef`: previene collisioni da doppi tocchi rapidi.
 * 3. Banner Locandina HD / Offline: risolve sia immagini locali require che remote.
 * 4. Condivisione mirata con link diretto alla pagina del canale su intvstasera.it.
 * 5. Pulsante "Guarda in Diretta" istantaneo e sicuro.
 * 6. Pulsante "Avvisami prima dell'inizio" con promemoria 10 minuti prima.
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
} from 'react-native';
import { useApp } from '../context/AppContext';
import { openLiveStream } from '../services/streaming';
import { ChannelLogo } from './ChannelLogo';
import { getProgramPosterSource } from '../utils/programImages';
import { X, Play, Bell, Share2, Clock, Check } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export const ProgramDetailModal: React.FC = () => {
  const { selectedProgram, setSelectedProgram, colors, toggleReminder, hasReminder } = useApp();
  const isClosingRef = useRef(false);

  // Reset del lock alla selezione di un nuovo programma
  useEffect(() => {
    if (selectedProgram) {
      isClosingRef.current = false;
    }
  }, [selectedProgram]);

  /**
   * Chiusura affidabile, immediata e thread-safe del modal.
   * La transizione di uscita è gestita dal sistema operativo nativo (Dialog slide-out).
   */
  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setSelectedProgram(null);
  };

  /**
   * Gestore non-bloccante del gesto swipe-down sulla maniglia superiore
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 12,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 40 || gestureState.vy > 0.4) {
          handleClose();
        }
      },
    })
  ).current;

  if (!selectedProgram) return null;

  const isReminded = hasReminder(selectedProgram.id);
  const posterSource = getProgramPosterSource(
    selectedProgram.posterUrl,
    selectedProgram.title,
    selectedProgram.category,
    selectedProgram.description
  );

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
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Tocco sull'area semitrasparente esterna per chiusura istantanea */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropDismiss} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Maniglia di trascinamento swipe-down e tasto X */}
          <View {...panResponder.panHandlers} style={styles.sheetHeader}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 20, bottom: 20, left: 40, right: 40 }}>
              <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />
            </TouchableOpacity>

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
            {posterSource ? (
              <Image
                source={posterSource}
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
                  <>
                    <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={[styles.reminderActionText, { color: '#ffffff' }]}>
                      Promemoria Attivo
                    </Text>
                  </>
                ) : (
                  <>
                    <Bell size={16} color={colors.text} style={{ marginRight: 6 }} />
                    <Text style={[styles.reminderActionText, { color: colors.text }]}>
                      Avvisami prima dell'inizio (-10 min)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Sinossi / Trama Completa */}
            <View style={styles.descSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                TRAMA & DETTAGLI
              </Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>
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
              <Share2 size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.shareText, { color: colors.textSecondary }]}>
                Condividi Programma
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    marginBottom: 12,
    gap: 8,
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  channelName: {
    fontSize: 12,
    fontWeight: '700',
  },
  numBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 2,
  },
  numText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
  },
  timeText: {
    fontSize: 13,
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
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
  },
  mainActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  reminderActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
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
    letterSpacing: 1,
    marginBottom: 8,
  },
  descText: {
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
    fontSize: 13,
    fontWeight: '600',
  },
});
