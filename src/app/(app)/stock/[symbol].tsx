import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BellPlus, Brain, Plus, Swords, Wand2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCandles, useExplainIndicators } from '@/api/queries';
import type { Resolution } from '@/api/types';
import { CandleChart } from '@/components/charts/CandleChart';
import { LiveBadge } from '@/components/LiveBadge';
import {
  Button,
  Card,
  Disclaimer,
  ErrorState,
  LoadingState,
  Markdown,
  Screen,
  SectionHeader,
  Segmented,
  StatGrid,
  StatTile,
  Text,
} from '@/components/ui';
import { RESOLUTIONS } from '@/config/market';
import { useLivePrice } from '@/hooks/useLivePrice';
import { formatINR, formatNumber, formatPct, normaliseSymbol, trendOf } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function StockScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ symbol: string }>();
  const symbol = normaliseSymbol(params.symbol ?? '');
  const [resolution, setResolution] = useState<Resolution>('D');

  const live = useLivePrice(symbol);
  const candles = useCandles(symbol, resolution);
  const explain = useExplainIndicators();

  const list = candles.data ?? [];
  const last = list[list.length - 1];
  const prev = list[list.length - 2];
  const price = live.price ?? last?.close ?? null;
  const change = resolution === 'D' && prev && price != null ? ((price - prev.close) / prev.close) * 100 : null;
  const t = trendOf(change);

  const onExplain = () => {
    if (!last || price == null) return;
    explain.mutate({
      symbol,
      price,
      rsi: last.rsi ?? undefined,
      sma: last.sma ?? undefined,
      ema: last.ema ?? undefined,
    });
  };

  return (
    <Screen refreshing={candles.isRefetching} onRefresh={candles.refetch}>
      <Stack.Screen options={{ title: symbol }} />

      <View style={styles.priceBlock}>
        <Text variant="display" numeric accessibilityLabel={`${symbol} price ${formatINR(price)}`}>
          {formatINR(price)}
        </Text>
        <View style={styles.row}>
          {change != null ? (
            <Text variant="small" tone={t === 'down' ? 'down' : t === 'up' ? 'up' : 'muted'} numeric>
              {formatPct(change)} today
            </Text>
          ) : null}
          <LiveBadge status={live.status} />
        </View>
      </View>

      <Segmented
        options={RESOLUTIONS.map((r) => ({ value: r.value as Resolution, label: r.label }))}
        value={resolution}
        onChange={setResolution}
      />

      <Card>
        {candles.isLoading ? (
          <LoadingState message="Loading candles…" />
        ) : candles.error ? (
          <ErrorState error={candles.error} onRetry={candles.refetch} />
        ) : list.length === 0 ? (
          <Text variant="small" tone="muted">
            No candle data for this timeframe. Intraday candles need a paid Upstox plan; try 1D.
          </Text>
        ) : (
          <CandleChart candles={list} livePrice={live.price} daily={resolution === 'D'} />
        )}
        <View style={styles.legend}>
          <View style={[styles.swatch, { backgroundColor: colors.warning }]} />
          <Text variant="caption" tone="muted">
            EMA(14)
          </Text>
          <View style={[styles.swatch, { backgroundColor: colors.info }]} />
          <Text variant="caption" tone="muted">
            RSI(14)
          </Text>
        </View>
      </Card>

      {last ? (
        <StatGrid>
          <StatTile label="RSI (14)" value={last.rsi != null ? last.rsi.toFixed(1) : '—'} hint={rsiHint(last.rsi)} />
          <StatTile
            label="MACD"
            value={last.macd != null ? formatNumber(last.macd) : '—'}
            hint={
              last.macd != null && last.macd_signal != null
                ? last.macd > last.macd_signal
                  ? 'Above signal (bullish)'
                  : 'Below signal (bearish)'
                : undefined
            }
          />
          <StatTile label="SMA (14)" value={formatINR(last.sma)} />
          <StatTile label="EMA (14)" value={formatINR(last.ema)} />
        </StatGrid>
      ) : null}

      <Card>
        <SectionHeader title="AI explanation" icon={<Wand2 color={colors.primary} size={18} />} />
        {explain.data ? (
          <Markdown>{explain.data.explanation}</Markdown>
        ) : (
          <Text variant="small" tone="muted">
            Get a plain-English read of the latest RSI, SMA and EMA values.
          </Text>
        )}
        {explain.error ? (
          <Text variant="small" tone="down">
            {explain.error.message}
          </Text>
        ) : null}
        <Button
          title={explain.data ? 'Explain again' : 'Explain indicators'}
          variant="secondary"
          loading={explain.isPending}
          disabled={!last}
          onPress={onExplain}
        />
      </Card>

      <View style={styles.actions}>
        <Button
          title="Predict"
          variant="secondary"
          icon={<Brain color={colors.text} size={16} />}
          style={styles.action}
          onPress={() => router.push({ pathname: '/predict', params: { symbol } })}
        />
        <Button
          title="Debate"
          variant="secondary"
          icon={<Swords color={colors.text} size={16} />}
          style={styles.action}
          onPress={() => router.push({ pathname: '/debate', params: { symbol } })}
        />
        <Button
          title="Alert"
          variant="secondary"
          icon={<BellPlus color={colors.text} size={16} />}
          style={styles.action}
          onPress={() => router.push({ pathname: '/alerts', params: { symbol } })}
        />
        <Button
          title="Add"
          variant="secondary"
          icon={<Plus color={colors.text} size={16} />}
          style={styles.action}
          onPress={() =>
            router.push({ pathname: '/add-holding', params: { symbol, price: price != null ? String(price) : '' } })
          }
        />
      </View>

      <Disclaimer />
    </Screen>
  );
}

function rsiHint(rsi: number | null) {
  if (rsi == null) return undefined;
  if (rsi >= 70) return 'Overbought';
  if (rsi <= 30) return 'Oversold';
  return 'Neutral';
}

const styles = StyleSheet.create({
  priceBlock: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 12, height: 3, borderRadius: 2, marginLeft: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, flexBasis: '45%' },
});
