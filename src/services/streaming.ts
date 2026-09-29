/**
 * ============================================================================
 * STASERA IN TV - LIVE STREAMING SERVICE & IN-APP BROWSER
 * ============================================================================
 * 
 * Questo servizio gestisce l'apertura e la riproduzione dei flussi di diretta
 * streaming ufficiali dei canali televisivi (RaiPlay, Mediaset Infinity,
 * Discovery+, La7, TV8, emittenti regionali e canali sportivi).
 * 
 * STRATEGIA DI APERTURA:
 * 1. In-App Custom Chrome Tabs / SFSafariViewController tramite `expo-web-browser`:
 *    - Mantiene l'utente all'interno del contesto dell'applicazione.
 *    - Personalizzazione barra strumenti scura (#0f172a) e controlli bianchi (#ffffff).
 * 2. Fallback su `Linking.openURL`:
 *    - Se il browser in-app fallisce, delega l'URL al browser predefinito di sistema.
 * 3. Tracciamento Analitico:
 *    - Registra l'evento di avvio streaming per metriche di audience EPG.
 * 
 * @module services/streaming
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { trackStreamClick } from './analytics';

/**
 * Apre il flusso streaming ufficiale del canale in un browser in-app ottimizzato.
 * 
 * @param url URL ufficiale della diretta (RaiPlay, Mediaset, Sky/Now, La7, ecc.)
 * @param channelName Nome del canale per messaggi all'utente e telemetria
 */
export async function openLiveStream(url?: string | null, channelName?: string): Promise<void> {
  if (!url) {
    Alert.alert(
      'Diretta non disponibile',
      `La diretta streaming ufficiale per ${channelName || 'questo canale'} non è al momento accessibile via web.`
    );
    return;
  }

  if (channelName) {
    trackStreamClick(channelName);
  }

  try {
    // Apertura nativa in-app con interfaccia scura
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#0f172a',
      controlsColor: '#ffffff',
      showTitle: true,
      enableBarCollapsing: true,
    });
  } catch (error) {
    // Fallback su browser esterno di sistema
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Errore', 'Impossibile aprire il link dello streaming sul dispositivo.');
    }
  }
}
