import { File } from 'expo-file-system';

import { TIMEOUTS } from '@/config/env';

import { request, unwrapErrorField } from './client';
import type {
  Alert,
  AlertCheckResult,
  AlertCreate,
  AlertUpdate,
  Candle,
  ChatResponse,
  CSVImportResult,
  DashboardSummary,
  HoldingCreate,
  HoldingWithStats,
  LoginResponse,
  ModelType,
  NewsResponse,
  PortfolioSummary,
  Prediction,
  Quote,
  Resolution,
  RiskAnalysis,
  ScenarioResult,
  TrainedModels,
  TriggeredAlert,
  UserOut,
} from './types';

/** One namespace per backend router (Backend/app/api/v1/*.py). */

const sym = (s: string) => encodeURIComponent(s.trim().toUpperCase());

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuthRedirect: true,
    }),
  signup: (email: string, password: string, full_name?: string) =>
    request<UserOut>('/auth/signup', {
      method: 'POST',
      body: { email, password, full_name },
      skipAuthRedirect: true,
    }),
};

export const marketApi = {
  quote: (symbol: string) => request<Quote>(`/market/quote/${sym(symbol)}`),
  candles: (symbol: string, resolution: Resolution) =>
    request<Candle[]>(`/market/candles/${sym(symbol)}?resolution=${resolution}`),
};

export const dashboardApi = {
  summary: () => request<DashboardSummary>('/dashboard/summary', { timeoutMs: 45_000 }),
};

export const portfolioApi = {
  holdings: () => request<HoldingWithStats[]>('/portfolio/holdings'),
  summary: () => request<PortfolioSummary>('/portfolio/summary'),
  add: (data: HoldingCreate) => request<HoldingWithStats>('/portfolio/holdings', { method: 'POST', body: data }),
  remove: (id: number) => request<null>(`/portfolio/holdings/${id}`, { method: 'DELETE' }),
  insights: () => request<{ insights: string }>('/portfolio/ai-insights', { timeoutMs: TIMEOUTS.ai }),
  /** Uploads a CSV/XLSX picked with expo-document-picker (copyToCacheDirectory: true). */
  importFile: (uri: string) => {
    const form = new FormData();
    form.append('file', new File(uri));
    return request<CSVImportResult>('/portfolio/import', { method: 'POST', formData: form, timeoutMs: 60_000 });
  },
};

export const riskApi = {
  analysis: async () =>
    unwrapErrorField(await request<RiskAnalysis | { error: string }>('/risk/analysis', { timeoutMs: TIMEOUTS.ai })),
  scenario: async (market_drop_pct: number) =>
    unwrapErrorField(
      await request<ScenarioResult | { error: string }>('/risk/scenario', {
        method: 'POST',
        body: { market_drop_pct },
        timeoutMs: 45_000,
      }),
    ),
};

export const alertsApi = {
  list: () => request<Alert[]>('/alerts/'),
  create: (data: AlertCreate) => request<Alert>('/alerts/', { method: 'POST', body: data }),
  update: (id: number, data: AlertUpdate) => request<Alert>(`/alerts/${id}`, { method: 'PUT', body: data }),
  remove: (id: number) => request<null>(`/alerts/${id}`, { method: 'DELETE' }),
  check: () => request<AlertCheckResult>('/alerts/check', { timeoutMs: 45_000 }),
  triggered: (limit = 50) => request<TriggeredAlert[]>(`/alerts/triggered?limit=${limit}`),
};

export const predictApi = {
  predict: (symbol: string, model: ModelType) =>
    request<Prediction>(`/predict/${sym(symbol)}?model=${model}`, { timeoutMs: TIMEOUTS.prediction }),
  models: (symbol: string) => request<TrainedModels>(`/predict/${sym(symbol)}/models`),
};

export const newsApi = {
  breaking: (limit = 15) => request<NewsResponse>(`/news/breaking?limit=${limit}`),
};

export const chatApi = {
  query: (question: string) =>
    request<ChatResponse>('/chat/query', { method: 'POST', body: { question, top_k: 5 }, timeoutMs: TIMEOUTS.ai }),
  explainIndicators: (payload: { symbol: string; price: number; rsi?: number; sma?: number; ema?: number }) =>
    request<{ explanation: string }>('/chat/explain-indicators', {
      method: 'POST',
      body: payload,
      timeoutMs: TIMEOUTS.ai,
    }),
};
