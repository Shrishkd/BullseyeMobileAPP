import type { DebateEvent } from '@/api/types';
import { debateReducer, initialDebateState, type DebateState } from '@/lib/debateReducer';

const run = (events: DebateEvent[], from: DebateState = debateReducer(initialDebateState, { type: 'start' })) =>
  events.reduce((s, event) => debateReducer(s, { type: 'event', event }), from);

describe('debateReducer', () => {
  it('builds up a full debate from the SSE event sequence', () => {
    const s = run([
      { type: 'status', stage: 'evidence', message: 'Gathering evidence' },
      {
        type: 'evidence',
        symbol: 'RELIANCE',
        current_price: 1448.4,
        items: [{ id: 'E1', category: 'model', label: 'Direction', value: 'UP', note: '' }],
        unavailable: ['position'],
      },
      {
        type: 'argument',
        side: 'bull',
        round: 'opening',
        thesis: 'Momentum is building',
        points: [{ claim: 'Model says UP', evidence_ids: ['E1'], invalid_ids: [], unverified_numbers: [], verified: true }],
      },
      {
        type: 'argument',
        side: 'bear',
        round: 'rebuttal',
        points: [],
        concession: 'Trend is up',
      },
      { type: 'error', stage: 'rebuttals', side: 'bull', message: 'quota' },
      {
        type: 'verdict',
        verdict: 'BUY',
        confidence: 64,
        composite: 0.21,
        thresholds: { buy: 0.15, sell: -0.15 },
        components: [],
        moderator: null,
      },
      { type: 'done', cached: false },
    ]);

    expect(s.phase).toBe('done');
    expect(s.symbol).toBe('RELIANCE');
    expect(s.unavailable).toEqual(['position']);
    expect(s.bull.thesis).toBe('Momentum is building');
    expect(s.bull.opening).toHaveLength(1);
    expect(s.bear.concession).toBe('Trend is up');
    expect(s.errors).toEqual([{ stage: 'rebuttals', side: 'bull', message: 'quota' }]);
    expect(s.verdict?.verdict).toBe('BUY');
    expect(s.verdict).not.toHaveProperty('type');
  });

  it('records a fatal failure and resets on restart', () => {
    const failed = debateReducer(debateReducer(initialDebateState, { type: 'start' }), {
      type: 'fail',
      message: 'Unsupported NSE symbol',
    });
    expect(failed.phase).toBe('failed');
    expect(failed.fatal).toBe('Unsupported NSE symbol');

    const restarted = debateReducer(failed, { type: 'start' });
    expect(restarted).toEqual({ ...initialDebateState, phase: 'running' });
  });

  it('finish only completes a running debate', () => {
    const failed = { ...initialDebateState, phase: 'failed' as const };
    expect(debateReducer(failed, { type: 'finish' }).phase).toBe('failed');
  });
});
