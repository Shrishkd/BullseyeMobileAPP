import { API_BASE_URL, TIMEOUTS } from '@/config/env';

/**
 * Single HTTP entry point for the app. Every request goes through here so
 * auth headers, timeouts and error shapes are handled in one place.
 *
 * On iOS/Android the global `fetch` is Expo's WinterCG implementation
 * (expo/fetch), which also supports streaming bodies (used by the debate SSE).
 */

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

type AuthHandlers = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

let auth: AuthHandlers = { getToken: () => null, onUnauthorized: () => {} };

/** Wired once by the auth store; keeps this module free of store imports. */
export function registerAuthHandlers(handlers: AuthHandlers) {
  auth = handlers;
}

export function authHeader(): Record<string, string> {
  const token = auth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function handleUnauthorized() {
  auth.onUnauthorized();
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Skip the global 401 → logout handling (used by the login call itself). */
  skipAuthRedirect?: boolean;
};

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const d = data as { detail?: unknown; message?: unknown };
    if (typeof d.detail === 'string') return d.detail;
    // FastAPI validation errors: detail is a list of { msg, loc }.
    if (Array.isArray(d.detail) && d.detail[0]?.msg) return String(d.detail[0].msg);
    if (typeof d.message === 'string') return d.message;
  }
  if (typeof data === 'string' && data.length > 0 && data.length < 300) return data;
  return fallback;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, timeoutMs = TIMEOUTS.default, signal } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener('abort', onOuterAbort);

  const headers: Record<string, string> = { Accept: 'application/json', ...authHeader() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = controller.signal.aborted && !signal?.aborted;
    throw new ApiError(
      aborted ? 'The server took too long to respond.' : 'Cannot reach the Bullseye server.',
      0,
      e,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !opts.skipAuthRedirect) handleUnauthorized();
    throw new ApiError(errorMessage(data, `Request failed (${res.status})`), res.status, data);
  }

  return data as T;
}

/**
 * Several backend endpoints (risk analysis, scenario, volatility) report
 * "no data" as HTTP 200 with `{ error: "..." }`. Turn that into an ApiError so
 * screens handle it through the normal error path.
 */
export function unwrapErrorField<T extends object>(data: T | { error: string }): T {
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    throw new ApiError(data.error, 200, data);
  }
  return data as T;
}
