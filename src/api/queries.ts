import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  alertsApi,
  chatApi,
  dashboardApi,
  marketApi,
  newsApi,
  portfolioApi,
  predictApi,
  riskApi,
} from './endpoints';
import type { AlertCreate, AlertUpdate, HoldingCreate, ModelType, Resolution } from './types';

/** Query keys live here so invalidation stays consistent across screens. */
export const queryKeys = {
  dashboard: ['dashboard'] as const,
  quote: (symbol: string) => ['quote', symbol] as const,
  candles: (symbol: string, resolution: Resolution) => ['candles', symbol, resolution] as const,
  holdings: ['portfolio', 'holdings'] as const,
  portfolioSummary: ['portfolio', 'summary'] as const,
  portfolioInsights: ['portfolio', 'insights'] as const,
  risk: ['risk', 'analysis'] as const,
  alerts: ['alerts', 'list'] as const,
  triggered: ['alerts', 'triggered'] as const,
  news: ['news', 'breaking'] as const,
  prediction: (symbol: string, model: ModelType) => ['prediction', symbol, model] as const,
};

// ── Reads ─────────────────────────────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.summary,
    refetchInterval: 60_000, // Same cadence as the web dashboard.
  });
}

export function useCandles(symbol: string, resolution: Resolution) {
  return useQuery({
    queryKey: queryKeys.candles(symbol, resolution),
    queryFn: () => marketApi.candles(symbol, resolution),
    enabled: symbol.length > 0,
  });
}

export function useQuote(symbol: string) {
  return useQuery({
    queryKey: queryKeys.quote(symbol),
    queryFn: () => marketApi.quote(symbol),
    enabled: symbol.length > 0,
    refetchInterval: 60_000,
  });
}

export function useHoldings() {
  return useQuery({ queryKey: queryKeys.holdings, queryFn: portfolioApi.holdings });
}

export function usePortfolioSummary() {
  return useQuery({ queryKey: queryKeys.portfolioSummary, queryFn: portfolioApi.summary });
}

export function useRiskAnalysis() {
  return useQuery({ queryKey: queryKeys.risk, queryFn: riskApi.analysis, staleTime: 5 * 60_000 });
}

export function useAlerts() {
  return useQuery({ queryKey: queryKeys.alerts, queryFn: alertsApi.list });
}

export function useTriggeredAlerts() {
  return useQuery({ queryKey: queryKeys.triggered, queryFn: () => alertsApi.triggered(50) });
}

export function useNews() {
  return useQuery({ queryKey: queryKeys.news, queryFn: () => newsApi.breaking(15), staleTime: 60_000 });
}

/** Manual trigger only: the first call per symbol can auto-train for up to a minute. */
export function usePrediction(symbol: string, model: ModelType, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.prediction(symbol, model),
    queryFn: () => predictApi.predict(symbol, model),
    enabled: enabled && symbol.length > 0,
    staleTime: 10 * 60_000,
    retry: false,
  });
}

// ── Writes ────────────────────────────────────────────────────────────────────

function useInvalidatePortfolio() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['portfolio'] }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      qc.invalidateQueries({ queryKey: queryKeys.risk }),
    ]);
}

export function useAddHolding() {
  const invalidate = useInvalidatePortfolio();
  return useMutation({ mutationFn: (data: HoldingCreate) => portfolioApi.add(data), onSuccess: invalidate });
}

export function useDeleteHolding() {
  const invalidate = useInvalidatePortfolio();
  return useMutation({ mutationFn: (id: number) => portfolioApi.remove(id), onSuccess: invalidate });
}

export function useImportHoldings() {
  const invalidate = useInvalidatePortfolio();
  return useMutation({ mutationFn: (uri: string) => portfolioApi.importFile(uri), onSuccess: invalidate });
}

export function usePortfolioInsights() {
  return useMutation({ mutationFn: portfolioApi.insights });
}

export function useScenario() {
  return useMutation({ mutationFn: (dropPct: number) => riskApi.scenario(dropPct) });
}

function useInvalidateAlerts() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['alerts'] }),
      qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
}

export function useCreateAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({ mutationFn: (data: AlertCreate) => alertsApi.create(data), onSuccess: invalidate });
}

export function useUpdateAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AlertUpdate }) => alertsApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({ mutationFn: (id: number) => alertsApi.remove(id), onSuccess: invalidate });
}

export function useCheckAlerts() {
  const invalidate = useInvalidateAlerts();
  return useMutation({ mutationFn: alertsApi.check, onSuccess: invalidate });
}

export function useChat() {
  return useMutation({ mutationFn: (question: string) => chatApi.query(question) });
}

export function useExplainIndicators() {
  return useMutation({ mutationFn: chatApi.explainIndicators });
}
