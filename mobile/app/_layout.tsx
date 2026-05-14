import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useActivities } from '~/hooks/useActivities';
import { useTimer } from '~/hooks/useTimer';
import * as liveActivity from '~/notifications/liveActivity';
import * as runningNotification from '~/notifications/runningNotification';
import { ThemeProvider } from '~/theme/ThemeProvider';
import { queryClient } from '~/state/queryClient';
import { startQueryCachePersistence } from '~/state/queryPersistence';
import { useSessionStore } from '~/state/session';
import { resolveSwatch } from '~/theme/swatch';
import { BRAND } from '~/theme/tokens';

function SessionGate() {
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'loading') return;
    const inAuthFlow = segments[0] === 'login' || segments[0] === 'auth';
    if (status === 'signedOut' && !inAuthFlow) {
      router.replace('/login');
    } else if (status === 'signedIn' && inAuthFlow) {
      router.replace('/(tabs)/home');
    }
  }, [status, segments, router]);

  return null;
}

function RunningOverlaySync() {
  const status = useSessionStore((s) => s.status);
  const enabled = status === 'signedIn';
  const timerQ = useTimer();
  const activitiesQ = useActivities();

  useEffect(() => {
    if (!enabled) return;
    const timer = timerQ.data?.timer ?? null;
    const config = timerQ.data?.config;
    if (!timer || !config) {
      void liveActivity.end();
      void runningNotification.end();
      return;
    }
    const activity = activitiesQ.data?.find((a) => a.id === timer.activityId) ?? null;
    const colorHex = activity ? resolveSwatch(activity.color).border : BRAND.accent;
    const displayName = activity?.name ?? timer.name ?? 'Block';
    const startedAtMs = new Date(timer.startedAt).getTime();
    const args = {
      startedAtMs,
      endsAtMs: startedAtMs + config.halfDurationMs,
      activityName: displayName,
      colorHex,
      half: timer.half,
    };

    // Awaiting-choice = half 1 finished and the user hasn't picked
    // "start next" or "stop" yet. There's no live countdown to show, so hide
    // the iOS Live Activity until the next half actually starts.
    const isAwaitingChoice = timer.half === 1 && timer.firstEntryId != null;
    if (isAwaitingChoice) {
      void liveActivity.end();
    } else {
      void liveActivity.start(args);
    }
    void runningNotification.start(args);
  }, [enabled, timerQ.data, activitiesQ.data]);

  return null;
}

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS === 'web') return;
  focusManager.setFocused(status === 'active');
}

export default function RootLayout() {
  useEffect(() => startQueryCachePersistence(queryClient), []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SessionGate />
            <RunningOverlaySync />
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="pickers/picker"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="pickers/edit"
                options={{ presentation: 'modal', headerShown: false }}
              />
            </Stack>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
