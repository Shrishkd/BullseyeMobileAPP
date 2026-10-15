import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  size = 'md',
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryText, border: colors.primary },
    secondary: { bg: colors.muted, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.downSoft, fg: colors.down, border: colors.down },
  }[variant];

  const handlePress = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && { opacity: 0.8 },
        inactive && { opacity: 0.5 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant={size === 'sm' ? 'small' : 'body'} weight="600" style={{ color: palette.fg }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { minHeight: 36, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
