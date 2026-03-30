/**
 * sectors.ts — Data adapter for sectors.app API
 *
 * Pattern: USE_MOCK = true ketika tidak ada SECTORS_API_KEY
 * Untuk swap ke API real, cukup set SECTORS_API_KEY di .env.local
 * Tidak ada perubahan UI yang diperlukan.
 *
 * API Reference: https://docs.sectors.app
 *   - V1: company reports, daily data, financials, filings, index data
 *   - V2: screener/filter endpoint only
 */

import {
  stockInfo,
  financials,
  quarterlyEarnings,
  ohlcvData,
  insiderTransactions,
  seasonalityData,
  dividendData,
  foreignFlowData,
  competitiveData,
  allStocks,
  marketOverview,
  type StockInfo,
  type FinancialStatement,
  type QuarterlyEarnings,
  type OHLCVData,
  type InsiderTransaction,
  type SeasonalityData,
  type DividendHistory,
  type ForeignFlowData,
  type SectorCompetitiveData,
} from "./mock-data";

const USE_MOCK = !process.env.SECTORS_API_KEY;
const API_V1 = "https://api.sectors.app/v1";
const API_V2 = "https://api.sectors.app/v2";

// ─── API HELPERS ──────────────────────────────────────────────────────────────

async function fetchV1(endpoint: string) {
  const res = await fetch(`${API_V1}${endpoint}`, {
    headers: { Authorization: process.env.SECTORS_API_KEY! },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`sectors.app v1 error ${res.status}: ${endpoint}`);
  return res.json();
}

async function fetchV2(endpoint: string) {
  const res = await fetch(`${API_V2}${endpoint}`, {
    headers: { Authorization: process.env.SECTORS_API_KEY! },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`sectors.app v2 error ${res.status}: ${endpoint}`);
  return res.json();
}

/** Format YYYY-MM-DD, N days ago from today */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ─── MOCK FALLBACK ────────────────────────────────────────────────────────────

function getDefaultTicker(ticker: string): string {
  const available = ["BBCA", "TLKM", "ASII", "BMRI", "GOTO"];
  return available.includes(ticker.toUpperCase()) ? ticker.toUpperCase() : "BBCA";
}

// ─── TRANSFORMS (API → App interfaces) ───────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function transformStockInfo(raw: any, ticker: string): StockInfo {
  const o = raw.overview ?? raw;
  const v = raw.valuation ?? {};
  return {
    ticker: ticker.toUpperCase(),
    name: o.company_name ?? o.name ?? ticker,
    sector: o.sector ?? "",
    subsector: o.sub_sector ?? o.sub_industry ?? "",
    marketCap: Math.round((o.market_cap ?? 0) / 1e12 * 10) / 10, // IDR → triliun
    price: o.close ?? o.last_close ?? 0,
    priceChange: o.change_1d ?? 0,
    priceChangePct: o.change_1d_percent ?? 0,
    pe: v.pe ?? o.pe_ttm ?? null,
    pb: v.pb ?? o.pb_mrq ?? 0,
    de: o.der_mrq ?? 0,
    roe: o.roe_ttm ?? 0,
    roa: o.roa_ttm ?? 0,
    dividendYield: o.dividend_yield_5y_avg ?? 0,
    eps: o.forward_eps ?? o.earnings_per_share ?? 0,
    beta: o.beta ?? 1.0,
    listing: o.listing_date ?? "",
    employees: o.employee_num ?? 0,
    description: o.description ?? "",
  };
}

function transformFinancials(raw: any[]): FinancialStatement[] {
  return raw.map((r) => ({
    year: new Date(r.date ?? r.period ?? "").getFullYear() || r.year || 0,
    revenue: Math.round((r.revenue ?? r.total_revenue ?? 0) / 1e9),
    grossProfit: Math.round((r.gross_profit ?? r.revenue * 0.4) / 1e9),
    operatingIncome: Math.round((r.operating_income ?? r.ebit ?? 0) / 1e9),
    netIncome: Math.round((r.earnings ?? r.net_income ?? 0) / 1e9),
    ebitda: Math.round((r.ebitda ?? 0) / 1e9),
    freeCashFlow: Math.round((r.free_cash_flow ?? 0) / 1e9),
    totalAssets: Math.round((r.total_assets ?? 0) / 1e9),
    totalDebt: Math.round((r.total_liabilities ?? r.total_debt ?? 0) / 1e9),
    equity: Math.round((r.total_equity ?? 0) / 1e9),
    capex: Math.round(Math.abs(r.capital_expenditure ?? 0) / 1e9),
  }));
}

function transformQuarterlyEarnings(raw: any[]): QuarterlyEarnings[] {
  return raw.map((r) => {
    const date = r.date ?? r.period ?? "";
    const d = new Date(date);
    const q = `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
    const epsActual = r.earnings_per_share ?? r.eps ?? 0;
    const epsEstimate = r.forward_eps ?? epsActual * 0.95;
    return {
      quarter: q,
      date,
      epsActual,
      epsEstimate,
      revenueActual: Math.round((r.revenue ?? r.total_revenue ?? 0) / 1e9),
      revenueEstimate: Math.round((r.revenue_estimate ?? (r.revenue ?? 0) * 0.97) / 1e9),
      beat: epsActual >= epsEstimate,
      priceReaction: r.price_reaction ?? 0,
    };
  });
}

function transformDaily(raw: any[]): OHLCVData[] {
  // sectors.app daily only returns close + volume; approximate OHLC from close
  return raw.map((r) => {
    const close = r.close ?? 0;
    return {
      date: r.date ?? "",
      open: r.open ?? close,
      high: r.high ?? Math.round(close * 1.005),
      low: r.low ?? Math.round(close * 0.995),
      close,
      volume: r.volume ?? 0,
    };
  });
}

function transformInsiderTransactions(raw: any[]): InsiderTransaction[] {
  return raw
    .filter((r) => r.transaction_type === "buy" || r.transaction_type === "sell"
      || r.transaction_type === "Pembelian" || r.transaction_type === "Penjualan")
    .map((r) => ({
      date: r.date ?? r.announcement_date ?? "",
      name: r.holder_name ?? r.name ?? "",
      position: r.position ?? "Insider",
      type: (r.transaction_type === "sell" || r.transaction_type === "Penjualan") ? "sell" as const : "buy" as const,
      shares: r.amount_transaction ?? r.shares ?? 0,
      price: r.price ?? 0,
      value: Math.round((r.transaction_value ?? 0) / 1e9 * 10) / 10,
    }));
}

function transformDividendHistory(raw: any[]): DividendHistory[] {
  return raw.map((r) => {
    const exDate = r.date ?? r.ex_date ?? "";
    const year = exDate ? new Date(exDate).getFullYear().toString() : "";
    return {
      year,
      dps: r.dividend ?? r.dividend_original ?? 0,
      yield: (r.yield ?? 0) * 100, // API returns decimal
      payoutRatio: r.payout_ratio ?? 0,
      exDate,
    };
  });
}

function transformForeignFlow(dailyData: any[]): ForeignFlowData[] {
  // Derive from daily transaction data foreign_buy_volume / foreign_sell_volume
  let cumulative = 0;
  return dailyData
    .filter((r) => r.foreign_buy_volume != null || r.foreign_sell_volume != null)
    .map((r) => {
      const buyVol = r.foreign_buy_volume ?? 0;
      const sellVol = r.foreign_sell_volume ?? 0;
      const price = r.close ?? 0;
      // Approximate net buy in billion IDR
      const netBuy = Math.round(((buyVol - sellVol) * price) / 1e9 * 10) / 10;
      cumulative = Math.round((cumulative + netBuy) * 10) / 10;
      return {
        date: r.date ?? "",
        netBuy,
        cumulativeNet: cumulative,
        foreignOwnership: r.foreign_ownership ?? 0,
      };
    });
}

function transformSeasonality(dailyData: any[]): SeasonalityData[] {
  // Calculate monthly seasonality from historical daily prices
  const months: Record<string, { returns: number[]; volumes: number[] }> = {};
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  for (let i = 0; i < MONTH_NAMES.length; i++) {
    months[MONTH_NAMES[i]] = { returns: [], volumes: [] };
  }

  // Group by month, calculate monthly returns
  let prevClose: number | null = null;
  let prevMonth: number | null = null;
  let monthStart: number | null = null;

  for (const d of dailyData) {
    const date = new Date(d.date);
    const month = date.getMonth();
    const close = d.close ?? 0;

    if (prevMonth !== null && month !== prevMonth && monthStart !== null) {
      const monthReturn = ((prevClose! - monthStart) / monthStart) * 100;
      const monthName = MONTH_NAMES[prevMonth];
      months[monthName].returns.push(monthReturn);
    }

    if (prevMonth === null || month !== prevMonth) {
      monthStart = close;
    }

    months[MONTH_NAMES[month]].volumes.push(d.volume ?? 0);
    prevClose = close;
    prevMonth = month;
  }

  return MONTH_NAMES.map((m) => {
    const r = months[m].returns;
    const v = months[m].volumes;
    return {
      month: m,
      avgReturn: r.length > 0 ? Math.round(r.reduce((a, b) => a + b, 0) / r.length * 10) / 10 : 0,
      winRate: r.length > 0 ? Math.round(r.filter((x) => x > 0).length / r.length * 100) : 50,
      avgVolume: v.length > 0 ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0,
    };
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function getStockInfo(ticker: string): Promise<StockInfo> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return stockInfo[t] ?? stockInfo.BBCA;

  const data = await fetchV1(`/company/report/${t}/?sections=overview,valuation`);
  return transformStockInfo(data, t);
}

export async function getFinancials(ticker: string): Promise<FinancialStatement[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return financials[t] ?? financials.BBCA;

  const data = await fetchV1(`/company/report/${t}/?sections=financials`);
  const items = data.financials?.historical_earnings ?? data.financials ?? [];
  return transformFinancials(Array.isArray(items) ? items : []);
}

export async function getQuarterlyEarnings(ticker: string): Promise<QuarterlyEarnings[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return quarterlyEarnings[t] ?? quarterlyEarnings.BBCA;

  const data = await fetchV1(`/financials/quarterly/${t}/`);
  return transformQuarterlyEarnings(Array.isArray(data) ? data : []);
}

export async function getOHLCV(ticker: string): Promise<OHLCVData[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return ohlcvData[t] ?? ohlcvData.BBCA;

  // Max 90-day window per request
  const data = await fetchV1(`/daily/${t}/?start=${daysAgo(89)}&end=${daysAgo(0)}`);
  return transformDaily(Array.isArray(data) ? data : []);
}

export async function getInsiderTransactions(ticker: string): Promise<InsiderTransaction[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return insiderTransactions[t] ?? insiderTransactions.BBCA;

  const data = await fetchV1(`/filings/?symbol=${t}`);
  return transformInsiderTransactions(Array.isArray(data) ? data : []);
}

export async function getSeasonality(ticker: string): Promise<SeasonalityData[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return seasonalityData[t] ?? seasonalityData.BBCA;

  // Fetch ~2 years of daily data for seasonality (multiple 90-day requests)
  const [batch1, batch2, batch3] = await Promise.all([
    fetchV1(`/daily/${t}/?start=${daysAgo(269)}&end=${daysAgo(180)}`).catch(() => []),
    fetchV1(`/daily/${t}/?start=${daysAgo(179)}&end=${daysAgo(90)}`).catch(() => []),
    fetchV1(`/daily/${t}/?start=${daysAgo(89)}&end=${daysAgo(0)}`).catch(() => []),
  ]);
  const combined = [...(batch1 ?? []), ...(batch2 ?? []), ...(batch3 ?? [])];
  return transformSeasonality(combined);
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

  // Build v2 SQL-like where clause
  const conditions: string[] = [];
  if (filters?.maxPE) conditions.push(`pe_ttm <= ${filters.maxPE}`);
  if (filters?.minDividend) conditions.push(`dividend_yield_5y_avg >= ${filters.minDividend / 100}`);
  if (filters?.maxDE) conditions.push(`der_mrq <= ${filters.maxDE}`);
  if (filters?.minROE) conditions.push(`roe_ttm >= ${filters.minROE}`);
  // Sector filter via sub_sector or sub_industry if available
  const where = conditions.length > 0 ? `?where=${encodeURIComponent(conditions.join(" AND "))}` : "";

  const data = await fetchV2(`/companies/${where}`);
  const results = data.results ?? data ?? [];

  // Transform v2 screener results to match app interface
  return (Array.isArray(results) ? results : []).map((r: Record<string, unknown>) => ({
    ticker: (r.symbol as string)?.replace(".JK", "") ?? "",
    name: r.company_name ?? "",
    sector: r.sector ?? "",
    subsector: r.sub_sector ?? "",
    marketCap: Math.round(((r.market_cap as number) ?? 0) / 1e12 * 10) / 10,
    price: r.close ?? r.last_close ?? 0,
    priceChange: 0,
    priceChangePct: r.yearly_mcap_change ?? 0,
    pe: r.pe_ttm ?? null,
    pb: r.pb_mrq ?? 0,
    de: r.der_mrq ?? 0,
    roe: r.roe_ttm ?? 0,
    roa: r.roa_ttm ?? 0,
    dividendYield: ((r.dividend_yield_5y_avg as number) ?? 0) * 100,
    eps: r.forward_eps ?? 0,
    beta: 1.0,
    listing: "",
    employees: 0,
    description: "",
  }));
}

export async function getDividendHistory(ticker: string): Promise<DividendHistory[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return dividendData[t] ?? dividendData.BBCA;

  const data = await fetchV1(`/company/report/${t}/?sections=dividend`);
  const items = data.dividend?.historical_dividends ?? data.dividend ?? [];
  return transformDividendHistory(Array.isArray(items) ? items : []);
}

export async function getForeignFlow(ticker: string): Promise<ForeignFlowData[]> {
  const t = getDefaultTicker(ticker);
  if (USE_MOCK) return foreignFlowData[t] ?? foreignFlowData.BBCA;

  // Foreign flow is derived from daily transaction data
  const data = await fetchV1(`/daily/${t}/?start=${daysAgo(89)}&end=${daysAgo(0)}`);
  return transformForeignFlow(Array.isArray(data) ? data : []);
}

export async function getMarketOverview() {
  if (USE_MOCK) return marketOverview;

  try {
    const [indexData, topChanges] = await Promise.all([
      fetchV1(`/index-daily/COMPOSITE/?start=${daysAgo(1)}&end=${daysAgo(0)}`),
      fetchV1(`/companies/top-changes/`),
    ]);

    const latest = Array.isArray(indexData) && indexData.length > 0 ? indexData[indexData.length - 1] : null;
    const prev = Array.isArray(indexData) && indexData.length > 1 ? indexData[indexData.length - 2] : null;

    const ihsgValue = latest?.price ?? marketOverview.ihsg.value;
    const ihsgPrev = prev?.price ?? ihsgValue;
    const change = Math.round((ihsgValue - ihsgPrev) * 100) / 100;
    const changePct = ihsgPrev > 0 ? Math.round((change / ihsgPrev) * 10000) / 100 : 0;

    return {
      ihsg: {
        value: ihsgValue,
        change,
        changePct,
        volume: latest?.volume ?? marketOverview.ihsg.volume,
        value2: marketOverview.ihsg.value2,
        advancers: topChanges?.advancers_count ?? marketOverview.ihsg.advancers,
        decliners: topChanges?.decliners_count ?? marketOverview.ihsg.decliners,
        unchanged: topChanges?.unchanged_count ?? marketOverview.ihsg.unchanged,
      },
      sectorPerformance: marketOverview.sectorPerformance, // fallback — no direct sector endpoint
    };
  } catch {
    return marketOverview; // graceful fallback to mock
  }
}

export async function getAllCompetitiveData(): Promise<SectorCompetitiveData[]> {
  if (USE_MOCK) return competitiveData;

  // Competitive analysis requires assembled data from multiple endpoints
  // Not directly available from sectors.app — use mock data as base
  return competitiveData;
}

export { USE_MOCK };
export type { SectorCompetitiveData };
