/**
 * Technical indicators — dihitung server-side dari OHLCV data
 * RSI, MACD, Bollinger Bands, Moving Averages, Support/Resistance
 */

import type { OHLCVData } from "./mock-data";

export interface MAData {
  date: string;
  ma50: number | null;
  ma100: number | null;
  ma200: number | null;
}

export interface RSIData {
  date: string;
  rsi: number;
}

export interface MACDData {
  date: string;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BBData {
  date: string;
  upper: number;
  middle: number;
  lower: number;
}

export interface TechnicalSummary {
  ma50: number;
  ma100: number;
  ma200: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  bbUpper: number;
  bbLower: number;
  support: number;
  resistance: number;
  trend: "bullish" | "bearish" | "sideways";
  volumeSignal: "increasing" | "decreasing" | "stable";
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────

function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else if (i === period - 1) {
      result.push(prev);
    } else {
      prev = values[i] * k + prev * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

// ─── INDICATORS ───────────────────────────────────────────────────────────────

export function calculateMA(data: OHLCVData[]): MAData[] {
  const closes = data.map((d) => d.close);
  const ma50 = sma(closes, 50);
  const ma100 = sma(closes, 100);
  const ma200 = sma(closes, 200);

  return data.map((d, i) => ({
    date: d.date,
    ma50: ma50[i],
    ma100: ma100[i],
    ma200: ma200[i],
  }));
}

export function calculateRSI(data: OHLCVData[], period = 14): RSIData[] {
  const closes = data.map((d) => d.close);
  const result: RSIData[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push({ date: data[i].date, rsi: 50 });
      continue;
    }

    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    result.push({ date: data[i].date, rsi: Math.round(rsi * 10) / 10 });
  }

  return result;
}

export function calculateMACD(
  data: OHLCVData[],
  fast = 12,
  slow = 26,
  signal = 9
): MACDData[] {
  const closes = data.map((d) => d.close);
  const ema12 = ema(closes, fast);
  const ema26 = ema(closes, slow);

  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, signal);

  return data.map((d, i) => ({
    date: d.date,
    macd: Math.round(macdLine[i] * 10) / 10,
    signal: Math.round(signalLine[i] * 10) / 10,
    histogram: Math.round((macdLine[i] - signalLine[i]) * 10) / 10,
  }));
}

export function calculateBollingerBands(
  data: OHLCVData[],
  period = 20,
  stdDev = 2
): BBData[] {
  const closes = data.map((d) => d.close);
  const middle = sma(closes, period);

  return data.map((d, i) => {
    const m = middle[i];
    if (m === null) {
      return { date: d.date, upper: d.close, middle: d.close, lower: d.close };
    }

    const slice = closes.slice(Math.max(0, i - period + 1), i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / slice.length;
    const std = Math.sqrt(variance);

    return {
      date: d.date,
      upper: Math.round(m + stdDev * std),
      middle: Math.round(m),
      lower: Math.round(m - stdDev * std),
    };
  });
}

export function calculateSupportResistance(data: OHLCVData[]): {
  support: number;
  resistance: number;
} {
  const recent = data.slice(-60); // Last 60 candles
  const lows = recent.map((d) => d.low);
  const highs = recent.map((d) => d.high);

  const support = Math.min(...lows) * 1.01; // Slightly above absolute low
  const resistance = Math.max(...highs) * 0.99; // Slightly below absolute high

  return {
    support: Math.round(support),
    resistance: Math.round(resistance),
  };
}

export function buildTechnicalSummary(data: OHLCVData[]): TechnicalSummary {
  const maData = calculateMA(data);
  const rsiData = calculateRSI(data);
  const macdData = calculateMACD(data);
  const bbData = calculateBollingerBands(data);
  const { support, resistance } = calculateSupportResistance(data);

  const last = data.length - 1;
  const lastMA = maData[last];
  const lastRSI = rsiData[last];
  const lastMACD = macdData[last];
  const lastBB = bbData[last];

  const currentPrice = data[last].close;

  // Trend determination
  const isAboveMA50 = lastMA.ma50 && currentPrice > lastMA.ma50;
  const isAboveMA200 = lastMA.ma200 && currentPrice > lastMA.ma200;
  const macdBullish = lastMACD.macd > lastMACD.signal;

  const trend: TechnicalSummary["trend"] =
    isAboveMA50 && isAboveMA200 && macdBullish
      ? "bullish"
      : !isAboveMA50 && !isAboveMA200 && !macdBullish
      ? "bearish"
      : "sideways";

  // Volume trend
  const recentVol = data.slice(-10).map((d) => d.volume);
  const prevVol = data.slice(-20, -10).map((d) => d.volume);
  const avgRecent = recentVol.reduce((a, b) => a + b, 0) / recentVol.length;
  const avgPrev = prevVol.reduce((a, b) => a + b, 0) / prevVol.length;
  const volumeSignal: TechnicalSummary["volumeSignal"] =
    avgRecent > avgPrev * 1.1
      ? "increasing"
      : avgRecent < avgPrev * 0.9
      ? "decreasing"
      : "stable";

  return {
    ma50: Math.round(lastMA.ma50 ?? currentPrice),
    ma100: Math.round(lastMA.ma100 ?? currentPrice),
    ma200: Math.round(lastMA.ma200 ?? currentPrice),
    rsi: lastRSI.rsi,
    macd: lastMACD.macd,
    macdSignal: lastMACD.signal,
    bbUpper: lastBB.upper,
    bbLower: lastBB.lower,
    support,
    resistance,
    trend,
    volumeSignal,
  };
}
