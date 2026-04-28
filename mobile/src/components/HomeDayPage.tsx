import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import type { Activity, Entry } from '~/api/types';
import { BlocksLogo } from '~/components/BlocksLogo';
import { SwipeableBlockRow } from '~/components/SwipeableBlockRow';
import { useEntries } from '~/hooks/useEntries';
import { useDeleteEntry } from '~/hooks/useEntryMutations';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  date: string;
  isToday: boolean;
  activitiesById: Map<number, Activity>;
  onEdit: (entry: Entry) => void;
}

const keyExtractor = (item: Entry) => String(item.id);
const Separator = () => <View style={{ height: 8 }} />;

export function HomeDayPage({ date, isToday, activitiesById, onEdit }: Props) {
  const { tokens } = useTheme();
  const range = useMemo(() => ({ from: date, to: date }), [date]);
  const entriesQ = useEntries(range);
  const deleteMut = useDeleteEntry();

  const entries = entriesQ.data ?? [];
  const isLoading = entriesQ.isLoading;
  const isEmpty = !isLoading && entries.length === 0;

  if (isEmpty) {
    return <EmptyState isToday={isToday} />;
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
      contentContainerStyle={styles.listContent}
      refreshing={entriesQ.isFetching}
      onRefresh={() => {
        void entriesQ.refetch();
      }}
    />
  );
}

function EmptyState({ isToday }: { isToday: boolean }) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },
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
