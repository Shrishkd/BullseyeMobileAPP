import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MarketPulseItem } from '@/api/types';
import { Sparkline } from '@/components/charts/Sparkline';
import { Badge, Text } from '@/components/ui';
import { formatINR, formatPct, trendOf } from '@/lib/format';
import { spacing } from '@/theme/tokens';

function rsiBadge(rsi: number | null) {
  if (rsi == null) return null;
  if (rsi >= 70) return <Badge label={`RSI ${rsi.toFixed(0)} · OB`} tone="down" />;
  if (rsi <= 30) return <Badge label={`RSI ${rsi.toFixed(0)} · OS`} tone="up" />;
  return <Badge label={`RSI ${rsi.toFixed(0)}`} />;
}

export function MarketPulseRow({ item }: { item: MarketPulseItem }) {
  const t = trendOf(item.change_1d_pct);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: item.symbol } })}
      accessibilityRole="button"
      accessibilityLabel={`${item.symbol}, ${formatINR(item.price)}, ${formatPct(item.change_1d_pct)} today`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <View style={styles.left}>
        <Text variant="body" weight="600">
          {item.symbol}
        </Text>
        {rsiBadge(item.rsi)}
      </View>
      <Sparkline data={item.sparkline} width={72} height={26} />
      <View style={styles.right}>
        <Text variant="body" weight="600" numeric>
          {formatINR(item.price)}
        </Text>
        <Text variant="caption" tone={t === 'up' ? 'up' : t === 'down' ? 'down' : 'muted'} numeric>
          {formatPct(item.change_1d_pct)} · 5D {formatPct(item.change_5d_pct, 1)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  left: { flex: 1, gap: 4 },
  right: { alignItems: 'flex-end', minWidth: 110 },
});
