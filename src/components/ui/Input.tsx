import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

type InputProps = TextInputProps & { label?: string; error?: string | null };

export const Input = forwardRef<TextInput, InputProps>(function Input({ label, error, style, ...rest }, ref) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="small" tone="muted" weight="500">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...rest}
        style={[
          styles.input,
          { backgroundColor: colors.muted, color: colors.text, borderColor: error ? colors.down : colors.border },
          style,
        ]}
      />
      {error ? (
        <Text variant="caption" tone="down">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
});
