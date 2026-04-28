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
import type { TimerConfig, TimerEnvelope } from '~/api/types';
import { cancelPendingCompletion, scheduleCompletion } from '~/notifications/completionAlert';
import { queryKeys } from '~/state/queryClient';

function readConfig(qc: ReturnType<typeof useQueryClient>): TimerConfig | undefined {
  const env = qc.getQueryData<TimerEnvelope>(queryKeys.timer());
  return env?.config;
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
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      invalidateAfterTimerChange(qc);
    },
  });
}
