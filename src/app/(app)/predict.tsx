import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDown, ArrowRight, ArrowUp, Info } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePrediction } from '@/api/queries';
import type { Direction, ModelType } from '@/api/types';
import { SymbolSearch } from '@/components/SymbolSearch';
import {
  Button,
  Card,
  Disclaimer,
  ErrorState,
  LoadingState,
  ProgressBar,
  Screen,
  SectionHeader,
  Segmented,
  Text,
} from '@/components/ui';
import { formatINR, normaliseSymbol, timeAgo } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const MODELS: { value: ModelType; label: string }[] = [
  { value: 'xgboost', label: 'XGBoost' },
  { value: 'lstm', label: 'LSTM' },
];

export default function PredictScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const [symbol, setSymbol] = useState(normaliseSymbol(params.symbol ?? ''));
  const [model, setModel] = useState<ModelType>('xgboost');
  const [requested, setRequested] = useState(!!params.symbol);

  const prediction = usePrediction(symbol, model, requested);
  const p = prediction.data;

  const dir: Record<Direction, { color: string; soft: string; Icon: typeof ArrowUp }> = {
    UP: { color: colors.up, soft: colors.upSoft, Icon: ArrowUp },
    DOWN: { color: colors.down, soft: colors.downSoft, Icon: ArrowDown },
    SIDEWAYS: { color: colors.warning, soft: colors.warningSoft, Icon: ArrowRight },
  };

  return (
    <Screen>
      <Card>
        <View style={styles.row}>
          <Info color={colors.textMuted} size={16} />
          <Text variant="caption" tone="muted" style={styles.flex}>
            Models analyse RSI, EMA, MACD, price action and volume on daily candles to forecast the next 10 sessions. A
            new symbol is trained on its first request, which can take up to a minute.
          </Text>
        </View>
      </Card>

      <SymbolSearch
        initial={symbol}
        selected={symbol}
        onSubmit={(s) => {
          setSymbol(s);
          setRequested(true);
        }}
      />
      <Segmented options={MODELS} value={model} onChange={setModel} />
      <Button
        title="Get prediction"
        disabled={!symbol}
        loading={prediction.isFetching}
        onPress={() => (requested ? prediction.refetch() : setRequested(true))}
      />

      {prediction.isFetching && !p ? (
        <LoadingState message={`Running ${model === 'xgboost' ? 'XGBoost' : 'LSTM'} on ${symbol}… first run trains the model.`} />
      ) : prediction.error ? (
        <ErrorState error={prediction.error} onRetry={prediction.refetch} />
      ) : p ? (
        <>
          <Card accent={dir[p.prediction].color}>
            <View style={styles.between}>
              <View>
                <Text variant="title">{p.symbol}</Text>
                <Text variant="caption" tone="muted" numeric>
                  {formatINR(p.current_price)}
                </Text>
              </View>
              <View style={[styles.dirIcon, { backgroundColor: dir[p.prediction].soft }]}>
                {(() => {
                  const { Icon, color } = dir[p.prediction];
                  return <Icon color={color} size={22} />;
                })()}
              </View>
            </View>
            <View style={styles.row}>
              <Text variant="display" style={{ color: dir[p.prediction].color }}>
                {p.prediction}
              </Text>
              <Text variant="title" style={{ color: dir[p.prediction].color }} numeric>
                {p.expected_move}
              </Text>
            </View>
            <Text variant="caption" tone="muted">
              Expected move over the next 10 sessions
            </Text>
            <View style={styles.between}>
              <Text variant="small" tone="muted">
                Confidence
              </Text>
              <Text variant="small" weight="600" numeric>
                {p.confidence.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar value={p.confidence} color={dir[p.prediction].color} />
            <Text variant="caption" tone="muted">
              Model: {p.model_used.toUpperCase()} · {timeAgo(p.timestamp)}
            </Text>
          </Card>

          <Card>
            <SectionHeader title="Trading signals" />
            {p.signals.length === 0 ? (
              <Text variant="small" tone="muted">
                No signals triggered.
              </Text>
            ) : (
              p.signals.map((s) => <SignalRow key={s} signal={s} />)
            )}
          </Card>

          <Button
            title={`Debate ${p.symbol}: Bull vs Bear`}
            variant="secondary"
            onPress={() => router.push({ pathname: '/debate', params: { symbol: p.symbol } })}
          />
        </>
      ) : null}

      <Disclaimer />
    </Screen>
  );
}

function SignalRow({ signal }: { signal: string }) {
  const { colors } = useTheme();
  const lower = signal.toLowerCase();
  const color = /bullish|oversold|above/.test(lower)
    ? colors.up
    : /bearish|overbought|below/.test(lower)
      ? colors.down
      : colors.textMuted;
  return (
    <View style={[styles.signal, { borderLeftColor: color, backgroundColor: colors.muted }]}>
      <Text variant="small">{signal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dirIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  signal: { borderLeftWidth: 3, borderRadius: 6, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  flex: { flex: 1 },
});
