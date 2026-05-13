import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';

import type { Activity, Entry } from '~/api/types';
import { BlocksLogo } from '~/components/BlocksLogo';
import { SwipeableBlockRow } from '~/components/SwipeableBlockRow';
import { useEntries } from '~/hooks/useEntries';
import { useDeleteEntry } from '~/hooks/useEntryMutations';
import { useTheme } from '~/theme/ThemeProvider';
import { BRAND } from '~/theme/tokens';

interface Props {
  date: string;
  isToday: boolean;
  activitiesById: Map<number, Activity>;
  onEdit: (entry: Entry) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
}

const keyExtractor = (item: Entry) => String(item.id);
const Separator = () => <View style={{ height: 8 }} />;

export function HomeDayPage({ date, isToday, activitiesById, onEdit, onAdd, onRefresh }: Props) {
  const range = useMemo(() => ({ from: date, to: date }), [date]);
  const entriesQ = useEntries(range);
  const deleteMut = useDeleteEntry();

  const entries = entriesQ.data ?? [];
  const isLoading = entriesQ.isLoading;
  const isEmpty = !isLoading && entries.length === 0;

  const handleRefresh = useCallback(() => {
    void entriesQ.refetch();
    onRefresh?.();
  }, [entriesQ, onRefresh]);

  if (isEmpty) {
    // Wrap the empty state in a ScrollView so pull-to-refresh works when
    // dragging anywhere on the (otherwise empty) surface.
    return (
      <ScrollView
        style={styles.emptyScroll}
        contentContainerStyle={styles.emptyScrollContent}
        refreshControl={(
          <RefreshControl refreshing={entriesQ.isFetching} onRefresh={handleRefresh} />
        )}
      >
        <EmptyState isToday={isToday} onAdd={onAdd} />
      </ScrollView>
    );
  }

  return (
    <FlashList<Entry>
      data={entries}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => (
        <SwipeableBlockRow
          entry={item}
          activity={item.activityId != null ? activitiesById.get(item.activityId) ?? null : null}
          onEdit={onEdit}
          onDelete={(e) => deleteMut.mutate(e.id)}
        />
      )}
      ItemSeparatorComponent={Separator}
      ListFooterComponent={onAdd ? <AddBlockButton onPress={onAdd} /> : null}
      contentContainerStyle={styles.listContent}
      refreshing={entriesQ.isFetching}
      onRefresh={handleRefresh}
    />
  );
}

function AddBlockButton({ onPress }: { onPress: () => void }) {
  const { tokens } = useTheme();
  return (
    <View style={styles.addWrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.addBtn,
          { borderColor: tokens.separator, opacity: pressed ? 0.6 : 1 },
        ]}
        android_ripple={{ color: 'rgba(46,159,92,0.15)' }}
      >
        <Plus size={18} color={BRAND.accent} strokeWidth={2.5} />
        <Text style={[styles.addLabel, { color: BRAND.accent }]}>Add block</Text>
      </Pressable>
    </View>
  );
}

function EmptyState({ isToday, onAdd }: { isToday: boolean; onAdd?: () => void }) {
  const { tokens } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={{ opacity: 0.4 }}>
        <BlocksLogo size={48} color={tokens.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: tokens.text }]}>No blocks</Text>
      <Text style={[styles.emptySub, { color: tokens.textTertiary }]}>
        {isToday ? 'Start a block or add one to log today.' : 'No blocks logged this day.'}
      </Text>
      {onAdd && (
        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <AddBlockButton onPress={onAdd} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  emptyScroll: { flex: 1 },
  emptyScrollContent: { flexGrow: 1 },
  addWrap: { paddingTop: 8 },
  addBtn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addLabel: { fontSize: 15, fontWeight: '600' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
