# CLAUDE.md: Bullseye Mobile

@AGENTS.md

AGENTS.md (above) is Expo's own guidance for this SDK. Follow it. In short: Expo APIs change every SDK, so check `https://docs.expo.dev/versions/v57.0.0/` before you touch an Expo/RN API, and always install with `npx expo install`.

## 1. What this is

Bullseye Mobile is the iOS/Android client for **Bullseye**, an India-first, AI-powered investing platform for NSE equities. It is a **client only**: all data, ML and AI come from the existing FastAPI backend in `D:\PROJECTS\Bullseye\Backend` (sibling repo). The web client is `D:\PROJECTS\Bullseye\Frontend` (React + Vite). When behaviour is unclear, read the backend router in `Backend/app/api/v1/<module>.py`. That file is the contract, not the web UI.

Product plan and phase status: [docs/ROADMAP.md](docs/ROADMAP.md).

## 2. Tech stack

| Layer | Choice |
|---|---|
| Runtime | Expo SDK **57**, React Native 0.86, React 19.2, **React Compiler on**, Hermes |
| Language | TypeScript 6 (strict), path alias `@/*` → `src/*` |
| Navigation | Expo Router (file-based, typed routes), routes in `src/app/` |
| Server state | TanStack Query v5 (`src/api/queries.ts`) |
| Client state | Zustand v5 (`src/stores/`): auth session + preferences only |
| Secure storage | `expo-secure-store` (Keychain/Keystore) via `src/lib/storage.ts` |
| Networking | Global `fetch` = `expo/fetch` on native (supports streaming bodies), RN `WebSocket` |
| Charts | Hand-rolled `react-native-svg` (candles, sparkline, donut). No WebView, no chart lib |
| Icons | `lucide-react-native` (same set as the web). **Do not add `@expo/vector-icons`** (deprecated) |
| Styling | `StyleSheet` + tokens in `src/theme/tokens.ts` (ported from web `index.css`). No NativeWind |
| Tests | Jest + `jest-expo`; tests in `src/__tests__/` |

Backend (not in this repo): FastAPI + async SQLAlchemy + SQLite, JWT (HS256, python-jose) + bcrypt, Upstox market data, XGBoost/LSTM predictions, Gemini 2.5 Flash, VADER news sentiment, NewsData.io.

## 3. Commands

```bash
npm install                 # install (lockfile: package-lock.json; use npm, not bun/yarn)
npx expo start              # dev server; scan QR with Expo Go, or press a / i
npm run typecheck           # tsc --noEmit
npm run lint                # expo lint (eslint-config-expo, incl. React Compiler rules)
npm test                    # jest
npm run check               # typecheck + lint + test: run before saying a task is done
npm run doctor              # expo-doctor (dependency/config health)
npx expo install <pkg>      # ALWAYS use this to add deps (SDK-compatible versions)
npx expo install --fix      # repair version mismatches
npx expo export --platform android   # full JS bundle compile (catches bad imports)
```

Backend (from `D:\PROJECTS\Bullseye\Backend`, with its venv active):

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Use `--host 0.0.0.0` so a phone on the same Wi-Fi can reach it. Demo login: `shrish@test.com` / `demo1234`. The backend seeds it at startup.

### Pointing the app at the backend

Copy `.env.example` → `.env.local` (git-ignored):

- Android emulator: default `http://10.0.2.2:8000/api` works with no config.
- iOS simulator: default `http://localhost:8000/api` works.
- Physical phone: `EXPO_PUBLIC_API_BASE_URL=http://<PC-LAN-IP>:8000/api`, `EXPO_PUBLIC_WS_BASE_URL=ws://<PC-LAN-IP>:8000`.

Restart `expo start` after changing env vars. `EXPO_PUBLIC_*` values are **bundled in plain text**, so never put secrets there.

## 4. Project structure

```
src/
  app/                      # ROUTES ONLY (every file is a screen)
    _layout.tsx             # root: hydrate stores, splash, QueryClient, theme, Stack.Protected auth gate
    (auth)/login|signup     # signed-out stack
    (app)/_layout.tsx       # signed-in Stack (themed headers)
    (app)/(tabs)/           # index (Home/dashboard), markets, portfolio, ai (hub), more
    (app)/stock/[symbol]    # chart + live price + indicators + AI explain + actions
    (app)/predict|debate|chat|risk|alerts|news|settings|add-holding(modal)
  api/
    client.ts               # request(): base URL, auth header, timeouts, ApiError, 401 → logout
    endpoints.ts            # one namespace per backend router (authApi, marketApi, …)
    types.ts                # backend response/request types (keep in sync with backend)
    queries.ts              # React Query hooks + queryKeys + invalidation
    queryClient.ts          # QueryClient defaults (no retry on 4xx)
    debate.ts               # SSE stream for /debate/{symbol}
  components/
    ui/                     # design-system primitives (Text, Card, Button, Input, Chips, Feedback, Stat, Markdown, Screen)
    charts/                 # CandleChart, Sparkline, Donut (react-native-svg)
    *.tsx                   # feature components shared by screens (SymbolSearch, MarketPulseRow, NavCard…)
  hooks/                    # useLivePrice (WebSocket), useDebate (SSE)
  lib/                      # pure logic (format, sse, jwt, debateReducer, storage); unit-test these
  stores/                   # zustand: auth.ts (session), settings.ts (theme pref)
  theme/                    # tokens.ts + useTheme()
  config/                   # env.ts (URLs, timeouts, demo creds), market.ts (symbols, resolutions)
  __tests__/                # jest tests for src/lib and src/api pure functions
docs/ROADMAP.md
```

