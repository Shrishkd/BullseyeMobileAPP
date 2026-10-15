import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

type ChipProps = { label: string; selected?: boolean; onPress?: () => void; icon?: ReactNode };

export function Chip({ label, selected, onPress, icon }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primarySoft : colors.muted,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}>
      {icon}
      <Text variant="small" weight="600" style={{ color: selected ? colors.primary : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Horizontally scrolling chip row (symbols, prompts). */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children}
    </ScrollView>
  );
}

type Tone = 'neutral' | 'up' | 'down' | 'warning' | 'info' | 'primary';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const map = {
    neutral: { bg: colors.muted, fg: colors.textMuted },
    up: { bg: colors.upSoft, fg: colors.up },
    down: { bg: colors.downSoft, fg: colors.down },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    info: { bg: colors.infoSoft, fg: colors.info },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text variant="caption" weight="600" style={{ color: map.fg }}>
        {label}
      </Text>
    </View>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.muted }]} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: colors.card }]}>
            <Text variant="small" weight="600" style={{ color: active ? colors.primary : colors.textMuted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { gap: spacing.sm, paddingVertical: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segment: { flex: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
});
