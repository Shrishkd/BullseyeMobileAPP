import * as DocumentPicker from 'expo-document-picker';
import { router, useNavigation } from 'expo-router';
import { FileUp, Plus, ShieldAlert, Sparkles, Trash2 } from 'lucide-react-native';
import { useLayoutEffect } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  useDeleteHolding,
  useHoldings,
  useImportHoldings,
  usePortfolioInsights,
  usePortfolioSummary,
} from '@/api/queries';
import type { HoldingWithStats } from '@/api/types';
import {
  Badge,
  Button,
  Card,
  Disclaimer,
  Divider,
  EmptyState,
  ErrorState,
  errorText,
  LoadingState,
  Markdown,
  Screen,
  SectionHeader,
  StatGrid,
  StatTile,
  Text,
} from '@/components/ui';
import { formatINR, formatNumber, formatPct, formatSignedINR, trendOf } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const IMPORT_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const holdings = useHoldings();
  const summary = usePortfolioSummary();
  const remove = useDeleteHolding();
  const importer = useImportHoldings();
  const insights = usePortfolioInsights();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/add-holding')}
          accessibilityRole="button"
          accessibilityLabel="Add holding"
          hitSlop={12}
          style={styles.headerBtn}>
          <Plus color={colors.primary} size={24} />
        </Pressable>
      ),
    });
  }, [navigation, colors.primary]);

  const refresh = () => {
    void holdings.refetch();
    void summary.refetch();
  };

  const confirmDelete = (h: HoldingWithStats) =>
    Alert.alert('Remove holding', `Remove ${h.symbol} (${formatNumber(h.quantity, 0)} units) from your portfolio?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(h.id) },
    ]);

  const pickAndImport = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: IMPORT_TYPES, copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    importer.mutate(res.assets[0].uri, {
      onSuccess: (r) => {
        const errs = r.errors
          .slice(0, 5)
          .map((e) => `Row ${e.row}${e.symbol ? ` (${e.symbol})` : ''}: ${e.error}`)
          .join('\n');
        Alert.alert('Import complete', `Imported ${r.imported}, failed ${r.failed}.${errs ? `\n\n${errs}` : ''}`);
      },
      onError: (e) => Alert.alert('Import failed', errorText(e)),
    });
  };

  if (holdings.isLoading) return <LoadingState message="Loading holdings…" />;
  if (holdings.error) return <ErrorState error={holdings.error} onRetry={refresh} />;

  const list = holdings.data ?? [];
  const s = summary.data;
  const pnlTrend = trendOf(s?.total_pnl);

  return (
    <Screen refreshing={holdings.isRefetching} onRefresh={refresh}>
      {s ? (
        <StatGrid>
          <StatTile label="Invested" value={formatINR(s.total_invested, 0)} />
          <StatTile label="Current" value={formatINR(s.total_current_value, 0)} />
          <StatTile
            label="Total P/L"
            value={formatSignedINR(s.total_pnl)}
            hint={formatPct(s.total_pnl_pct)}
            tone={pnlTrend === 'down' ? 'down' : pnlTrend === 'up' ? 'up' : 'default'}
          />
          <StatTile label="Holdings" value={String(s.holdings_count)} />
        </StatGrid>
      ) : null}

      <Card>
        <SectionHeader title="Holdings" action={<Badge label={`${list.length} positions`} />} />
        {list.length === 0 ? (
          <EmptyState
            title="Your portfolio is empty"
            message="Add a holding manually or import a CSV / Excel file with symbol, quantity, buy_price and buy_date columns."
            action={<Button title="Add holding" size="sm" onPress={() => router.push('/add-holding')} />}
          />
        ) : (
          list.map((h, i) => (
            <View key={h.id}>
              {i > 0 ? <Divider /> : null}
              <HoldingRow holding={h} onDelete={() => confirmDelete(h)} />
            </View>
          ))
        )}
        <Text variant="caption" tone="muted">
          Tap a holding for its chart. Long-press to remove.
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Import" icon={<FileUp color={colors.info} size={18} />} />
        <Text variant="small" tone="muted">
          Upload a .csv, .xlsx or .xls file. Duplicate symbols within the file are skipped.
        </Text>
        <Button title="Choose file" variant="secondary" loading={importer.isPending} onPress={pickAndImport} />
      </Card>

      <Card>
        <SectionHeader title="AI portfolio insights" icon={<Sparkles color={colors.primary} size={18} />} />
        {insights.data ? <Markdown>{insights.data.insights}</Markdown> : null}
        {insights.error ? (
          <Text variant="small" tone="down">
            {errorText(insights.error)}
          </Text>
        ) : null}
        <Button
          title={insights.data ? 'Refresh insights' : 'Analyse my portfolio'}
          variant="secondary"
          loading={insights.isPending}
          disabled={list.length === 0}
          onPress={() => insights.mutate()}
        />
        <Disclaimer />
      </Card>

      <Button
        title="Open risk analysis"
        variant="secondary"
        icon={<ShieldAlert color={colors.text} size={16} />}
        onPress={() => router.push('/risk')}
      />
    </Screen>
  );
}

function HoldingRow({ holding: h, onDelete }: { holding: HoldingWithStats; onDelete: () => void }) {
  const { colors } = useTheme();
  const t = trendOf(h.pnl);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/stock/[symbol]', params: { symbol: h.symbol } })}
      onLongPress={onDelete}
      accessibilityRole="button"
      accessibilityLabel={`${h.symbol}, ${formatNumber(h.quantity, 0)} units, P/L ${formatSignedINR(h.pnl)}`}
      accessibilityActions={[{ name: 'delete', label: 'Remove holding' }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && onDelete()}
      style={({ pressed }) => [styles.holding, pressed && { opacity: 0.6 }]}>
      <View style={styles.flex}>
        <View style={styles.row}>
          <Text variant="body" weight="600">
            {h.symbol}
          </Text>
          <Badge label={h.asset_type} />
        </View>
        <Text variant="caption" tone="muted" numeric>
          {formatNumber(h.quantity, h.quantity % 1 === 0 ? 0 : 2)} × {formatINR(h.buy_price)}
          {h.allocation_pct != null ? ` · ${h.allocation_pct.toFixed(1)}%` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text variant="body" numeric>
          {formatINR(h.current_value ?? h.invested_value)}
        </Text>
        <Text variant="caption" tone={t === 'down' ? 'down' : t === 'up' ? 'up' : 'muted'} numeric>
          {h.pnl == null ? 'No live price' : `${formatSignedINR(h.pnl)} (${formatPct(h.pnl_pct)})`}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel={`Remove ${h.symbol}`} style={styles.trash}>
        <Trash2 color={colors.textMuted} size={16} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBtn: { paddingHorizontal: spacing.lg },
  holding: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  right: { alignItems: 'flex-end' },
  trash: { padding: 4 },
  flex: { flex: 1, gap: 2 },
});
