/** Display formatting. India-first: INR with Indian digit grouping (1,23,456.78). */

const DASH = '—';

function isNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Groups an integer string the Indian way: 1234567 → 12,34,567. */
function groupIndian(intPart: string): string {
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

/** Formats with Indian grouping without relying on Intl locale data. */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (!isNum(value)) return DASH;
  const sign = value < 0 ? '-' : '';
  const [intPart, frac] = Math.abs(value).toFixed(decimals).split('.');
  return `${sign}${groupIndian(intPart)}${frac ? `.${frac}` : ''}`;
}

export function formatINR(value: number | null | undefined, decimals = 2): string {
  if (!isNum(value)) return DASH;
  const sign = value < 0 ? '-' : '';
  return `${sign}₹${formatNumber(Math.abs(value), decimals)}`;
}

/** ₹1.2L / ₹3.4Cr style for tight spaces. */
export function formatINRCompact(value: number | null | undefined): string {
  if (!isNum(value)) return DASH;
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
  return formatINR(value, abs >= 1000 ? 0 : 2);
}

/** Signed percentage: +1.25% / -0.40%. */
export function formatPct(value: number | null | undefined, decimals = 2): string {
  if (!isNum(value)) return DASH;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Signed INR amount: +₹1,200.00 / -₹300.00. */
export function formatSignedINR(value: number | null | undefined): string {
  if (!isNum(value)) return DASH;
  return `${value > 0 ? '+' : ''}${formatINR(value)}`;
}

export function trendOf(value: number | null | undefined): 'up' | 'down' | 'flat' {
  if (!isNum(value) || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

/** "5m ago", "3h ago", "2d ago", or a short date. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return DASH;
  // Backend timestamps are UTC without a zone suffix.
  const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  const t = new Date(hasZone ? iso : `${iso}Z`).getTime();
  if (!Number.isFinite(t)) return DASH;
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}d ago`;
  return new Date(t).toDateString().slice(4);
}

/** Normalises user-typed tickers: " reliance " → "RELIANCE". */
export function normaliseSymbol(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
