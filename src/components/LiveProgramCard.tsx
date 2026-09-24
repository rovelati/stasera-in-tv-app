import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { Program, Channel } from '../types';
import { openLiveStream } from '../services/streaming';
import { Play, Clock, ArrowRight, Radio } from 'lucide-react-native';

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
  const [progress, setProgress] = useState<number>(0);
  const [minutesLeft, setMinutesLeft] = useState<number>(0);

  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      const start = new Date(currentProgram.startTime).getTime();
      const end = new Date(currentProgram.endTime).getTime();

      if (end <= start) {
        setProgress(50);
        setMinutesLeft(30);
        return;
      }

      const totalDuration = end - start;
      const elapsed = Math.max(0, now - start);
      const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      const remainingMinutes = Math.max(0, Math.round((end - now) / (1000 * 60)));

      setProgress(pct);
      setMinutesLeft(remainingMinutes);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 30000); // update every 30s
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
          {channel.number > 0 && (
            <View style={[styles.channelNumber, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.channelNumberText, { color: colors.textSecondary }]}>
                {channel.number}
              </Text>
            </View>
          )}
          {channel.logo ? (
            <Image source={{ uri: channel.logo }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.fallbackLogo, { backgroundColor: colors.primary }]}>
              <Text style={styles.fallbackLogoText}>{channel.name.slice(0, 2)}</Text>
            </View>
          )}
          <Text style={[styles.channelName, { color: colors.text }]} numberOfLines={1}>
            {channel.name}
          </Text>
        </View>

        {/* Live Badge */}
        <View style={[styles.liveBadge, { backgroundColor: colors.liveBg }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
          <Text style={[styles.liveText, { color: colors.live }]}>IN ONDA ORA</Text>
        </View>
      </View>

      {/* Main Live Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.programTitle, { color: colors.text }]} numberOfLines={1}>
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
                { width: `${progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
              {currentProgram.startTimeFormatted || 'Ora'} - {currentProgram.endTimeFormatted || 'Fine'}
            </Text>
            <Text style={[styles.timeLeftLabel, { color: colors.primary }]}>
              {minutesLeft > 0 ? `Termina tra ${minutesLeft} min` : 'In chiusura'}
            </Text>
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
  channelNumber: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  channelNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },
  logo: {
    width: 28,
    height: 20,
    marginRight: 8,
  },
  fallbackLogo: {
    width: 24,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fallbackLogoText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  channelName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
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
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.3,
  },
  streamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  streamBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
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
    fontSize: 11,
    fontWeight: '600',
  },
  timeLeftLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  nextBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  nextLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  nextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextTime: {
    fontSize: 12,
    fontWeight: '800',
  },
  nextTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
