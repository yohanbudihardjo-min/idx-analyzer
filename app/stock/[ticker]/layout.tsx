import { getStockInfo } from "@/lib/sectors";
import { Badge } from "@/components/ui/badge";
import { StockTabNav } from "@/components/stock-tab-nav";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function StockLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const stock = await getStockInfo(ticker);
  const isPositive = stock.priceChange >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Stock Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-mono text-2xl font-bold">{stock.ticker}</h1>
            <Badge variant="outline" className="text-xs">
              {stock.subsector || stock.sector}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{stock.name}</p>
        </div>

        <div className="text-right">
          <p className="font-mono text-3xl font-semibold">
            {stock.price.toLocaleString("id-ID")}
          </p>
          <p
            className={cn(
              "flex items-center justify-end gap-1 text-sm font-medium mt-0.5",
              isPositive ? "text-bullish" : "text-bearish"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {isPositive ? "+" : ""}
            {stock.priceChange.toFixed(0)} ({isPositive ? "+" : ""}
            {stock.priceChangePct.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
        {[
          { label: "P/E", value: stock.pe?.toFixed(1) ?? "N/A" },
          { label: "P/B", value: stock.pb?.toFixed(2) ?? "N/A" },
          { label: "D/E", value: stock.de?.toFixed(2) ?? "N/A" },
          { label: "ROE", value: `${stock.roe?.toFixed(1) ?? "N/A"}%` },
          {
            label: "Div Yield",
            value: `${stock.dividendYield?.toFixed(2) ?? "0.00"}%`,
          },
          {
            label: "Market Cap",
            value:
              stock.marketCap >= 1000
                ? `${(stock.marketCap / 1000).toFixed(1)}T`
                : `${stock.marketCap.toFixed(0)}B`,
          },
        ].map((m) => (
          <div key={m.label} className="bg-muted/30 rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="font-mono font-semibold mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <StockTabNav ticker={ticker} />

      {/* Page Content */}
      {children}
    </div>
  );
}
