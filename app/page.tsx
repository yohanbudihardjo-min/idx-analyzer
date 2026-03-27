import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketOverview } from "@/lib/sectors";
import { stockInfo } from "@/lib/mock-data";
import { USE_MOCK } from "@/lib/sectors";
import {
  TrendingUp, TrendingDown,
  BarChart3, LineChart, DollarSign, PieChart,
  Activity, Search, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const frameworks = [
  { id: 1, name: "Stock Screener", firm: "Goldman Sachs", href: "/screener", icon: Search, desc: "Filter saham IDX berdasarkan P/E, ROE, dividen, dan growth" },
  { id: 2, name: "DCF Valuation", firm: "Morgan Stanley", href: "/stock/BBCA/valuation", icon: DollarSign, desc: "Model valuasi DCF dengan WACC dan sensitivity table" },
  { id: 4, name: "Earnings Analyzer", firm: "JPMorgan", href: "/stock/BBCA/earnings", icon: BarChart3, desc: "Analisis pre-earnings, beat/miss history, dan rekomendasi" },
  { id: 6, name: "Technical Analysis", firm: "Citadel", href: "/stock/BBCA/technical", icon: LineChart, desc: "Candlestick + MA + RSI + MACD + support/resistance" },
  { id: 9, name: "Pattern Finder", firm: "Renaissance", href: "/stock/BBCA/patterns", icon: Activity, desc: "Seasonality, insider transactions, pola statistik tersembunyi" },
  { id: 10, name: "Macro Dashboard", firm: "McKinsey", href: "/macro", icon: PieChart, desc: "BI Rate, inflasi, PDB, dan dampaknya terhadap saham" },
];

export default async function DashboardPage() {
  const market = await getMarketOverview();
  const stocks = Object.values(stockInfo);
  const isMock = USE_MOCK;
  const ihsg = market.ihsg;
  const isPositive = ihsg.change >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {isMock && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
          <span>
            Mode Demo — Data mock untuk 5 emiten IDX. Set{" "}
            <code className="font-mono text-xs bg-muted px-1 rounded">SECTORS_API_KEY</code>{" "}
            di .env.local untuk data real dari sectors.app
          </span>
        </div>
      )}

      {/* IHSG */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="col-span-2 sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wide">IHSG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 flex-wrap">
              <span className="text-3xl font-mono font-semibold">
                {ihsg.value.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
              </span>
              <span className={cn("flex items-center gap-1 text-sm font-medium mb-1", isPositive ? "text-bullish" : "text-bearish")}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {isPositive ? "+" : ""}{ihsg.change.toFixed(2)} ({isPositive ? "+" : ""}{ihsg.changePct.toFixed(2)}%)
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span>Vol {(ihsg.volume / 1e9).toFixed(1)}B</span>
              <span className="text-bullish">{ihsg.advancers}↑</span>
              <span className="text-bearish">{ihsg.decliners}↓</span>
              <span>{ihsg.unchanged}=</span>
            </div>
          </CardContent>
        </Card>

        {(market.sectorPerformance as { sector: string; change: number }[]).slice(0, 5).map((s) => (
          <Card key={s.sector} className="col-span-1 p-3">
            <p className="text-xs text-muted-foreground truncate">{s.sector}</p>
            <p className={cn("text-base font-mono font-semibold mt-1", s.change >= 0 ? "text-bullish" : "text-bearish")}>
              {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
            </p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Stocks list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">5 Emiten Demo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stocks.map((s) => (
              <Link
                key={s.ticker}
                href={`/stock/${s.ticker}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors border-t border-border first:border-t-0"
              >
                <div>
                  <p className="font-mono font-semibold text-sm">{s.ticker}</p>
                  <p className="text-xs text-muted-foreground">{s.sector}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{s.price.toLocaleString("id-ID")}</p>
                  <p className={cn("text-xs font-mono", s.priceChange >= 0 ? "text-bullish" : "text-bearish")}>
                    {s.priceChange >= 0 ? "+" : ""}{s.priceChangePct.toFixed(2)}%
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Framework grid */}
        <div className="lg:col-span-3 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide px-1">Framework Analisis Tersedia</p>
          {frameworks.map((f) => (
            <Link key={f.id} href={f.href} className="group block">
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                    <f.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{f.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">{f.firm}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
