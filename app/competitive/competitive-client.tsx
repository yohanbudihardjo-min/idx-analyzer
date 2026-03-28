"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle } from "lucide-react";
import type { SectorCompetitiveData, CompetitorData } from "@/lib/mock-data";

const MarketShareChart = dynamic(
  () => import("@/components/charts/market-share-chart").then((m) => ({ default: m.MarketShareChart }))
);
const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then((m) => ({ default: m.AIAnalysis })),
  { ssr: false }
);

interface Props {
  sectors: SectorCompetitiveData[];
}

const MOAT_LABELS: Record<string, string> = {
  brand: "Brand",
  cost: "Cost Adv.",
  network: "Network",
  switching: "Switching",
};

function MoatDot({ value }: { value: number }) {
  const colors = ["#3f3f46", "#ef444460", "#f59e0b60", "#3b82f660", "#22c55e"];
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{ background: i <= value ? colors[value - 1] : "#27272a" }}
        />
      ))}
    </div>
  );
}

function ManagementBadge({ rating }: { rating: number }) {
  if (rating >= 8.5) return <Badge className="bg-bullish/15 text-bullish border-bullish/30 text-xs">{rating.toFixed(1)} Excellent</Badge>;
  if (rating >= 7) return <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">{rating.toFixed(1)} Good</Badge>;
  return <Badge variant="outline" className="text-muted-foreground text-xs">{rating.toFixed(1)} Average</Badge>;
}

function shareChange(data: CompetitorData["marketShare"]) {
  if (data.length < 2) return 0;
  return data[data.length - 1].share - data[0].share;
}

