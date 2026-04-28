import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BRAND } from '~/theme/tokens';

interface Props {
  label?: string;
  onPress: () => void;
}

export function FAB({ label = 'Start', onPress }: Props) {
  const isIos = Platform.OS === 'ios';
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(15,79,42,0.15)' }}
      style={({ pressed }) => [
        styles.fab,
        isIos ? styles.iosShape : styles.mdShape,
        {
          backgroundColor: isIos ? BRAND.accent : '#CFEFD9',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Svg width={isIos ? 18 : 20} height={isIos ? 18 : 20} viewBox="0 0 20 20">
        <Path
          d="M10 3v14M3 10h14"
          stroke={isIos ? '#FFFFFF' : '#0F4F2A'}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </Svg>
      <Text
        style={[
          styles.label,
          {
            color: isIos ? '#FFFFFF' : '#0F4F2A',
            fontSize: isIos ? 17 : 14,
            fontWeight: isIos ? '600' : '500',
            letterSpacing: isIos ? 0 : 0.1,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iosShape: {
    paddingLeft: 18,
    paddingRight: 22,
    borderRadius: 28,
    shadowColor: BRAND.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  mdShape: {
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: 16,
    elevation: 6,
  },
  label: {},
});
