import { router } from 'expo-router';
import { Bell, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useDashboard } from '@/api/queries';
import { Donut } from '@/components/charts/Donut';
import { Sparkline } from '@/components/charts/Sparkline';
import { MarketPulseRow } from '@/components/MarketPulseRow';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  StatGrid,
  StatTile,
  Text,
} from '@/components/ui';
import { formatINR, formatPct, formatSignedINR, timeAgo, trendOf } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const ASSET_LABELS: Record<string, string> = { stock: 'Stocks', etf: 'ETFs', crypto: 'Crypto', mutual_fund: 'Mutual funds' };

function riskTone(level: string) {
  if (level === 'Low') return 'up' as const;
  if (level === 'High') return 'down' as const;
  if (level === 'Moderate') return 'warning' as const;
  return 'default' as const;
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();

  if (isLoading) return <LoadingState message="Loading your dashboard…" />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const p = data.portfolio;
  const hasHoldings = p.holdings_count > 0;
  const value = p.total_current_value ?? p.total_invested;
  const pnlTrend = trendOf(p.total_pnl);
  const firstName = data.user.name?.split(' ')[0] ?? data.user.email.split('@')[0];

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <View style={styles.greeting}>
        <Text variant="heading">
          Hi, <Text variant="heading" tone="primary">{firstName}</Text>
        </Text>
        <Text variant="caption" tone="muted">
          Updated {timeAgo(data.generated_at)} · refreshes every minute
        </Text>
      </View>

      {/* Portfolio value */}
      <Card accent={hasHoldings ? undefined : colors.border}>
        <Text variant="label" tone="muted">
          Portfolio value
        </Text>
        {hasHoldings ? (
          <>
            <Text variant="display" numeric>
              {formatINR(value)}
            </Text>
            <View style={styles.row}>
              {pnlTrend === 'down' ? <TrendingDown color={colors.down} size={16} /> : <TrendingUp color={colors.up} size={16} />}
              <Text variant="small" tone={pnlTrend === 'down' ? 'down' : pnlTrend === 'up' ? 'up' : 'muted'} numeric>
                {p.total_pnl == null ? 'Live prices unavailable' : `${formatSignedINR(p.total_pnl)} (${formatPct(p.total_pnl_pct)})`}
              </Text>
            </View>
            <Text variant="caption" tone="muted" numeric>
              Invested {formatINR(p.total_invested)} · {p.holdings_count} holdings
            </Text>
            {data.portfolio_sparkline.length > 1 ? (
              <Sparkline data={data.portfolio_sparkline} height={44} />
            ) : null}
          </>
        ) : (
          <EmptyState
            title="No holdings yet"
            message="Add your first holding to see live P/L, allocation and risk."
            action={<Button title="Add holding" size="sm" onPress={() => router.push('/add-holding')} />}
          />
        )}
      </Card>

      <StatGrid>
        <StatTile
          label="Alerts"
          value={`${data.alerts.active} active`}
          hint={`${data.alerts.total_triggers} triggers total`}
        />
        <StatTile
          label="Risk level"
          value={data.risk_snapshot.overall}
          tone={riskTone(data.risk_snapshot.overall)}
          hint={
            data.risk_snapshot.concentration_hhi != null
              ? `HHI ${data.risk_snapshot.concentration_hhi.toFixed(2)} · ${data.risk_snapshot.flags} flags`
              : `${data.risk_snapshot.flags} flags`
          }
        />
      </StatGrid>

      {/* Market pulse */}
      <Card>
        <SectionHeader
          title="Market pulse"
          action={<Button title="All markets" variant="ghost" size="sm" onPress={() => router.push('/markets')} />}
        />
        {data.market_pulse.length === 0 ? (
          <Text variant="small" tone="muted">
            Market data is unavailable right now.
          </Text>
        ) : (
          data.market_pulse.map((m, i) => (
            <View key={m.symbol}>
              {i > 0 ? <Divider /> : null}
              <MarketPulseRow item={m} />
            </View>
          ))
        )}
      </Card>

      {hasHoldings && Object.keys(p.asset_allocation).length > 0 ? (
        <Card>
          <SectionHeader title="Allocation" />
          <Donut
            data={Object.entries(p.asset_allocation).map(([k, v]) => ({ label: ASSET_LABELS[k] ?? k, value: v }))}
            centerValue={String(p.holdings_count)}
            centerLabel="holdings"
          />
        </Card>
      ) : null}

      {hasHoldings && (p.top_gainers.length > 0 || p.top_losers.length > 0) ? (
        <Card>
          <SectionHeader title="Top movers" />
          {[...p.top_gainers, ...p.top_losers.filter((l) => !p.top_gainers.some((g) => g.symbol === l.symbol))].map((h) => (
            <View key={h.symbol} style={styles.moverRow}>
              <Text variant="body" weight="600" style={styles.flex}>
                {h.symbol}
              </Text>
              <Text variant="small" tone={trendOf(h.pnl_pct) === 'down' ? 'down' : 'up'} numeric>
                {formatSignedINR(h.pnl)} ({formatPct(h.pnl_pct)})
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card onPress={() => router.push('/alerts')} accessibilityLabel="Open alerts">
        <SectionHeader title="Recent alerts" icon={<Bell color={colors.warning} size={18} />} />
        {data.alerts.recent_triggers.length === 0 ? (
          <Text variant="small" tone="muted">
            No alerts have triggered yet.
          </Text>
        ) : (
          data.alerts.recent_triggers.map((t, i) => (
            <View key={`${t.symbol}-${t.triggered_at}-${i}`} style={styles.alertRow}>
              <Badge label={t.symbol} tone="warning" />
              <Text variant="small" style={styles.flex} numberOfLines={2}>
                {t.message}
              </Text>
              <Text variant="caption" tone="muted">
                {timeAgo(t.triggered_at)}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card onPress={() => router.push('/risk')} accessibilityLabel="Open risk analysis">
        <SectionHeader title="Risk analysis" icon={<ShieldAlert color={colors.info} size={18} />} />
        <Text variant="small" tone="muted">
          Volatility, beta, Sharpe, VaR, concentration and stress tests for your portfolio.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  moverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
