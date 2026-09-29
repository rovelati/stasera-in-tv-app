/**
 * ============================================================================
 * STASERA IN TV - TELEMETRY & GOOGLE ANALYTICS 4 (MEASUREMENT PROTOCOL)
 * ============================================================================
 * 
 * Questo modulo implementa il tracciamento conforme alle normative GDPR/ePrivacy
 * per l'applicazione mobile senza l'ausilio di SDK binari pesanti (Firebase SDK),
 * utilizzando l'endpoint HTTP REST del Google Analytics 4 Measurement Protocol.
 * 
 * CARATTERISTICHE PRINCIPALI:
 * 1. Identificatore Anonimo Univoco (Client ID): generato localmente come UUID v4
 *    e salvato su AsyncStorage senza raccogliere dati personali o IDFA/AAID.
 * 2. Esecuzione "Fire-and-Forget": le chiamate analitiche avvengono in modo non bloccante
 *    e gli eventuali errori di rete vengono intercettati silenziosamente.
 * 3. Tassonomia Eventi GA4 Standard:
 *    - `app_open`: avvio dell'applicazione.
 *    - `screen_view`: navigazione tra sezioni.
 *    - `select_content`: apertura della scheda dettaglio di un programma.
 *    - `set_reminder` / `remove_reminder`: interazioni con le notifiche.
 *    - `watch_live_stream`: apertura della diretta streaming di un canale.
 *    - `search`: ricerche effettuate dall'utente.
 * 
 * @module services/analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** ID proprietà Google Analytics 4 di produzione */
const GA_MEASUREMENT_ID = 'G-824117SV8J';

/** Chiave di memorizzazione Client ID anonimo */
const CLIENT_ID_KEY = '@stasera_in_tv_analytics_client_id';

/** Endpoint REST ufficiale Google Analytics 4 Measurement Protocol */
const GA_ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}`;

/**
 * Genera una stringa pseudo-casuale conforme allo standard UUID v4.
 * 
 * @returns Stringa UUID v4 (es. "3b9a1d48-6c82-4fa0-8f92-5d47101bb0a1")
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Recupera l'identificativo client anonimo persistito su disco o ne genera uno nuovo.
 * 
 * @returns Identificatore univoco del dispositivo per la sessione GA4
 */
export const getClientId = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(CLIENT_ID_KEY);
    if (stored) return stored;

    const newId = generateUUID();
    await AsyncStorage.setItem(CLIENT_ID_KEY, newId);
    return newId;
  } catch {
    return generateUUID();
  }
};

/**
 * Invia un evento strutturato al Measurement Protocol di GA4.
 * 
 * @param eventName Nome semantico dell'evento (es. "select_content")
 * @param params Mappa di parametri addizionali associati all'evento
 */
export const trackEvent = async (
  eventName: string,
  params: Record<string, any> = {}
): Promise<void> => {
  try {
    const clientId = await getClientId();

    const payload = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params: {
            ...params,
            app_name: 'Stasera in TV',
            app_version: '1.0.3',
            platform: Platform.OS,
            engagement_time_msec: 100,
          },
        },
      ],
    };

    fetch(GA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignora silenziosamente eventuali offline/errori di rete
    });
  } catch {
    // Ignora errori di parsing
  }
};

/**
 * Traccia la visualizzazione di una schermata/tab.
 * 
 * @param screenName Nome della schermata (es. "Stasera", "In Onda", "Preferiti")
 */
export const trackScreenView = (screenName: string): Promise<void> => {
  return trackEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenName,
  });
};

/**
 * Traccia l'avvio della sessione app.
 */
export const trackAppOpen = (): Promise<void> => {
  return trackEvent('app_open', {});
};

/**
 * Traccia l'interazione con un programma televisivo specifico.
 * 
 * @param title Titolo del programma selezionato
 * @param channel Nome del canale di trasmissione
 * @param category Categoria o genere (es. "Film", "Sport")
 */
export const trackSelectProgram = (title: string, channel: string, category?: string): Promise<void> => {
  return trackEvent('select_content', {
    content_type: 'program',
    item_id: `${channel}_${title}`,
    item_name: title,
    item_category: category || 'Generale',
    channel_name: channel,
  });
};

/**
 * Traccia l'attivazione o la rimozione di un promemoria per un evento TV.
 * 
 * @param title Titolo del programma
 * @param channel Nome del canale
 * @param action Azione eseguita ("add" o "remove")
 */
export const trackReminder = (title: string, channel: string, action: 'add' | 'remove'): Promise<void> => {
  return trackEvent(action === 'add' ? 'set_reminder' : 'remove_reminder', {
    item_name: title,
    channel_name: channel,
  });
};

/**
 * Traccia il click per l'avvio della diretta streaming ufficiale.
 * 
 * @param channelName Nome dell'emittente TV in streaming
 */
export const trackStreamClick = (channelName: string): Promise<void> => {
  return trackEvent('watch_live_stream', {
    channel_name: channelName,
  });
};

/**
 * Traccia le chiavi di ricerca digitate dall'utente.
 * 
 * @param term Testo di ricerca
 */
export const trackSearch = (term: string): Promise<void> => {
  return trackEvent('search', {
    search_term: term,
  });
};
