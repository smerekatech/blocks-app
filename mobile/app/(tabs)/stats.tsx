import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView, {
  type PageScrollStateChangedNativeEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';

import { StatsBars } from '~/components/charts/StatsBars';
import { TrendChart } from '~/components/charts/TrendChart';
import { useStats } from '~/hooks/useStats';
import { useToday } from '~/hooks/useToday';
import { bucketByDay, dateRange, shiftAnchor, type RangeKind } from '~/lib/dateRange';
import { useTheme } from '~/theme/ThemeProvider';

function formatBlocks(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function formatRangeLabel(anchor: string, kind: RangeKind): string {
  const r = dateRange(anchor, kind);
  if (kind === 'year') return r.from.slice(0, 4);

  const [fy, fm, fd] = r.from.split('-').map(Number);
  const [ty, tm, td] = r.to.split('-').map(Number);
  const from = new Date(fy!, fm! - 1, fd!);
  const to = new Date(ty!, tm! - 1, td!);
  const currentYear = new Date().getFullYear();

  if (kind === 'month') {
    const sameYear = from.getFullYear() === currentYear;
    return from.toLocaleDateString(undefined, sameYear
      ? { month: 'long' }
      : { month: 'long', year: 'numeric' });
  }

  // week
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  const sameYear = from.getFullYear() === currentYear;
  const fromStr = from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const toStr = sameMonth
    ? String(to.getDate())
    : to.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const yearSuffix = sameYear ? '' : `, ${from.getFullYear()}`;
  return `${fromStr} – ${toStr}${yearSuffix}`;
}

function StatsPage({ anchor, kind }: { anchor: string; kind: RangeKind }) {
  const { tokens } = useTheme();
  const range = useMemo(() => dateRange(anchor, kind), [anchor, kind]);
  const { data, isLoading } = useStats(range);

  const buckets = useMemo(
    () => bucketByDay(data?.byDay ?? [], range, kind),
    [data?.byDay, range, kind],
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.totalCard, { backgroundColor: tokens.surfaceMuted }]}>
        <Text style={[styles.totalLabel, { color: tokens.textTertiary }]}>Total</Text>
        <Text style={[styles.totalValue, { color: tokens.text }]}>
          {data ? `${formatBlocks(data.total)} ${data.total === 1 ? 'block' : 'blocks'}` : isLoading ? '—' : '0 blocks'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]}>Trend</Text>
        <TrendChart data={buckets} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]}>By activity</Text>
        <StatsBars rows={data?.byActivity ?? []} />
      </View>
    </ScrollView>
  );
}

export default function StatsScreen() {
  const { tokens } = useTheme();
  const today = useToday();
  const [kind, setKind] = useState<RangeKind>('week');
  const [anchor, setAnchor] = useState(today);

  // Don't allow paging past the current week/month/year.
  const currentRange = useMemo(() => dateRange(today, kind), [today, kind]);
  const isAtCurrent = useMemo(
    () => today >= currentRange.from && today <= currentRange.to
      && anchor >= currentRange.from && anchor <= currentRange.to,
    [today, anchor, currentRange],
  );

  const pages = useMemo(
    () => isAtCurrent
      ? [shiftAnchor(anchor, kind, -1), anchor]
      : [shiftAnchor(anchor, kind, -1), anchor, shiftAnchor(anchor, kind, 1)],
    [anchor, kind, isAtCurrent],
  );
  const pagerRef = useRef<PagerView>(null);
  const isUserSwipeRef = useRef(false);

  const onKindChange = useCallback((k: RangeKind) => {
    setKind(k);
    setAnchor(today);
  }, [today]);

  const onPageScrollStateChanged = useCallback((e: PageScrollStateChangedNativeEvent) => {
    const state = e.nativeEvent.pageScrollState;
    if (state === 'dragging') isUserSwipeRef.current = true;
    else if (state === 'idle') isUserSwipeRef.current = false;
  }, []);

  const onPageSelected = useCallback((e: PagerViewOnPageSelectedEvent) => {
    if (!isUserSwipeRef.current) return;
    const page = e.nativeEvent.position;
    if (page === 1) return;
    const dir: -1 | 1 = page === 0 ? -1 : 1;
    setAnchor((prev) => shiftAnchor(prev, kind, dir));
    requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
  }, [kind]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: tokens.text }]}>Stats</Text>
      </View>

      <View style={styles.controls}>
        <Segmented kind={kind} onChange={onKindChange} />
        <Text style={[styles.rangeLabel, { color: tokens.textSecondary }]}>
          {formatRangeLabel(anchor, kind)}
        </Text>
      </View>

      <PagerView
        key={`${kind}-${isAtCurrent ? 'cur' : 'past'}`}
        ref={pagerRef}
        style={styles.pager}
        initialPage={1}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {pages.map((a, i) => (
          <View key={`${kind}-${a}-${i}`} style={styles.page}>
            <StatsPage anchor={a} kind={kind} />
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

function Segmented({ kind, onChange }: { kind: RangeKind; onChange: (k: RangeKind) => void }) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.segWrap, { backgroundColor: tokens.surfaceMuted }]}>
      {(['week', 'month', 'year'] as const).map((k) => {
        const active = k === kind;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            style={[styles.seg, active && { backgroundColor: tokens.surface }]}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '600' : '500',
                color: active ? tokens.text : tokens.textSecondary,
                textTransform: 'capitalize',
              }}
            >
              {k}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: 0.4 },
  controls: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
  rangeLabel: { fontSize: 15, fontWeight: '600', textAlign: 'center', fontVariant: ['tabular-nums'] },
  segWrap: { flexDirection: 'row', borderRadius: 8, padding: 2 },
  seg: { flex: 1, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  pager: { flex: 1 },
  page: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 120 },
  totalCard: { padding: 20, borderRadius: 14, gap: 4 },
  totalLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  totalValue: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '500' },
});
