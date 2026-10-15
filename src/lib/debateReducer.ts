import type {
  DebateClaim,
  DebateComponent,
  DebateEvent,
  DebateEvidence,
  DebateModerator,
  DebateSide,
  DebateStage,
  Verdict,
} from '@/api/types';

export type SideState = {
  thesis?: string;
  opening?: DebateClaim[];
  rebuttal?: DebateClaim[];
  concession?: string;
};

export type DebateState = {
  phase: 'idle' | 'running' | 'done' | 'failed';
  stage: DebateStage | null;
  statusMessage: string | null;
  symbol: string | null;
  currentPrice: number | null;
  evidence: DebateEvidence[];
  unavailable: string[];
  bull: SideState;
  bear: SideState;
  verdict: {
    verdict: Verdict;
    confidence: number;
    composite: number;
    thresholds: { buy: number; sell: number };
    components: DebateComponent[];
    moderator: DebateModerator | null;
  } | null;
  /** Non-fatal round errors streamed by the server (the verdict still arrives). */
  errors: { stage: string; side?: string; message: string }[];
  /** Fatal error: the stream could not start or broke. */
  fatal: string | null;
  cached: boolean;
};

export type DebateAction =
  | { type: 'start' }
  | { type: 'event'; event: DebateEvent }
  | { type: 'fail'; message: string }
  | { type: 'finish' };

export const initialDebateState: DebateState = {
  phase: 'idle',
  stage: null,
  statusMessage: null,
  symbol: null,
  currentPrice: null,
  evidence: [],
  unavailable: [],
  bull: {},
  bear: {},
  verdict: null,
  errors: [],
  fatal: null,
  cached: false,
};

function updateSide(state: DebateState, side: DebateSide, patch: Partial<SideState>): DebateState {
  return { ...state, [side]: { ...state[side], ...patch } };
}

export function debateReducer(state: DebateState, action: DebateAction): DebateState {
  switch (action.type) {
    case 'start':
      return { ...initialDebateState, phase: 'running' };
    case 'fail':
      return { ...state, phase: 'failed', fatal: action.message };
    case 'finish':
      return state.phase === 'running' ? { ...state, phase: 'done' } : state;
    case 'event': {
      const e = action.event;
      switch (e.type) {
        case 'status':
          return { ...state, stage: e.stage, statusMessage: e.message };
        case 'evidence':
          return {
            ...state,
            symbol: e.symbol,
            currentPrice: e.current_price,
            evidence: e.items,
            unavailable: e.unavailable,
          };
        case 'argument':
          return e.round === 'opening'
            ? updateSide(state, e.side, { thesis: e.thesis, opening: e.points })
            : updateSide(state, e.side, { rebuttal: e.points, concession: e.concession });
        case 'verdict': {
          const { type: _type, ...verdict } = e;
          return { ...state, verdict };
        }
        case 'error':
          return { ...state, errors: [...state.errors, { stage: e.stage, side: e.side, message: e.message }] };
        case 'done':
          return { ...state, phase: 'done', cached: e.cached, statusMessage: null };
        default:
          return state;
      }
    }
    default:
      return state;
  }
}
