/**
 * ============================================================================
 * STASERA IN TV - LIVE PROGRAM CARD COMPONENT
 * ============================================================================
 * 
 * Componente per la visualizzazione dell'evento televisivo in corso di trasmissione:
 * 
 * FUNZIONALITÀ PRINCIPALI:
 * 1. Locandina Programma: mostra la locandina ufficiale o fallback tematico.
 * 2. Progress Bar in Tempo Reale:
 *    - Calcola la percentuale di trasmissione completata e i minuti rimanenti.
 *    - Gestisce correttamente gli eventi imminenti (non ancora iniziati).
 * 3. Preview del Programma Successivo:
 *    - Mostra il programma in arrivo con orario e titolo.
 * 4. Tasto Rapido Diretta Streaming:
 *    - Avvia la trasmissione live con un tocco.
 * 
 * @module components/LiveProgramCard
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../context/AppContext';
import { Program, Channel } from '../types';
import { openLiveStream } from '../services/streaming';
import { getCurrentRomeMinutes, getTimeMinutes } from '../api/client';
import { resolveProgramPoster } from '../utils/programImages';
import { ChannelLogo } from './ChannelLogo';
import { Play, Clock, ArrowRight, Radio, Film, Tv, Trophy, Sparkles } from 'lucide-react-native';

interface LiveProgramCardProps {
  channel: Channel;
  currentProgram: Program;
  nextProgram?: Program | null;
}

export const LiveProgramCard: React.FC<LiveProgramCardProps> = ({
  channel,
  currentProgram,
  nextProgram,
}) => {
  const { colors, setSelectedProgram } = useApp();
  const [progress, setProgress] = useState<number>(30);
  const [statusLabel, setStatusLabel] = useState<string>('In onda');
  const [isUpcoming, setIsUpcoming] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const posterUri = resolveProgramPoster(
    currentProgram.posterUrl,
    currentProgram.title,
    currentProgram.category,
    currentProgram.description
  );

  useEffect(() => {
    const updateProgress = () => {
      const nowMin = getCurrentRomeMinutes();
      let startMin = getTimeMinutes(currentProgram.startTimeFormatted || currentProgram.startTime);
      let endMin = getTimeMinutes(currentProgram.endTimeFormatted || currentProgram.endTime);

      if (endMin <= startMin) {
        endMin = startMin + 60;
      }

      // Se a cavallo di mezzanotte (es. 23:30 -> 01:30)
      if (endMin < startMin) {
        endMin += 1440;
      }

      let currentMin = nowMin;
      if (currentMin < startMin && (currentMin + 1440 - startMin) < (endMin - startMin)) {
        currentMin += 1440;
      }

      const totalDuration = Math.max(15, endMin - startMin);

      if (nowMin < startMin && (startMin - nowMin) > 10) {
        // Evento imminente / non ancora iniziato
        const waitMin = startMin - nowMin;
        setProgress(0);
        setStatusLabel(waitMin <= 60 ? `Inizia tra ${waitMin} min` : `Inizia alle ${currentProgram.startTimeFormatted || ''}`);
        setIsUpcoming(true);
      } else {
        const elapsed = Math.max(0, currentMin - startMin);
        const pct = Math.min(100, Math.max(5, (elapsed / totalDuration) * 100));
        const remainingMinutes = Math.max(1, endMin - currentMin);
        setProgress(pct);
        setStatusLabel(remainingMinutes > 0 ? `Termina tra ${remainingMinutes} min` : 'In chiusura');
        setIsUpcoming(false);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 15000);
    return () => clearInterval(interval);
  }, [currentProgram]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setSelectedProgram({ ...currentProgram, channelId: channel.id, channelName: channel.name, channelLogo: channel.logo, channelNumber: channel.number, streamUrl: channel.stream?.url, streamLabel: channel.stream?.label })}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Channel Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.channelLeft}>
          <ChannelLogo
            logoUrl={channel.logo}
            channelName={channel.name}
            size={34}
            style={{ marginRight: 10 }}
          />
          <View>
            <Text style={[styles.channelName, { color: colors.text }]} numberOfLines={1}>
              {channel.name}
            </Text>
            {channel.number > 0 && (
              <Text style={[styles.lcnSubtitle, { color: colors.textSecondary }]}>
                Canale {channel.number}
              </Text>
            )}
          </View>
        </View>

        {/* Live Badge */}
        <View style={[styles.liveBadge, { backgroundColor: isUpcoming ? colors.accent + '25' : colors.liveBg }]}>
          <View style={[styles.liveDot, { backgroundColor: isUpcoming ? colors.accent : colors.live }]} />
          <Text style={[styles.liveText, { color: isUpcoming ? colors.accent : colors.live }]}>
            {isUpcoming ? 'A BREVE' : 'IN ONDA ORA'}
          </Text>
        </View>
      </View>

      {/* Main Live Content */}
      <View style={styles.content}>
        <View style={styles.bodyRow}>
          {posterUri && !imageError ? (
            <Image
              source={{ uri: posterUri }}
              style={styles.livePoster}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.livePosterPlaceholder, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
              {(() => {
                const c = (currentProgram.category || '').toLowerCase();
                if (c.includes('film') || c.includes('cinema')) return <Film size={22} color={colors.textMuted} />;
                if (c.includes('serie') || c.includes('fiction')) return <Tv size={22} color={colors.textMuted} />;
                if (c.includes('sport') || c.includes('calcio')) return <Trophy size={22} color={colors.textMuted} />;
                if (c.includes('intrattenimento') || c.includes('show')) return <Sparkles size={22} color={colors.textMuted} />;
                return <Radio size={22} color={colors.textMuted} />;
              })()}
            </View>
          )}

          <View style={styles.mainInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.programTitle, { color: colors.text }]} numberOfLines={2}>
                {currentProgram.title}
              </Text>
              {channel.stream?.url && (
                <TouchableOpacity
                  style={[styles.streamBtn, { backgroundColor: '#dc2626' }]}
                  onPress={() => openLiveStream(channel.stream?.url, channel.name)}
                  activeOpacity={0.8}
                >
                  <Play size={11} color="#ffffff" fill="#ffffff" style={{ marginRight: 3 }} />
                  <Text style={styles.streamBtnText}>Diretta</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Progress Bar & Timing */}
            <View style={styles.progressSection}>
              <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSubtle }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: isUpcoming ? colors.accent : colors.primary,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  {currentProgram.startTimeFormatted || 'Ora'} - {currentProgram.endTimeFormatted || 'Fine'}
                </Text>
                <Text style={[styles.timeLeftLabel, { color: isUpcoming ? colors.accent : colors.primary }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Program Preview */}
        {nextProgram && (
          <View style={[styles.nextBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.nextLabel, { color: colors.textMuted }]}>A SEGUIRE</Text>
            <View style={styles.nextContent}>
              <Text style={[styles.nextTime, { color: colors.primaryLight }]}>
                {nextProgram.startTimeFormatted || ''}
              </Text>
              <Text style={[styles.nextTitle, { color: colors.text }]} numberOfLines={1}>
                {nextProgram.title}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '700',
  },
  lcnSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    padding: 12,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  livePoster: {
    width: 58,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  livePosterPlaceholder: {
    width: 58,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 76,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  programTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  streamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  streamBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  progressSection: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  timeLeftLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  nextBox: {
    padding: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  nextLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  nextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextTime: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  nextTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
});
