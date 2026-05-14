import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Activity, RunningTimer, TimerConfig } from '~/api/types';
import { useElapsedSec } from '~/hooks/useElapsedSec';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  timer: RunningTimer;
  config: TimerConfig;
  activity: Activity | null;
  onTap?: () => void;
  onStop?: () => void;
}

function formatRemaining(elapsedSec: number, totalSec: number): string {
  const remaining = Math.max(0, totalSec - elapsedSec);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function RunningBar({ timer, config, activity, onTap, onStop }: Props) {
  const { tokens, scheme } = useTheme();
  const swatch = resolveSwatch(activity?.color);
  const isDark = scheme === 'dark';
  const colors = isDark
    ? { bar: swatch.borderDark, surface: swatch.surfaceDark, text: tokens.text }
    : { bar: swatch.border, surface: swatch.surface, text: tokens.text };

  const elapsedSec = useElapsedSec(timer.startedAt);
  const totalSec = Math.round(config.halfDurationMs / 1000);
  const clampedSec = Math.min(elapsedSec, totalSec);

  const displayName = activity?.name ?? timer.name ?? 'Running';
  const halfLabel = timer.half === 2 ? 'Second half' : 'Running';

  // Pulse animation for the recording dot.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0, 0] });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onTap}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: tokens.separator,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      >
        <View style={[styles.stripe, { backgroundColor: colors.bar }]} />
        <View style={styles.dotWrap}>
          <Animated.View
            style={[
              styles.dotRing,
              {
                backgroundColor: colors.bar,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />
          <View style={[styles.dot, { backgroundColor: colors.bar }]} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {timer.half === 2 && (
            <Text style={[styles.status, { color: tokens.textSecondary }]} numberOfLines={1}>
              {halfLabel}
            </Text>
          )}
        </View>
        <Text style={[styles.remaining, { color: colors.text }]} numberOfLines={1}>
          {formatRemaining(clampedSec, totalSec)}
        </Text>
        {onStop && (
          <Pressable
            onPress={onStop}
            hitSlop={8}
            style={({ pressed }) => [
              styles.stopBtn,
              { backgroundColor: colors.bar, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={styles.stopSquare} />
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderRadius: 16,
    paddingLeft: 0,
    paddingRight: 8,
    paddingVertical: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stripe: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  dotWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  center: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  status: { fontSize: 12 },
  remaining: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
    marginRight: 12,
  },
  stopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
