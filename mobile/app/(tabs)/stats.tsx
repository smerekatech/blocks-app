import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatsBars } from '~/components/charts/StatsBars';
import { TrendChart } from '~/components/charts/TrendChart';
import { useStats } from '~/hooks/useStats';
import { useToday } from '~/hooks/useToday';
import { bucketByDay, dateRange, type RangeKind } from '~/lib/dateRange';
import { useTheme } from '~/theme/ThemeProvider';

const HALF_DURATION_MIN = 45;

function formatTotalDuration(blocks: number): string {
  const minutes = Math.round(blocks * 2 * HALF_DURATION_MIN);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function StatsScreen() {
  const { tokens } = useTheme();
  const today = useToday();
  const [kind, setKind] = useState<RangeKind>('week');

  const range = useMemo(() => dateRange(today, kind), [today, kind]);
  const { data, isLoading } = useStats(range);

  const buckets = useMemo(
    () => bucketByDay(data?.byDay ?? [], range, kind),
    [data?.byDay, range, kind],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: tokens.text }]}>Stats</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Segmented kind={kind} onChange={setKind} />

        <View style={[styles.totalCard, { backgroundColor: tokens.surfaceMuted }]}>
          <Text style={[styles.totalLabel, { color: tokens.textTertiary }]}>
            {kind === 'week' ? 'This week' : kind === 'month' ? 'This month' : 'This year'}
          </Text>
          <Text style={[styles.totalValue, { color: tokens.text }]}>
            {data ? formatTotalDuration(data.total) : isLoading ? '—' : '0 min'}
          </Text>
          <Text style={[styles.totalSub, { color: tokens.textTertiary }]}>
            {data ? `${data.total.toFixed(1)} blocks` : ''}
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
  content: { padding: 16, gap: 20, paddingBottom: 120 },
  segWrap: { flexDirection: 'row', borderRadius: 8, padding: 2 },
  seg: { flex: 1, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  totalCard: { padding: 20, borderRadius: 14, gap: 4 },
  totalLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  totalValue: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  totalSub: { fontSize: 13 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '500' },
});
