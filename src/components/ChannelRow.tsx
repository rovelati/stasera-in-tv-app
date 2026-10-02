import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { Channel } from '../types';
import { openLiveStream } from '../services/streaming';
import { ChannelLogo } from './ChannelLogo';
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
        {/* Icona/Logo del Canale ad alta visibilità */}
        <ChannelLogo
          logoUrl={channel.logo}
          channelName={channel.name}
          size={42}
          style={styles.logoContainer}
        />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {channel.name}
            </Text>
            {channel.number > 0 && (
              <View style={[styles.lcnPill, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.lcnPillText, { color: colors.textSecondary }]}>
                  {channel.number}
                </Text>
              </View>
            )}
          </View>

          {channel.geo ? (
            <View style={styles.geoRow}>
              <MapPin size={11} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.geoText, { color: colors.textSecondary }]} numberOfLines={1}>
                {channel.geo.city} ({channel.geo.region})
                {channel.geo.badge ? ` · ${channel.geo.badge}` : ''}
              </Text>
            </View>
          ) : (
            <Text style={[styles.typeText, { color: colors.textMuted }]}>
              {channel.type || 'Nazionale'} · Tocca per palinsesto 24h
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
          hitSlop={12}
          style={styles.favBtn}
        >
          <Heart
            size={19}
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
  logoContainer: {
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  lcnPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  lcnPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geoText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  typeText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
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
    padding: 6,
  },
});
