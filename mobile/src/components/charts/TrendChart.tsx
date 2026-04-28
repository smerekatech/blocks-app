import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '~/theme/ThemeProvider';

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
}

const PADDING = 4;

export function TrendChart({ data, height = 120 }: Props) {
  const { tokens } = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.wrap}>
      <View style={[styles.chartArea, { height }]}>
        <Svg width="100%" height={height}>
          {data.map((d, i) => {
            const barW = `${100 / data.length - 1}%`;
            const x = `${(100 / data.length) * i + 0.5}%`;
            const ratio = max > 0 ? d.value / max : 0;
            const barH = Math.max(2, (height - PADDING * 2) * ratio);
            const y = height - PADDING - barH;
            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill={tokens.accent}
                opacity={d.value > 0 ? 1 : 0.18}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={[styles.label, { color: tokens.textTertiary, flex: 1 / data.length }]}
            numberOfLines={1}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  chartArea: { width: '100%' },
  labels: { flexDirection: 'row', paddingHorizontal: 2 },
  label: { fontSize: 10, textAlign: 'center' },
});
