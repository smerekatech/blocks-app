import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Activity, RunningTimer, TimerConfig } from '~/api/types';
import { useElapsedSec } from '~/hooks/useElapsedSec';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  timer: RunningTimer;
  config: TimerConfig;
  activity: Activity | null;
  onTap?: () => void;
}

function formatRemaining(elapsedSec: number, totalSec: number): string {
  const remaining = Math.max(0, totalSec - elapsedSec);
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function RunningBar({ timer, config, activity, onTap }: Props) {
  const { scheme } = useTheme();
  const swatch = resolveSwatch(activity?.color);
  const barColor = scheme === 'dark' ? swatch.borderDark : swatch.border;

  const elapsedSec = useElapsedSec(timer.startedAt);
  const totalSec = Math.round(config.halfDurationMs / 1000);
  const clampedSec = Math.min(elapsedSec, totalSec);
  const pct = totalSec > 0 ? clampedSec / totalSec : 0;

  const displayName = activity?.name ?? timer.name ?? 'Running';

  // Pulse animation for the recording dot — 1.6s ease-out infinite per design.
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
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0.0, 0] });

  const height = Platform.OS === 'ios' ? 48 : 56;

  return (
    <Pressable
      onPress={onTap}
      style={[styles.bar, { backgroundColor: barColor, height }]}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
    >
      <View pointerEvents="none" style={[styles.fill, { width: `${pct * 100}%` }]} />
      <View style={styles.dotWrap}>
        <Animated.View
          style={[
            styles.dotRing,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />
        <View style={styles.dot} />
      </View>
      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
          {timer.half === 2 ? '  ·  ½ → 1' : ''}
        </Text>
      </View>
      <Text style={styles.time}>{formatRemaining(clampedSec, totalSec)}</Text>
      <Svg width={8} height={14} viewBox="0 0 8 14" style={{ marginLeft: 8, opacity: 0.85 }}>
        <Path
          d="M1 1l6 6-6 6"
          stroke="#FFFFFF"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  dotRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  center: { flex: 1, minWidth: 0 },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    opacity: 0.95,
  },
});
