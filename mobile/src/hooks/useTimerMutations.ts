import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import {
  completeTimer,
  startSecondHalf,
  startTimer,
  stopTimer,
  type CompleteTimerResult,
  type StartTimerInput,
} from '~/api/timer';
import type { Activity, RunningTimer, TimerConfig, TimerEnvelope } from '~/api/types';
import * as liveActivity from '~/notifications/liveActivity';
import * as runningNotification from '~/notifications/runningNotification';
import { cancelPendingCompletion, scheduleCompletion } from '~/notifications/completionAlert';
import { queryKeys } from '~/state/queryClient';
import { resolveSwatch } from '~/theme/swatch';
import { BRAND } from '~/theme/tokens';

function readConfig(qc: ReturnType<typeof useQueryClient>): TimerConfig | undefined {
  const env = qc.getQueryData<TimerEnvelope>(queryKeys.timer());
  return env?.config;
}

function colorHexFor(qc: ReturnType<typeof useQueryClient>, activityId: number | null): string {
  if (activityId == null) return BRAND.accent;
  const matches = qc.getQueriesData<Activity[]>({ queryKey: ['activities'] });
  for (const [, list] of matches) {
    const found = list?.find((a) => a.id === activityId);
    if (found) return resolveSwatch(found.color).border;
  }
  return BRAND.accent;
}

function startRunningOverlay(
  timer: RunningTimer,
  config: TimerConfig,
  displayName: string,
  colorHex: string,
) {
  const startedAtMs = new Date(timer.startedAt).getTime();
  const args = {
    startedAtMs,
    endsAtMs: startedAtMs + config.halfDurationMs,
    activityName: displayName,
    colorHex,
    half: timer.half,
  };
  void liveActivity.start(args);
  void runningNotification.start(args);
}

function updateRunningOverlay(timer: RunningTimer, config: TimerConfig) {
  const startedAtMs = new Date(timer.startedAt).getTime();
  const args = {
    startedAtMs,
    endsAtMs: startedAtMs + config.halfDurationMs,
    half: timer.half,
  };
  void liveActivity.update(args);
  void runningNotification.update(args);
}

function endRunningOverlay() {
  void liveActivity.end();
  void runningNotification.end();
}

function invalidateAfterTimerChange(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.timer() });
  void qc.invalidateQueries({ queryKey: ['entries'] });
  void qc.invalidateQueries({ queryKey: ['stats'] });
}

interface StartArgs extends StartTimerInput {
  /** Display name used in the completion notification. */
  displayName: string;
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ displayName: _ignored, ...input }: StartArgs) => startTimer(input),
    async onSuccess(timer, vars) {
      const config = readConfig(qc);
      if (config) {
        await scheduleCompletion({
          activityName: vars.displayName,
          startedAt: new Date(timer.startedAt),
          durationMs: config.halfDurationMs,
        });
        startRunningOverlay(timer, config, vars.displayName, colorHexFor(qc, timer.activityId));
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      invalidateAfterTimerChange(qc);
    },
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stopTimer,
    async onSuccess() {
      await cancelPendingCompletion();
      endRunningOverlay();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      invalidateAfterTimerChange(qc);
    },
  });
}

interface CompleteArgs {
  displayName: string;
}

export function useCompleteTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (_args: CompleteArgs) => completeTimer(),
    async onSuccess(result: CompleteTimerResult) {
      if (result.state === 'completed') {
        await cancelPendingCompletion();
        endRunningOverlay();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      invalidateAfterTimerChange(qc);
    },
  });
}

export function useStartSecondHalf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { displayName: string }) => startSecondHalf().then((timer) => ({ timer, displayName: args.displayName })),
    async onSuccess({ timer, displayName }) {
      const config = readConfig(qc);
      if (config) {
        await scheduleCompletion({
          activityName: displayName,
          startedAt: new Date(timer.startedAt),
          durationMs: config.halfDurationMs,
        });
        updateRunningOverlay(timer, config);
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      invalidateAfterTimerChange(qc);
    },
  });
}
