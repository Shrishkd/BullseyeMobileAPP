import { router } from 'expo-router';
import { View } from 'react-native';

import { useDashboard } from '@/api/queries';
import { MarketPulseRow } from '@/components/MarketPulseRow';
import { SymbolSearch } from '@/components/SymbolSearch';
import { Card, Divider, ErrorState, LoadingState, Screen, SectionHeader, Text } from '@/components/ui';

export default function MarketsScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <SymbolSearch onSubmit={(symbol) => router.push({ pathname: '/stock/[symbol]', params: { symbol } })} />

      <Card>
        <SectionHeader title="Market pulse" />
        <Text variant="caption" tone="muted">
          Daily closes for key NSE stocks and your holdings. Tap a row for the live chart.
        </Text>
        {isLoading ? (
          <LoadingState />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.market_pulse.length === 0 ? (
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
    </Screen>
  );
}
