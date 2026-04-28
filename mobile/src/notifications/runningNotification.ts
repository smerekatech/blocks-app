import { Platform } from 'react-native';

import RunningNotification, {
  type StartArgs,
  type UpdateArgs,
} from '../../modules/blocks-running-notification';

const enabled = Platform.OS === 'android' && RunningNotification != null;

let currentKey: string | null = null;

function keyFor(args: StartArgs | UpdateArgs): string {
  return `${args.startedAtMs}#${args.half}`;
}

/** Idempotent: returns immediately if the same (startedAt, half) is already showing. */
export async function start(args: StartArgs): Promise<void> {
  if (!enabled) return;
  const key = keyFor(args);
  if (currentKey === key) return;
  try {
    await RunningNotification!.start(args);
    currentKey = key;
  } catch (e) {
    console.warn('runningNotification.start failed', e);
  }
}

export async function update(args: UpdateArgs): Promise<void> {
  if (!enabled) return;
  const key = keyFor(args);
  try {
    await RunningNotification!.update(args);
    currentKey = key;
  } catch (e) {
    console.warn('runningNotification.update failed', e);
  }
}

export async function end(): Promise<void> {
  if (!enabled) return;
  const wasRunning = currentKey != null;
  currentKey = null;
  if (!wasRunning) return;
  try {
    await RunningNotification!.end();
  } catch (e) {
    console.warn('runningNotification.end failed', e);
  }
}

export type { StartArgs, UpdateArgs };
