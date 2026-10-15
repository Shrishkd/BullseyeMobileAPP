# Bullseye Mobile: development roadmap

**Goal:** bring the Bullseye web platform (live NSE data, ML predictions, AI Debate, portfolio, risk, alerts, news, AI chat) to iOS and Android with one React Native / Expo codebase, using the existing FastAPI backend as is wherever possible.

**Status as of 15 Oct 2026:** Phases 0–2 are scaffolded in this repo, apart from the backend items marked *backend*. Typecheck, lint, 18 unit tests, `expo-doctor` and an Android bundle export all pass. Nothing has run against a live backend yet (see Phase 2 exit criteria).

---

## 1. Key decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 57 (managed, CNG) + Expo Router** | One TS codebase. The team already knows React/TS. File-based routing mirrors the web pages. EAS covers build, submit and OTA |
| Data layer | **TanStack Query + Zustand** (same as web) | Web patterns and query keys port 1:1. Query gives caching, refetch on focus and invalidation |
| Token storage | **expo-secure-store** | The web keeps the JWT in `localStorage`. Mobile must use Keychain/Keystore |
| Candlestick chart | **Custom react-native-svg** | TradingView Lightweight Charts would need a WebView: heavier, slower to start, and awkward with gestures and theming. Revisit (Skia or a WebView) if users need pinch-zoom, many overlays or drawing tools |
| SSE for debate | **expo/fetch streaming body** | `EventSource` can't send `Authorization`. `expo/fetch` gives a WinterCG `ReadableStream` on native |
| Icons | **lucide-react-native** | Same icons as the web. `@expo/vector-icons` is deprecated |
| Styling | **StyleSheet + design tokens** | Tokens ported from web `index.css` (green/black). No build-time CSS tooling to break across SDK upgrades |
| Backend | **Reuse unchanged for MVP** | Every web endpoint works from native, because CORS doesn't apply there. Changes below are hardening, not blockers |

## 2. Web → mobile feature map

| Web page | Mobile location | Mobile adaptation | Status |
|---|---|---|---|
| Login / Signup | `(auth)/login`, `(auth)/signup` | One-tap demo login; SecureStore session; forced-logout notice | ✅ |
| Dashboard | Tab **Home** | Single `/dashboard/summary` call, 60 s refetch, pull to refresh; P/L, alerts, risk, market pulse, allocation donut, movers | ✅ |
| Market | Tab **Markets** → `stock/[symbol]` | Search + popular chips; SVG candles with EMA and RSI panel, touch-scrub readout; live WS price with REST fallback; AI indicator explanation; quick actions | ✅ |
| Predictions | AI hub → `predict` | XGBoost/LSTM toggle, confidence bar, signals, auto-train progress copy | ✅ |
| AI Debate | AI hub → `debate` | Streams rounds live (SSE), stage stepper, evidence pack, bull/bear cards, unverified-claim badges, verdict breakdown, moderator | ✅ |
| Portfolio | Tab **Portfolio** + `add-holding` modal | Holdings with live P/L, long-press delete, CSV/XLSX import via document picker, AI insights | ✅ |
| Risk | More → `risk` | Metrics grid, sector bars, per-holding, stress-test chips (5–50%), AI narrative | ✅ |
| Alerts | More → `alerts` (and from a stock) | Create/toggle/delete, Check now, history | ✅ (on-demand only) |
| News | More → `news` | Sentiment banner, article cards, in-app browser | ✅ |
| Chat | AI hub → `chat` | Bubble UI, quick prompts, markdown answers | ✅ |
| Settings | More → `settings` | Theme (dark/light/system), server info, sign out | ✅ |
| Forgot password | – | Backend has no reset endpoint | ⛔ *backend* |

## 3. Phases

### Phase 0: Backend readiness (*backend*, ~1 week, can run in parallel)
Not needed for local dev, but needed before any external user installs the app.

1. **Refresh tokens**: add `POST /auth/refresh` (rotating refresh token, 30 days) and `GET /auth/me`. Today the access token lasts 60 min (`auth.py`), so mobile users are logged out every hour. The client already centralises 401 handling in `api/client.ts`, so wiring refresh in later is a small change.
2. **WebSocket auth**: `ws_market.py` accepts unauthenticated connections ("Auth intentionally disabled"). Authenticate on the first message or subprotocol. Reject or close after a timeout.
3. **Consistent errors**: `/risk/*` returns 200 + `{error}`. Return 404/422 with `detail`. `CatchAllErrorMiddleware` returns `str(exc)` to clients, which leaks internals, so return a generic message and log details server-side.
4. **Push notifications**: add `POST /devices {expo_push_token, platform}`. Run a scheduled job (Celery/APScheduler is already planned) that evaluates active alerts every few minutes during market hours and sends through the Expo Push API.
5. **Background model training**: move `_auto_train` out of the request (Celery). Return `202 {status: "training"}` and let the client poll, so phones don't hold a 60 s request open.
6. **Production config**: HTTPS/WSS only. Change `SECRET_KEY` from `dev-secret-key`. Disable the seeded demo user (`DEMO_EMAIL`) in production, or make it read-only. Move from SQLite to PostgreSQL. Add `http://localhost:8081` to CORS only if Expo web preview is used.
7. **Password reset** endpoint (email OTP).
8. **Rate limiting** on `/auth/login` and on Gemini-backed endpoints.

