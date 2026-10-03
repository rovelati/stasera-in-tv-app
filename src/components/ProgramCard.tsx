/**
 * ============================================================================
 * STASERA IN TV - PROGRAM CARD COMPONENT (MEMOIZED & HIGH PERFORMANCE)
 * ============================================================================
 * 
 * Card principale della guida TV per i programmi serali.
 * 
 * OTTIMIZZAZIONI DI RENDERING:
 * 1. React.memo per evitare ri-render non necessari durante lo scroll.
 * 2. `delayPressIn={0}` per apertura istantanea della scheda evento al tocco.
 * 3. HitSlop per azioni rapide (Preferiti, Diretta, Promemoria).
 * 
 * @module components/ProgramCard
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { Program, Channel } from '../types';
import { openLiveStream } from '../services/streaming';
import { ChannelLogo } from './ChannelLogo';
import { Bell, Play, Film, Tv, Trophy, Sparkles, Clock, Heart, Radio } from 'lucide-react-native';
import { getProgramPosterSource } from '../utils/programImages';

interface ProgramCardProps {
  program: Program;
  channel: Channel;
}

const ProgramCardComponent: React.FC<ProgramCardProps> = ({ program, channel }) => {
  const { colors, toggleReminder, hasReminder, toggleFavorite, isFavorite, setSelectedProgram } = useApp();
  const [imageError, setImageError] = React.useState<boolean>(false);

  const isFav = isFavorite(channel.id);
  const isReminded = hasReminder(program.id);

  const posterSource = getProgramPosterSource(
    program.posterUrl,
    program.title,
    program.category,
    program.description
  );

  const getCategoryBadgeStyle = (cat?: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('film') || c.includes('cinema')) {
      return { bg: colors.filmBadge, text: colors.filmText };
    }
    if (c.includes('sport') || c.includes('calcio')) {
      return { bg: colors.sportBadge, text: colors.sportText };
    }
    if (c.includes('serie') || c.includes('fiction')) {
      return { bg: colors.seriesBadge, text: colors.seriesText };
    }
    return { bg: colors.badgeBg, text: colors.badgeText };
  };

  const badgeStyle = getCategoryBadgeStyle(program.category);

  const handleOpenDetail = () => {
    setSelectedProgram({
      ...program,
      channelId: channel.id,
      channelName: channel.name,
      channelLogo: channel.logo,
      channelNumber: channel.number,
      streamUrl: channel.stream?.url,
      streamLabel: channel.stream?.label,
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      delayPressIn={0}
      onPress={handleOpenDetail}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Channel Header Bar */}
      <View style={[styles.channelHeader, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.channelInfo}>
          <ChannelLogo
            logoUrl={channel.logo}
            channelName={channel.name}
            size={30}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.channelName, { color: colors.text }]} numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.number > 0 && (
            <View style={[styles.channelNumber, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.channelNumberText, { color: colors.textSecondary }]}>
                {channel.number}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          {program.isPrimaSerata && (
            <View style={[styles.primaSerataBadge, { backgroundColor: colors.primaryLight + '25', borderColor: colors.primary }]}>
              <Text style={[styles.primaSerataText, { color: colors.primary }]}>Prima Serata</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(channel.id);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.favButton}
          >
            <Heart
              size={16}
              color={isFav ? '#ef4444' : colors.textMuted}
              fill={isFav ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Program Content Body */}
      <View style={styles.body}>
        {/* Left Poster if available */}
        {posterSource && !imageError ? (
          <Image
            source={posterSource}
            style={styles.poster}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View
            style={[
              styles.posterPlaceholder,
              {
                backgroundColor: badgeStyle.bg ? badgeStyle.bg + '25' : colors.surfaceSubtle,
                borderColor: badgeStyle.bg || colors.border,
              },
            ]}
          >
            {(() => {
              const c = (program.category || '').toLowerCase();
              if (c.includes('film') || c.includes('cinema')) return <Film size={28} color={badgeStyle.text} />;
              if (c.includes('serie') || c.includes('fiction')) return <Tv size={28} color={badgeStyle.text} />;
              if (c.includes('sport') || c.includes('calcio')) return <Trophy size={28} color={badgeStyle.text} />;
              if (c.includes('intrattenimento') || c.includes('show')) return <Sparkles size={28} color={badgeStyle.text} />;
              if (c.includes('informazione') || c.includes('tg')) return <Radio size={28} color={badgeStyle.text} />;
              return <Film size={28} color={badgeStyle.text} />;
            })()}
            <Text style={[styles.placeholderCategoryText, { color: badgeStyle.text }]} numberOfLines={1}>
              {program.category || 'TV'}
            </Text>
          </View>
        )}

        {/* Right Details */}
        <View style={styles.details}>
          <View style={styles.timeRow}>
            <View style={styles.timeBadge}>
              <Clock size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.timeText, { color: colors.text }]}>
                {program.startTimeFormatted || '21:15'}
                {program.endTimeFormatted ? ` - ${program.endTimeFormatted}` : ''}
              </Text>
            </View>

            {program.category ? (
              <View style={[styles.catBadge, { backgroundColor: badgeStyle.bg }]}>
                <Text style={[styles.catText, { color: badgeStyle.text }]} numberOfLines={1}>
                  {program.category}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {program.title}
          </Text>

          {program.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {program.description}
            </Text>
          ) : null}

          {/* Action Row */}
          <View style={styles.actionRow}>
            {channel.stream?.url && (
              <TouchableOpacity
                style={[styles.streamBtn, { backgroundColor: '#dc2626' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  openLiveStream(channel.stream?.url, channel.name);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.8}
              >
                <Play size={12} color="#ffffff" fill="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.streamBtnText}>Diretta</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.reminderBtn,
                {
                  backgroundColor: isReminded ? colors.accent + '25' : colors.surfaceSubtle,
                  borderColor: isReminded ? colors.accent : colors.border,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                toggleReminder(program, channel.name, channel.logo);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
            >
              <Bell
                size={12}
                color={isReminded ? colors.accent : colors.textSecondary}
                fill={isReminded ? colors.accent : 'transparent'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.reminderBtnText,
                  { color: isReminded ? colors.accent : colors.textSecondary },
                ]}
              >
                {isReminded ? 'Promemoria attivo' : 'Promemoria'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ProgramCard = React.memo(ProgramCardComponent);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelInfo: {
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
  channelName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaSerataBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaSerataText: {
    fontSize: 10,
    fontWeight: '700',
  },
  favButton: {
    padding: 4,
  },
  body: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  poster: {
    width: 76,
    height: 108,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  posterPlaceholder: {
    width: 76,
    height: 108,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 6,
  },
  placeholderCategoryText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 100,
  },
  catText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  streamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  streamBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  reminderBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
