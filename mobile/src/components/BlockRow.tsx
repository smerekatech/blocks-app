import { Platform, StyleSheet, Text, View } from 'react-native';

import type { Activity, Entry } from '~/api/types';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  entry: Entry;
  activity: Activity | null;
}

const HALF_DURATION_MIN = 45;

function formatDuration(blocks: number): string {
  const minutes = Math.round(blocks * 2 * HALF_DURATION_MIN);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function BlockRow({ entry, activity }: Props) {
  const { tokens, scheme } = useTheme();
  const swatch = resolveSwatch(activity?.color);
  const colors = scheme === 'dark'
    ? { bar: swatch.borderDark, bg: swatch.bgDark, text: swatch.textDark }
    : { bar: swatch.border, bg: swatch.bg, text: swatch.text };

  const isHalf = entry.blocks <= 0.5;
  const radius = Platform.OS === 'ios' ? 12 : 16;
  const tintOpacity = scheme === 'dark' ? 0.35 : 0.6;

  const displayName = activity?.name ?? entry.name ?? 'Unnamed';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.surface,
          borderRadius: radius,
        },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: colors.bar }]} />
      <View
        pointerEvents="none"
        style={[
          styles.tint,
          { backgroundColor: colors.bg, opacity: tintOpacity, left: 5, borderRadius: radius },
        ]}
      />
      <View style={styles.content}>
        <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.meta, { color: tokens.textSecondary }]} numberOfLines={1}>
          {formatDuration(entry.blocks)}
          {isHalf ? ' · ½' : ''}
        </Text>
      </View>
      <View style={[styles.chip, { backgroundColor: colors.bar }]}>
        <Text style={styles.chipText}>{isHalf ? '½' : '1'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
    paddingRight: 16,
    paddingLeft: 0,
    overflow: 'hidden',
  },
  bar: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 14,
  },
  tint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  meta: {
    fontSize: 13,
  },
  chip: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
