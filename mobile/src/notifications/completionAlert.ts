import * as Notifications from 'expo-notifications';
import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV({ id: 'blocks-notifications' });
const KEY_PENDING_ID = 'completion-id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function cancelPendingCompletion(): Promise<void> {
  const id = mmkv.getString(KEY_PENDING_ID);
  mmkv.remove(KEY_PENDING_ID);
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // No-op — id may already be gone.
    }
  }
}

interface ScheduleInput {
  activityName: string;
  startedAt: Date;
  durationMs: number;
}

export async function scheduleCompletion({ activityName, startedAt, durationMs }: ScheduleInput): Promise<void> {
  await cancelPendingCompletion();

  const fireAt = new Date(startedAt.getTime() + durationMs);
  if (fireAt.getTime() <= Date.now() + 1000) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Block complete',
      body: activityName,
      sound: 'default',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
  });
  mmkv.set(KEY_PENDING_ID, id);
}
