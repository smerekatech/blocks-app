import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import type { Activity, Entry } from '~/api/types';
import { CountGlyph } from '~/components/CountGlyph';
import { resolveSwatch } from '~/theme/swatch';
import { useTheme } from '~/theme/ThemeProvider';

interface Props {
  entry: Entry;
  activity: Activity | null;
}

export function BlockRow({ entry, activity }: Props) {
  const { tokens, scheme } = useTheme();
  const swatch = resolveSwatch(activity?.color);
  const colors = scheme === 'dark'
    ? { bar: swatch.borderDark, surface: swatch.surfaceDark, bg: swatch.bgDark, text: swatch.textDark }
    : { bar: swatch.border, surface: swatch.surface, bg: swatch.bg, text: swatch.text };

  const isHalf = entry.blocks <= 0.5;
  const radius = Platform.OS === 'ios' ? 12 : 16;
  const minHeight = isHalf ? 28 : 56;
  const verticalPad = isHalf ? 5 : 14;

  const displayName = activity?.name ?? entry.name ?? 'Unnamed';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: tokens.separator,
          borderRadius: radius,
          minHeight,
          paddingTop: verticalPad,
          paddingBottom: verticalPad,
        },
      ]}
    >
      {isHalf && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Pattern
              id="stripes"
              patternUnits="userSpaceOnUse"
              width={16}
              height={16}
              patternTransform="rotate(-45)"
            >
              <Rect x={0} y={0} width={8} height={16} fill={colors.surface} />
              <Rect x={8} y={0} width={8} height={16} fill={colors.bg} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#stripes)" />
        </Svg>
      )}
      <View style={[styles.bar, { backgroundColor: colors.bar }]} />
      <View style={styles.glyphWrap}>
        <CountGlyph half={isHalf} color={colors.bar} size={isHalf ? 12 : 14} />
      </View>
      <Text
        style={[
          styles.name,
          { color: tokens.text, fontSize: isHalf ? 14 : 16 },
        ]}
        numberOfLines={1}
      >
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingLeft: 0,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: 10,
  },
  glyphWrap: {
    marginRight: 8,
  },
  name: {
    flex: 1,
    fontWeight: '500',
  },
});
