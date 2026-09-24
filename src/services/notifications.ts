import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Program } from '../types';

// Configure notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('stasera-in-tv-reminders', {
      name: 'Promemoria Programmi TV',
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
 * Schedule a local notification 10 minutes before program starts.
 */
export async function scheduleProgramReminder(
  program: Program,
  channelName: string
): Promise<string | null> {
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) {
    throw new Error('Permesso di notifica non concesso');
  }

  const startTimestamp = new Date(program.startTime).getTime();
  const triggerTimestamp = startTimestamp - 10 * 60 * 1000; // -10 minutes
  const now = Date.now();

  if (triggerTimestamp <= now) {
    // If less than 10 mins remaining or already started, schedule in 10 seconds as immediate reminder
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
 * Cancel a previously scheduled reminder by ID
 */
export async function cancelProgramReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('Failed to cancel notification:', err);
  }
}
