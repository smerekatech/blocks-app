import { apiFetch } from './client';
import type { RunningTimer, TimerEnvelope } from './types';

export function getTimer(): Promise<TimerEnvelope> {
  return apiFetch<TimerEnvelope>('/api/timer');
}

export interface StartTimerInput {
  activityId?: number;
  name?: string;
  startedDate: string;
}

export function startTimer(input: StartTimerInput): Promise<RunningTimer> {
  return apiFetch<RunningTimer>('/api/timer/start', {
    method: 'POST',
    body: input,
  });
}

export interface StopTimerResult {
  entryId: number | null;
}

export function stopTimer(): Promise<StopTimerResult> {
  return apiFetch<StopTimerResult>('/api/timer/stop', { method: 'POST' });
}

export type CompleteTimerResult =
  | { state: 'awaiting-choice'; firstEntryId: number; activityId: number | null; startedDate: string }
  | { state: 'completed'; firstEntryId: number | null };

export function completeTimer(): Promise<CompleteTimerResult> {
  return apiFetch<CompleteTimerResult>('/api/timer/complete', { method: 'POST' });
}

export function startSecondHalf(): Promise<RunningTimer> {
  return apiFetch<RunningTimer>('/api/timer/second-half', { method: 'POST' });
}
