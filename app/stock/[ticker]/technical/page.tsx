import { getOHLCV, getStockInfo } from "@/lib/sectors";
import {
  buildTechnicalSummary,
  calculateMA,
  calculateRSI,
  calculateMACD,
} from "@/lib/indicators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { RSIChart } from "@/components/charts/rsi-chart";
import { MACDChart } from "@/components/charts/macd-chart";
import { AIAnalysis } from "@/components/ai-analysis";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default async function TechnicalPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [ohlcv, stock] = await Promise.all([
    getOHLCV(ticker),
    getStockInfo(ticker),
  ]);

  const maData = calculateMA(ohlcv);
  const rsiData = calculateRSI(ohlcv);
  const macdData = calculateMACD(ohlcv);
  const summary = buildTechnicalSummary(ohlcv);

  const trendIcon =
    summary.trend === "bullish" ? (
      <TrendingUp className="h-4 w-4 text-bullish" />
    ) : summary.trend === "bearish" ? (
      <TrendingDown className="h-4 w-4 text-bearish" />
    ) : (
      <Minus className="h-4 w-4 text-neutral" />
    );

  const trendColor =
    summary.trend === "bullish"
      ? "text-bullish"
      : summary.trend === "bearish"
      ? "text-bearish"
      : "text-neutral";

  const technicalData = {
    ticker,
    currentPrice: stock.price,
    summary,
    recentOHLCV: ohlcv.slice(-10),
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className={cn("col-span-2 sm:col-span-1 lg:col-span-2", summary.trend === "bullish" ? "border-bullish/30 bg-bullish-muted" : summary.trend === "bearish" ? "border-bearish/30 bg-bearish-muted" : "")}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Trend</p>
            <p className={cn("flex items-center gap-1.5 text-base font-semibold mt-1 capitalize", trendColor)}>
              {trendIcon}
              {summary.trend}
            </p>
          </CardContent>
        </Card>

        {[
          {
            label: "RSI (14)",
            value: summary.rsi.toFixed(1),
            sub:
              summary.rsi > 70
                ? "Overbought"
                : summary.rsi < 30
                ? "Oversold"
                : "Neutral",
            color:
              summary.rsi > 70
                ? "text-bearish"
                : summary.rsi < 30
                ? "text-bullish"
                : "text-neutral",
          },
          {
            label: "MA 50",
            value: summary.ma50.toLocaleString("id-ID"),
            sub: stock.price > summary.ma50 ? "↑ Above" : "↓ Below",
            color: stock.price > summary.ma50 ? "text-bullish" : "text-bearish",
          },
          {
            label: "MA 200",
            value: summary.ma200.toLocaleString("id-ID"),
            sub: stock.price > summary.ma200 ? "↑ Above" : "↓ Below",
            color:
              stock.price > summary.ma200 ? "text-bullish" : "text-bearish",
          },
          {
            label: "Support",
            value: summary.support.toLocaleString("id-ID"),
            sub: "60D Low",
            color: "text-bullish",
          },
          {
            label: "Resistance",
            value: summary.resistance.toLocaleString("id-ID"),
            sub: "60D High",
            color: "text-bearish",
          },
          {
            label: "Volume",
            value: summary.volumeSignal,
            sub: "10D vs 20D",
            color:
              summary.volumeSignal === "increasing"
                ? "text-bullish"
                : summary.volumeSignal === "decreasing"
                ? "text-bearish"
                : "text-neutral",
          },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="font-mono font-semibold text-sm mt-1">{m.value}</p>
              <p className={cn("text-xs mt-0.5", m.color)}>{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MA Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-[#3b82f6] inline-block" />
          MA 50
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-[#f59e0b] inline-block" />
          MA 100
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-[#a855f7] inline-block" />
          MA 200
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-bullish inline-block" />
          Up candle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-bearish inline-block" />
          Down candle
        </span>
      </div>

      {/* Candlestick Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {ticker} — Price Chart + Moving Averages
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <CandlestickChart ohlcv={ohlcv} maData={maData} height={420} />
        </CardContent>
      </Card>

      {/* RSI + MACD */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">RSI (14)</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  summary.rsi > 70
                    ? "border-bearish/50 text-bearish"
                    : summary.rsi < 30
                    ? "border-bullish/50 text-bullish"
                    : ""
                )}
              >
                {summary.rsi.toFixed(1)}{" "}
                {summary.rsi > 70
                  ? "Overbought"
                  : summary.rsi < 30
                  ? "Oversold"
                  : "Neutral"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <RSIChart rsiData={rsiData} height={180} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">MACD (12/26/9)</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  summary.macd > summary.macdSignal
                    ? "border-bullish/50 text-bullish"
                    : "border-bearish/50 text-bearish"
                )}
              >
                {summary.macd > summary.macdSignal ? "Bullish" : "Bearish"} Cross
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <MACDChart macdData={macdData} height={180} />
          </CardContent>
        </Card>
      </div>

      {/* Bollinger Bands info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bollinger Bands (20, 2σ)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Upper Band</p>
              <p className="font-mono font-semibold mt-1 text-bearish">
                {summary.bbUpper.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="font-mono font-semibold mt-1">
                {stock.price.toLocaleString("id-ID")}
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  stock.price > summary.bbUpper
                    ? "text-bearish"
                    : stock.price < summary.bbLower
                    ? "text-bullish"
                    : "text-neutral"
                )}
              >
                {stock.price > summary.bbUpper
                  ? "Above upper"
                  : stock.price < summary.bbLower
                  ? "Below lower"
                  : "Inside bands"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lower Band</p>
              <p className="font-mono font-semibold mt-1 text-bullish">
                {summary.bbLower.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <AIAnalysis
        framework="technical"
        firmName="Citadel"
        stockData={technicalData}
      />
    </div>
  );
}
