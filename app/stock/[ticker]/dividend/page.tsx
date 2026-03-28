import { getDividendHistory, getStockInfo } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const DividendChart = dynamic(
  () => import("@/components/charts/dividend-chart").then(m => ({ default: m.DividendChart }))
);
const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis }))
);

export default async function DividendPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [dividends, stock] = await Promise.all([
    getDividendHistory(ticker),
    getStockInfo(ticker),
  ]);

  const latest = dividends[dividends.length - 1];
  const prev = dividends[dividends.length - 2];
  const oldest = dividends[0];

  // CAGR dividen 5 tahun
  const years = dividends.length - 1;
  const cagr = oldest.dps > 0 && latest.dps > 0
    ? Math.pow(latest.dps / oldest.dps, 1 / years) - 1
    : 0;

  // Trend DPS vs tahun sebelumnya
  const dpsTrend = prev?.dps > 0
    ? ((latest.dps - prev.dps) / prev.dps) * 100
    : 0;

  const hasDividend = latest.dps > 0;

  const dividendAnalysisData = {
    ticker: stock.ticker,
    name: stock.name,
    currentPrice: stock.price,
    latestDPS: latest.dps,
    latestYield: latest.yield,
    latestPayoutRatio: latest.payoutRatio,
    cagrDividend5Y: (cagr * 100).toFixed(2),
    history: dividends,
  };

  return (
    <div className="space-y-6">
      {!hasDividend && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
          <Minus className="h-4 w-4 shrink-0" />
          {stock.ticker} belum membagikan dividen hingga saat ini.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "DPS Terakhir",
            value: hasDividend ? `Rp ${latest.dps.toLocaleString("id-ID")}` : "—",
            sub: latest.exDate !== "-" ? `Ex-date: ${latest.exDate}` : "Belum ada",
          },
          {
            label: "Dividend Yield",
            value: hasDividend ? `${latest.yield.toFixed(2)}%` : "0%",
            sub: `vs Harga ${stock.price.toLocaleString("id-ID")}`,
            color: hasDividend ? "text-bullish" : "text-muted-foreground",
          },
          {
            label: "Payout Ratio",
            value: hasDividend ? `${latest.payoutRatio.toFixed(1)}%` : "—",
            sub: latest.payoutRatio > 70 ? "Tinggi — perhatikan FCF" : latest.payoutRatio > 0 ? "Sehat" : "N/A",
          },
          {
            label: "CAGR Dividen",
            value: hasDividend ? `${(cagr * 100).toFixed(1)}%` : "—",
            sub: `${years} tahun terakhir`,
            color: cagr > 0 ? "text-bullish" : "text-muted-foreground",
          },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={cn("font-mono text-xl font-semibold mt-1", card.color)}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {hasDividend && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Riwayat DPS per Tahun</CardTitle>
          </CardHeader>
          <CardContent>
            <DividendChart data={dividends} />
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Riwayat Dividen</CardTitle>
            {hasDividend && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", dpsTrend >= 0 ? "text-bullish" : "text-bearish")}>
                {dpsTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                DPS {dpsTrend >= 0 ? "+" : ""}{dpsTrend.toFixed(1)}% YoY
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Tahun", "DPS (IDR)", "Yield", "Payout Ratio", "Ex-Date"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...dividends].reverse().map((d) => {
                const isLatest = d.year === latest.year;
                return (
                  <tr key={d.year} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{d.year}</span>
                        {isLatest && <Badge variant="outline" className="text-xs">Terbaru</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      {d.dps > 0 ? `Rp ${d.dps.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className={cn("px-4 py-2.5 font-mono", d.yield > 4 ? "text-bullish" : "")}>
                      {d.yield > 0 ? `${d.yield.toFixed(2)}%` : "—"}
                    </td>
                    <td className={cn("px-4 py-2.5 font-mono", d.payoutRatio > 70 ? "text-yellow-500" : "")}>
                      {d.payoutRatio > 0 ? `${d.payoutRatio.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.exDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AIAnalysis framework="dividend" firmName="Fidelity" stockData={dividendAnalysisData} />
    </div>
  );
}
