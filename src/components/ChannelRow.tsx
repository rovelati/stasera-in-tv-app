import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { Channel } from '../types';
import { openLiveStream } from '../services/streaming';
import { Play, Heart, MapPin } from 'lucide-react-native';

interface ChannelRowProps {
  channel: Channel;
  onPress?: (channel: Channel) => void;
}

export const ChannelRow: React.FC<ChannelRowProps> = ({ channel, onPress }) => {
  const { colors, toggleFavorite, isFavorite } = useApp();
  const isFav = isFavorite(channel.id);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(channel)}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.left}>
        {channel.number > 0 && (
          <View style={[styles.numberBadge, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[styles.numberText, { color: colors.textSecondary }]}>
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

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{channel.name}</Text>
          {channel.geo ? (
            <View style={styles.geoRow}>
              <MapPin size={10} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.geoText, { color: colors.textSecondary }]} numberOfLines={1}>
                {channel.geo.city} ({channel.geo.region})
                {channel.geo.badge ? ` · ${channel.geo.badge}` : ''}
              </Text>
            </View>
          ) : (
            <Text style={[styles.typeText, { color: colors.textMuted }]}>
              {channel.type || 'Nazionale'} · Tocca per palinsesto
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
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

        <TouchableOpacity
          onPress={() => toggleFavorite(channel.id)}
          hitSlop={10}
          style={styles.favBtn}
        >
          <Heart
            size={18}
            color={isFav ? '#ef4444' : colors.textMuted}
            fill={isFav ? '#ef4444' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  left: {
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
  logo: {
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
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
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
});
