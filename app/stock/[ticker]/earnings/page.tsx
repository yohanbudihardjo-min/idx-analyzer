import { getQuarterlyEarnings, getStockInfo } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIAnalysis } from "@/components/ai-analysis";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [earnings, stock] = await Promise.all([
    getQuarterlyEarnings(ticker),
    getStockInfo(ticker),
  ]);

  const recent = earnings.slice(-4).reverse();
  const beatCount = recent.filter((e) => e.beat).length;
  const beatRate = (beatCount / recent.length) * 100;

  const avgBeatMiss =
    recent.reduce((sum, e) => {
      if (e.epsEstimate && e.epsEstimate !== 0) {
        return sum + ((e.epsActual - e.epsEstimate) / Math.abs(e.epsEstimate)) * 100;
      }
      return sum;
    }, 0) / recent.length;

  const avgPriceReaction =
    recent.reduce((sum, e) => sum + (e.priceReaction ?? 0), 0) / recent.length;

  const earningsData = { ticker, currentPrice: stock.price, recent, beatRate, avgBeatMiss, avgPriceReaction };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Beat Rate (4Q)</p>
            <p className={cn("font-mono text-2xl font-bold mt-1", beatRate >= 75 ? "text-bullish" : beatRate >= 50 ? "text-neutral" : "text-bearish")}>
              {beatRate.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{beatCount}/4 kuartal</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Beat/Miss</p>
            <p className={cn("font-mono text-2xl font-bold mt-1", avgBeatMiss >= 0 ? "text-bullish" : "text-bearish")}>
              {avgBeatMiss >= 0 ? "+" : ""}{avgBeatMiss.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">vs estimasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Price Reaction</p>
            <p className={cn("font-mono text-2xl font-bold mt-1", avgPriceReaction >= 0 ? "text-bullish" : "text-bearish")}>
              {avgPriceReaction >= 0 ? "+" : ""}{avgPriceReaction.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">1D setelah earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Earnings Trend</p>
            <div className="flex items-center gap-2 mt-1">
              {recent[0]?.epsActual > (recent[1]?.epsActual ?? 0) ? (
                <TrendingUp className="h-6 w-6 text-bullish" />
              ) : (
                <TrendingDown className="h-6 w-6 text-bearish" />
              )}
              <span className={cn("font-bold", recent[0]?.epsActual > (recent[1]?.epsActual ?? 0) ? "text-bullish" : "text-bearish")}>
                {recent[0]?.epsActual > (recent[1]?.epsActual ?? 0) ? "Growing" : "Declining"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">EPS quarter-over-quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* EPS Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">EPS Aktual vs Estimasi — 4 Kuartal Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <EarningsChart earnings={recent} height={250} />
        </CardContent>
      </Card>

      {/* Quarterly Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detail Per Kuartal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Kuartal", "EPS Aktual", "EPS Estimasi", "Beat/Miss", "% vs Est", "Reaksi Harga"].map((h) => (
                    <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-4", h === "Kuartal" ? "text-left" : "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((e) => {
                  const beatMissPct = e.epsEstimate && e.epsEstimate !== 0
                    ? ((e.epsActual - e.epsEstimate) / Math.abs(e.epsEstimate)) * 100
                    : null;

                  return (
                    <tr key={e.quarter} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{e.quarter}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        Rp {e.epsActual.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {e.epsEstimate ? `Rp ${e.epsEstimate.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {e.beat ? (
                          <span className="flex items-center justify-end gap-1 text-bullish">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Beat
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1 text-bearish">
                            <XCircle className="h-3.5 w-3.5" /> Miss
                          </span>
                        )}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono", beatMissPct !== null && beatMissPct >= 0 ? "text-bullish" : "text-bearish")}>
                        {beatMissPct !== null ? `${beatMissPct >= 0 ? "+" : ""}${beatMissPct.toFixed(1)}%` : "—"}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono", (e.priceReaction ?? 0) >= 0 ? "text-bullish" : "text-bearish")}>
                        {e.priceReaction !== undefined
                          ? `${e.priceReaction >= 0 ? "+" : ""}${e.priceReaction.toFixed(2)}%`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AIAnalysis framework="earnings" firmName="JPMorgan" stockData={earningsData} />
    </div>
  );
}
