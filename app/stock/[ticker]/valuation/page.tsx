import { getFinancials, getStockInfo } from "@/lib/sectors";
import { runDCF, estimateWACC, formatBillion, formatIDR } from "@/lib/dcf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIAnalysis } from "@/components/ai-analysis";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default async function ValuationPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [financials, stock] = await Promise.all([
    getFinancials(ticker),
    getStockInfo(ticker),
  ]);

  const baseYear = financials[financials.length - 1];
  const wacc = estimateWACC(stock.beta ?? 1.0);
  const netDebt = baseYear.totalDebt - baseYear.equity; // net debt proxy
  const operatingMargin = baseYear.operatingIncome / baseYear.revenue;
  // Derive shares outstanding from market cap and price
  const sharesOutstanding = Math.round((stock.marketCap * 1e12) / stock.price / 1e6); // millions

  const inputs = {
    revenueGrowthRates: [0.1, 0.1, 0.09, 0.08, 0.07],
    operatingMarginTarget: operatingMargin > 0 ? operatingMargin : 0.15,
    taxRate: 0.22,
    capexPct: baseYear.capex / baseYear.revenue,
    wacc,
    terminalGrowthRate: 0.04,
    exitMultiple: 12,
    sharesOutstanding,
  };

  const result = runDCF(baseYear, inputs, netDebt, inputs.sharesOutstanding);

  const avgIntrinsic =
    (result.intrinsicPriceGrowth + result.intrinsicPriceExit) / 2;
  const upside = ((avgIntrinsic - stock.price) / stock.price) * 100;
  const verdict =
    upside > 20
      ? "Significantly Undervalued"
      : upside > 0
      ? "Slightly Undervalued"
      : upside > -20
      ? "Fairly Valued"
      : "Overvalued";

  const verdictColor =
    upside > 20
      ? "text-bullish border-bullish/50"
      : upside > 0
      ? "text-bullish border-bullish/30"
      : upside > -20
      ? "text-neutral border-border"
      : "text-bearish border-bearish/50";

  const dcfData = {
    ticker,
    currentPrice: stock.price,
    wacc: inputs.wacc,
    result: {
      intrinsicPriceGrowth: result.intrinsicPriceGrowth,
      intrinsicPriceExit: result.intrinsicPriceExit,
      enterpriseValueGrowth: result.enterpriseValueGrowth,
      enterpriseValueExit: result.enterpriseValueExit,
    },
    inputs,
    baseYear,
    verdict,
    upside,
  };

  return (
    <div className="space-y-6">
      {/* Verdict Banner */}
      <Card className={cn("border-2", verdictColor.split(" ")[1])}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Verdict DCF</p>
              <p className={cn("text-xl font-bold mt-0.5", verdictColor.split(" ")[0])}>
                {verdict}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Avg Intrinsic Value</p>
              <p className="font-mono text-2xl font-bold mt-0.5">
                {formatIDR(avgIntrinsic)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Upside/Downside</p>
              <p
                className={cn(
                  "font-mono text-2xl font-bold mt-0.5",
                  upside >= 0 ? "text-bullish" : "text-bearish"
                )}
              >
                {upside >= 0 ? "+" : ""}
                {upside.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intrinsic Values */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Perpetuity Growth Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">
              {formatIDR(result.intrinsicPriceGrowth)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Terminal Growth Rate: {(inputs.terminalGrowthRate * 100).toFixed(1)}%
            </p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enterprise Value</span>
                <span className="font-mono">{formatBillion(result.enterpriseValueGrowth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PV Terminal Value</span>
                <span className="font-mono">{formatBillion(result.pvTerminalGrowth)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Exit Multiple Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-bold">
              {formatIDR(result.intrinsicPriceExit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              EV/EBITDA Exit: {inputs.exitMultiple}x
            </p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enterprise Value</span>
                <span className="font-mono">{formatBillion(result.enterpriseValueExit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PV Terminal Value</span>
                <span className="font-mono">{formatBillion(result.pvTerminalExit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Asumsi DCF</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: "WACC", value: `${(inputs.wacc * 100).toFixed(2)}%` },
              { label: "Beta", value: (stock.beta ?? 1.0).toFixed(2) },
              { label: "Terminal Growth", value: `${(inputs.terminalGrowthRate * 100).toFixed(1)}%` },
              { label: "Exit Multiple", value: `${inputs.exitMultiple}x` },
              { label: "Op. Margin", value: `${(inputs.operatingMarginTarget * 100).toFixed(1)}%` },
              { label: "Tax Rate", value: `${(inputs.taxRate * 100).toFixed(0)}%` },
              { label: "Capex/Rev", value: `${(inputs.capexPct * 100).toFixed(1)}%` },
              { label: "Net Debt", value: formatBillion(netDebt) },
            ].map((a) => (
              <div key={a.label}>
                <p className="text-xs text-muted-foreground">{a.label}</p>
                <p className="font-mono font-medium mt-0.5">{a.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5-Year Projections Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Proyeksi 5 Tahun</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Tahun", "Revenue", "EBITDA", "FCF", "Discount Factor", "PV FCF"].map((h) => (
                    <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-4", h === "Tahun" ? "text-left" : "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.years.map((y) => (
                  <tr key={y.year} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">FY{y.year}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatBillion(y.revenue)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatBillion(y.ebitda)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatBillion(y.fcf)}</td>
                    <td className="px-4 py-3 text-right font-mono">{y.discountFactor.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono text-bullish">{formatBillion(y.pvFCF)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sensitivity Analysis — WACC vs Terminal Growth Rate</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-normal px-4 py-3">
                    WACC ↓ / TGR →
                  </th>
                  {["1%", "2%", "3%", "4%"].map((g) => (
                    <th key={g} className="text-right text-xs text-muted-foreground font-normal px-4 py-3">
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.sensitivityTable.map((row) => (
                  <tr key={row.wacc} className={cn(
                    "hover:bg-muted/20",
                    Math.abs(row.wacc - inputs.wacc) < 0.001 && "bg-primary/5"
                  )}>
                    <td className={cn("px-4 py-3 font-mono font-medium", Math.abs(row.wacc - inputs.wacc) < 0.001 && "text-primary")}>
                      {(row.wacc * 100).toFixed(0)}%
                      {Math.abs(row.wacc - inputs.wacc) < 0.001 && (
                        <span className="text-xs text-muted-foreground ml-1">(base)</span>
                      )}
                    </td>
                    {[row.fairValueAt1pctGrowth, row.fairValueAt2pctGrowth, row.fairValueAt3pctGrowth, row.fairValueAt4pctGrowth].map((fv, i) => {
                      const pct = ((fv - stock.price) / stock.price) * 100;
                      return (
                        <td key={i} className={cn(
                          "px-4 py-3 text-right font-mono text-xs",
                          pct > 20 ? "text-bullish bg-bullish-muted" : pct > 0 ? "text-bullish" : pct > -20 ? "" : "text-bearish bg-bearish-muted"
                        )}>
                          <div>{fv.toLocaleString("id-ID")}</div>
                          <div className="text-[10px] opacity-70">{pct >= 0 ? "+" : ""}{pct.toFixed(0)}%</div>
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

      <AIAnalysis framework="dcf" firmName="Morgan Stanley" stockData={dcfData} />
    </div>
  );
}
