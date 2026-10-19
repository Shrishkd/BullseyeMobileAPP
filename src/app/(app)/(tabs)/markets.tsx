import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDashboard } from '@/api/queries';
import { MarketPulseRow } from '@/components/MarketPulseRow';
import { SymbolSearch } from '@/components/SymbolSearch';
import { Card, Divider, ErrorState, LoadingState, Screen, SectionHeader, Text } from '@/components/ui';
import { useWatchlistStore } from '@/stores/watchlist';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function MarketsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();
  const watchlist = useWatchlistStore((s) => s.symbols);

  const pulseMap = new Map((data?.market_pulse ?? []).map((m) => [m.symbol, m]));

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <SymbolSearch onSubmit={(symbol) => router.push({ pathname: '/stock/[symbol]', params: { symbol } })} />

      {/* Watchlist Section */}
      <Card>
        <SectionHeader
          title={`Watchlist (${watchlist.length})`}
          icon={<Star color={colors.warning} fill={colors.warning} size={18} />}
        />
        {watchlist.length === 0 ? (
          <Text variant="small" tone="muted">
            Star symbols on any stock screen to pin them here for quick access.
          </Text>
        ) : (
          watchlist.map((sym, i) => {
            const item = pulseMap.get(sym);
            return (
              <View key={sym}>
                {i > 0 ? <Divider /> : null}
                {item ? (
                  <MarketPulseRow item={item} />
                ) : (
                  <Pressable
                    onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: sym } })}
                    accessibilityRole="button"
                    accessibilityLabel={sym}
                    style={({ pressed }) => [styles.simpleRow, pressed && { opacity: 0.6 }]}>
                    <Text variant="body" weight="600">
                      {sym}
                    </Text>
                    <Text variant="caption" tone="muted">
                      Tap to view chart →
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </Card>

      {/* Full Market Pulse */}
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

const styles = StyleSheet.create({
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
});
