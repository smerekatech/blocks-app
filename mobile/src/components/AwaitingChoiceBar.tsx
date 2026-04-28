import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Activity, RunningTimer } from '~/api/types';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';
import { BRAND } from '~/theme/tokens';

interface Props {
  timer: RunningTimer;
  activity: Activity | null;
  onStartNext: () => void;
  onStartAnother: () => void;
}

export function AwaitingChoiceBar({ timer, activity, onStartNext, onStartAnother }: Props) {
  const { tokens, scheme } = useTheme();
  const swatch = resolveSwatch(activity?.color);
  const tint = scheme === 'dark' ? swatch.borderDark : swatch.border;
  const displayName = activity?.name ?? timer.name ?? 'Block';

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: tokens.surface, borderTopColor: tokens.separator },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: tint }]} />
        <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.status, { color: tokens.textSecondary }]}>½ saved</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onStartAnother}
          style={({ pressed }) => [
            styles.btn,
            styles.btnSecondary,
            { borderColor: tokens.separator, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: tokens.text }]}>Start another</Text>
        </Pressable>
        <Pressable
          onPress={onStartNext}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: BRAND.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Start next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  status: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: { borderWidth: StyleSheet.hairlineWidth },
  btnText: { fontSize: 15, fontWeight: '600' },
});
