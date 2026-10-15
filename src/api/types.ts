/**
 * Response/request shapes of the Bullseye FastAPI backend (Backend/app/api/v1).
 * Keep these in sync with the backend; nullable fields are nullable there too
 * (live prices are often unavailable outside market hours or on Upstox errors).
 */

// ── Auth ──────────────────────────────────────────────────────────────────────
export type LoginResponse = { access_token: string; token_type: string };
export type UserOut = { id: number; email: string; full_name: string | null; created_at: string };

// ── Market ────────────────────────────────────────────────────────────────────
/** Backend resolutions. Intraday may 401 on free-tier Upstox credentials. */
export type Resolution = '1' | '5' | '15' | '60' | 'D';

export type Quote = { symbol: string; price: number | null; currency: string; market_open: boolean };

export type Candle = {
  /** Epoch milliseconds. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma: number | null;
  ema: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
};

export type LivePriceMessage =
  | { symbol: string; price: number | null; type: 'initial' | 'update' }
  | { error: string };

// ── Dashboard ─────────────────────────────────────────────────────────────────
export type DashboardHolding = {
  symbol: string;
  asset_type: string;
  quantity: number;
  buy_price: number;
  current_price: number | null;
  invested_value: number;
  current_value: number | null;
  pnl: number | null;
  pnl_pct: number | null;
};

export type MarketPulseItem = {
  symbol: string;
  price: number | null;
  change_1d_pct: number | null;
  change_5d_pct: number | null;
  sparkline: number[];
  rsi: number | null;
};

export type DashboardSummary = {
  portfolio: {
    total_invested: number;
    total_current_value: number | null;
    total_pnl: number | null;
    total_pnl_pct: number | null;
    holdings_count: number;
    top_gainers: DashboardHolding[];
    top_losers: DashboardHolding[];
    asset_allocation: Record<string, number>;
  };
  holdings: DashboardHolding[];
  alerts: {
    total: number;
    active: number;
    total_triggers: number;
    recent_triggers: { symbol: string; alert_type: string; message: string; triggered_at: string }[];
  };
  market_pulse: MarketPulseItem[];
  portfolio_sparkline: number[];
  risk_snapshot: { overall: string; concentration_hhi?: number; flags: number; avg_volatility?: number | null };
  generated_at: string;
  user: { id: number; email: string; name: string | null };
};

// ── Portfolio ─────────────────────────────────────────────────────────────────
export type AssetType = 'stock' | 'etf' | 'crypto' | 'mutual_fund';

export type HoldingCreate = {
  symbol: string;
  quantity: number;
  buy_price: number;
  /** ISO datetime string. */
  buy_date: string;
  asset_type?: AssetType;
};

export type HoldingWithStats = {
  id: number;
  symbol: string;
  quantity: number;
  buy_price: number;
  buy_date: string;
  asset_type: string;
  created_at: string;
  current_price: number | null;
  current_value: number | null;
  invested_value: number;
  pnl: number | null;
  pnl_pct: number | null;
  allocation_pct: number | null;
};

export type PortfolioSummary = {
  total_invested: number;
  total_current_value: number | null;
  total_pnl: number | null;
  total_pnl_pct: number | null;
  holdings_count: number;
  last_updated: string;
};

export type CSVImportResult = {
  imported: number;
  failed: number;
  errors: { row: number; symbol?: string; error: string }[];
};

// ── Risk ──────────────────────────────────────────────────────────────────────
export type RiskHolding = {
  symbol: string;
  asset_type: string;
  sector: string;
  weight_pct: number;
  volatility: number;
  risk_level: string;
  max_drawdown: number;
  sharpe_ratio: number;
  var_95: number;
  beta: number;
  rsi: number | null;
  pnl_pct: number;
  data_points: number;
};

export type RiskAnalysis = {
  overall_risk_level: string;
  portfolio_volatility: number;
  portfolio_beta: number;
  portfolio_sharpe: number;
  portfolio_var_95: number;
  hhi_concentration: number;
  diversification_score: number;
  holdings_count: number;
  sectors_count: number;
  sector_weights: Record<string, number>;
  risk_flags: string[];
  holdings: RiskHolding[];
  ai_summary: string;
  last_updated: string;
};

