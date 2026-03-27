import { getStockInfo, getFinancials } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
const AIAnalysis = dynamic(() => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis })));
import { formatBillion } from "@/lib/dcf";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default async function StockOverviewPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [stock, financials] = await Promise.all([
    getStockInfo(ticker),
    getFinancials(ticker),
  ]);

  // Latest 3 years of financials
  const recentFinancials = financials.slice(-3).reverse();

  const stockData = { stock, financials: recentFinancials };

  return (
    <div className="space-y-6">
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
                  {
                    label: "Revenue",
                    key: "revenue" as const,
                    fmt: formatBillion,
                  },
                  {
                    label: "EBITDA",
                    key: "ebitda" as const,
                    fmt: formatBillion,
                  },
                  {
                    label: "Net Income",
                    key: "netIncome" as const,
                    fmt: formatBillion,
                  },
                  {
                    label: "Free Cash Flow",
                    key: "freeCashFlow" as const,
                    fmt: formatBillion,
                  },
                  {
                    label: "Total Assets",
                    key: "totalAssets" as const,
                    fmt: formatBillion,
                  },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-muted/20">
                    <td className="px-6 py-3 text-muted-foreground">
                      {row.label}
                    </td>
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
                            <div
                              className={cn(
                                "text-xs",
                                growth >= 0 ? "text-bullish" : "text-bearish"
                              )}
                            >
                              {growth >= 0 ? "+" : ""}
                              {growth.toFixed(1)}%
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

      {/* AI Analysis */}
      <AIAnalysis
        framework="overview"
        firmName="Goldman Sachs"
        stockData={stockData}
      />
    </div>
  );
}
