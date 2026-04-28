import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import type { Activity } from '~/api/types';
import { useActivities } from '~/hooks/useActivities';
import { useStartTimer } from '~/hooks/useTimerMutations';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StartPickerScreen() {
  const { tokens, scheme } = useTheme();
  const router = useRouter();
  const { data: activities = [], isLoading } = useActivities();
  const startMut = useStartTimer();
  const [search, setSearch] = useState('');
  const [freeformMode, setFreeformMode] = useState(false);
  const [freeformText, setFreeformText] = useState('');

  const filtered = search
    ? activities.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : activities;

  function close() {
    if (router.canGoBack()) router.back();
  }

  async function startWithActivity(activity: Activity) {
    if (startMut.isPending) return;
    try {
      await startMut.mutateAsync({
        activityId: activity.id,
        startedDate: todayString(),
        displayName: activity.name,
      });
      close();
    } catch (err) {
      Alert.alert('Could not start', err instanceof Error ? err.message : String(err));
    }
  }

  async function startFreeform() {
    const name = freeformText.trim();
    if (!name || startMut.isPending) return;
    try {
      await startMut.mutateAsync({
        name,
        startedDate: todayString(),
        displayName: name,
      });
      close();
    } catch (err) {
      Alert.alert('Could not start', err instanceof Error ? err.message : String(err));
    }
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
          <Text style={[styles.headerTitle, { color: tokens.text }]}>Start a block</Text>
          <View style={{ width: 60 }} />
        </View>

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
            <Text style={[styles.freeformLabel, { color: tokens.textSecondary }]}>
              Block name
            </Text>
            <TextInput
              value={freeformText}
              onChangeText={setFreeformText}
              placeholder="e.g. Reading"
              placeholderTextColor={tokens.textTertiary}
              style={[styles.freeformInput, { color: tokens.text, borderColor: tokens.separator }]}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={startFreeform}
            />
            <Pressable
              onPress={startFreeform}
              disabled={!freeformText.trim() || startMut.isPending}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: tokens.accent,
                  opacity: !freeformText.trim() || startMut.isPending || pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {startMut.isPending ? 'Starting…' : 'Start'}
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
              return (
                <Pressable
                  onPress={() => startWithActivity(item)}
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
                  <Text style={[styles.chevron, { color: tokens.textTertiary }]}>›</Text>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: tokens.separator, marginLeft: 60 }]} />
            )}
            ListEmptyComponent={
              isLoading ? null : (
                <View style={styles.emptyList}>
                  <Text style={{ color: tokens.textTertiary }}>
                    {search ? 'No matches' : 'No activities yet'}
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              <Pressable onPress={() => setFreeformMode(true)} style={styles.freeformLink}>
                <Text style={{ color: tokens.accent, fontSize: 15 }}>Start freeform…</Text>
              </Pressable>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  chevron: { fontSize: 20, marginLeft: 8 },
  separator: { height: StyleSheet.hairlineWidth },
  emptyList: { padding: 32, alignItems: 'center' },
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
