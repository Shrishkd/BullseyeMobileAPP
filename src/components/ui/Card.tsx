import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Accent border, e.g. for verdict / prediction cards. */
  accent?: string;
  accessibilityLabel?: string;
};

export function Card({ children, style, onPress, accent, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const base = [
    styles.card,
    { backgroundColor: colors.card, borderColor: accent ?? colors.border },
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.75 }]}>
      {children}
    </Pressable>
  );
}

type SectionHeaderProps = { title: string; action?: ReactNode; icon?: ReactNode };

export function SectionHeader({ title, action, icon }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {icon}
        <Text variant="title">{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
