import { Platform } from 'react-native';

/**
 * Runtime config. Only EXPO_PUBLIC_* variables reach the app bundle, and they
 * ship in plain text inside the binary: never put secrets here.
 *
 * Defaults point at a backend on the dev machine. The Android emulator reaches
 * the host at 10.0.2.2; a physical phone needs the machine's LAN IP
 * (set EXPO_PUBLIC_API_BASE_URL in .env.local).
 */
const devHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

function stripSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export const API_BASE_URL = stripSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${devHost}:8000/api`,
);

export const WS_BASE_URL = stripSlash(
  process.env.EXPO_PUBLIC_WS_BASE_URL ?? API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, ''),
);

/** Demo account seeded by the backend at startup (see Backend/app/core/config.py). */
export const DEMO_CREDENTIALS = { email: 'shrish@test.com', password: 'demo1234' } as const;

export const TIMEOUTS = {
  default: 20_000,
  /** First prediction for a symbol auto-trains the model (~30 s XGBoost, ~60 s LSTM). */
  prediction: 120_000,
  /** Gemini-backed endpoints (chat, insights, risk narrative). */
  ai: 60_000,
} as const;
