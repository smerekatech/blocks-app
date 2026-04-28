import { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Activity, RunningTimer, TimerConfig } from '~/api/types';
import {
  useCompleteTimer,
  useStartSecondHalf,
  useStopTimer,
} from '~/hooks/useTimerMutations';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  visible: boolean;
  onClose: () => void;
  timer: RunningTimer;
  config: TimerConfig;
  activity: Activity | null;
}

/** Whether the timer has reached its half duration and is ready for "complete". */
function isComplete(timer: RunningTimer, config: TimerConfig, now: number): boolean {
  const elapsed = now - new Date(timer.startedAt).getTime();
  return elapsed >= config.halfDurationMs;
}

export function RunningBarSheet(props: Props) {
  if (!props.visible) return null;

  if (Platform.OS === 'ios') {
    return <IosActionSheet {...props} />;
  }
  return <AndroidSheet {...props} />;
}

function useDisplayName(timer: RunningTimer, activity: Activity | null): string {
  return activity?.name ?? timer.name ?? 'Block';
}

function useActions(props: Props) {
  const stopMut = useStopTimer();
  const completeMut = useCompleteTimer();
  const secondHalfMut = useStartSecondHalf();
  const displayName = useDisplayName(props.timer, props.activity);

  async function stop() {
    try {
      await stopMut.mutateAsync();
      props.onClose();
    } catch (err) {
      Alert.alert('Could not stop', err instanceof Error ? err.message : String(err));
    }
  }

  async function complete() {
    try {
      const result = await completeMut.mutateAsync({ displayName });
      if (result.state === 'awaiting-choice') {
        Alert.alert('First half saved', 'Start a second half or stop here?', [
          { text: 'Stop', style: 'cancel', onPress: stop },
          { text: 'Start second half', onPress: secondHalf },
        ]);
        return;
      }
      props.onClose();
    } catch (err) {
      Alert.alert('Could not complete', err instanceof Error ? err.message : String(err));
    }
  }

  async function secondHalf() {
    try {
      await secondHalfMut.mutateAsync({ displayName });
      props.onClose();
    } catch (err) {
      Alert.alert('Could not start second half', err instanceof Error ? err.message : String(err));
    }
  }

  return { stop, complete, secondHalf };
}

function IosActionSheet(props: Props) {
  const actions = useActions(props);
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;

    const now = Date.now();
    const ready = isComplete(props.timer, props.config, now);
    const inAwaitingChoice = props.timer.half === 1 && props.timer.firstEntryId != null;

    const buttons: string[] = [];
    const handlers: Array<() => void> = [];

    if (inAwaitingChoice) {
      buttons.push('Start second half');
      handlers.push(() => void actions.secondHalf());
      buttons.push('Stop');
      handlers.push(() => void actions.stop());
    } else if (ready) {
      buttons.push(props.timer.half === 1 ? 'Complete first half' : 'Complete block');
      handlers.push(() => void actions.complete());
      buttons.push('Stop early');
      handlers.push(() => void actions.stop());
    } else {
      buttons.push('Stop');
      handlers.push(() => void actions.stop());
    }

    const cancelIndex = buttons.length;
    buttons.push('Cancel');

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: props.activity?.name ?? props.timer.name ?? 'Running block',
        options: buttons,
        cancelButtonIndex: cancelIndex,
        destructiveButtonIndex: buttons.findIndex((b) => b === 'Stop' || b === 'Stop early'),
      },
      (idx) => {
        if (idx === cancelIndex) {
          props.onClose();
          return;
        }
        handlers[idx]?.();
      },
    );
  }, [props, actions]);

  return null;
}

function AndroidSheet(props: Props) {
  const { tokens } = useTheme();
  const actions = useActions(props);
  const slide = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide]);

  function dismiss(after?: () => void) {
    Animated.timing(slide, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setMounted(false);
      after?.();
      props.onClose();
    });
  }

  if (!mounted) return null;

  const now = Date.now();
  const ready = isComplete(props.timer, props.config, now);
  const inAwaitingChoice = props.timer.half === 1 && props.timer.firstEntryId != null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const backdropOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={() => dismiss()}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000', opacity: backdropOpacity },
          ]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => dismiss()} />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: tokens.surface, transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: tokens.separator }]} />
          <Text style={[styles.sheetTitle, { color: tokens.text }]}>
            {props.activity?.name ?? props.timer.name ?? 'Running block'}
          </Text>
          {inAwaitingChoice ? (
            <>
              <SheetButton label="Start second half" onPress={() => dismiss(() => void actions.secondHalf())} />
              <SheetButton label="Stop" destructive onPress={() => dismiss(() => void actions.stop())} />
            </>
          ) : ready ? (
            <>
              <SheetButton
                label={props.timer.half === 1 ? 'Complete first half' : 'Complete block'}
                onPress={() => dismiss(() => void actions.complete())}
              />
              <SheetButton label="Stop early" destructive onPress={() => dismiss(() => void actions.stop())} />
            </>
          ) : (
            <SheetButton label="Stop" destructive onPress={() => dismiss(() => void actions.stop())} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function SheetButton({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: tokens.surfaceMuted }}
      style={({ pressed }) => [
        styles.sheetButton,
        { borderColor: tokens.separator, backgroundColor: pressed ? tokens.surfaceMuted : 'transparent' },
      ]}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: '500',
          color: destructive ? tokens.danger : tokens.accent,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  sheetButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
