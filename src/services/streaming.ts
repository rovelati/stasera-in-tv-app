import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { trackStreamClick } from './analytics';

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
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#0f172a',
      controlsColor: '#ffffff',
      showTitle: true,
      enableBarCollapsing: true,
    });
  } catch (error) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Errore', 'Impossibile aprire il link dello streaming.');
    }
  }
}
