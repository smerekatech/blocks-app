import { Platform } from 'react-native';

import LiveActivity, { type StartArgs, type UpdateArgs } from '../../modules/blocks-live-activity';

const enabled = Platform.OS === 'ios' && LiveActivity != null;

let currentKey: string | null = null;

function keyFor(args: StartArgs | UpdateArgs): string {
  return `${args.startedAtMs}#${args.half}`;
}

/** Idempotent: returns immediately if a Live Activity for the same (startedAt, half) is already running. */
export async function start(args: StartArgs): Promise<void> {
  if (!enabled) return;
  const key = keyFor(args);
  if (currentKey === key) return;
  try {
    await LiveActivity!.start(args);
    currentKey = key;
  } catch (e) {
    console.warn('liveActivity.start failed', e);
  }
}

export async function update(args: UpdateArgs): Promise<void> {
  if (!enabled) return;
  const key = keyFor(args);
  try {
    await LiveActivity!.update(args);
    currentKey = key;
  } catch (e) {
    console.warn('liveActivity.update failed', e);
  }
}

export async function end(): Promise<void> {
  if (!enabled) return;
  const wasRunning = currentKey != null;
  currentKey = null;
  if (!wasRunning) return;
  try {
    await LiveActivity!.end();
  } catch (e) {
    console.warn('liveActivity.end failed', e);
  }
}

export type { StartArgs, UpdateArgs };
