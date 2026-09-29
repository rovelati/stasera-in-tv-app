/**
 * ============================================================================
 * STASERA IN TV - MODULO NOTIFICHE PUSH LOCALI & ALLARMI ESATTI
 * ============================================================================
 * 
 * Questo servizio gestisce la pianificazione delle notifiche di sistema locali:
 * 
 * 1. CONFIGURAZIONE CANALE ANDROID (NotificationChannel):
 *    - Canale ad alta priorità (`AndroidImportance.MAX`) per garantire il pop-up
 *      heads-up su Android 8.0+ (API 26) fino ad Android 15/16 (API 36).
 *    - Vibrazione personalizzata e colore del LED di notifica (#2563eb).
 * 
 * 2. TRIGGER INTELLIGENTE:
 *    - Se mancano più di 10 minuti all'inizio: calcola l'offset temporale esatto (-10 min).
 *    - Se il programma sta per iniziare o è già in onda: invia un avviso immediato di conferma.
 * 
 * 3. GESTIONE DEI PERMESSI:
 *    - Richiesta dinamica del permesso `POST_NOTIFICATIONS` su Android 13+ (API 33+) e iOS.
 * 
 * @module services/notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Program } from '../types';

/**
 * Configura il comportamento di presentazione delle notifiche in primo piano (Foreground).
 * Consente la visualizzazione dell'avviso visivo, il suono e il badge sull'icona.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra il canale di notifica specifico per Android e richiede i permessi di sistema.
 * 
 * @returns true se il permesso di notifica è accordato dall'utente, false altrimenti
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('stasera-in-tv-reminders', {
      name: 'Promemoria Programmi TV',
      description: 'Notifiche 10 minuti prima dell\'inizio dei tuoi programmi preferiti',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Pianifica una notifica locale 10 minuti prima dell'orario di inizio del programma.
 * 
 * @param program Programma televisivo per cui impostare la sveglia
 * @param channelName Nome del canale emittente
 * @returns ID univoco della notifica generata dal sistema operativo, o null in caso di errore
 */
export async function scheduleProgramReminder(
  program: Program,
  channelName: string
): Promise<string | null> {
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) {
    throw new Error('Permesso di notifica non concesso dall\'utente');
  }

  const startTimestamp = new Date(program.startTime).getTime();
  const triggerTimestamp = startTimestamp - 10 * 60 * 1000; // 10 minuti prima
  const now = Date.now();

  if (triggerTimestamp <= now) {
    // Se mancano meno di 10 minuti o il programma è già iniziato, notifica subito
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📺 In onda adesso su ${channelName}`,
        body: `"${program.title}" è iniziato ora! Tocca per guardare o scoprire i dettagli.`,
        data: { programId: program.id, channelId: program.channelId },
        sound: true,
      },
      trigger: {
        seconds: 2,
        channelId: 'stasera-in-tv-reminders',
      } as any,
    });
    return notificationId;
  }

  const secondsUntilTrigger = Math.max(1, Math.floor((triggerTimestamp - now) / 1000));

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔔 Tra 10 minuti su ${channelName}`,
      body: `"${program.title}" inizia alle ${program.startTimeFormatted || 'breve'}. Non perdertelo!`,
      data: { programId: program.id, channelId: program.channelId },
      sound: true,
    },
    trigger: {
      seconds: secondsUntilTrigger,
      channelId: 'stasera-in-tv-reminders',
    } as any,
  });

  return notificationId;
}

/**
 * Cancella una notifica programmata precedentemente attraverso il suo ID nativo.
 * 
 * @param notificationId ID restituito in fase di schedulazione
 */
export async function cancelProgramReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('[Notifications] Errore cancellazione notifica:', err);
  }
}
