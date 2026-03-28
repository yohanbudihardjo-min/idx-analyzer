import { getForeignFlow, getStockInfo } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const ForeignFlowChart = dynamic(
  () => import("@/components/charts/foreign-flow-chart").then(m => ({ default: m.ForeignFlowChart }))
);
const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis }))
);

export default async function ForeignFlowPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [flow, stock] = await Promise.all([getForeignFlow(ticker), getStockInfo(ticker)]);

  const latest = flow[flow.length - 1];
  const last30 = flow.slice(-30);
  const net30d = last30.reduce((sum, d) => sum + d.netBuy, 0);
  const cumulativeYTD = flow[flow.length - 1]?.cumulativeNet ?? 0;

  // Signal
  const signal: "Akumulasi" | "Distribusi" | "Netral" =
    net30d > 50 ? "Akumulasi"
    : net30d < -50 ? "Distribusi"
    : "Netral";

  const signalColor = signal === "Akumulasi" ? "text-bullish" : signal === "Distribusi" ? "text-bearish" : "text-muted-foreground";
  const signalBadge = signal === "Akumulasi" ? "border-bullish/40 text-bullish" : signal === "Distribusi" ? "border-bearish/40 text-bearish" : "";

  const foreignData = {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    foreignOwnership: latest.foreignOwnership,
    net30d: net30d.toFixed(1),
    cumulativeYTD: cumulativeYTD.toFixed(1),
    signal,
    recentFlow: last30.slice(-10).map(d => ({ date: d.date, netBuy: d.netBuy })),
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net Asing 30H</p>
            <p className={cn("font-mono text-xl font-semibold mt-1", net30d >= 0 ? "text-bullish" : "text-bearish")}>
              {net30d >= 0 ? "+" : ""}{net30d.toFixed(1)}B
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {net30d >= 0 ? <TrendingUp className="h-3 w-3 text-bullish" /> : <TrendingDown className="h-3 w-3 text-bearish" />}
              <Badge variant="outline" className={cn("text-xs", signalBadge)}>{signal}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kumulatif YTD</p>
            <p className={cn("font-mono text-xl font-semibold mt-1", cumulativeYTD >= 0 ? "text-bullish" : "text-bearish")}>
              {cumulativeYTD >= 0 ? "+" : ""}{cumulativeYTD.toFixed(1)}B
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total net sejak awal periode</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kepemilikan Asing</p>
            <p className="font-mono text-xl font-semibold mt-1">{latest.foreignOwnership.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {latest.foreignOwnership > 40 ? "Dominan asing" : latest.foreignOwnership > 25 ? "Partisipasi signifikan" : "Dominan domestik"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Net Foreign Buy/Sell & Kumulatif</CardTitle>
            <span className={cn("text-xs font-medium", signalColor)}>
              {signal === "Akumulasi" ? "↑ Asing sedang akumulasi" : signal === "Distribusi" ? "↓ Asing sedang distribusi" : "→ Asing netral"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ForeignFlowChart data={flow} />
        </CardContent>
      </Card>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">10 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Tanggal", "Net Buy/Sell (B IDR)", "Kumulatif (B IDR)", "Kepemilikan Asing"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flow.slice(-10).reverse().map((d) => (
                <tr key={d.date} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{d.date}</td>
                  <td className={cn("px-4 py-2.5 font-mono font-medium", d.netBuy >= 0 ? "text-bullish" : "text-bearish")}>
                    {d.netBuy >= 0 ? "+" : ""}{d.netBuy.toFixed(1)}
                  </td>
                  <td className={cn("px-4 py-2.5 font-mono", d.cumulativeNet >= 0 ? "text-bullish" : "text-bearish")}>
                    {d.cumulativeNet >= 0 ? "+" : ""}{d.cumulativeNet.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 font-mono">{d.foreignOwnership.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AIAnalysis framework="foreign" firmName="CLSA" stockData={foreignData} />
    </div>
  );
}
