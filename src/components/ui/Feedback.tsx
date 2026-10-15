import { AlertTriangle, Info, Inbox } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Text } from './Text';

export function LoadingState({ message }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      {message ? (
        <Text variant="small" tone="muted" align="center">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <AlertTriangle color={colors.down} size={28} />
      <Text variant="body" align="center">
        {errorText(error)}
      </Text>
      {onRetry ? <Button title="Try again" variant="secondary" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Inbox color={colors.textMuted} size={28} />
      <Text variant="title" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="small" tone="muted" align="center">
          {message}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

/** Required wherever a prediction, verdict or AI opinion is shown. */
export function Disclaimer({ text }: { text?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.disclaimer, { backgroundColor: colors.muted }]}>
      <Info color={colors.textMuted} size={14} />
      <Text variant="caption" tone="muted" style={styles.flex}>
        {text ??
          'For information and education only. Not investment advice. Past performance does not guarantee future results.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  disclaimer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  flex: { flex: 1 },
});