### Phase 1: Foundation ✅
- Expo SDK 57 + Expo Router + TS strict + React Compiler. Path alias `@/`.
- Design tokens ported from web. Dark default plus light/system themes.
- API client (`request()`), typed endpoints, `ApiError`, timeouts, 401 → logout.
- Auth store with SecureStore, JWT-expiry check on foreground, `Stack.Protected` routing.
- React Query client (no retry on 4xx, focus manager wired to `AppState`).
- UI kit: Text, Card, Button (haptics), Input, Chip/Badge/Segmented, Stat tiles, Loading/Error/Empty, Disclaimer, Markdown.
- Jest + jest-expo, ESLint (expo config), `npm run check`.

### Phase 2: Feature parity MVP ✅ (code complete, needs device QA)
All screens in the table above.

**Exit criteria (to do):**
- [ ] Run against a live backend on a physical Android and iOS device over LAN, using the demo account.
- [ ] Verify the debate SSE streams progressively on device (not buffered until the end). Check that the backend's `X-Accel-Buffering: no` survives any proxy.
- [ ] Verify CSV import upload (`expo-file-system` `File` in `FormData`) against `/portfolio/import`.
- [ ] Verify the live WS price and the fallback (kill the backend mid-session, then restart it).
- [ ] Empty-account pass: no holdings, no alerts, market closed.

### Phase 3: Mobile-native value (2–3 weeks)
1. **Push notifications** for triggered alerts (`expo-notifications`). Needs Phase 0.4 and a development build.
2. **Biometric app lock** (`expo-local-authentication`) on resume after N minutes. Hide balances in the app switcher.
3. **Watchlist** synced to the backend (roadmap item on the web too). Make the Markets tab default to it.
4. **Offline cache**: persist the React Query cache (`@tanstack/query-async-storage-persister`) for the dashboard, holdings and news, so the app opens instantly with stale-but-labelled data. Exclude anything sensitive from persistence, or encrypt it.
5. **Deep links**: `bullseye://stock/RELIANCE`, and notification taps that open the alert or stock.
6. **Home-screen widget** (portfolio value / watchlist) via a config plugin. Stretch goal.
7. **Chart upgrades**: pinch-zoom/pan, more overlays (SMA, MACD panel), and landscape full-screen chart.
8. **Date picker** for buy date (`@react-native-community/datetimepicker`) in place of the text field.

### Phase 4: Hardening (1–2 weeks)
- **Security:** certificate pinning (optional), jailbreak/root awareness (warn only), screenshot protection on portfolio screens (Android `FLAG_SECURE` via plugin), and an audit for logging of sensitive data.
- **Performance:** FlashList for long lists; memoised chart geometry (done); dashboard skeletons. Measure TTI on a low-end Android device.
- **Accessibility:** VoiceOver/TalkBack pass, dynamic type, contrast check of tokens in both themes.
- **Testing:** component tests (`@testing-library/react-native`) for the auth flow and the add-holding form. Maestro E2E smoke tests (login → dashboard → stock → debate). Add a CI job running `npm run check`.
- **Observability:** Sentry (`@sentry/react-native`) with PII scrubbing. No request bodies in breadcrumbs.

### Phase 5: Release (1–2 weeks)
1. EAS setup: `eas.json` profiles (development / preview / production), bundle IDs `com.shrish.bullseye` (change if needed), app icon and splash in Bullseye branding.
2. `eas build --profile preview`, then internal testing (TestFlight and Play internal track).
3. Store compliance: privacy policy, Play Data Safety and Apple privacy labels (email, financial info), and a clear "not investment advice / not SEBI-registered" statement in the listing and the app.
4. `eas submit`, then staged rollout.
5. OTA updates via `eas update` with a runtime-version policy, so JS fixes ship without store review.

### Phase 6: Post-launch
- Debate verdict track record (from the web roadmap), SHAP explanations for predictions, backtesting.
- Multi-broker linking (Zerodha Kite) for real holdings.
- Tablet layouts.

## 4. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Upstox token expires daily; free tier has no intraday data | Empty charts and prices for every user | Backend job to refresh the token; app defaults to 1D and explains when intraday is unavailable (done) |
| 60-min JWT without refresh | Users logged out hourly | Phase 0.1 refresh tokens |
| Long auto-train requests | Timeouts on mobile networks | 120 s client timeout (done); Phase 0.5 background training |
| Unauthenticated WebSocket | Free quota abuse of the Upstox proxy | Phase 0.2 |
| Regulatory (SEBI) | Store rejection or legal exposure | Disclaimers on every AI/prediction surface (done); store copy |
| Secret in web bundle | `Frontend/.env` defines `VITE_SUPABASE_SECRET_KEY`. Every `VITE_*` var is bundled into the browser | Rotate that key and remove it from the frontend env (web, not mobile) |
