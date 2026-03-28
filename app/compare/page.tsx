import { getScreenerData } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { GitCompare } from "lucide-react";

const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis }))
);

const METRICS = [
  { key: "pe", label: "P/E", fmt: (v: number | null) => v != null ? v.toFixed(1) : "N/A", lowerIsBetter: true },
  { key: "pb", label: "P/B", fmt: (v: number) => v.toFixed(2), lowerIsBetter: true },
  { key: "roe", label: "ROE %", fmt: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
  { key: "de", label: "D/E", fmt: (v: number) => v.toFixed(2), lowerIsBetter: true },
  { key: "dividendYield", label: "Div Yield", fmt: (v: number) => `${v.toFixed(2)}%`, lowerIsBetter: false },
  { key: "eps", label: "EPS", fmt: (v: number) => v.toFixed(0), lowerIsBetter: false },
  { key: "marketCap", label: "Mkt Cap (T)", fmt: (v: number) => v.toFixed(0), lowerIsBetter: false },
  { key: "revenue5YrGrowth", label: "Rev 5Y CAGR", fmt: (v: number) => `${v.toFixed(1)}%`, lowerIsBetter: false },
] as const;

type MetricKey = typeof METRICS[number]["key"];

export default async function ComparePage() {
  const stocks = await getScreenerData();

  // Find best/worst per metric (excluding nulls)
  const best: Partial<Record<MetricKey, string>> = {};
  const worst: Partial<Record<MetricKey, string>> = {};

  for (const m of METRICS) {
    const validStocks = stocks.filter(s => s[m.key as keyof typeof s] != null);
    if (!validStocks.length) continue;

    const sorted = [...validStocks].sort((a, b) => {
      const av = a[m.key as keyof typeof a] as number;
      const bv = b[m.key as keyof typeof b] as number;
      return m.lowerIsBetter ? av - bv : bv - av;
    });
    best[m.key] = sorted[0].ticker;
    worst[m.key] = sorted[sorted.length - 1].ticker;
  }

  const compareData = {
    stocks: stocks.map(s => ({
      ticker: s.ticker,
      name: s.name,
      sector: s.sector,
      pe: s.pe,
      pb: s.pb,
      roe: s.roe,
      de: s.de,
      dividendYield: s.dividendYield,
      eps: s.eps,
      marketCap: s.marketCap,
      revenue5YrGrowth: (s as { revenue5YrGrowth: number }).revenue5YrGrowth,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <GitCompare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Stock Comparison</h1>
          <p className="text-sm text-muted-foreground">Komparasi fundamental 5 emiten demo IDX · Goldman Sachs Framework</p>
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Perbandingan Metrik Fundamental</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium w-32">Metrik</th>
                {stocks.map(s => (
                  <th key={s.ticker} className="px-4 py-2.5 text-center">
                    <Link href={`/stock/${s.ticker}`} className="hover:text-primary transition-colors">
                      <p className="font-mono font-semibold text-sm">{s.ticker}</p>
                      <p className="text-xs text-muted-foreground font-normal truncate max-w-[100px]">{s.sector}</p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.key} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-medium">{m.label}</td>
                  {stocks.map(s => {
                    const val = s[m.key as keyof typeof s] as number | null;
                    const isBest = best[m.key] === s.ticker && val != null;
                    const isWorst = worst[m.key] === s.ticker && val != null;
                    return (
                      <td key={s.ticker} className="px-4 py-2.5 text-center">
                        <span className={cn(
                          "font-mono text-sm px-2 py-0.5 rounded",
                          isBest && "bg-bullish/15 text-bullish font-semibold",
                          isWorst && !isBest && "bg-bearish/15 text-bearish"
                        )}>
                          {val != null ? m.fmt(val as never) : "N/A"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-bullish/30 inline-block" />
          Terbaik di kategori
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-bearish/30 inline-block" />
          Terburuk di kategori
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stocks.map(s => {
          const bestCount = Object.values(best).filter(t => t === s.ticker).length;
          const worstCount = Object.values(worst).filter(t => t === s.ticker).length;
          return (
            <Card key={s.ticker} className="p-4">
              <Link href={`/stock/${s.ticker}`} className="block hover:opacity-80 transition-opacity">
                <p className="font-mono font-bold text-sm">{s.ticker}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{s.name}</p>
                <div className="flex gap-2 mt-2">
                  {bestCount > 0 && (
                    <Badge variant="outline" className="text-xs text-bullish border-bullish/30">
                      ★ {bestCount} terbaik
                    </Badge>
                  )}
                  {worstCount > 0 && (
                    <Badge variant="outline" className="text-xs text-bearish border-bearish/30">
                      {worstCount} terburuk
                    </Badge>
                  )}
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      <AIAnalysis framework="compare" firmName="Goldman Sachs" stockData={compareData} />
    </div>
  );
}
