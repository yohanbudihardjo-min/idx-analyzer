import { NextResponse } from "next/server";
import { getStockInfo, getOHLCV } from "@/lib/sectors";
import { calculatePortfolioRisk, type HoldingInput } from "@/lib/portfolio-risk";
import type { StockInfo, OHLCVData } from "@/lib/mock-data";

export async function POST(req: Request) {
  const { holdings } = (await req.json()) as { holdings: HoldingInput[] };

  // Fetch data for all holdings in parallel
  const [stockInfoResults, ohlcvResults] = await Promise.all([
    Promise.all(holdings.map((h) => getStockInfo(h.ticker))),
    Promise.all(holdings.map((h) => getOHLCV(h.ticker))),
  ]);

  const stockInfoMap: Record<string, StockInfo> = {};
  const ohlcvMap: Record<string, OHLCVData[]> = {};

  holdings.forEach((h, i) => {
    stockInfoMap[h.ticker] = stockInfoResults[i];
    ohlcvMap[h.ticker] = ohlcvResults[i];
  });

  const report = calculatePortfolioRisk(holdings, stockInfoMap, ohlcvMap);
  return NextResponse.json(report);
}
