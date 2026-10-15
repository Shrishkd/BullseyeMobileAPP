import { useCallback, useEffect, useReducer, useRef } from 'react';

import { ApiError } from '@/api/client';
import { streamDebate } from '@/api/debate';
import { debateReducer, initialDebateState } from '@/lib/debateReducer';

/** Runs one AI debate at a time; aborts the stream on restart or unmount. */
export function useDebate() {
  const [state, dispatch] = useReducer(debateReducer, initialDebateState);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (symbol: string, refresh = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: 'start' });
    try {
      await streamDebate(symbol, (event) => dispatch({ type: 'event', event }), {
        refresh,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) dispatch({ type: 'finish' });
    } catch (e) {
      if (controller.signal.aborted) return;
      dispatch({ type: 'fail', message: e instanceof ApiError ? e.message : 'The debate failed to run.' });
    }
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { state, start, cancel };
}
