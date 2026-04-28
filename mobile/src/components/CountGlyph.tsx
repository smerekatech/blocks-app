import Svg, { Rect } from 'react-native-svg';

interface Props {
  half?: boolean;
  color: string;
  halfPosition?: 'top' | 'bottom';
  size?: number;
}

/**
 * Web-parity icon for a block:
 *   full → fully-filled rounded square
 *   half → outlined square with bottom (or top) half filled
 */
export function CountGlyph({ half = false, color, halfPosition = 'bottom', size = 14 }: Props) {
  const inner = size - 2;
  const halfHeight = inner / 2;
  const halfY = halfPosition === 'top' ? 1 : size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect
        x={1}
        y={1}
        width={inner}
        height={inner}
        rx={2.5}
        fill="none"
        stroke={color}
        strokeWidth={1.3}
      />
      {half ? (
        <Rect x={1} y={halfY} width={inner} height={halfHeight} fill={color} />
      ) : (
        <Rect x={1} y={1} width={inner} height={inner} rx={2.5} fill={color} />
      )}
    </Svg>
  );
}
