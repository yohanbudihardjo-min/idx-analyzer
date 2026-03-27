/**
 * sectors.ts — Mock adapter for sectors.app API
 *
 * Pattern: USE_MOCK = true ketika tidak ada SECTORS_API_KEY
 * Untuk swap ke API real, cukup set SECTORS_API_KEY di .env.local
 * Tidak ada perubahan UI yang diperlukan.
 */

import {
  stockInfo,
  financials,
  quarterlyEarnings,
  ohlcvData,
  insiderTransactions,
  seasonalityData,
  allStocks,
  marketOverview,
  type StockInfo,
  type FinancialStatement,
  type QuarterlyEarnings,
  type OHLCVData,
  type InsiderTransaction,
  type SeasonalityData,
} from "./mock-data";

const USE_MOCK = !process.env.SECTORS_API_KEY;
const API_BASE = "https://api.sectors.app/v2";

async function fetchSectors(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${process.env.SECTORS_API_KEY}` },
    next: { revalidate: 3600 }, // 1 hour cache
  });
  if (!res.ok) throw new Error(`sectors.app API error: ${res.status}`);
  return res.json();
}

// ─── MOCK FALLBACK ─────────────────────────────────────────────────────────

function getDefaultTicker(ticker: string): string {
  const available = ["BBCA", "TLKM", "ASII", "BMRI", "GOTO"];
  return available.includes(ticker.toUpperCase()) ? ticker.toUpperCase() : "BBCA";
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────

export async function getStockInfo(ticker: string): Promise<StockInfo> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return stockInfo[t] ?? stockInfo.BBCA;

  const data = await fetchSectors(`/companies/${t}/overview`);
  return data as StockInfo;
}

export async function getFinancials(ticker: string): Promise<FinancialStatement[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return financials[t] ?? financials.BBCA;

  const data = await fetchSectors(`/companies/${t}/financials?period=annual&years=5`);
  return data as FinancialStatement[];
}

export async function getQuarterlyEarnings(ticker: string): Promise<QuarterlyEarnings[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return quarterlyEarnings[t] ?? quarterlyEarnings.BBCA;

  const data = await fetchSectors(`/companies/${t}/earnings`);
  return data as QuarterlyEarnings[];
}

export async function getOHLCV(ticker: string): Promise<OHLCVData[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return ohlcvData[t] ?? ohlcvData.BBCA;

  // sectors.app daily transaction (max 90 days), supplement with Yahoo for longer history
  const data = await fetchSectors(`/companies/${t}/daily?start=2023-03-27`);
  return data as OHLCVData[];
}

export async function getInsiderTransactions(ticker: string): Promise<InsiderTransaction[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return insiderTransactions[t] ?? insiderTransactions.BBCA;

  const data = await fetchSectors(`/companies/${t}/filings?type=insider`);
  return data as InsiderTransaction[];
}

export async function getSeasonality(ticker: string): Promise<SeasonalityData[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return seasonalityData[t] ?? seasonalityData.BBCA;

  // Calculate from historical prices
  const data = await fetchSectors(`/companies/${t}/daily?start=2015-01-01`);
  return data as SeasonalityData[];
}

export async function getScreenerData(filters?: {
  maxPE?: number;
  minDividend?: number;
  maxDE?: number;
  sector?: string;
  minROE?: number;
}) {
  if (USE_MOCK) {
    let results = allStocks;
    if (filters?.maxPE) results = results.filter((s) => s.pe !== null && s.pe <= filters.maxPE!);
    if (filters?.minDividend) results = results.filter((s) => s.dividendYield >= filters.minDividend!);
    if (filters?.maxDE) results = results.filter((s) => s.de <= filters.maxDE!);
    if (filters?.sector) results = results.filter((s) => s.sector === filters.sector);
    if (filters?.minROE) results = results.filter((s) => s.roe >= filters.minROE!);
    return results;
  }

  const params = new URLSearchParams();
  if (filters?.maxPE) params.set("where", `pe <= ${filters.maxPE}`);
  const data = await fetchSectors(`/companies/?${params}`);
  return data;
}

export async function getMarketOverview() {
  if (USE_MOCK) return marketOverview;

  const data = await fetchSectors(`/idx/market-summary`);
  return data;
}

export { USE_MOCK };
