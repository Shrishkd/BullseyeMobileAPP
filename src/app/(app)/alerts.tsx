import { useLocalSearchParams } from 'expo-router';
import { Trash2, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Alert as RNAlert, Pressable, StyleSheet, Switch, View } from 'react-native';

import {
  useAlerts,
  useCheckAlerts,
  useCreateAlert,
  useDeleteAlert,
  useTriggeredAlerts,
  useUpdateAlert,
} from '@/api/queries';
import type { Alert, AlertType } from '@/api/types';
import {
  Badge,
  Button,
  Card,
  Chip,
  ChipRow,
  Divider,
  EmptyState,
  ErrorState,
  errorText,
  Input,
  LoadingState,
  Screen,
  SectionHeader,
  Segmented,
  Text,
} from '@/components/ui';
import { formatNumber, normaliseSymbol, timeAgo } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const TYPES: { value: AlertType; label: string; hint: string; unit: string; placeholder: string }[] = [
  { value: 'price_above', label: 'Price above', hint: 'Triggers when LTP rises to the level', unit: '₹', placeholder: '2500' },
  { value: 'price_below', label: 'Price below', hint: 'Triggers when LTP falls to the level', unit: '₹', placeholder: '2200' },
  { value: 'rsi_overbought', label: 'RSI overbought', hint: 'RSI(14) at or above threshold', unit: 'RSI', placeholder: '70' },
  { value: 'rsi_oversold', label: 'RSI oversold', hint: 'RSI(14) at or below threshold', unit: 'RSI', placeholder: '30' },
  { value: 'volume_spike', label: 'Volume spike', hint: 'Volume ≥ threshold × 20-day average', unit: '×', placeholder: '2' },
];

const typeMeta = (t: string) => TYPES.find((x) => x.value === t);