export function CompetitiveClient({ sectors }: Props) {
  const [activeSector, setActiveSector] = useState(sectors[0]?.sector ?? "");
  const sector = sectors.find((s) => s.sector === activeSector) ?? sectors[0];

  if (!sector) return null;

  const sorted = [...sector.competitors].sort((a, b) => b.marketCap - a.marketCap);
  const top2 = sorted.slice(0, 2);

  const aiData = {
    sector: sector.sector,
    description: sector.sectorDescription,
    threats: sector.threats.map((t) => `${t.title}: ${t.detail}`),
    competitors: sorted.map((c) => ({
      ticker: c.ticker,
      name: c.name,
      marketCap: `${c.marketCap}T IDR`,
      revenue: `${(c.revenue / 1000).toFixed(1)}T IDR`,
      revenueGrowth: `${c.revenueGrowth}%`,
      netMargin: `${c.netMargin}%`,
      roe: `${c.roe}%`,
      pe: c.pe,
      moat: c.moat,
      marketShareTrend: c.marketShare,
      managementRating: c.managementRating,
      rdSpendingPct: `${c.rdSpendingPct}%`,
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header + Sector Tabs */}
      <div>
        <div className="mb-1">
          <p className="text-xs text-muted-foreground">Bain & Company</p>
          <h1 className="text-2xl font-bold">Competitive Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">{sector.sectorDescription}</p>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {sectors.map((s) => (
            <button
              key={s.sector}
              onClick={() => setActiveSector(s.sector)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activeSector === s.sector
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              )}
            >
              {s.sector}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Market Cap Ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Market Cap Comparison (Triliun IDR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sorted.map((c, i) => {
              const pct = (c.marketCap / sorted[0].marketCap) * 100;
              return (
                <div key={c.ticker} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <span className="font-mono text-xs font-semibold w-12">{c.ticker}</span>
                  <div className="flex-1 bg-muted/30 rounded-full h-5 relative">
                    <div
                      className="h-5 rounded-full bg-primary/70 flex items-center pl-2 transition-all"
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-[10px] text-white font-mono whitespace-nowrap">
                        {c.marketCap.toFixed(0)}T
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Revenue & Margin Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Revenue & Profitabilitas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Perusahaan", "Revenue (T IDR)", "Growth YoY", "Gross Margin", "Net Margin", "ROE", "P/E"].map((h) => (
                    <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-4", h === "Perusahaan" ? "text-left" : "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((c) => {
                  const bestNetMargin = Math.max(...sorted.map((x) => x.netMargin));
                  const bestROE = Math.max(...sorted.map((x) => x.roe));
                  const worstGrowth = Math.min(...sorted.map((x) => x.revenueGrowth));
                  return (
                    <tr key={c.ticker} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-xs">{c.ticker}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{c.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {(c.revenue / 1000).toFixed(1)}T
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs",
                        c.revenueGrowth === worstGrowth ? "text-bearish" : c.revenueGrowth > 10 ? "text-bullish" : ""
                      )}>
                        {c.revenueGrowth >= 0 ? "+" : ""}{c.revenueGrowth.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {c.grossMargin.toFixed(1)}%
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs",
                        c.netMargin === bestNetMargin ? "text-bullish font-semibold" : ""
                      )}>
                        {c.netMargin.toFixed(1)}%
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs",
                        c.roe === bestROE ? "text-bullish font-semibold" : ""
                      )}>
                        {c.roe.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {c.pe?.toFixed(1) ?? "—"}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. Moat Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Competitive Moat Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-xs text-muted-foreground font-normal py-3 px-4 text-left">Perusahaan</th>
                  {Object.values(MOAT_LABELS).map((l) => (
                    <th key={l} className="text-xs text-muted-foreground font-normal py-3 px-4 text-center">{l}</th>
                  ))}
                  <th className="text-xs text-muted-foreground font-normal py-3 px-4 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((c) => {
                  const total = c.moat.brand + c.moat.cost + c.moat.network + c.moat.switching;
                  const bestTotal = Math.max(...sorted.map((x) => x.moat.brand + x.moat.cost + x.moat.network + x.moat.switching));
                  return (
                    <tr key={c.ticker} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-xs">{c.ticker}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{c.name}</p>
                      </td>
                      {(["brand", "cost", "network", "switching"] as const).map((key) => (
                        <td key={key} className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <MoatDot value={c.moat[key]} />
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className={cn("font-mono font-bold text-sm", total === bestTotal ? "text-bullish" : "text-muted-foreground")}>
                          {total}/20
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground px-4 pb-3">Skala 1–5 per dimensi moat. Warna: merah=lemah, kuning=sedang, biru=kuat, hijau=sangat kuat</p>
        </CardContent>
      </Card>

      {/* 4. Market Share Trends */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Tren Market Share (3 Tahun)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MarketShareChart
            competitors={sorted.map((c) => ({ name: c.name, ticker: c.ticker, data: c.marketShare }))}
          />
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {sorted.map((c) => {
              const chg = shareChange(c.marketShare);
              return (
                <div key={c.ticker} className="text-center">
                  <p className="font-mono text-xs font-semibold">{c.ticker}</p>
                  <div className={cn("flex items-center justify-center gap-1 text-xs", chg > 0 ? "text-bullish" : chg < 0 ? "text-bearish" : "text-muted-foreground")}>
                    {chg > 0 ? <TrendingUp className="h-3 w-3" /> : chg < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {chg >= 0 ? "+" : ""}{chg.toFixed(1)}pp
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Management & R&D */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Management Quality & Inovasi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Perusahaan", "Management Rating", "R&D Spending (% Rev)", "Capital Allocation"].map((h) => (
                  <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-4", h === "Perusahaan" ? "text-left" : "text-center")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((c) => (
                <tr key={c.ticker} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-xs">{c.ticker}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">{c.name}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ManagementBadge rating={c.managementRating} />
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs">
                    {c.rdSpendingPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("text-xs", c.roe >= 20 ? "text-bullish" : c.roe >= 12 ? "text-muted-foreground" : "text-bearish")}>
                      {c.roe >= 20 ? "Excellent" : c.roe >= 12 ? "Good" : "Below Avg"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 6. Sector Threats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-bearish" />
            Ancaman Utama Sektor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sector.threats.map((t, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-bearish mb-1">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 7. SWOT Top 2 */}
      {top2.filter((c) => c.swot).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {top2.filter((c) => c.swot).map((c) => (
            <Card key={c.ticker}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  SWOT — {c.ticker} ({c.name})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {([
                  { key: "strengths", label: "Strengths", color: "text-bullish" },
                  { key: "weaknesses", label: "Weaknesses", color: "text-bearish" },
                  { key: "opportunities", label: "Opportunities", color: "text-primary" },
                  { key: "threats", label: "Threats", color: "text-amber-500" },
                ] as const).map(({ key, label, color }) => (
                  <div key={key}>
                    <p className={cn("text-xs font-semibold mb-1", color)}>{label}</p>
                    <ul className="space-y-0.5">
                      {c.swot![key].map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className={cn("mt-1 shrink-0", color)}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 8. AI Analysis (Bain) */}
      <AIAnalysis
        framework="competitive"
        firmName="Bain & Company"
        stockData={aiData}
      />
    </div>
  );
}
