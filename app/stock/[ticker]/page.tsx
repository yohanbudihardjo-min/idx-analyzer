import {
  getStockInfo,
  getFinancials,
  getOHLCV,
  getQuarterlyEarnings,
  getSeasonality,
  getDividendHistory,
  getForeignFlow,
} from "@/lib/sectors";
import { buildTechnicalSummary, calculateRiskMetrics } from "@/lib/indicators";
import { runDCF, estimateWACC } from "@/lib/dcf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { formatBillion } from "@/lib/dcf";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis }))
);

type Signal = "Bullish" | "Bearish" | "Neutral";

interface FrameworkSignal {
  name: string;
  firm: string;
  href: string;
  signal: Signal;
  reason: string;
}

const SIGNAL_STYLES: Record<Signal, { badge: string; icon: string; text: string }> = {
  Bullish: { badge: "border-bullish/40 text-bullish bg-bullish/5", icon: "text-bullish", text: "Bullish" },
  Bearish: { badge: "border-bearish/40 text-bearish bg-bearish/5", icon: "text-bearish", text: "Bearish" },
  Neutral: { badge: "border-border text-muted-foreground", icon: "text-muted-foreground", text: "Netral" },
};

export default async function StockOverviewPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  // Fetch all data in parallel
  const [stock, financials, ohlcv, earnings, seasonality, dividends, foreignFlow] =
    await Promise.all([
      getStockInfo(ticker),
      getFinancials(ticker),
      getOHLCV(ticker),
      getQuarterlyEarnings(ticker),
      getSeasonality(ticker),
      getDividendHistory(ticker),
      getForeignFlow(ticker),
    ]);

  // ── Signal computation ──────────────────────────────────────────────────────

  // 1. Technical
  const techSummary = buildTechnicalSummary(ohlcv);
  const techSignal: Signal =
    techSummary.trend === "bullish" ? "Bullish"
    : techSummary.trend === "bearish" ? "Bearish"
    : "Neutral";
  const techReason =
    `Trend ${techSummary.trend} · RSI ${techSummary.rsi.toFixed(0)} · MACD ${techSummary.macd > techSummary.macdSignal ? "bullish cross" : "bearish cross"}`;

  // 2. Valuation (DCF)
  const baseYear = financials[financials.length - 1];
  const wacc = estimateWACC(stock.beta ?? 1);
  const revenueGrowths = financials.slice(-3).map((f, i, arr) =>
    i > 0 ? (f.revenue - arr[i - 1].revenue) / arr[i - 1].revenue : 0.08
  );
  const avgGrowth = revenueGrowths.slice(1).reduce((a, b) => a + b, 0) / (revenueGrowths.length - 1);
  const dcfResult = runDCF(
    baseYear,
    {
      revenueGrowthRates: [avgGrowth, avgGrowth * 0.9, avgGrowth * 0.85, avgGrowth * 0.8, avgGrowth * 0.75],
      operatingMarginTarget: baseYear.operatingIncome / baseYear.revenue,
      taxRate: 0.22,
      capexPct: baseYear.capex / baseYear.revenue,
      wacc,
      terminalGrowthRate: 0.03,
      exitMultiple: 10,
      sharesOutstanding: (stock.marketCap * 1000) / stock.price,
    },
    baseYear.totalDebt - baseYear.equity,
    (stock.marketCap * 1000) / stock.price
  );
  const intrinsic = (dcfResult.intrinsicPriceGrowth + dcfResult.intrinsicPriceExit) / 2;
  const marginOfSafety = ((intrinsic - stock.price) / stock.price) * 100;
  const valSignal: Signal =
    marginOfSafety > 15 ? "Bullish"
    : marginOfSafety < -15 ? "Bearish"
    : "Neutral";
  const valReason = `Intrinsik Rp${Math.round(intrinsic).toLocaleString("id-ID")} · ${marginOfSafety >= 0 ? "Diskon" : "Premium"} ${Math.abs(marginOfSafety).toFixed(0)}%`;

  // 3. Earnings
  const recentEarnings = earnings.slice(-4);
  const beatCount = recentEarnings.filter(e => e.beat).length;
  const earningsSignal: Signal =
    beatCount >= 3 ? "Bullish"
    : beatCount <= 1 ? "Bearish"
    : "Neutral";
  const earningsReason = `Beat ${beatCount}/4 kuartal terakhir · EPS trend ${
    recentEarnings.length >= 2 && recentEarnings[recentEarnings.length - 1].epsActual > recentEarnings[0].epsActual
      ? "naik" : "turun"}`;

  // 4. Patterns (Seasonality — current month)
  const MONTH_IDS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const currentMonthIdx = new Date().getMonth(); // 0-indexed
  const currentMonthId = MONTH_IDS[currentMonthIdx];
  const monthData = seasonality.find(s => s.month === currentMonthId) ?? seasonality[0];
  const patternsSignal: Signal =
    monthData.avgReturn > 1 && monthData.winRate > 58 ? "Bullish"
    : monthData.avgReturn < -1 && monthData.winRate < 42 ? "Bearish"
    : "Neutral";
  const patternsReason = `${currentMonthId}: avg return ${monthData.avgReturn > 0 ? "+" : ""}${monthData.avgReturn.toFixed(1)}% · win rate ${monthData.winRate}%`;

  // 5. Dividend
  const latestDiv = dividends[dividends.length - 1];
  const prevDiv = dividends[dividends.length - 2];
  const divGrowing = latestDiv.dps > 0 && prevDiv?.dps > 0 && latestDiv.dps > prevDiv.dps;
  const divSignal: Signal =
    latestDiv.dps === 0 ? "Neutral"
    : latestDiv.yield >= 3 && divGrowing ? "Bullish"
    : latestDiv.yield >= 2 ? "Neutral"
    : "Bearish";
  const divReason = latestDiv.dps === 0
    ? "Belum membagikan dividen"
    : `Yield ${latestDiv.yield.toFixed(2)}% · DPS ${divGrowing ? "naik" : "stagnan/turun"} YoY`;

  // 6. Risk (Sharpe as signal)
  const riskMetrics = calculateRiskMetrics(ohlcv);
  const riskSignal: Signal =
    riskMetrics.sharpe >= 0.5 ? "Bullish"
    : riskMetrics.sharpe >= 0 ? "Neutral"
    : "Bearish";
  const riskReason = `Sharpe ${riskMetrics.sharpe.toFixed(2)} · ${riskMetrics.riskRating} risk · Vol ${riskMetrics.volatility.toFixed(0)}%`;

  // 7. Foreign Flow
  const last30 = foreignFlow.slice(-30);
  const net30d = last30.reduce((sum, d) => sum + d.netBuy, 0);
  const foreignSignal: Signal =
    net30d > 50 ? "Bullish"
    : net30d < -50 ? "Bearish"
    : "Neutral";
  const latestOwnership = foreignFlow[foreignFlow.length - 1]?.foreignOwnership ?? 0;
  const foreignReason = `Net asing 30H ${net30d >= 0 ? "+" : ""}${net30d.toFixed(0)}B · Kepemilikan ${latestOwnership.toFixed(1)}%`;

  // ── Overall verdict ─────────────────────────────────────────────────────────
  const signals: FrameworkSignal[] = [
    { name: "Technical", firm: "Citadel", href: `/stock/${ticker}/technical`, signal: techSignal, reason: techReason },
    { name: "Valuation", firm: "Morgan Stanley", href: `/stock/${ticker}/valuation`, signal: valSignal, reason: valReason },
    { name: "Earnings", firm: "JPMorgan", href: `/stock/${ticker}/earnings`, signal: earningsSignal, reason: earningsReason },
    { name: "Patterns", firm: "Renaissance", href: `/stock/${ticker}/patterns`, signal: patternsSignal, reason: patternsReason },
    { name: "Dividend", firm: "Fidelity", href: `/stock/${ticker}/dividend`, signal: divSignal, reason: divReason },
    { name: "Risk", firm: "Bridgewater", href: `/stock/${ticker}/risk`, signal: riskSignal, reason: riskReason },
    { name: "Foreign", firm: "CLSA", href: `/stock/${ticker}/foreign`, signal: foreignSignal, reason: foreignReason },
  ];

  const bullCount = signals.filter(s => s.signal === "Bullish").length;
  const bearCount = signals.filter(s => s.signal === "Bearish").length;
  const overallSignal: Signal =
    bullCount > bearCount + 1 ? "Bullish"
    : bearCount > bullCount + 1 ? "Bearish"
    : "Neutral";

  // Latest 3 years of financials
  const recentFinancials = financials.slice(-3).reverse();
  const stockData = { stock, financials: recentFinancials };

  return (
    <div className="space-y-6">

      {/* ── Multi-Framework Signal Summary ── */}
      <Card className={cn(
        "border",
        overallSignal === "Bullish" ? "border-bullish/30" : overallSignal === "Bearish" ? "border-bearish/30" : "border-border"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Sinyal Multi-Framework</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{bullCount} bullish · {signals.filter(s => s.signal === "Neutral").length} netral · {bearCount} bearish</span>
              <Badge variant="outline" className={cn("text-xs font-semibold", SIGNAL_STYLES[overallSignal].badge)}>
                {overallSignal === "Bullish" ? "↑" : overallSignal === "Bearish" ? "↓" : "→"} {SIGNAL_STYLES[overallSignal].text}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {signals.map((s) => {
              const styles = SIGNAL_STYLES[s.signal];
              return (
                <Link key={s.name} href={s.href} className="group block">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">· {s.firm}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{s.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className={cn("text-xs", styles.badge)}>
                        {s.signal === "Bullish" ? "↑" : s.signal === "Bearish" ? "↓" : "→"} {styles.text}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Profil Perusahaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sektor</p>
                <p className="font-medium mt-0.5">{stock.sector}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sub-Sektor</p>
                <p className="font-medium mt-0.5">{stock.subsector ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Market Cap</p>
                <p className="font-mono font-medium mt-0.5">
                  {formatBillion(stock.marketCap)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Beta (1Y)</p>
                <p className="font-mono font-medium mt-0.5">
                  {stock.beta?.toFixed(2) ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">IPO Date</p>
                <p className="font-mono font-medium mt-0.5">
                  {stock.listing ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Karyawan</p>
                <p className="font-mono font-medium mt-0.5">
                  {stock.employees?.toLocaleString("id-ID") ?? "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valuation Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Valuasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                { label: "P/E Ratio", value: stock.pe?.toFixed(1) ?? "N/A" },
                { label: "P/B Ratio", value: stock.pb?.toFixed(2) ?? "N/A" },
                { label: "D/E Ratio", value: stock.de?.toFixed(2) ?? "N/A" },
                { label: "ROE", value: `${stock.roe?.toFixed(1) ?? "N/A"}%` },
                {
                  label: "Dividend Yield",
                  value: `${stock.dividendYield?.toFixed(2) ?? "0.00"}%`,
                },
                { label: "EPS", value: `Rp ${stock.eps?.toLocaleString("id-ID") ?? "N/A"}` },
              ].map((m) => (
                <div key={m.label} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-mono font-medium">{m.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ringkasan Keuangan (3 Tahun Terakhir)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-normal px-6 py-3">
                    Metrik
                  </th>
                  {recentFinancials.map((f) => (
                    <th
                      key={f.year}
                      className="text-right text-xs text-muted-foreground font-normal px-4 py-3"
                    >
                      FY{f.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { label: "Revenue", key: "revenue" as const, fmt: formatBillion },
                  { label: "EBITDA", key: "ebitda" as const, fmt: formatBillion },
                  { label: "Net Income", key: "netIncome" as const, fmt: formatBillion },
                  { label: "Free Cash Flow", key: "freeCashFlow" as const, fmt: formatBillion },
                  { label: "Total Assets", key: "totalAssets" as const, fmt: formatBillion },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-muted/20">
                    <td className="px-6 py-3 text-muted-foreground">{row.label}</td>
                    {recentFinancials.map((f, i) => {
                      const val = f[row.key] as number;
                      const prevVal =
                        i < recentFinancials.length - 1
                          ? (recentFinancials[i + 1][row.key] as number)
                          : null;
                      const growth =
                        prevVal && prevVal !== 0
                          ? ((val - prevVal) / Math.abs(prevVal)) * 100
                          : null;
                      return (
                        <td key={f.year} className="px-4 py-3 text-right font-mono">
                          <div>{row.fmt(val)}</div>
                          {growth !== null && (
                            <div className={cn("text-xs", growth >= 0 ? "text-bullish" : "text-bearish")}>
                              {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AIAnalysis framework="overview" firmName="Goldman Sachs" stockData={stockData} />
    </div>
  );
}
