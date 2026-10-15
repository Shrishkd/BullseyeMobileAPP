import { useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ChevronDown, ChevronUp, Gavel, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { DebateClaim, DebateComponent, DebateStage, Verdict } from '@/api/types';
import { SymbolSearch } from '@/components/SymbolSearch';
import { Badge, Button, Card, Disclaimer, Divider, ErrorState, ProgressBar, Screen, SectionHeader, Text } from '@/components/ui';
import { useDebate } from '@/hooks/useDebate';
import type { SideState } from '@/lib/debateReducer';
import { formatINR, normaliseSymbol } from '@/lib/format';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const STAGES: { key: DebateStage; label: string }[] = [
  { key: 'evidence', label: 'Evidence' },
  { key: 'openings', label: 'Openings' },
  { key: 'rebuttals', label: 'Rebuttals' },
  { key: 'verdict', label: 'Verdict' },
];

export default function DebateScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const [symbol, setSymbol] = useState(normaliseSymbol(params.symbol ?? ''));
  const { state, start } = useDebate();
  const started = useRef(false);

  // Auto-start when opened from a stock / prediction screen.
  useEffect(() => {
    if (params.symbol && !started.current) {
      started.current = true;
      void start(normaliseSymbol(params.symbol));
    }
  }, [params.symbol, start]);

  const running = state.phase === 'running';
  const stageIdx = state.stage ? STAGES.findIndex((s) => s.key === state.stage) : -1;

  return (
    <Screen>
      <SymbolSearch initial={symbol} selected={symbol} onSubmit={setSymbol} />
      <View style={styles.actions}>
        <Button
          title={running ? 'Debating…' : `Start debate${symbol ? ` on ${symbol}` : ''}`}
          disabled={!symbol || running}
          loading={running}
          style={styles.flex}
          onPress={() => start(symbol)}
        />
        {state.phase === 'done' && state.cached ? (
          <Button
            title="Re-run"
            variant="secondary"
            icon={<RefreshCw color={colors.text} size={16} />}
            onPress={() => start(symbol, true)}
          />
        ) : null}
      </View>

      {state.phase !== 'idle' ? (
        <View style={styles.stepper} accessibilityLabel={`Stage: ${state.stage ?? 'starting'}`}>
          {STAGES.map((s, i) => {
            const done = state.phase === 'done' || i < stageIdx;
            const active = running && i === stageIdx;
            return (
              <View key={s.key} style={styles.step}>
                <View
                  style={[
                    styles.stepBar,
                    { backgroundColor: done ? colors.primary : active ? colors.warning : colors.muted },
                  ]}
                />
                <Text variant="caption" tone={done || active ? 'default' : 'muted'}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text variant="small" tone="muted">
          A Bull agent and a Bear agent argue over the stock using only Bullseye&apos;s own data (model, technicals,
          risk, news, your position), then rebut each other. The verdict comes from a fixed formula; the Moderator only
          explains it.
        </Text>
      )}

      {running && state.statusMessage ? (
        <View style={styles.row}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text variant="small" tone="muted">
            {state.statusMessage}
          </Text>
        </View>
      ) : null}

      {state.phase === 'failed' ? <ErrorState error={new Error(state.fatal ?? 'Debate failed')} onRetry={() => start(symbol)} /> : null}

      {state.verdict ? <VerdictCard verdict={state.verdict} /> : null}

      {state.evidence.length > 0 ? <EvidenceCard state={state} /> : null}

      <SideCard side="bull" data={state.bull} />
      <SideCard side="bear" data={state.bear} />

      {state.verdict?.moderator ? (
        <Card>
          <SectionHeader title="Moderator" icon={<Gavel color={colors.info} size={18} />} />
          <Text variant="body">{state.verdict.moderator.summary}</Text>
          <Badge
            label={`Stronger side: ${state.verdict.moderator.stronger_side}`}
            tone={
              state.verdict.moderator.stronger_side === 'bull'
                ? 'up'
                : state.verdict.moderator.stronger_side === 'bear'
                  ? 'down'
                  : 'neutral'
            }
          />
          <Text variant="small" tone="muted">
            {state.verdict.moderator.stronger_side_reason}
          </Text>
          {state.verdict.moderator.key_risks.length > 0 ? (
            <>
              <Divider />
              <Text variant="label" tone="muted">
                Key risks
              </Text>
              {state.verdict.moderator.key_risks.map((r, i) => (
                <ClaimRow key={i} claim={{ ...r, claim: r.risk }} />
              ))}
            </>
          ) : null}
        </Card>
      ) : null}

      {state.errors.map((e, i) => (
        <View key={i} style={[styles.row, styles.errorRow, { backgroundColor: colors.warningSoft }]}>
          <AlertTriangle color={colors.warning} size={16} />
          <Text variant="small" style={styles.flex}>
            {e.side ? `${e.side} ` : ''}
            {e.stage}: {e.message}
          </Text>
        </View>
      ))}

      {state.phase === 'done' && state.cached ? (
        <Text variant="caption" tone="muted" align="center">
          Showing today&apos;s cached debate. Re-run to regenerate.
        </Text>
      ) : null}

      <Disclaimer />
    </Screen>
  );
}

function VerdictCard({
  verdict,
}: {
  verdict: { verdict: Verdict; confidence: number; composite: number; thresholds: { buy: number; sell: number }; components: DebateComponent[] };
}) {
  const { colors } = useTheme();
  const color = { BUY: colors.up, HOLD: colors.warning, SELL: colors.down }[verdict.verdict];
  return (
    <Card accent={color}>
      <View style={styles.between}>
        <View>
          <Text variant="label" tone="muted">
            Verdict
          </Text>
          <Text variant="display" style={{ color }}>
            {verdict.verdict}
          </Text>
        </View>
        <View style={styles.right}>
          <Text variant="label" tone="muted">
            Confidence
          </Text>
          <Text variant="heading" numeric>
            {Math.round(verdict.confidence)}%
          </Text>
        </View>
      </View>
      <ProgressBar value={verdict.confidence} color={color} />
      <Text variant="caption" tone="muted" numeric>
        Composite {verdict.composite >= 0 ? '+' : ''}
        {verdict.composite.toFixed(3)} · BUY above +{verdict.thresholds.buy} · SELL below {verdict.thresholds.sell}
      </Text>
      <Divider />
      {verdict.components.map((c) => (
        <ComponentRow key={c.name} c={c} />
      ))}
    </Card>
  );
}

function ComponentRow({ c }: { c: DebateComponent }) {
  const { colors } = useTheme();
  const positive = c.contribution >= 0;
  const width = Math.min(Math.abs(c.contribution) / 0.45, 1) * 50; // Max weight 0.45 → half the bar.
  return (
    <View style={styles.component}>
      <View style={styles.between}>
        <Text variant="small" weight="600" style={styles.capital}>
          {c.name} <Text variant="caption" tone="muted">×{c.weight}</Text>
        </Text>
        <Text variant="small" tone={positive ? 'up' : 'down'} numeric>
          {positive ? '+' : ''}
          {c.contribution.toFixed(3)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View style={[styles.centerLine, { backgroundColor: colors.border }]} />
        <View
          style={[
            styles.barFill,
            { width: `${width}%`, backgroundColor: positive ? colors.up : colors.down },
            positive ? { left: '50%' } : { right: '50%' },
          ]}
        />
      </View>
      <Text variant="caption" tone="muted">
        {c.explanation}
      </Text>
    </View>
  );
}

function EvidenceCard({ state }: { state: { symbol: string | null; currentPrice: number | null; evidence: { id: string; label: string; value: string; note: string; category: string }[]; unavailable: string[] } }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <SectionHeader
          title={`Evidence pack (${state.evidence.length})`}
          action={open ? <ChevronUp color={colors.textMuted} size={20} /> : <ChevronDown color={colors.textMuted} size={20} />}
        />
      </Pressable>
      <Text variant="caption" tone="muted" numeric>
        {state.symbol} · {formatINR(state.currentPrice)}
        {state.unavailable.length ? ` · unavailable: ${state.unavailable.join(', ')}` : ''}
      </Text>
      {open
        ? state.evidence.map((e) => (
            <View key={e.id} style={styles.evidence}>
              <Badge label={e.id} tone="info" />
              <View style={styles.flex}>
                <Text variant="small" weight="600">
                  {e.label}: <Text variant="small">{e.value}</Text>
                </Text>
                {e.note ? (
                  <Text variant="caption" tone="muted">
                    {e.note}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        : null}
    </Card>
  );
}

function SideCard({ side, data }: { side: 'bull' | 'bear'; data: SideState }) {
  const { colors } = useTheme();
  if (!data.opening && !data.rebuttal) return null;
  const isBull = side === 'bull';
  const color = isBull ? colors.up : colors.down;
  const Icon = isBull ? TrendingUp : TrendingDown;
  return (
    <Card accent={color}>
      <SectionHeader title={isBull ? 'Bull case' : 'Bear case'} icon={<Icon color={color} size={18} />} />
      {data.thesis ? (
        <Text variant="body" weight="600">
          {data.thesis}
        </Text>
      ) : null}
      {data.opening?.map((c, i) => <ClaimRow key={`o${i}`} claim={c} />)}
      {data.rebuttal ? (
        <>
          <Divider />
          <Text variant="label" tone="muted">
            Rebuttal
          </Text>
          {data.rebuttal.map((c, i) => (
            <ClaimRow key={`r${i}`} claim={c} />
          ))}
          {data.concession ? (
            <Text variant="small" tone="muted">
              Concedes: {data.concession}
            </Text>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function ClaimRow({ claim }: { claim: DebateClaim }) {
  return (
    <View style={styles.claim}>
      {claim.target ? (
        <Text variant="caption" tone="muted">
          Re: {claim.target}
        </Text>
      ) : null}
      <Text variant="small">{claim.claim}</Text>
      <View style={styles.badges}>
        {claim.evidence_ids.map((id) => (
          <Badge key={id} label={id} tone={claim.invalid_ids.includes(id) ? 'down' : 'info'} />
        ))}
        {!claim.verified ? <Badge label="Unverified" tone="warning" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  stepper: { flexDirection: 'row', gap: spacing.sm },
  step: { flex: 1, gap: 4 },
  stepBar: { height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  between: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  right: { alignItems: 'flex-end' },
  errorRow: { padding: spacing.md, borderRadius: radius.md },
  component: { gap: 4 },
  capital: { textTransform: 'capitalize' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  centerLine: { position: 'absolute', left: '50%', width: 1, top: 0, bottom: 0 },
  barFill: { position: 'absolute', top: 0, bottom: 0 },
  evidence: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  claim: { gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  flex: { flex: 1 },
});