export default function AlertsScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const [tab, setTab] = useState<'alerts' | 'history'>('alerts');
  const [formOpen, setFormOpen] = useState(!!params.symbol);

  const alerts = useAlerts();
  const triggered = useTriggeredAlerts();
  const check = useCheckAlerts();

  const runCheck = () =>
    check.mutate(undefined, {
      onSuccess: (r) =>
        RNAlert.alert(
          r.triggered > 0 ? `${r.triggered} alert${r.triggered > 1 ? 's' : ''} triggered` : 'No alerts triggered',
          r.results.map((x) => `• ${x.message}`).join('\n') || `Checked ${r.checked} active alerts.`,
        ),
      onError: (e) => RNAlert.alert('Check failed', errorText(e)),
    });

  const refresh = () => {
    void alerts.refetch();
    void triggered.refetch();
  };

  return (
    <Screen keyboard refreshing={alerts.isRefetching} onRefresh={refresh}>
      <View style={styles.row}>
        <Button
          title="Check now"
          variant="secondary"
          icon={<Zap color={colors.warning} size={16} />}
          loading={check.isPending}
          onPress={runCheck}
          style={styles.flex}
        />
        <Button title={formOpen ? 'Close' : 'New alert'} onPress={() => setFormOpen((o) => !o)} style={styles.flex} />
      </View>
      <Text variant="caption" tone="muted">
        Alerts are evaluated when you tap Check now. Push notifications for triggered alerts are on the roadmap.
      </Text>

      {formOpen ? <CreateAlertForm initialSymbol={params.symbol} onCreated={() => setFormOpen(false)} /> : null}

      <Segmented
        options={[
          { value: 'alerts', label: `My alerts${alerts.data ? ` (${alerts.data.length})` : ''}` },
          { value: 'history', label: `History${triggered.data ? ` (${triggered.data.length})` : ''}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'alerts' ? (
        alerts.isLoading ? (
          <LoadingState />
        ) : alerts.error ? (
          <ErrorState error={alerts.error} onRetry={alerts.refetch} />
        ) : !alerts.data?.length ? (
          <EmptyState title="No alerts yet" message="Create a price, RSI or volume alert to monitor a stock." />
        ) : (
          <Card>
            {alerts.data.map((a, i) => (
              <View key={a.id}>
                {i > 0 ? <Divider /> : null}
                <AlertRow alert={a} />
              </View>
            ))}
          </Card>
        )
      ) : triggered.isLoading ? (
        <LoadingState />
      ) : triggered.error ? (
        <ErrorState error={triggered.error} onRetry={triggered.refetch} />
      ) : !triggered.data?.length ? (
        <EmptyState title="Nothing has triggered yet" />
      ) : (
        <Card>
          {triggered.data.map((t, i) => (
            <View key={t.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.history}>
                <View style={styles.row}>
                  <Badge label={t.symbol} tone="warning" />
                  <Text variant="caption" tone="muted">
                    {timeAgo(t.triggered_at)}
                  </Text>
                </View>
                <Text variant="small">{t.message}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function AlertRow({ alert: a }: { alert: Alert }) {
  const { colors } = useTheme();
  const update = useUpdateAlert();
  const remove = useDeleteAlert();
  const meta = typeMeta(a.alert_type);

  const confirmDelete = () =>
    RNAlert.alert('Delete alert', `Delete the ${meta?.label ?? a.alert_type} alert on ${a.symbol}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(a.id) },
    ]);

  return (
    <View style={styles.alertRow}>
      <View style={styles.flex}>
        <View style={styles.row}>
          <Text variant="body" weight="600">
            {a.symbol}
          </Text>
          <Badge label={meta?.label ?? a.alert_type} tone="info" />
        </View>
        <Text variant="caption" tone="muted" numeric>
          {meta?.unit === '₹' ? `₹${formatNumber(a.threshold)}` : `${meta?.unit ?? ''} ${a.threshold}`} · triggered{' '}
          {a.triggered_count}×{a.last_triggered ? ` · last ${timeAgo(a.last_triggered)}` : ''}
        </Text>
        {a.note ? (
          <Text variant="caption" tone="muted">
            {a.note}
          </Text>
        ) : null}
      </View>
      <Switch
        value={a.is_active}
        onValueChange={(v) => update.mutate({ id: a.id, data: { is_active: v } })}
        trackColor={{ true: colors.primary, false: colors.muted }}
        accessibilityLabel={`${a.symbol} alert active`}
      />
      <Pressable onPress={confirmDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${a.symbol} alert`}>
        <Trash2 color={colors.textMuted} size={18} />
      </Pressable>
    </View>
  );
}

function CreateAlertForm({ initialSymbol, onCreated }: { initialSymbol?: string; onCreated: () => void }) {
  const create = useCreateAlert();
  const [type, setType] = useState<AlertType>('price_above');
  const [symbol, setSymbol] = useState(initialSymbol ?? '');
  const [threshold, setThreshold] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const meta = typeMeta(type)!;

  const submit = () => {
    const sym = normaliseSymbol(symbol);
    const thr = Number(threshold.replace(',', '.'));
    if (!sym) return setError('Enter a symbol.');
    if (!Number.isFinite(thr) || thr <= 0) return setError('Enter a positive threshold.');
    if (type.startsWith('rsi') && thr > 100) return setError('RSI thresholds are between 0 and 100.');
    setError(null);
    create.mutate(
      { symbol: sym, alert_type: type, threshold: thr, note: note.trim() || undefined },
      { onSuccess: onCreated, onError: (e) => setError(errorText(e)) },
    );
  };

  return (
    <Card>
      <SectionHeader title="Create alert" />
      <ChipRow>
        {TYPES.map((t) => (
          <Chip key={t.value} label={t.label} selected={t.value === type} onPress={() => setType(t.value)} />
        ))}
      </ChipRow>
      <Text variant="caption" tone="muted">
        {meta.hint}
      </Text>
      <Input label="Symbol" value={symbol} onChangeText={setSymbol} autoCapitalize="characters" autoCorrect={false} placeholder="RELIANCE" />
      <Input
        label={`Threshold (${meta.unit})`}
        value={threshold}
        onChangeText={setThreshold}
        keyboardType="decimal-pad"
        placeholder={meta.placeholder}
      />
      <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="Reason for alert…" />
      {error ? (
        <Text variant="small" tone="down">
          {error}
        </Text>
      ) : null}
      <Button title="Create alert" loading={create.isPending} onPress={submit} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  history: { gap: 4, paddingVertical: spacing.sm },
  flex: { flex: 1, gap: 2 },
});
