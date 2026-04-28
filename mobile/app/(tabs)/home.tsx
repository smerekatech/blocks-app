import { useCallback, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView, {
  type PageScrollStateChangedNativeEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';

import { signOut } from '~/api/auth';
import type { Activity, Entry } from '~/api/types';
import { FAB } from '~/components/FAB';
import { HomeDayPage } from '~/components/HomeDayPage';
import { RunningBar } from '~/components/RunningBar';
import { RunningBarSheet } from '~/components/RunningBarSheet';
import { useActivities } from '~/hooks/useActivities';
import { useTimer } from '~/hooks/useTimer';
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
  }, []);

  const goForward = useCallback(() => {
    setCenter((prev) => (prev === today ? prev : addDays(prev, 1)));
  }, [today]);

  const onEdit = useCallback(
    (entry: Entry) => {
      router.push({ pathname: '/pickers/edit', params: { entryId: String(entry.id) } });
    },
    [router],
  );

  function openMenu() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Sign out', 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        (idx) => {
          if (idx === 0) void signOut();
        },
      );
    } else {
      Alert.alert('Account', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
      ]);
    }
  }

  const title = dateTitle(center, today);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top']}>
      {timer && config && (
        <RunningBar
          timer={timer}
          config={config}
          activity={runningActivity}
          onTap={() => setSheetOpen(true)}
        />
      )}

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

        {!timer && (
          <Pressable
            onPress={() => router.push({ pathname: '/pickers/picker', params: { mode: 'start' } })}
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: BRAND.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.startBtnText}>Start</Text>
          </Pressable>
        )}

        <Pressable onPress={openMenu} hitSlop={8} style={styles.menuBtn}>
          <Text style={[styles.menuDots, { color: tokens.textSecondary }]}>⋯</Text>
        </Pressable>
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
            />
          </View>
        ))}
      </PagerView>

      <FAB
        label="Add"
        icon={
          <Plus
            size={Platform.OS === 'ios' ? 18 : 20}
            color={Platform.OS === 'ios' ? '#FFFFFF' : '#0F4F2A'}
            strokeWidth={2.5}
          />
        }
        onPress={() =>
          router.push({ pathname: '/pickers/picker', params: { mode: 'add', date: center } })
        }
      />

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
  startBtn: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  menuBtn: { paddingHorizontal: 4 },
  menuDots: { fontSize: 24, lineHeight: 24 },
  pager: { flex: 1 },
  page: { flex: 1 },
});
