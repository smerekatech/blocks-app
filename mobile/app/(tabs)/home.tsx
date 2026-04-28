import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView, {
  type PageScrollStateChangedNativeEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import type { Activity, Entry } from '~/api/types';
import { AwaitingChoiceBar } from '~/components/AwaitingChoiceBar';
import { HomeDayPage } from '~/components/HomeDayPage';
import { RunningBar } from '~/components/RunningBar';
import { RunningBarSheet } from '~/components/RunningBarSheet';
import { useActivities } from '~/hooks/useActivities';
import { useEntries } from '~/hooks/useEntries';
import { useTimer } from '~/hooks/useTimer';
import { useStartSecondHalf, useStopTimer } from '~/hooks/useTimerMutations';
import { useToday } from '~/hooks/useToday';
import { addDays } from '~/lib/dateRange';
import { useTheme } from '~/theme/ThemeProvider';
import { BRAND } from '~/theme/tokens';

function dateTitle(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  const sameYear = dt.getFullYear() === new Date().getFullYear();
  return dt.toLocaleDateString(undefined, sameYear
    ? { weekday: 'long', month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HomeScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const today = useToday();
  const insets = useSafeAreaInsets();

  const [center, setCenter] = useState(today);
  const isAtToday = center === today;

  // When at today, render only [yesterday, today] so forward swipe is a no-op.
  // Otherwise render [prev, current, next] sliding window.
  const dates = useMemo(
    () =>
      isAtToday
        ? [addDays(center, -1), center]
        : [addDays(center, -1), center, addDays(center, 1)],
    [center, isAtToday],
  );
  const pagerRef = useRef<PagerView>(null);
  // True only while the user is actively dragging the pager. Programmatic
  // mounts and setPage calls don't flip this, so onPageSelected can ignore
  // events that didn't come from a real swipe.
  const isUserSwipeRef = useRef(false);

  const timerQ = useTimer();
  const activitiesQ = useActivities();
  const activitiesById = useMemo(() => {
    const map = new Map<number, Activity>();
    for (const a of activitiesQ.data ?? []) map.set(a.id, a);
    return map;
  }, [activitiesQ.data]);

  const timer = timerQ.data?.timer ?? null;
  const config = timerQ.data?.config;
  const runningActivity =
    timer?.activityId != null ? activitiesById.get(timer.activityId) ?? null : null;
  const isAwaitingChoice = timer != null && timer.half === 1 && timer.firstEntryId != null;

  const centerRange = useMemo(() => ({ from: center, to: center }), [center]);
  const centerEntriesQ = useEntries(centerRange);
  const blocksSum = (centerEntriesQ.data ?? []).reduce((acc, e) => acc + e.blocks, 0);

  const stopMut = useStopTimer();
  const secondHalfMut = useStartSecondHalf();

  const [sheetOpen, setSheetOpen] = useState(false);

  const onPageScrollStateChanged = useCallback(
    (e: PageScrollStateChangedNativeEvent) => {
      const state = e.nativeEvent.pageScrollState;
      if (state === 'dragging') {
        isUserSwipeRef.current = true;
      } else if (state === 'idle') {
        // The settle (whether triggered by drag-release or setPage) is done.
        isUserSwipeRef.current = false;
      }
    },
    [],
  );

  const onPageSelected = useCallback((e: PagerViewOnPageSelectedEvent) => {
    if (!isUserSwipeRef.current) return; // ignore mount + programmatic events
    const page = e.nativeEvent.position;
    if (page === 1) return;
    const offset = page - 1;
    setCenter((prev) => addDays(prev, offset));
    // Snap back to the middle so the new center stays visible.
    requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
  }, []);

  const goBack = useCallback(() => {
    setCenter((prev) => addDays(prev, -1));
    requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
  }, []);

  const goForward = useCallback(() => {
    setCenter((prev) => (prev === today ? prev : addDays(prev, 1)));
    requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
  }, [today]);

  const onEdit = useCallback(
    (entry: Entry) => {
      router.push({ pathname: '/pickers/edit', params: { entryId: String(entry.id) } });
    },
    [router],
  );

  const onAddForDate = useCallback(
    (date: string) => {
      router.push({ pathname: '/pickers/picker', params: { mode: 'add', date } });
    },
    [router],
  );

  const title = dateTitle(center, today);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [styles.chev, { opacity: pressed ? 0.5 : 1 }]}
        >
          <ChevronLeft size={28} color={tokens.text} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={() => {
            if (!isAtToday) {
              setCenter(today);
              requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
            }
          }}
          style={styles.titleWrap}
          disabled={isAtToday}
          hitSlop={6}
        >
          <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>

        <Pressable
          onPress={goForward}
          hitSlop={10}
          disabled={isAtToday}
          style={({ pressed }) => [
            styles.chev,
            { opacity: isAtToday ? 0.25 : pressed ? 0.5 : 1 },
          ]}
        >
          <ChevronRight size={28} color={tokens.text} strokeWidth={2} />
        </Pressable>

        <View style={styles.countSlot}>
          {blocksSum > 0 && (
            <Text style={[styles.blockCount, { color: tokens.textSecondary }]}>
              {blocksSum % 1 === 0 ? blocksSum : blocksSum.toFixed(1)}
            </Text>
          )}
        </View>
      </View>

      <PagerView
        // Re-mount pager when window size changes (today vs not-today flips between 2 and 3 pages).
        key={isAtToday ? 'today-window' : 'past-window'}
        ref={pagerRef}
        style={styles.pager}
        initialPage={1}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {dates.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.page}>
            <HomeDayPage
              date={d}
              isToday={d === today}
              activitiesById={activitiesById}
              onEdit={onEdit}
              onAdd={() => onAddForDate(d)}
              onRefresh={() => {
                void timerQ.refetch();
                void activitiesQ.refetch();
              }}
            />
          </View>
        ))}
      </PagerView>

      {!timer && (
        <Pressable
          onPress={() => router.push({ pathname: '/pickers/picker', params: { mode: 'start' } })}
          style={({ pressed }) => [
            styles.fab,
            { bottom: 16 + insets.bottom, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.fabText}>Start</Text>
        </Pressable>
      )}

      {timer && config && isAwaitingChoice && (
        <AwaitingChoiceBar
          timer={timer}
          activity={runningActivity}
          onStartNext={() => {
            const displayName = runningActivity?.name ?? timer.name ?? 'Block';
            secondHalfMut.mutate({ displayName });
          }}
          onStartAnother={() => {
            stopMut.mutate(undefined, {
              onSuccess: () => {
                router.push({ pathname: '/pickers/picker', params: { mode: 'start' } });
              },
            });
          }}
        />
      )}
      {timer && config && !isAwaitingChoice && (
        <RunningBar
          timer={timer}
          config={config}
          activity={runningActivity}
          onTap={() => setSheetOpen(true)}
          onStop={() => stopMut.mutate()}
        />
      )}

      {sheetOpen && timer && config && (
        <RunningBarSheet
          visible
          onClose={() => setSheetOpen(false)}
          timer={timer}
          config={config}
          activity={runningActivity}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 4,
  },
  chev: { padding: 4 },
  titleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 0.2 },
  countSlot: { width: 44, alignItems: 'flex-end', paddingRight: 4 },
  blockCount: { fontSize: 17, fontWeight: '600' },
  pager: { flex: 1 },
  page: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    width: 72,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
