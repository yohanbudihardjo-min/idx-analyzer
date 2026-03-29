/**
 * Portfolio-level risk calculations — Bridgewater Associates framework
 * Correlation, concentration, stress test, tail risk, liquidity, hedging
 */

import type { OHLCVData, StockInfo } from "./mock-data";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface HoldingInput {
  ticker: string;
  weight: number; // percentage 0-100
}

export interface HoldingRisk {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
  volatility: number;
  beta: number;
  maxDrawdown: number;
  var95: number;
  sharpe: number;
  liquidityRating: "High" | "Medium" | "Low";
  liquidityScore: number; // 1-10
  interestRateSensitivity: "High" | "Medium" | "Low";
}

export interface CorrelationEntry {
  ticker1: string;
  ticker2: string;
  correlation: number;
}

export interface SectorConcentration {
  sector: string;
  weight: number;
  holdings: string[];
  riskLevel: "Low" | "Medium" | "High";
}

export interface StressScenario {
  name: string;
  description: string;
  estimatedDrawdown: number;
  probability: number; // 0-1
  affectedHoldings: { ticker: string; impact: number }[];
}

export interface HedgingRecommendation {
  risk: string;
  strategy: string;
  instrument: string;
  estimatedCost: string;
}

export interface PortfolioRiskReport {
  holdings: HoldingRisk[];
  correlationMatrix: CorrelationEntry[];
  portfolioVolatility: number;
  portfolioBeta: number;
  portfolioSharpe: number;
  portfolioVaR95: number;
  portfolioMaxDrawdown: number;
  overallRiskRating: "Low" | "Medium" | "High";
  sectorConcentration: SectorConcentration[];
  herfindahlIndex: number; // concentration measure 0-1
  stressScenarios: StressScenario[];
  hedgingRecommendations: HedgingRecommendation[];
  tailRiskMetrics: {
    cvar95: number; // Conditional VaR (Expected Shortfall)
    tailIndex: number;
    worstCaseMonthly: number;
    blackSwanDrawdown: number;
  };
}

// ─── CALCULATIONS ────────────────────────────────────────────────────────────

function dailyReturns(data: OHLCVData[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
  }
  return returns;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  const aSlice = a.slice(0, n);
  const bSlice = b.slice(0, n);
  const mA = mean(aSlice);
  const mB = mean(bSlice);
  const sA = stdDev(aSlice);
  const sB = stdDev(bSlice);
  if (sA === 0 || sB === 0) return 0;
  const cov = aSlice.reduce((acc, v, i) => acc + (v - mA) * (bSlice[i] - mB), 0) / n;
  return Math.round((cov / (sA * sB)) * 100) / 100;
}

function calculateLiquidityRating(stock: StockInfo, ohlcv: OHLCVData[]): { rating: "High" | "Medium" | "Low"; score: number } {
  const avgVolume = mean(ohlcv.slice(-20).map(d => d.volume));
  const avgValueTraded = avgVolume * stock.price;

  // Score based on market cap and trading volume
  let score = 5;
  if (stock.marketCap > 200) score += 2;
  else if (stock.marketCap > 50) score += 1;
  else score -= 1;

  if (avgValueTraded > 100_000_000_000) score += 2; // > 100B IDR/day
  else if (avgValueTraded > 10_000_000_000) score += 1;
  else score -= 1;

  score = Math.max(1, Math.min(10, score));
  const rating = score >= 7 ? "High" : score >= 4 ? "Medium" : "Low";
  return { rating, score };
}

function getInterestRateSensitivity(sector: string): "High" | "Medium" | "Low" {
  const highSensitivity = ["Banking", "Financials", "Property", "Real Estate"];
  const medSensitivity = ["Consumer", "Automotive", "Infrastructure", "Telecom"];
  if (highSensitivity.some(s => sector.toLowerCase().includes(s.toLowerCase()))) return "High";
  if (medSensitivity.some(s => sector.toLowerCase().includes(s.toLowerCase()))) return "Medium";
  return "Low";
}

// ─── MAIN CALCULATION ────────────────────────────────────────────────────────

