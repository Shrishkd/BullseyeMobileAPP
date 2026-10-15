import { fetch } from 'expo/fetch';

import { API_BASE_URL } from '@/config/env';
import { createSSEParser } from '@/lib/sse';

import { ApiError, authHeader, handleUnauthorized } from './client';
import type { DebateEvent } from './types';

/**
 * Streams GET /debate/{symbol} (Server-Sent Events). EventSource cannot send
 * the Authorization header, so this reads the streaming body of expo/fetch,
 * the same approach the web client uses with fetch + ReadableStream.
 *
 * Resolves when the stream ends; rejects on HTTP or network errors. Abort via
 * `signal` when the screen unmounts.
 */
export async function streamDebate(
  symbol: string,
  onEvent: (event: DebateEvent) => void,
  opts: { refresh?: boolean; signal?: AbortSignal } = {},
): Promise<void> {
  const url = `${API_BASE_URL}/debate/${encodeURIComponent(symbol.trim().toUpperCase())}?refresh=${opts.refresh ? 'true' : 'false'}`;

  let res;
  try {
    res = await fetch(url, {
      headers: { Accept: 'text/event-stream', ...authHeader() },
      signal: opts.signal,
    });
  } catch (e) {
    if (opts.signal?.aborted) return;
    throw new ApiError('Cannot reach the Bullseye server.', 0, e);
  }

  if (!res.ok || !res.body) {
    if (res.status === 401) handleUnauthorized();
    let detail = 'Failed to start debate';
    try {
      const body = (await res.json()) as { detail?: string };
      detail = body?.detail ?? detail;
    } catch {
      // Non-JSON error body.
    }
    throw new ApiError(detail, res.status);
  }

  const parser = createSSEParser((data) => {
    try {
      onEvent(JSON.parse(data) as DebateEvent);
    } catch {
      // Ignore malformed frames rather than killing the whole debate.
    }
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
    parser.end();
  } catch (e) {
    if (opts.signal?.aborted) return;
    throw new ApiError('The debate stream was interrupted.', 0, e);
  }
}
