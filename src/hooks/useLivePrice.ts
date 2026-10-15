import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { marketApi } from '@/api/endpoints';
import type { LivePriceMessage } from '@/api/types';
import { WS_BASE_URL } from '@/config/env';

export type LiveStatus = 'connecting' | 'live' | 'fallback' | 'offline';

type Snapshot = { symbol: string | null; price: number | null; status: LiveStatus; updatedAt: number | null };

const MAX_BACKOFF_MS = 15_000;
const FALLBACK_POLL_MS = 15_000;

const fresh = (symbol: string | null): Snapshot => ({ symbol, price: null, status: 'connecting', updatedAt: null });

/**
 * Live LTP for one symbol over /ws/market/{symbol} (server pushes every ~1 s).
 *
 * - Reconnects with exponential backoff.
 * - While the socket is down, polls GET /market/quote as a fallback.
 * - Closes everything when the app is backgrounded (battery + Upstox quota)
 *   and reconnects on foreground.
 */
export function useLivePrice(symbol: string | null) {
  // State is tagged with its symbol, so switching symbols shows a clean slate
  // without resetting state inside the effect.
  const [snap, setSnap] = useState<Snapshot>(() => fresh(symbol));

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let disposed = false;

    const update = (fn: (s: Snapshot) => Partial<Snapshot>) =>
      setSnap((prev) => {
        const base = prev.symbol === symbol ? prev : fresh(symbol);
        return { ...base, ...fn(base) };
      });

    const accept = (p: number | null | undefined, status?: LiveStatus) => {
      if (typeof p !== 'number' || !Number.isFinite(p)) return;
      update((s) => ({ price: p, updatedAt: Date.now(), status: status ?? s.status }));
    };

    const stopPolling = () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = null;
    };

    const startPolling = () => {
      if (pollTimer.current) return;
      const poll = () =>
        marketApi
          .quote(symbol)
          .then((q) => {
            if (disposed) return;
            update((s) => ({ status: s.status === 'live' ? s.status : 'fallback' }));
            accept(q.price);
          })
          .catch(() => {
            if (!disposed) update((s) => ({ status: s.status === 'live' ? s.status : 'offline' }));
          });
      void poll();
      pollTimer.current = setInterval(poll, FALLBACK_POLL_MS);
    };

    const closeSocket = () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        ws.close();
      }
    };

    const connect = () => {
      if (disposed) return;
      closeSocket();
      const ws = new WebSocket(`${WS_BASE_URL}/ws/market/${encodeURIComponent(symbol)}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(String(e.data)) as LivePriceMessage;
          if ('error' in msg) return; // Server closes after sending an error.
          retryRef.current = 0;
          accept(msg.price, 'live');
          stopPolling();
        } catch {
          // Ignore malformed frames.
        }
      };

      ws.onclose = () => {
        if (disposed || wsRef.current !== ws) return;
        wsRef.current = null;
        update((s) => ({ status: s.status === 'live' ? 'fallback' : s.status }));
        startPolling();
        const delay = Math.min(1000 * 2 ** retryRef.current, MAX_BACKOFF_MS);
        retryRef.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };
    };

    connect();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        retryRef.current = 0;
        connect();
      } else if (state === 'background') {
        closeSocket();
        stopPolling();
      }
    });

    return () => {
      disposed = true;
      sub.remove();
      closeSocket();
      stopPolling();
    };
  }, [symbol]);

  const current = snap.symbol === symbol ? snap : fresh(symbol);
  return { price: current.price, status: current.status, updatedAt: current.updatedAt };
}
