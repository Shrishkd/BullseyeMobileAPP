import { memo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

type SparklineProps = {
  data: number[];
  /** Fixed width; omit to fill the parent's width. */
  width?: number;
  height?: number;
  color?: string;
};

/** Tiny trend line; colour follows first → last direction unless overridden. */
export const Sparkline = memo(function Sparkline({ data, width, height = 28, color }: SparklineProps) {
  const { colors } = useTheme();
  const [measured, setMeasured] = useState(0);
  const values = data.filter((v) => Number.isFinite(v));
  if (values.length < 2) return null;

  const w = width ?? measured;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    .join(' ');
  const stroke = color ?? (values[values.length - 1] >= values[0] ? colors.up : colors.down);

  return (
    <View
      style={{ width: width ?? '100%', height }}
      onLayout={width ? undefined : (e) => setMeasured(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Polyline points={points} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" />
        </Svg>
      ) : null}
    </View>
  );
});
