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

**IDX Analyzer** is a Next.js 16 (App Router) stock analysis dashboard for Indonesia's IDX/BEI market. It provides 13 AI-powered analysis frameworks, each with a distinct Wall Street firm persona (e.g. Goldman Sachs, Citadel, Morgan Stanley). All AI prompts and responses are in **Indonesian (Bahasa Indonesia)**.

### Data Layer (`lib/`)

`lib/sectors.ts` is the single data access point. It uses a **mock/live adapter pattern**: `USE_MOCK = !process.env.SECTORS_API_KEY`. When no API key is set, all functions return data from `lib/mock-data.ts` (5 demo tickers: BBCA, TLKM, ASII, BMRI, GOTO). Setting `SECTORS_API_KEY` in `.env.local` switches to the live [sectors.app](https://sectors.app) API with no UI changes needed. Live mode uses **v1** endpoints for per-ticker data and **v2** for the screener. API responses are transformed to match the app's TypeScript interfaces via `transform*` functions in the same file.

- `lib/indicators.ts` — server-side technical indicator calculations (RSI, MACD, Bollinger Bands, moving averages, support/resistance)
- `lib/dcf.ts` — DCF valuation model (WACC calc, 5-year projections, sensitivity table)
- `lib/portfolio-risk.ts` — portfolio-level risk calculations (correlation, stress test, tail risk, hedging)
- `lib/sectors.ts` — data adapter (mock ↔ live); unknown tickers fall back to BBCA
- `lib/mock-data.ts` — static demo data for 5 tickers across 3 sectors (Banking, Telecom, Consumer/Auto)

### AI Endpoint (`app/api/ai/[framework]/route.ts`)

Single streaming POST endpoint. The `[framework]` path segment selects a system prompt persona (e.g. `overview` → Goldman Sachs analyst, `technical` → Citadel quant). Uses `streamText` from Vercel AI SDK with `anthropic/claude-sonnet-4.6` via `@ai-sdk/gateway`. All prompts and AI responses are in Indonesian.

### Routes

| Route | Description |
|---|---|
| `/` | Dashboard — IHSG overview, sector performance, 5 demo stocks, 13 framework cards |
| `/screener` | Stock screener with filters (P/E, ROE, dividend, D/E, sector) |
| `/compare` | Side-by-side comparison of 5 stocks |
| `/competitive` | Competitive analysis by sector (Bain framework) |
| `/portfolio` | Portfolio builder with allocation, DCA, rebalancing, IPS |
| `/income` | Dividend income strategy & DRIP compounding |
| `/macro` | Macro dashboard (BI Rate, CPI, GDP) |
| `/stock/[ticker]` | Stock overview with signal cards |
| `/stock/[ticker]/technical` | Technical analysis (candlestick + indicators) |
| `/stock/[ticker]/valuation` | DCF valuation with sensitivity table |
| `/stock/[ticker]/earnings` | Earnings beat/miss history |
| `/stock/[ticker]/dividend` | Dividend yield, payout ratio, DPS history |
| `/stock/[ticker]/patterns` | Seasonality + insider transactions |
| `/stock/[ticker]/risk` | Beta, volatility, max drawdown, VaR, Sharpe ratio |
| `/stock/[ticker]/foreign` | Foreign investor flow, net buy/sell, ownership % |

Stock detail pages share a layout (`/stock/[ticker]/layout.tsx`) that fetches stock info server-side and renders `StockTabNav` for sub-route navigation.

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

### Key Conventions

- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`; custom finance colors (`--color-bullish`, `--color-bearish`) defined in `app/globals.css`; dark theme by default
- **UI primitives:** shadcn/ui with `base-nova` style; configured in `components.json`; uses `@base-ui/react`
- **Path aliases:** `@/*` maps to project root (e.g. `@/lib/utils`, `@/components/ui/button`)
- **TypeScript:** Strict mode enabled; build errors suppressed in `next.config.ts` due to `@base-ui/react` incompatibilities
- **AI streaming:** `components/ai-analysis.tsx` uses `useCompletion` from `@ai-sdk/react` to call `/api/ai/[framework]`; renders markdown via `components/ai-elements/message.tsx`
