import { StyleSheet, Text, View } from 'react-native';

import type { StatsByActivity } from '~/api/stats';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  rows: StatsByActivity[];
}

const HALF_DURATION_MIN = 45;

function formatDuration(blocks: number): string {
  const minutes = Math.round(blocks * 2 * HALF_DURATION_MIN);
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function StatsBars({ rows }: Props) {
  const { tokens, scheme } = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.blocks));

  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: tokens.textTertiary }}>No activity yet in this range.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {rows.map((row, idx) => {
        const swatch = resolveSwatch(row.color);
        const fill = scheme === 'dark' ? swatch.borderDark : swatch.border;
        const tint = scheme === 'dark' ? swatch.bgDark : swatch.bg;
        const ratio = row.blocks / max;
        return (
          <View key={`${row.activityId ?? 'free'}-${idx}`} style={styles.row}>
            <View style={[styles.tile, { backgroundColor: fill }]} />
            <View style={styles.body}>
              <View style={styles.labelLine}>
                <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={[styles.duration, { color: tokens.textSecondary }]}>
                  {formatDuration(row.blocks)}
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: tint }]}>
                <View
                  style={[styles.barFill, { backgroundColor: fill, width: `${ratio * 100}%` }]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 24, height: 24, borderRadius: 5 },
  body: { flex: 1, gap: 6 },
  labelLine: { flexDirection: 'row', alignItems: 'baseline' },
  name: { flex: 1, fontSize: 15, fontWeight: '500' },
  duration: { fontSize: 13, fontVariant: ['tabular-nums'] },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  empty: { paddingVertical: 32, alignItems: 'center' },
});