export function calculatePortfolioRisk(
  holdings: HoldingInput[],
  stockInfoMap: Record<string, StockInfo>,
  ohlcvMap: Record<string, OHLCVData[]>,
): PortfolioRiskReport {

  // ── Per-holding risk metrics ──
  const holdingRisks: HoldingRisk[] = holdings.map(h => {
    const stock = stockInfoMap[h.ticker];
    const ohlcv = ohlcvMap[h.ticker];
    const returns = dailyReturns(ohlcv);
    const vol = Math.round(stdDev(returns) * Math.sqrt(252) * 100 * 10) / 10;

    // Max drawdown
    let peak = ohlcv[0].close;
    let maxDD = 0;
    for (const d of ohlcv) {
      if (d.close > peak) peak = d.close;
      const dd = (peak - d.close) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    // VaR
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIdx = Math.floor(0.05 * sortedReturns.length);
    const var95 = Math.round(Math.abs(sortedReturns[varIdx] ?? sortedReturns[0]) * 100 * 100) / 100;

    // Sharpe
    const annualReturn = mean(returns) * 252;
    const annualVol = stdDev(returns) * Math.sqrt(252);
    const sharpe = annualVol > 0 ? Math.round(((annualReturn - 0.06) / annualVol) * 100) / 100 : 0;

    const liquidity = calculateLiquidityRating(stock, ohlcv);

    return {
      ticker: h.ticker,
      name: stock.name,
      sector: stock.sector,
      weight: h.weight,
      volatility: vol,
      beta: stock.beta,
      maxDrawdown: Math.round(maxDD * 100 * 10) / 10,
      var95,
      sharpe,
      liquidityRating: liquidity.rating,
      liquidityScore: liquidity.score,
      interestRateSensitivity: getInterestRateSensitivity(stock.sector),
    };
  });

  // ── Correlation matrix ──
  const returnsMap: Record<string, number[]> = {};
  for (const h of holdings) {
    returnsMap[h.ticker] = dailyReturns(ohlcvMap[h.ticker]);
  }

  const correlations: CorrelationEntry[] = [];
  for (let i = 0; i < holdings.length; i++) {
    for (let j = i + 1; j < holdings.length; j++) {
      correlations.push({
        ticker1: holdings[i].ticker,
        ticker2: holdings[j].ticker,
        correlation: correlation(returnsMap[holdings[i].ticker], returnsMap[holdings[j].ticker]),
      });
    }
  }

  // ── Portfolio-level metrics (weighted) ──
  const weights = holdings.map(h => h.weight / 100);

  // Portfolio volatility with correlation
  let portfolioVar = 0;
  for (let i = 0; i < holdings.length; i++) {
    const volI = holdingRisks[i].volatility / 100;
    for (let j = 0; j < holdings.length; j++) {
      const volJ = holdingRisks[j].volatility / 100;
      let corr = 1;
      if (i !== j) {
        const entry = correlations.find(
          c => (c.ticker1 === holdings[i].ticker && c.ticker2 === holdings[j].ticker)
            || (c.ticker1 === holdings[j].ticker && c.ticker2 === holdings[i].ticker)
        );
        corr = entry?.correlation ?? 0.5;
      }
      portfolioVar += weights[i] * weights[j] * volI * volJ * corr;
    }
  }
  const portfolioVolatility = Math.round(Math.sqrt(portfolioVar) * 100 * 10) / 10;

  const portfolioBeta = Math.round(
    holdingRisks.reduce((acc, h) => acc + (h.weight / 100) * h.beta, 0) * 100
  ) / 100;

  const portfolioSharpe = Math.round(
    holdingRisks.reduce((acc, h) => acc + (h.weight / 100) * h.sharpe, 0) * 100
  ) / 100;

  // Portfolio VaR (parametric, assumes normal)
  const portfolioVaR95 = Math.round(portfolioVolatility * 1.645 * 10) / 10;

  // Portfolio max drawdown (weighted average with correlation penalty)
  const avgCorr = correlations.length > 0
    ? mean(correlations.map(c => c.correlation))
    : 1;
  const diversificationBenefit = Math.max(0.7, 1 - (1 - avgCorr) * 0.3);
  const portfolioMaxDrawdown = Math.round(
    holdingRisks.reduce((acc, h) => acc + (h.weight / 100) * h.maxDrawdown, 0) * diversificationBenefit * 10
  ) / 10;

  // ── Overall risk rating ──
  const overallRiskRating: PortfolioRiskReport["overallRiskRating"] =
    portfolioVolatility > 30 || portfolioBeta > 1.2 ? "High"
    : portfolioVolatility > 18 || portfolioBeta > 0.9 ? "Medium"
    : "Low";

  // ── Sector concentration ──
  const sectorMap: Record<string, { weight: number; holdings: string[] }> = {};
  for (const h of holdingRisks) {
    if (!sectorMap[h.sector]) sectorMap[h.sector] = { weight: 0, holdings: [] };
    sectorMap[h.sector].weight += h.weight;
    sectorMap[h.sector].holdings.push(h.ticker);
  }
  const sectorConcentration: SectorConcentration[] = Object.entries(sectorMap)
    .map(([sector, data]) => ({
      sector,
      weight: Math.round(data.weight * 10) / 10,
      holdings: data.holdings,
      riskLevel: data.weight > 50 ? "High" as const : data.weight > 30 ? "Medium" as const : "Low" as const,
    }))
    .sort((a, b) => b.weight - a.weight);

  // Herfindahl Index (position concentration)
  const herfindahlIndex = Math.round(
    holdings.reduce((acc, h) => acc + Math.pow(h.weight / 100, 2), 0) * 1000
  ) / 1000;

  // ── Stress Scenarios ──
  const stressScenarios: StressScenario[] = [
    {
      name: "Resesi Global (2008-style)",
      description: "Krisis finansial global, credit freeze, capital outflow masif dari emerging markets",
      estimatedDrawdown: Math.round(portfolioMaxDrawdown * 1.8 * 10) / 10,
      probability: 0.05,
      affectedHoldings: holdingRisks.map(h => ({
        ticker: h.ticker,
        impact: Math.round(-h.maxDrawdown * 1.5 * 10) / 10,
      })),
    },
    {
      name: "BI Rate Naik 200bps",
      description: "Bank Indonesia menaikkan suku bunga agresif untuk stabilisasi Rupiah",
      estimatedDrawdown: Math.round(
        holdingRisks.reduce((acc, h) => {
          const sensitivity = h.interestRateSensitivity === "High" ? 0.20
            : h.interestRateSensitivity === "Medium" ? 0.12 : 0.05;
          return acc + (h.weight / 100) * sensitivity * 100;
        }, 0) * 10
      ) / 10,
      probability: 0.10,
      affectedHoldings: holdingRisks.map(h => ({
        ticker: h.ticker,
        impact: h.interestRateSensitivity === "High" ? -20
          : h.interestRateSensitivity === "Medium" ? -12 : -5,
      })),
    },
    {
      name: "Rupiah Depresiasi 15%",
      description: "Pelemahan IDR/USD tajam akibat outflow asing dan defisit current account",
      estimatedDrawdown: Math.round(portfolioMaxDrawdown * 1.2 * 10) / 10,
      probability: 0.08,
      affectedHoldings: holdingRisks.map(h => ({
        ticker: h.ticker,
        impact: Math.round(-h.volatility * 0.6 * 10) / 10,
      })),
    },
    {
      name: "Koreksi IHSG -20%",
      description: "Koreksi pasar moderat tanpa resesi, profit-taking setelah rally panjang",
      estimatedDrawdown: Math.round(20 * portfolioBeta * 10) / 10,
      probability: 0.15,
      affectedHoldings: holdingRisks.map(h => ({
        ticker: h.ticker,
        impact: Math.round(-20 * h.beta * 10) / 10,
      })),
    },
  ];

  // ── Tail Risk ──
  // CVaR: average of returns below VaR threshold
  const allPortfolioReturns: number[] = [];
  const minLen = Math.min(...Object.values(returnsMap).map(r => r.length));
  for (let i = 0; i < minLen; i++) {
    let portReturn = 0;
    for (const h of holdings) {
      portReturn += (h.weight / 100) * (returnsMap[h.ticker][i] ?? 0);
    }
    allPortfolioReturns.push(portReturn);
  }
  const sortedPortReturns = [...allPortfolioReturns].sort((a, b) => a - b);
  const varThreshIdx = Math.floor(0.05 * sortedPortReturns.length);
  const tailReturns = sortedPortReturns.slice(0, varThreshIdx);
  const cvar95 = tailReturns.length > 0
    ? Math.round(Math.abs(mean(tailReturns)) * 100 * 100) / 100
    : portfolioVaR95 * 1.3;

  const worstDaily = sortedPortReturns.length > 0
    ? Math.abs(sortedPortReturns[0]) : 0;
  const worstCaseMonthly = Math.round(worstDaily * Math.sqrt(21) * 100 * 10) / 10;

  const tailRiskMetrics = {
    cvar95,
    tailIndex: Math.round((cvar95 / (portfolioVaR95 || 1)) * 100) / 100,
    worstCaseMonthly,
    blackSwanDrawdown: Math.round(portfolioMaxDrawdown * 2.5 * 10) / 10,
  };

  // ── Hedging Recommendations ──
  const hedgingRecommendations: HedgingRecommendation[] = [];

  // Top risk: highest sector concentration
  const topSector = sectorConcentration[0];
  if (topSector && topSector.weight > 30) {
    hedgingRecommendations.push({
      risk: `Konsentrasi sektor ${topSector.sector} (${topSector.weight}%)`,
      strategy: "Diversifikasi ke sektor defensif (Consumer Staples, Utilities) atau ETF sektoral",
      instrument: "ETF LQ45 / Reksa Dana Indeks untuk diversifikasi otomatis",
      estimatedCost: "0.3-0.5% management fee per tahun",
    });
  }

  // Market risk (high beta)
  if (portfolioBeta > 0.9) {
    hedgingRecommendations.push({
      risk: `Beta portofolio tinggi (${portfolioBeta})`,
      strategy: "Tambah alokasi obligasi pemerintah (ORI/SBR) untuk menurunkan beta portofolio",
      instrument: "ORI / SBR Pemerintah (risk-free, kupon 6.5-7%)",
      estimatedCost: "Opportunity cost ~4-5% vs equity return",
    });
  }

  // Currency risk
  hedgingRecommendations.push({
    risk: "Eksposur mata uang (IDR weakening risk)",
    strategy: "Alokasi 5-10% ke aset berdenominasi USD atau emas sebagai hedge",
    instrument: "Reksa Dana Emas / USD Money Market Fund",
    estimatedCost: "0.5-1% management fee + currency conversion cost",
  });

  return {
    holdings: holdingRisks,
    correlationMatrix: correlations,
    portfolioVolatility,
    portfolioBeta,
    portfolioSharpe,
    portfolioVaR95,
    portfolioMaxDrawdown,
    overallRiskRating,
    sectorConcentration,
    herfindahlIndex,
    stressScenarios,
    hedgingRecommendations,
    tailRiskMetrics,
  };
}
