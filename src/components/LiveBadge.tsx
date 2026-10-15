import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { LiveStatus } from '@/hooks/useLivePrice';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const LABELS: Record<LiveStatus, string> = {
  connecting: 'Connecting',
  live: 'Live',
  fallback: 'Delayed',
  offline: 'Offline',
};

export function LiveBadge({ status, marketOpen }: { status: LiveStatus; marketOpen?: boolean }) {
  const { colors } = useTheme();
  const color = { connecting: colors.textMuted, live: colors.up, fallback: colors.warning, offline: colors.down }[status];
  return (
    <View style={styles.row} accessibilityLabel={`Price feed ${LABELS[status]}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" style={{ color }}>
        {LABELS[status]}
        {marketOpen === false ? ' · market closed' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
