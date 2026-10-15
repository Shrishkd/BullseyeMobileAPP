import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Categorical series colours, distinguishable in both themes. */
export const SERIES_COLORS = ['#22C365', '#60A5FA', '#F59E0B', '#A78BFA', '#F472B6', '#2DD4BF', '#F87171', '#94A3B8'];

type Slice = { label: string; value: number };

type DonutProps = { data: Slice[]; size?: number; centerLabel?: string; centerValue?: string };

export function Donut({ data, size = 140, centerLabel, centerValue }: DonutProps) {
  const { colors } = useTheme();
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0);
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;

  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.muted} strokeWidth={stroke} fill="none" />
          {total > 0 &&
            slices.map((s, i) => {
              const len = (s.value / total) * c;
              const el = (
                <Circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${Math.max(len - 1.5, 0.5)} ${c}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
        </Svg>
        {centerValue ? (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Text variant="title" numeric>
              {centerValue}
            </Text>
            {centerLabel ? (
              <Text variant="caption" tone="muted">
                {centerLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.legend}>
        {slices.map((s, i) => (
          <View key={s.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }]} />
            <Text variant="small" style={styles.flex} numberOfLines={1}>
              {s.label}
            </Text>
            <Text variant="small" tone="muted" numeric>
              {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  flex: { flex: 1 },
});
