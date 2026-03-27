import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
const AIAnalysis = dynamic(() => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis })));
const MacroCharts = dynamic(() => import("./macro-charts").then(m => ({ default: m.MacroCharts })));
import { macroData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

// GDP mock since not in macroData
const gdpHistory = [
  { quarter: "Q1 2024", growth: 5.11 },
  { quarter: "Q2 2024", growth: 5.05 },
  { quarter: "Q3 2024", growth: 4.95 },
  { quarter: "Q4 2024", growth: 5.02 },
  { quarter: "Q1 2025", growth: 5.08 },
];

export default async function MacroPage() {
  const biRate = macroData.biRateHistory;
  const inflation = macroData.inflationHistory;
  const gdp = gdpHistory;

  const latestBI = biRate[biRate.length - 1];
  const prevBI = biRate[biRate.length - 2];
  const biChange = latestBI.rate - prevBI.rate;

  const latestInflation = inflation[inflation.length - 1];
  const prevInflation = inflation[inflation.length - 2];
  const inflationChange = latestInflation.cpi - prevInflation.cpi;

  const latestGDP = gdp[gdp.length - 1];

  const macroAnalysisData = {
    biRate: { current: latestBI.rate, change: biChange, history: biRate.slice(-6) },
    inflation: { current: latestInflation.cpi, change: inflationChange, history: inflation.slice(-6) },
    gdp: { current: latestGDP.growth, quarter: latestGDP.quarter },
    usdIdr: macroData.usdIdr,
    context: "Indonesia macro environment Q1 2025",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Macro Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Framework McKinsey — BI Rate, Inflasi, PDB, dan dampaknya terhadap saham IDX
        </p>
      </div>

      {/* Key Macro Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">BI Rate</p>
            <p className="font-mono text-2xl font-bold mt-1">{latestBI.rate.toFixed(2)}%</p>
            <p className={cn("flex items-center gap-1 text-xs mt-1", biChange === 0 ? "text-muted-foreground" : biChange > 0 ? "text-bearish" : "text-bullish")}>
              {biChange === 0 ? (
                "Unchanged"
              ) : (
                <>
                  {biChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {`${biChange > 0 ? "+" : ""}${(biChange * 100).toFixed(0)} bps`}
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inflasi CPI (YoY)</p>
            <p className={cn("font-mono text-2xl font-bold mt-1", latestInflation.cpi > 4 ? "text-bearish" : latestInflation.cpi < 2 ? "text-bullish" : "")}>
              {latestInflation.cpi.toFixed(1)}%
            </p>
            <p className={cn("flex items-center gap-1 text-xs mt-1", inflationChange > 0 ? "text-bearish" : "text-bullish")}>
              {inflationChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {inflationChange > 0 ? "+" : ""}{inflationChange.toFixed(1)}% MoM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">GDP Growth (YoY)</p>
            <p className={cn("font-mono text-2xl font-bold mt-1", latestGDP.growth >= 5 ? "text-bullish" : latestGDP.growth < 4 ? "text-bearish" : "")}>
              {latestGDP.growth.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{latestGDP.quarter}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Real Rate</p>
            <p className={cn("font-mono text-2xl font-bold mt-1", (latestBI.rate - latestInflation.cpi) > 1 ? "text-bullish" : "text-bearish")}>
              {(latestBI.rate - latestInflation.cpi).toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">BI Rate − Inflasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <MacroCharts biRate={biRate} inflation={inflation} gdp={gdp} />

      {/* Sector Impact Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dampak Makro terhadap Sektor IDX</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Sektor", "BI Rate ↑", "Inflasi ↑", "USD/IDR ↑", "GDP ↑", "Outlook"].map((h) => (
                    <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-4", h === "Sektor" ? "text-left" : "text-center")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { sector: "Banking", biRate: "↓ Negative", inflation: "↑ Positive", usd: "↓ Negative", gdp: "↑ Positive", outlook: "neutral" },
                  { sector: "Consumer", biRate: "↓ Negative", inflation: "↓ Negative", usd: "↓ Negative", gdp: "↑ Positive", outlook: "bearish" },
                  { sector: "Telecommunications", biRate: "↓ Negative", inflation: "→ Neutral", usd: "↓ Negative", gdp: "→ Neutral", outlook: "neutral" },
                  { sector: "Commodities", biRate: "→ Neutral", inflation: "↑ Positive", usd: "↑ Positive", gdp: "↑ Positive", outlook: "bullish" },
                  { sector: "Technology", biRate: "↓ Negative", inflation: "→ Neutral", usd: "↓ Negative", gdp: "↑ Positive", outlook: "neutral" },
                  { sector: "Property", biRate: "↓ Negative", inflation: "↑ Positive", usd: "→ Neutral", gdp: "↑ Positive", outlook: "bearish" },
                ].map((row) => (
                  <tr key={row.sector} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{row.sector}</td>
                    {[row.biRate, row.inflation, row.usd, row.gdp].map((impact, i) => (
                      <td key={i} className={cn("px-4 py-3 text-center text-xs", impact.startsWith("↑") ? "text-bullish" : impact.startsWith("↓") ? "text-bearish" : "text-muted-foreground")}>
                        {impact}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", row.outlook === "bullish" ? "border-bullish/50 text-bullish" : row.outlook === "bearish" ? "border-bearish/50 text-bearish" : "")}
                      >
                        {row.outlook}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AIAnalysis framework="macro" firmName="McKinsey" stockData={macroAnalysisData} />
    </div>
  );
}
