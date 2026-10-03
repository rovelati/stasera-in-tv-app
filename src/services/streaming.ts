/**
 * ============================================================================
 * STASERA IN TV - LIVE STREAMING SERVICE & NATIVE APP LAUNCHER
 * ============================================================================
 * 
 * Questo servizio gestisce l'apertura e la riproduzione dei flussi di diretta
 * streaming ufficiali dei canali televisivi (RaiPlay, Mediaset Infinity,
 * Discovery+, La7, TV8, emittenti regionali e canali sportivi).
 * 
 * STRATEGIA RESILIENTE SENZA DEADLOCK:
 * 1. Delega diretta a Linking.openURL (apre l'app nativa Mediaset/RaiPlay o browser predefinito).
 * 2. Fallback su WebBrowser.openBrowserAsync per browser in-app.
 * 3. Tracciamento analitico trasparente.
 * 
 * @module services/streaming
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { trackStreamClick } from './analytics';

/**
 * Apre il flusso streaming ufficiale del canale.
 * 
 * @param url URL ufficiale della diretta (RaiPlay, Mediaset, Sky/Now, La7, ecc.)
 * @param channelName Nome del canale per messaggi all'utente e telemetria
 */
export async function openLiveStream(url?: string | null, channelName?: string): Promise<void> {
  if (!url) {
    Alert.alert(
      'Diretta non disponibile',
      `La diretta streaming ufficiale per ${channelName || 'questo canale'} non è al momento accessibile.`
    );
    return;
  }

  if (channelName) {
    trackStreamClick(channelName);
  }

  try {
    // Tentativo 1: Apertura nativa via Linking (gestisce app installate come Mediaset Infinity / RaiPlay o Chrome)
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  } catch (linkErr) {
    console.warn('[Streaming] Linking.openURL error, trying WebBrowser:', linkErr);
  }

  // Tentativo 2: Fallback in-app browser
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#0f172a',
      controlsColor: '#ffffff',
      showTitle: true,
      enableBarCollapsing: true,
    });
  } catch (browserErr) {
    console.warn('[Streaming] WebBrowser error:', browserErr);
    Alert.alert('Errore', 'Impossibile avviare lo streaming sul dispositivo.');
  }
}
