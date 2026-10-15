# Bullseye Mobile

iOS and Android app for **Bullseye**, the AI-powered investing assistant for Indian (NSE) markets. Built with Expo SDK 57, React Native, TypeScript and Expo Router. It talks to the existing Bullseye FastAPI backend.

**Features:** dashboard · live NSE prices (WebSocket) and candlestick charts · XGBoost/LSTM predictions · Bull vs Bear AI Debate (streamed) · portfolio with CSV/Excel import · risk analysis and stress tests · price/RSI/volume alerts · news sentiment · Gemini AI chat.

## Quick start

1. Start the backend (from `Bullseye/Backend`, venv active):
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
2. Run the app:
   ```bash
   npm install
   cp .env.example .env.local   # set your PC's LAN IP if using a physical phone
   npx expo start               # scan the QR code with Expo Go, or press a / i
   ```
3. Sign in with the demo account: `shrish@test.com` / `demo1234`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Expo dev server |
| `npm run check` | Typecheck + lint + unit tests |
| `npm run doctor` | Expo dependency/config health check |

## Docs

- [CLAUDE.md](CLAUDE.md): architecture, conventions, API contract and security rules
- [docs/ROADMAP.md](docs/ROADMAP.md): phased plan, from feature parity through store release

> Bullseye provides analytics and AI commentary for education only. It is not investment advice and Bullseye is not a SEBI-registered adviser.
