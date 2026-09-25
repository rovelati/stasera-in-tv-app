import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const GA_MEASUREMENT_ID = 'G-824117SV8J';
const CLIENT_ID_KEY = '@stasera_in_tv_analytics_client_id';
const GA_ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}`;

// Generate a random UUID v4 if not already present
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Retrieve or generate a persistent anonymous client ID for GA4
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
 * Send event to GA4 via Measurement Protocol
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
            app_version: '1.0.0',
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
      // Silently catch network errors to avoid disrupting user experience
    });
  } catch {
    // Silently ignore analytics errors
  }
};

/**
 * Track Screen Views
 */
export const trackScreenView = (screenName: string): Promise<void> => {
  return trackEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenName,
  });
};

/**
 * Track App Launch
 */
export const trackAppOpen = (): Promise<void> => {
  return trackEvent('app_open', {});
};

/**
 * Track Program Selection
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
 * Track Reminder Set / Cancel
 */
export const trackReminder = (title: string, channel: string, action: 'add' | 'remove'): Promise<void> => {
  return trackEvent(action === 'add' ? 'set_reminder' : 'remove_reminder', {
    item_name: title,
    channel_name: channel,
  });
};

/**
 * Track Live Stream Click
 */
export const trackStreamClick = (channelName: string): Promise<void> => {
  return trackEvent('watch_live_stream', {
    channel_name: channelName,
  });
};

/**
 * Track Search Query
 */
export const trackSearch = (term: string): Promise<void> => {
  return trackEvent('search', {
    search_term: term,
  });
};
