import { getSeasonality, getInsiderTransactions, getStockInfo } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIAnalysis } from "@/components/ai-analysis";
import { SeasonalityChart } from "@/components/charts/seasonality-chart";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, User } from "lucide-react";

// Month order for sorting
const monthOrder = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default async function PatternsPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [seasonality, insiders, stock] = await Promise.all([
    getSeasonality(ticker),
    getInsiderTransactions(ticker),
    getStockInfo(ticker),
  ]);

  // Best/worst months
  const sorted = [...seasonality].sort((a, b) => b.avgReturn - a.avgReturn);
  const bestMonths = sorted.slice(0, 3);
  const worstMonths = sorted.slice(-3);

  // Insider stats
  const buyCount = insiders.filter((t) => t.type === "buy").length;
  const sellCount = insiders.filter((t) => t.type === "sell").length;
  const totalInsiderValue = insiders
    .filter((t) => t.type === "buy")
    .reduce((sum, t) => sum + (t.value ?? 0), 0);

  const patternData = {
    ticker,
    seasonality,
    insiders: insiders.slice(0, 5),
    buyCount,
    sellCount,
    totalInsiderValue,
    bestMonths,
    worstMonths,
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Best Month</p>
            <p className="text-xl font-bold mt-1 text-bullish">
              {bestMonths[0]?.month ?? "—"}
            </p>
            <p className="text-xs text-bullish mt-1">
              Avg +{bestMonths[0]?.avgReturn.toFixed(1) ?? "0"}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Worst Month</p>
            <p className="text-xl font-bold mt-1 text-bearish">
              {worstMonths[0]?.month ?? "—"}
            </p>
            <p className="text-xs text-bearish mt-1">
              Avg {worstMonths[0]?.avgReturn.toFixed(1) ?? "0"}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Insider Buys</p>
            <p className="text-xl font-bold mt-1 text-bullish">{buyCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {insiders.length} total transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Insider Signal</p>
            <p className={cn("text-xl font-bold mt-1", buyCount > sellCount ? "text-bullish" : "text-bearish")}>
              {buyCount > sellCount ? "Bullish" : "Bearish"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {buyCount}B / {sellCount}S ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seasonality Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Seasonality — Avg Monthly Return</CardTitle>
            <Badge variant="outline" className="text-xs">Historical Average</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <SeasonalityChart data={seasonality} height={240} />
        </CardContent>
      </Card>

      {/* Best/Worst Months */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-bullish">3 Bulan Terbaik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestMonths.map((m) => (
                <div key={m.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-bullish" />
                    <span className="font-medium">{m.month}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-bullish">
                      +{m.avgReturn.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {m.winRate.toFixed(0)}% win rate
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-bearish">3 Bulan Terburuk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {worstMonths.map((m) => (
                <div key={m.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-bearish" />
                    <span className="font-medium">{m.month}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-bearish">
                      {m.avgReturn.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {m.winRate.toFixed(0)}% win rate
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insider Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Insider Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {insiders.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Tidak ada data insider transaction.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {insiders.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      t.type === "buy" ? "bg-bullish-muted" : "bg-bearish-muted"
                    )}>
                      <User className={cn("h-3.5 w-3.5", t.type === "buy" ? "text-bullish" : "text-bearish")} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.position} · {t.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        t.type === "buy"
                          ? "border-bullish/50 text-bullish"
                          : "border-bearish/50 text-bearish"
                      )}
                    >
                      {t.type}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.shares?.toLocaleString("id-ID")} saham
                    </p>
                    {t.value && (
                      <p className="text-xs font-mono mt-0.5">
                        Rp {(t.value / 1e9).toFixed(1)}B
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AIAnalysis framework="patterns" firmName="Renaissance" stockData={patternData} />
    </div>
  );
}