Rules:
- Nothing except screens and `_layout.tsx` goes in `src/app/`. Put helpers in `components/`, `hooks/`, `lib/`.
- Screens compose hooks + components. They do not call `fetch` or `request()` directly.
- `src/lib/` holds pure logic with no React and no I/O, so it is easy to test. Put new parsing/formatting/state logic here, with a test.

## 5. Architecture conventions

### Data flow
`screen → hook in api/queries.ts → endpoint in api/endpoints.ts → request() in api/client.ts`

- **Every** HTTP call goes through `request()` (or `streamDebate()` for SSE). That is where auth, timeouts and error mapping live.
- Server data lives in **React Query**, never in Zustand or `useState` copies. Add a key to `queryKeys`. Mutations must invalidate what they change (see `useInvalidatePortfolio`, which also invalidates dashboard + risk).
- Zustand holds **only** the session (`stores/auth.ts`) and preferences (`stores/settings.ts`).
- Long calls: pass `timeoutMs` (see `TIMEOUTS` in `config/env.ts`). The first `/predict/{symbol}` auto-trains (up to ~60 s). Gemini endpoints use `TIMEOUTS.ai`.

### Error handling
- `request()` throws `ApiError { status, message, data }`. `status === 0` means network/timeout.
- **Backend quirk:** `/risk/analysis`, `/risk/scenario`, `/risk/volatility` return **HTTP 200 with `{ "error": "..." }`** when there are no holdings or no data. Wrap them with `unwrapErrorField()`, which throws `ApiError` with `status 200`. Screens treat that as an empty state, not a failure (see `risk.tsx`).
- Live prices are often `null` (market closed, Upstox error, free tier). Every numeric field typed `number | null` must render `—` via `lib/format.ts`. Never show `NaN` or `₹0.00`.
- Every data screen handles all four states: `LoadingState`, `ErrorState` (with retry), `EmptyState`, and content. Use pull-to-refresh via `<Screen refreshing onRefresh>`.
- AI rounds can fail independently. The debate shows non-fatal `error` events but still renders the verdict.

### UI
- Use `components/ui` primitives and `useTheme().colors`. **Never hard-code colours.** Add a token if one is missing. Gains and losses always use `colors.up` / `colors.down`.
- Money: `formatINR` / `formatSignedINR` / `formatINRCompact` (Indian grouping 12,34,567). Percent: `formatPct`. Pass `numeric` to `<Text>` for figures so the digits don't jitter.
- Every prediction, debate verdict or AI opinion screen shows `<Disclaimer />`. Never phrase output as advice ("you should buy").
- Accessibility: `accessibilityRole`/`accessibilityLabel` on custom pressables, tap targets ≥ 44 pt (`hitSlop` for icons), and labels on all inputs.
- React Compiler is on and its lint rules are errors. Don't call impure functions (`Date.now()`, `Math.random()`) during render. Don't `setState` synchronously inside `useEffect`. Usually no manual `useMemo`/`useCallback` is needed.

## 6. API integration guide

Base URL `${API_BASE_URL}` already ends in `/api`. All routes except auth, news, health and the WebSocket need `Authorization: Bearer <jwt>`.

| Area | Endpoint | Notes |
|---|---|---|
| Auth | `POST /auth/signup` `{email,password,full_name?}` → UserOut | |
| | `POST /auth/login` `{email,password}` → `{access_token, token_type}` | JWT lifetime **60 min**, **no refresh endpoint** |
| Dashboard | `GET /dashboard/summary` | portfolio + holdings + alerts + market_pulse + sparkline + risk_snapshot + user; slow (fans out to Upstox) |
| Market | `GET /market/quote/{symbol}` | `{price \| null, market_open}` |
| | `GET /market/candles/{symbol}?resolution=1\|5\|15\|60\|D` | `time` = **epoch ms**; each candle carries sma/ema/rsi/macd. Intraday may fail on free-tier Upstox, so default to `D` |
| Live | `WS /ws/market/{symbol}` (no `/api` prefix) | pushes `{symbol, price, type: initial\|update}` ~1 s; `{error}` then close on failure; **no auth today** |
| Portfolio | `GET/POST /portfolio/holdings`, `DELETE /portfolio/holdings/{id}`, `GET /portfolio/summary` | `buy_date` ISO datetime |
| | `POST /portfolio/import` multipart `file` (.csv/.xlsx/.xls) | native: `form.append('file', new File(uri))` from `expo-file-system` |
| | `GET /portfolio/ai-insights` → `{insights}` (markdown) | Gemini |
| Risk | `GET /risk/analysis`, `POST /risk/scenario {market_drop_pct}`, `GET /risk/volatility/{symbol}` | 200 + `{error}` quirk |
| Alerts | `GET/POST /alerts/`, `PUT/DELETE /alerts/{id}`, `GET /alerts/check`, `GET /alerts/triggered?limit=` | **trailing slash** on `/alerts/`; alerts are evaluated only when `/check` is called |
| Predict | `GET /predict/{symbol}?model=xgboost\|lstm`, `GET /predict/{symbol}/models` | first call per symbol trains (~30–60 s) |
| Debate | `GET /debate/{symbol}?refresh=bool` (SSE) | events: status, evidence, argument, verdict, error, done |
| Chat | `POST /chat/query {question, top_k}` → `{answer, sources}`, `POST /chat/explain-indicators` | Gemini; markdown text |
| News | `GET /news/breaking?limit=` | `published_at` is `"YYYY-MM-DD HH:MM:SS"` UTC |

