import { router } from 'expo-router';
import { AlertTriangle, Flame, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { useRiskAnalysis, useScenario } from '@/api/queries';
import {
  Badge,
  Button,
  Card,
  Chip,
  ChipRow,
  Disclaimer,
  Divider,
  EmptyState,
  ErrorState,
  errorText,
  LoadingState,
  Markdown,
  ProgressBar,
  Screen,
  SectionHeader,
  StatGrid,
  StatTile,
  Text,
} from '@/components/ui';
import { formatINR, formatPct, formatSignedINR } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const DROPS = [5, 10, 15, 20, 30, 50];

function levelTone(level: string) {
  const l = level.toLowerCase();
  if (l.includes('low')) return 'up' as const;
  if (l.includes('very') || l.includes('high')) return 'down' as const;
  return 'warning' as const;
}

export default function RiskScreen() {
  const { colors } = useTheme();
  const risk = useRiskAnalysis();
  const scenario = useScenario();
  const [drop, setDrop] = useState(10);

  if (risk.isLoading) return <LoadingState message="Analysing portfolio risk… this includes an AI narrative." />;
  if (risk.error) {
    // Backend returns 200 + { error } when there are no holdings.
    if (risk.error instanceof ApiError && risk.error.status === 200) {
      return (
        <EmptyState
          title="No holdings to analyse"
          message={risk.error.message}
          action={<Button title="Add holding" size="sm" onPress={() => router.push('/add-holding')} />}
        />
      );
    }
    return <ErrorState error={risk.error} onRetry={risk.refetch} />;
  }
  const r = risk.data!;
  const levelColor = { up: colors.up, down: colors.down, warning: colors.warning }[levelTone(r.overall_risk_level)];

  return (
    <Screen refreshing={risk.isRefetching} onRefresh={risk.refetch}>
      <Card accent={levelColor}>
        <View style={styles.between}>
          <View>
            <Text variant="label" tone="muted">
              Overall risk
            </Text>
            <Text variant="heading" style={{ color: levelColor }}>
              {r.overall_risk_level}
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            {r.holdings_count} holdings · {r.sectors_count} sectors
          </Text>
        </View>
        {r.risk_flags.map((f) => (
          <View key={f} style={styles.flag}>
            <AlertTriangle color={colors.warning} size={14} />
            <Text variant="small" style={styles.flex}>
              {f}
            </Text>
          </View>
        ))}
      </Card>

      <StatGrid>
        <StatTile label="Volatility" value={`${r.portfolio_volatility.toFixed(1)}%`} hint="Annualised" />
        <StatTile label="Beta" value={r.portfolio_beta.toFixed(2)} hint="vs market" />
        <StatTile
          label="Sharpe"
          value={r.portfolio_sharpe.toFixed(2)}
          hint="Risk-adjusted return"
          tone={r.portfolio_sharpe >= 1 ? 'up' : r.portfolio_sharpe < 0 ? 'down' : 'default'}
        />
        <StatTile label="VaR 95%" value={`${r.portfolio_var_95.toFixed(2)}%`} hint="Daily worst case" />
        <StatTile
          label="HHI"
          value={r.hhi_concentration.toFixed(3)}
          hint={r.hhi_concentration > 0.25 ? 'Concentrated' : 'Concentration'}
          tone={r.hhi_concentration > 0.25 ? 'warning' : 'default'}
        />
        <StatTile label="Diversification" value={`${r.diversification_score.toFixed(0)}%`} hint="Score" />
      </StatGrid>

      <Card>
        <SectionHeader title="Sector concentration" />
        {Object.entries(r.sector_weights)
          .sort((a, b) => b[1] - a[1])
          .map(([sector, w]) => (
            <View key={sector} style={styles.sector}>
              <View style={styles.between}>
                <Text variant="small">{sector}</Text>
                <Text variant="small" tone="muted" numeric>
                  {w.toFixed(1)}%
                </Text>
              </View>
              <ProgressBar value={w} color={w > 25 ? colors.warning : colors.primary} />
            </View>
          ))}
        <Text variant="caption" tone="muted">
          Above 25% in one sector is flagged as concentration risk.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Per holding" />
        {r.holdings.map((h, i) => (
          <View key={h.symbol}>
            {i > 0 ? <Divider /> : null}
            <View style={styles.holding}>
              <View style={styles.flex}>
                <View style={styles.row}>
                  <Text variant="body" weight="600">
                    {h.symbol}
                  </Text>
                  <Badge label={h.risk_level} tone={levelTone(h.risk_level)} />
                </View>
                <Text variant="caption" tone="muted" numeric>
                  {h.sector} · {h.weight_pct.toFixed(1)}% · β {h.beta.toFixed(2)} · DD {h.max_drawdown.toFixed(1)}%
                  {h.rsi != null ? ` · RSI ${h.rsi.toFixed(0)}` : ''}
                </Text>
              </View>
              <Text variant="small" numeric>
                {h.volatility.toFixed(1)}% vol
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Stress test" icon={<Flame color={colors.down} size={18} />} />
        <Text variant="small" tone="muted">
          What if the market drops? Each holding falls by its beta × the drop.
        </Text>
        <ChipRow>
          {DROPS.map((d) => (
            <Chip key={d} label={`-${d}%`} selected={d === drop} onPress={() => setDrop(d)} />
          ))}
        </ChipRow>
        <Button title={`Run -${drop}% scenario`} variant="secondary" loading={scenario.isPending} onPress={() => scenario.mutate(drop)} />
        {scenario.error ? (
          <Text variant="small" tone="down">
            {errorText(scenario.error)}
          </Text>
        ) : null}
        {scenario.data ? (
          <>
            <StatGrid>
              <StatTile label="Current" value={formatINR(scenario.data.current_value, 0)} />
              <StatTile label="Stressed" value={formatINR(scenario.data.stressed_value, 0)} tone="down" />
            </StatGrid>
            <Text variant="body" tone="down" numeric>
              Impact {formatSignedINR(scenario.data.portfolio_impact)} ({formatPct(scenario.data.impact_pct)})
            </Text>
            {scenario.data.holdings.map((h) => (
              <View key={h.symbol} style={styles.between}>
                <Text variant="small">
                  {h.symbol} <Text variant="caption" tone="muted">β {h.beta.toFixed(2)}</Text>
                </Text>
                <Text variant="small" tone="down" numeric>
                  -{h.expected_drop.toFixed(1)}% → {formatINR(h.stressed_price)}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </Card>

      {r.ai_summary ? (
        <Card>
          <SectionHeader title="AI risk assessment" icon={<Sparkles color={colors.primary} size={18} />} />
          <Markdown>{r.ai_summary}</Markdown>
        </Card>
      ) : null}

      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flag: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sector: { gap: 4 },
  holding: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  flex: { flex: 1, gap: 2 },
});
