import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import type { Activity, Entry } from '~/api/types';
import { useActivities } from '~/hooks/useActivities';
import { useEntries } from '~/hooks/useEntries';
import { useToday } from '~/hooks/useToday';
import { usePatchEntry } from '~/hooks/useEntryMutations';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';

export default function EditPickerScreen() {
  const { tokens, scheme } = useTheme();
  const router = useRouter();
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const id = Number(entryId);

  const today = useToday();
  const range = useMemo(() => ({ from: today, to: today }), [today]);
  const entriesQ = useEntries(range);
  const entry = useMemo<Entry | undefined>(
    () => entriesQ.data?.find((e) => e.id === id),
    [entriesQ.data, id],
  );

  const activitiesQ = useActivities();
  const activities = activitiesQ.data ?? [];
  const patchMut = usePatchEntry();

  const [search, setSearch] = useState('');
  const [freeformMode, setFreeformMode] = useState(entry?.activityId == null && entry?.name != null);
  const [freeformText, setFreeformText] = useState(entry?.name ?? '');
  const [blocks, setBlocks] = useState<0.5 | 1>(entry && entry.blocks <= 0.5 ? 0.5 : 1);

  const filtered = search
    ? activities.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : activities;

  function close() {
    if (router.canGoBack()) router.back();
  }

  async function applyActivity(activity: Activity) {
    if (patchMut.isPending) return;
    try {
      await patchMut.mutateAsync({ id, input: { activityId: activity.id, blocks } });
      close();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    }
  }

  async function applyFreeform() {
    const name = freeformText.trim();
    if (!name || patchMut.isPending) return;
    try {
      await patchMut.mutateAsync({ id, input: { name, blocks } });
      close();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : String(err));
    }
  }

  if (!Number.isFinite(id) || !entry) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Text style={{ color: tokens.textTertiary }}>Block not found.</Text>
          <Pressable onPress={close} style={{ padding: 16 }}>
            <Text style={{ color: tokens.accent, fontSize: 17 }}>Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.handle, { backgroundColor: tokens.separator }]} />
        <View style={styles.header}>
          <Pressable onPress={close} hitSlop={8}>
            <Text style={[styles.headerAction, { color: tokens.accent }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: tokens.text }]}>Edit block</Text>
          <View style={{ width: 60 }} />
        </View>

        <SegmentedHalfFull value={blocks} onChange={setBlocks} />

        {!freeformMode && (
          <View style={[styles.searchWrap, { backgroundColor: tokens.surfaceMuted }]}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search activities"
              placeholderTextColor={tokens.textTertiary}
              style={[styles.search, { color: tokens.text }]}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
        )}

        {freeformMode ? (
          <View style={styles.freeformWrap}>
            <Text style={[styles.freeformLabel, { color: tokens.textSecondary }]}>Block name</Text>
            <TextInput
              value={freeformText}
              onChangeText={setFreeformText}
              placeholder="e.g. Reading"
              placeholderTextColor={tokens.textTertiary}
              style={[styles.freeformInput, { color: tokens.text, borderColor: tokens.separator }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={applyFreeform}
            />
            <Pressable
              onPress={applyFreeform}
              disabled={!freeformText.trim() || patchMut.isPending}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: tokens.accent,
                  opacity: !freeformText.trim() || patchMut.isPending || pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {patchMut.isPending ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setFreeformMode(false)} style={styles.secondaryButton}>
              <Text style={{ color: tokens.accent, fontSize: 15 }}>Pick from activities</Text>
            </Pressable>
          </View>
        ) : (
          <FlashList<Activity>
            data={filtered}
            keyExtractor={(a) => String(a.id)}
            renderItem={({ item }) => {
              const swatch = resolveSwatch(item.color);
              const tile = scheme === 'dark' ? swatch.borderDark : swatch.border;
              const selected = item.id === entry.activityId;
              return (
                <Pressable
                  onPress={() => applyActivity(item)}
                  android_ripple={{ color: tokens.surfaceMuted }}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: pressed ? tokens.surfaceMuted : 'transparent' },
                  ]}
                >
                  <View style={[styles.tile, { backgroundColor: tile }]} />
                  <Text style={[styles.rowName, { color: tokens.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {selected && (
                    <Text style={[styles.checkmark, { color: tokens.accent }]}>✓</Text>
                  )}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: tokens.separator, marginLeft: 60 }]} />
            )}
            ListFooterComponent={
              <Pressable onPress={() => setFreeformMode(true)} style={styles.freeformLink}>
                <Text style={{ color: tokens.accent, fontSize: 15 }}>Use freeform name…</Text>
              </Pressable>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SegmentedHalfFull({
  value,
  onChange,
}: {
  value: 0.5 | 1;
  onChange: (next: 0.5 | 1) => void;
}) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.segWrap, { backgroundColor: tokens.surfaceMuted }]}>
      <SegBtn label="½ block" active={value === 0.5} onPress={() => onChange(0.5)} />
      <SegBtn label="1 block" active={value === 1} onPress={() => onChange(1)} />
    </View>
  );
}

function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.seg,
        active && { backgroundColor: tokens.surface },
      ]}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: active ? '600' : '500',
          color: active ? tokens.text : tokens.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerAction: { fontSize: 17 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  segWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 2,
  },
  seg: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
  },
  search: { fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
  tile: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 12,
  },
  rowName: { flex: 1, fontSize: 17 },
  checkmark: { fontSize: 18, marginLeft: 8 },
  separator: { height: StyleSheet.hairlineWidth },
  freeformLink: { padding: 16, alignItems: 'center' },
  freeformWrap: { padding: 24, gap: 16 },
  freeformLabel: { fontSize: 13 },
  freeformInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 17,
  },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', padding: 8 },
});
