import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { signOut } from '~/api/auth';
import type { Activity, Entry } from '~/api/types';
import { FAB } from '~/components/FAB';
import { RunningBar } from '~/components/RunningBar';
import { RunningBarSheet } from '~/components/RunningBarSheet';
import { SwipeableBlockRow } from '~/components/SwipeableBlockRow';
import { useActivities } from '~/hooks/useActivities';
import { useEntries } from '~/hooks/useEntries';
import { useDeleteEntry } from '~/hooks/useEntryMutations';
import { useTimer } from '~/hooks/useTimer';
import { useToday } from '~/hooks/useToday';
import { useTheme } from '~/theme/ThemeProvider';
import { BRAND } from '~/theme/tokens';

function formatTitleDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  return `${weekday}, ${monthDay}`;
}

export default function TodayScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  const today = useToday();
  const range = useMemo(() => ({ from: today, to: today }), [today]);

  const entriesQ = useEntries(range);
  const timerQ = useTimer();
  const activitiesQ = useActivities();

  const activitiesById = useMemo(() => {
    const map = new Map<number, Activity>();
    for (const a of activitiesQ.data ?? []) map.set(a.id, a);
    return map;
  }, [activitiesQ.data]);

  const entries = entriesQ.data ?? [];
  const timer = timerQ.data?.timer ?? null;
  const config = timerQ.data?.config;
  const runningActivity =
    timer?.activityId != null ? activitiesById.get(timer.activityId) ?? null : null;

  const [sheetOpen, setSheetOpen] = useState(false);
  const deleteMut = useDeleteEntry();

  const isLoading = entriesQ.isLoading || activitiesQ.isLoading;
  const isEmpty = !isLoading && entries.length === 0;

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
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: tokens.text }]}>Today</Text>
          <Text style={[styles.subtitle, { color: tokens.textTertiary }]}>
            {formatTitleDate(today)}
          </Text>
        </View>
        <Pressable
          onPress={signOut}
          hitSlop={8}
          style={({ pressed }) => [styles.signOut, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.signOutText, { color: tokens.textTertiary }]}>Sign out</Text>
        </Pressable>
      </View>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <FlashList<Entry>
          data={entries}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => (
            <SwipeableBlockRow
              entry={item}
              activity={
                item.activityId != null ? activitiesById.get(item.activityId) ?? null : null
              }
              onEdit={(e) => router.push({ pathname: '/pickers/edit', params: { entryId: String(e.id) } })}
              onDelete={(e) => deleteMut.mutate(e.id)}
            />
          )}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.listContent}
          refreshing={entriesQ.isFetching}
          onRefresh={() => {
            void entriesQ.refetch();
            void timerQ.refetch();
          }}
        />
      )}

      <FAB onPress={() => router.push('/pickers/start')} />

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

const keyExtractor = (item: Entry) => String(item.id);
const Separator = () => <View style={{ height: 8 }} />;

function EmptyState() {
  const { tokens } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyMark, { backgroundColor: BRAND.accent + '22' }]}>
        <Text style={[styles.emptyMarkText, { color: BRAND.accent }]}>B0</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>No blocks yet</Text>
      <Text style={[styles.emptySub, { color: tokens.textTertiary }]}>
        Tap + to start your first block.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: 0.4 },
  subtitle: { fontSize: 13, marginTop: 2 },
  signOut: { paddingVertical: 8, paddingHorizontal: 8 },
  signOutText: { fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyMark: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyMarkText: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
