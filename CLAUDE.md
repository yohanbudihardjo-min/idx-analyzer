# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server with Turbopack (localhost:3000)
npm run build    # Production build (TypeScript errors suppressed — see next.config.ts)
npm run lint     # ESLint
```

No test suite is configured.

## Architecture

**IDX Analyzer** is a Next.js 16 (App Router) stock analysis dashboard for Indonesia's IDX/BEI market. It provides six analysis frameworks: Stock Screener, DCF Valuation, Earnings Analyzer, Technical Analysis, Pattern Finder, and Macro Dashboard.

### Data Layer (`lib/`)

`lib/sectors.ts` is the single data access point. It uses a **mock/live adapter pattern**: `USE_MOCK = !process.env.SECTORS_API_KEY`. When no API key is set, all functions return data from `lib/mock-data.ts` (5 demo tickers: BBCA, TLKM, ASII, BMRI, GOTO). Setting `SECTORS_API_KEY` in `.env.local` switches to the live [sectors.app](https://sectors.app) API with no UI changes needed.

- `lib/indicators.ts` — server-side technical indicator calculations (RSI, MACD, Bollinger Bands, moving averages, support/resistance)
- `lib/dcf.ts` — DCF valuation model
- `lib/sectors.ts` — data adapter (mock ↔ live)
- `lib/mock-data.ts` — static demo data for 5 tickers

### AI Endpoint (`app/api/ai/[framework]/route.ts`)

Single streaming POST endpoint. The `[framework]` path segment selects a system prompt persona (e.g. `overview` → Goldman Sachs analyst, `technical` → Citadel quant). Uses `streamText` from Vercel AI SDK with `anthropic/claude-sonnet-4.6` via `@ai-sdk/gateway`. All prompts and AI responses are in Indonesian.

### Routes

| Route | Description |
|---|---|
| `/` | Dashboard — IHSG overview, sector performance, 5 demo stocks |
| `/screener` | Stock screener with filters (P/E, ROE, dividend, D/E) |
| `/stock/[ticker]` | Stock overview |
| `/stock/[ticker]/technical` | Technical analysis (candlestick + indicators) |
| `/stock/[ticker]/valuation` | DCF valuation with sensitivity table |
| `/stock/[ticker]/earnings` | Earnings beat/miss history |
| `/stock/[ticker]/patterns` | Seasonality + insider transactions |
| `/macro` | Macro dashboard (BI Rate, CPI, GDP) |

### Components

- `components/ui/` — shadcn/ui primitives (Tailwind v4)
- `components/charts/` — financial charts using `lightweight-charts` and `recharts`
- `components/ai-elements/` — AI SDK UI building blocks (message, tool, artifact, etc.)
- `components/ai-analysis.tsx` — shared AI analysis panel used across stock pages

### Environment Variables

| Variable | Purpose |
|---|---|
| `SECTORS_API_KEY` | Live data from sectors.app; absent = mock mode |

The AI gateway (`@ai-sdk/gateway`) may require its own credentials configured separately outside this repo.
