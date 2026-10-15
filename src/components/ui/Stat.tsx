import { StyleSheet, View, type DimensionValue } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

type StatTileProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'up' | 'down' | 'warning';
  width?: DimensionValue;
};

export function StatTile({ label, value, hint, tone = 'default', width = '48%' }: StatTileProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.tile, { width, backgroundColor: colors.card, borderColor: colors.border }]}
      accessible
      accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <Text variant="title" tone={tone} numeric>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

/** Horizontal bar, 0–100. */
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.track, { backgroundColor: colors.muted }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color ?? colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
