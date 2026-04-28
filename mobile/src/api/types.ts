import type { SwatchId } from '~/theme/palette.generated';

export interface Activity {
  id: number;
  userId: number;
  name: string;
  /** Stored as a SwatchId, or a legacy hex string. Resolve via swatchFor(). */
  color: string;
  archivedAt: string | null;
  createdAt: string;
}

export interface Entry {
  id: number;
  userId: number;
  activityId: number | null;
  /** Freeform name when activityId is null, otherwise null. */
  name: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** 0.5 or 1 */
  blocks: number;
  position: number;
  createdAt: string;
}

export interface TimerConfig {
  halfDurationMs: number;
  halfBlockMinMs: number;
}

export interface RunningTimer {
  activityId: number | null;
  name: string | null;
  /** ISO timestamp of when the current half started. */
  startedAt: string;
  /** YYYY-MM-DD */
  startedDate: string;
  half: 1 | 2;
  /** Set after first half completes; null while half-1 is still running. */
  firstEntryId: number | null;
  /** Server-computed elapsed for the current half. */
  elapsedMs: number;
}

export interface TimerEnvelope {
  config: TimerConfig;
  timer: RunningTimer | null;
}

export type SwatchKey = SwatchId | (string & { _hex?: true });