Timestamps without a zone suffix are **UTC**. `lib/format.ts#timeAgo` handles that.

### JWT / session
- The token is stored **only** in SecureStore (`StorageKeys.token`) and in memory (`useAuthStore`). Never put it in AsyncStorage, logs, URLs, analytics or error reports.
- `client.ts` receives the token via `registerAuthHandlers()` (wired in `stores/auth.ts`) to avoid import cycles.
- Any 401 → `logout('Your session expired…')`, which also calls `queryClient.clear()`. When the app returns to the foreground, `checkExpiry()` checks the JWT `exp`.
- Routing is gated with `Stack.Protected` in `src/app/_layout.tsx`. Do not add manual redirects.

### WebSocket (live prices): `hooks/useLivePrice.ts`
- One socket per mounted symbol screen. Exponential backoff reconnect (max 15 s). While the socket is down, poll `GET /market/quote` every 15 s (`status: 'fallback'`).
- Close the socket and stop polling on `AppState` background; reconnect on `active`. Keep this behaviour (battery + Upstox rate limits).
- Status values for UI: `connecting | live | fallback | offline` (`components/LiveBadge.tsx`).
- When the backend adds WS auth (roadmap), send the token in the first message after `onopen` or a `Sec-WebSocket-Protocol` header, **not** a query string, because query strings end up in server logs.

### SSE (AI debate): `api/debate.ts`
- `EventSource` can't send `Authorization`, so we stream `expo/fetch`'s `res.body.getReader()` and parse frames with `lib/sse.ts` (unit-tested).
- State lives in the pure `lib/debateReducer.ts`. `hooks/useDebate.ts` aborts the stream on restart/unmount.

## 7. Security guardrails (financial data)

1. **No secrets in the app.** Gemini, Upstox, NewsData and Supabase keys stay on the server. Anything `EXPO_PUBLIC_*` is public.
2. **Tokens:** SecureStore only. Clear SecureStore and the React Query cache on logout.
3. **Transport:** production must be **HTTPS/WSS**. Android release builds block cleartext HTTP. Never add a blanket `usesCleartextTraffic` for production.
4. **Never log** tokens, passwords, holdings or P/L. Remove debug `console.log`s that print API payloads.
5. **Untrusted content:** AI text and news are untrusted. Render AI output as text (`<Markdown>` doesn't execute links/HTML). Open only `http(s)` URLs, via `expo-web-browser`.
6. **Validate input client-side** (symbols normalised with `normaliseSymbol`, positive numbers, RSI 0–100). The server still validates.
7. **Compliance copy:** Bullseye is not a SEBI-registered adviser. Keep disclaimers on predictions, debate verdicts, AI insights and chat.
8. **Destructive actions** (delete holding/alert, sign out) require a confirmation `Alert`.

## 8. Testing & definition of done

- New pure logic in `src/lib` gets Jest tests in `src/__tests__/`.
- Before saying a task is done, run `npm run check`. After dependency or config changes, also run `npm run doctor` and `npx expo export --platform android`.
- For UI changes, check the screen on a device or emulator in **both dark and light themes** and with a backend that returns empty data (no holdings), because the empty states are part of the contract.

## 9. Gotchas

- Upstox's daily access token (`UPSTOX_ACCESS_TOKEN` in the backend `.env`) expires every day. "Market data unavailable" across every screen usually means it needs renewing, not that the app is broken.
- Upstox maps `5` → 1-minute and `15/60` → 30-minute candles internally (`upstox.py`), so intraday labels are approximate.
- The dashboard is the slowest call (it fetches candles for up to 6 pulse symbols + 8 holdings). Don't call it more often than every 60 s.
- `/alerts/` needs the trailing slash. Without it FastAPI answers with a 307 redirect, which costs an extra round trip and can break behind a TLS-terminating proxy.
- Typed routes live in `.expo/types/router.d.ts`, generated by `expo start`. If `router.push` types look wrong, start the dev server once.

## 10. Git

The user commits and pushes themselves. **Do not run `git commit` / `git push`.** Prepare the changes and hand over a commit message.