export type ScenarioResult = {
  market_drop_pct: number;
  current_value: number;
  stressed_value: number;
  portfolio_impact: number;
  impact_pct: number;
  holdings: {
    symbol: string;
    beta: number;
    current_price: number;
    stressed_price: number;
    expected_drop: number;
    pnl_impact: number;
  }[];
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export type AlertType = 'price_above' | 'price_below' | 'rsi_overbought' | 'rsi_oversold' | 'volume_spike';

export type Alert = {
  id: number;
  symbol: string;
  alert_type: AlertType;
  threshold: number;
  note: string | null;
  is_active: boolean;
  triggered_count: number;
  last_triggered: string | null;
  created_at: string;
};

export type AlertCreate = { symbol: string; alert_type: AlertType; threshold: number; note?: string };
export type AlertUpdate = { is_active?: boolean; threshold?: number; note?: string };

export type TriggeredAlert = {
  id: number;
  alert_id: number;
  symbol: string;
  alert_type: AlertType;
  threshold: number;
  current_value: number;
  message: string;
  triggered_at: string;
};

export type AlertCheckResult = {
  checked: number;
  triggered: number;
  results: { alert_id: number; symbol: string; type: string; message: string; value: number; triggered_at: string }[];
  checked_at: string;
};

// ── Predictions ───────────────────────────────────────────────────────────────
export type ModelType = 'xgboost' | 'lstm';
export type Direction = 'UP' | 'DOWN' | 'SIDEWAYS';

export type Prediction = {
  symbol: string;
  prediction: Direction;
  /** 0–100. */
  confidence: number;
  /** Signed percentage string, e.g. "+1.05%". */
  expected_move: string;
  current_price: number;
  signals: string[];
  model_used: ModelType;
  timestamp: string;
};

export type TrainedModels = {
  symbol: string;
  xgboost_trained: boolean;
  lstm_trained: boolean;
  scaler_available: boolean;
};

// ── News ──────────────────────────────────────────────────────────────────────
export type Sentiment = { score: number; label: 'Positive' | 'Negative' | 'Neutral' };

export type NewsArticle = {
  title: string;
  description: string;
  source: string;
  url: string;
  image_url: string | null;
  published_at: string;
  sentiment: Sentiment;
};

export type NewsResponse = {
  articles: NewsArticle[];
  market_sentiment: { score: number; label: 'Bullish' | 'Bearish' | 'Neutral' };
  total: number;
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export type ChatResponse = { answer: string; sources: string[] };

// ── AI Debate (SSE events) ────────────────────────────────────────────────────
export type DebateEvidence = {
  id: string;
  category: 'model' | 'technical' | 'risk' | 'sentiment' | 'position';
  label: string;
  value: string;
  note: string;
};

export type DebateClaim = {
  claim: string;
  evidence_ids: string[];
  invalid_ids: string[];
  unverified_numbers: string[];
  verified: boolean;
  target?: string;
};

export type DebateComponent = {
  name: 'model' | 'technical' | 'sentiment' | 'risk';
  raw: number;
  weight: number;
  contribution: number;
  explanation: string;
};

export type DebateModerator = {
  summary: string;
  stronger_side: 'bull' | 'bear' | 'even';
  stronger_side_reason: string;
  key_risks: (DebateClaim & { risk: string })[];
};

export type DebateStage = 'evidence' | 'openings' | 'rebuttals' | 'verdict';
export type DebateSide = 'bull' | 'bear';
export type Verdict = 'BUY' | 'HOLD' | 'SELL';

export type DebateEvent =
  | { type: 'status'; stage: DebateStage; message: string }
  | { type: 'evidence'; symbol: string; current_price: number | null; items: DebateEvidence[]; unavailable: string[] }
  | { type: 'argument'; side: DebateSide; round: 'opening'; thesis: string; points: DebateClaim[] }
  | { type: 'argument'; side: DebateSide; round: 'rebuttal'; points: DebateClaim[]; concession: string }
  | {
      type: 'verdict';
      verdict: Verdict;
      confidence: number;
      composite: number;
      thresholds: { buy: number; sell: number };
      components: DebateComponent[];
      moderator: DebateModerator | null;
    }
  | { type: 'error'; stage: string; side?: string; message: string }
  | { type: 'done'; cached: boolean };
