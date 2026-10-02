/**
 * ============================================================================
 * STASERA IN TV - CHANNEL LOGO COMPONENT
 * ============================================================================
 * 
 * Componente dedicato per il rendering performante e resiliente dei loghi dei canali TV.
 * Supporta formati PNG, JPG, WEBP e SVG (tramite SvgUri).
 * Risolve automaticamente i percorsi relativi in URL assoluti puntanti al CDN Cloudflare.
 * Fornisce un badge di fallback stilizzato con iniziali del canale in caso di assenza o errore immagine.
 * 
 * @module components/ChannelLogo
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { resolveLogoUrl } from '../api/client';

interface ChannelLogoProps {
  logoUrl?: string | null;
  channelName: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  containerBg?: string;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  logoUrl,
  channelName,
  size = 40,
  style,
  containerBg = '#ffffff',
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const resolved = resolveLogoUrl(logoUrl);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const initials = (channelName || 'TV')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();

  const isSvg = resolved ? resolved.toLowerCase().endsWith('.svg') || resolved.includes('.svg?') : false;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Math.max(8, Math.round(size * 0.22)),
          backgroundColor: containerBg,
        },
        style,
      ]}
    >
      {resolved && !hasError ? (
        isSvg ? (
          <SvgUri
            uri={resolved}
            width={size * 0.8}
            height={size * 0.8}
            onError={() => setHasError(true)}
          />
        ) : (
          <Image
            source={{ uri: resolved }}
            style={{ width: size * 0.82, height: size * 0.82 }}
            resizeMode="contain"
            onError={() => setHasError(true)}
          />
        )
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: Math.max(8, Math.round(size * 0.22)) }]}>
          <Text style={[styles.fallbackText, { fontSize: Math.max(10, Math.round(size * 0.3)) }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fallback: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
