import { useRef } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { Activity, Entry } from '~/api/types';
import { BlockRow } from './BlockRow';
import { BRAND } from '~/theme/tokens';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  entry: Entry;
  activity: Activity | null;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

const ACTION_WIDTH = 64;
const TOTAL_ACTIONS = ACTION_WIDTH * 2;

export function SwipeableBlockRow({ entry, activity, onEdit, onDelete }: Props) {
  const ref = useRef<SwipeableMethods>(null);
  const { tokens } = useTheme();

  function close() {
    ref.current?.close();
  }

  function handleEdit() {
    close();
    onEdit(entry);
  }

  function handleDelete() {
    Alert.alert(
      'Delete block?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: close },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            close();
            onDelete(entry);
          },
        },
      ],
      { cancelable: true, onDismiss: close },
    );
  }

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={32}
      overshootRight={false}
      renderRightActions={(_progress, drag) => (
        <RightActions
          drag={drag}
          danger={tokens.danger}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    >
      <BlockRow entry={entry} activity={activity} />
    </ReanimatedSwipeable>
  );
}

function RightActions({
  drag,
  danger,
  onEdit,
  onDelete,
}: {
  drag: SharedValue<number>;
  danger: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const editStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(drag.value, [-TOTAL_ACTIONS, 0], [0, TOTAL_ACTIONS], 'clamp'),
      },
    ],
  }));
  const deleteStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(drag.value, [-TOTAL_ACTIONS, 0], [0, ACTION_WIDTH], 'clamp'),
      },
    ],
  }));

  return (
    <View style={styles.actionsRow}>
      <Animated.View style={[styles.action, { backgroundColor: BRAND.editBlue }, editStyle]}>
        <ActionButton label="Edit" onPress={onEdit} />
      </Animated.View>
      <Animated.View style={[styles.action, { backgroundColor: danger }, deleteStyle]}>
        <ActionButton label="Delete" onPress={onDelete} />
      </Animated.View>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <RectButton style={styles.actionButton} onPress={onPress}>
      <Text style={styles.actionLabel}>{label}</Text>
    </RectButton>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    width: TOTAL_ACTIONS,
  },
  action: {
    width: ACTION_WIDTH,
    overflow: 'hidden',
    borderRadius: Platform.OS === 'ios' ? 12 : 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
