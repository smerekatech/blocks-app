import Svg, { Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/**
 * The Blocks B0 mark — two stacked rounded rects, one filled and one outlined.
 * Mirrors public/blocks-logo.svg / blocks-logo-green.svg exactly.
 */
export function BlocksLogo({ size = 24, color = '#2E9F5C' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x={2} y={3} width={16} height={6} rx={1.5} fill={color} />
      <Rect
        x={2}
        y={11}
        width={16}
        height={6}
        rx={1.5}
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
    </Svg>
  );
}
