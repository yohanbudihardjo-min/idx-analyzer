"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Activity,
} from "lucide-react";
import type { PortfolioRiskReport } from "@/lib/portfolio-risk";

const AIAnalysis = dynamic(
  () =>
    import("@/components/ai-analysis").then((m) => ({ default: m.AIAnalysis })),
  { ssr: false }
);

// ─── Types ──────────────────────────────────────────────────────────────────

interface HoldingForm {
  ticker: string;
  weight: number;
}

const AVAILABLE_TICKERS = [
  { value: "BBCA", label: "BBCA — Bank Central Asia" },
  { value: "TLKM", label: "TLKM — Telkom Indonesia" },
  { value: "ASII", label: "ASII — Astra International" },
  { value: "BMRI", label: "BMRI — Bank Mandiri" },
  { value: "GOTO", label: "GOTO — GoTo Gojek Tokopedia" },
];

// ─── Risk Colors ────────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  Low: "text-bullish",
  Medium: "text-yellow-500",
  High: "text-bearish",
};

const RISK_BG: Record<string, string> = {
  Low: "bg-bullish/15 border-bullish/30",
  Medium: "bg-yellow-500/15 border-yellow-500/30",
  High: "bg-bearish/15 border-bearish/30",
};

const RISK_BADGE: Record<string, string> = {
  Low: "border-bullish/40 text-bullish",
  Medium: "border-yellow-500/40 text-yellow-500",
  High: "border-bearish/40 text-bearish",
};

function riskCell(level: "Low" | "Medium" | "High") {
  const colors = {
    Low: "bg-bullish/20 text-bullish",
    Medium: "bg-yellow-500/20 text-yellow-500",
    High: "bg-bearish/20 text-bearish",
  };
  const labels = { Low: "Rendah", Medium: "Sedang", High: "Tinggi" };
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded text-[10px] font-semibold",
        colors[level]
      )}
    >
      {labels[level]}
    </span>
  );
}

function corrColor(corr: number): string {
  if (corr >= 0.7) return "bg-bearish/30 text-bearish";
  if (corr >= 0.4) return "bg-yellow-500/20 text-yellow-500";
  if (corr >= 0) return "bg-bullish/20 text-bullish";
  return "bg-blue-500/20 text-blue-500";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PortfolioRiskClient() {
  const [holdings, setHoldings] = useState<HoldingForm[]>([
    { ticker: "BBCA", weight: 30 },
    { ticker: "TLKM", weight: 20 },
    { ticker: "ASII", weight: 20 },
    { ticker: "BMRI", weight: 20 },
    { ticker: "GOTO", weight: 10 },
  ]);
  const [report, setReport] = useState<PortfolioRiskReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalWeight = holdings.reduce((acc, h) => acc + h.weight, 0);
  const isValid =
    totalWeight === 100 &&
    holdings.length >= 2 &&
    holdings.every((h) => h.ticker && h.weight > 0);

  function addHolding() {
    const used = new Set(holdings.map((h) => h.ticker));
    const next = AVAILABLE_TICKERS.find((t) => !used.has(t.value));
    if (next) setHoldings([...holdings, { ticker: next.value, weight: 0 }]);
  }

  function removeHolding(idx: number) {
    setHoldings(holdings.filter((_, i) => i !== idx));
  }

  function updateHolding(idx: number, field: keyof HoldingForm, value: string | number) {
    setHoldings(
      holdings.map((h, i) => (i === idx ? { ...h, [field]: value } : h))
    );
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
      });
      const data = await res.json();
      setReport(data);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSubmitted(false);
    setReport(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground">Bridgewater Associates</p>
        <h1 className="text-2xl font-bold">Portfolio Risk Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analisis risiko portofolio komprehensif: korelasi, stress test, tail
          risk, konsentrasi sektor, dan strategi hedging.
        </p>
      </div>

      {/* Input Form */}
      {!submitted && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Komposisi Portofolio Anda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {holdings.map((h, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Select
                    value={h.ticker}
                    onValueChange={(v) => v && updateHolding(idx, "ticker", v)}
                  >
                    <SelectTrigger className="h-8 text-xs w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TICKERS.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          className="text-xs"
                          disabled={
                            holdings.some(
                              (hh, ii) =>
                                ii !== idx && hh.ticker === t.value
                            )
                          }
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={h.weight}
                      onChange={(e) =>
                        updateHolding(
                          idx,
                          "weight",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-8 w-20 text-xs text-center"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  {holdings.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => removeHolding(idx)}
                    >
                      Hapus
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3">
                  {holdings.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addHolding}
                      className="h-7 text-xs"
                    >
                      + Tambah Saham
                    </Button>
                  )}
                  <span
                    className={cn(
                      "text-xs font-mono font-semibold",
                      totalWeight === 100
                        ? "text-bullish"
                        : "text-bearish"
                    )}
                  >
                    Total: {totalWeight}%{" "}
                    {totalWeight !== 100 && "(harus 100%)"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full h-11 gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Menghitung
                Risiko...
              </>
            ) : (
              <>
                Analisis Risiko Portofolio{" "}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      {submitted && report && (
        <div className="space-y-6">
          {/* Back + Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {report.holdings.map((h) => `${h.ticker} ${h.weight}%`).join(" · ")}
              </p>
              <h2 className="text-lg font-semibold">
                Risk Assessment Report
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Ubah Portofolio
            </Button>
          </div>

          {/* Overall Risk Banner */}
          <Card
            className={cn("border", RISK_BG[report.overallRiskRating])}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <ShieldAlert
                className={cn(
                  "h-8 w-8 shrink-0",
                  RISK_COLOR[report.overallRiskRating]
                )}
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">
                    Portfolio Risk Profile
                  </span>
                  <Badge
                    variant="outline"
                    className={RISK_BADGE[report.overallRiskRating]}
                  >
                    {report.overallRiskRating === "Low"
                      ? "Risiko Rendah"
                      : report.overallRiskRating === "Medium"
                        ? "Risiko Sedang"
                        : "Risiko Tinggi"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Volatilitas {report.portfolioVolatility}% · Beta{" "}
                  {report.portfolioBeta} · VaR 95%{" "}
                  {report.portfolioVaR95}% · Sharpe{" "}
                  {report.portfolioSharpe} · HHI{" "}
                  {report.herfindahlIndex}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                label: "Volatilitas",
                value: `${report.portfolioVolatility}%`,
                sub: "Annualized",
              },
              {
                label: "Beta",
                value: report.portfolioBeta.toFixed(2),
                sub: "vs IHSG",
              },
              {
                label: "VaR 95%",
                value: `-${report.portfolioVaR95}%`,
                sub: "1-hari",
              },
              {
                label: "Max Drawdown",
                value: `-${report.portfolioMaxDrawdown}%`,
                sub: "Estimasi",
              },
              {
                label: "Sharpe Ratio",
                value: report.portfolioSharpe.toFixed(2),
                sub: "Risk-adj return",
              },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="font-mono text-xl font-semibold mt-1">
                    {m.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.sub}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Heat Map Summary Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Heat Map — Risk per Holding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Saham",
                        "Bobot",
                        "Volatilitas",
                        "Beta",
                        "Max DD",
                        "Likuiditas",
                        "Rate Sensitivity",
                        "Sharpe",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.holdings.map((h) => {
                      const volRisk =
                        h.volatility > 35
                          ? "High"
                          : h.volatility > 20
                            ? "Medium"
                            : "Low";
                      const betaRisk =
                        h.beta > 1.3
                          ? "High"
                          : h.beta > 0.9
                            ? "Medium"
                            : "Low";
                      const ddRisk =
                        h.maxDrawdown > 30
                          ? "High"
                          : h.maxDrawdown > 15
                            ? "Medium"
                            : "Low";
                      const sharpeRisk =
                        h.sharpe < 0
                          ? "High"
                          : h.sharpe < 0.5
                            ? "Medium"
                            : "Low";

                      return (
                        <tr
                          key={h.ticker}
                          className="border-b border-border last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-3 py-3">
                            <p className="font-mono font-semibold text-xs">
                              {h.ticker}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {h.name}
                            </p>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs font-semibold">
                            {h.weight}%
                          </td>
                          <td className="px-3 py-3">
                            {riskCell(volRisk as "Low" | "Medium" | "High")}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {h.volatility}%
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {riskCell(betaRisk as "Low" | "Medium" | "High")}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {h.beta}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {riskCell(ddRisk as "Low" | "Medium" | "High")}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              -{h.maxDrawdown}%
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {riskCell(h.liquidityRating)}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Score: {h.liquidityScore}/10
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {riskCell(h.interestRateSensitivity)}
                          </td>
                          <td className="px-3 py-3">
                            {riskCell(
                              sharpeRisk as "Low" | "Medium" | "High"
                            )}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {h.sharpe}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Correlation Matrix */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Matriks Korelasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">
                        Pair
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">
                        Korelasi
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">
                        Interpretasi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.correlationMatrix.map((c) => (
                      <tr
                        key={`${c.ticker1}-${c.ticker2}`}
                        className="border-b border-border last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold">
                          {c.ticker1} / {c.ticker2}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold",
                              corrColor(c.correlation)
                            )}
                          >
                            {c.correlation.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {c.correlation >= 0.7
                            ? "Korelasi tinggi — diversifikasi rendah"
                            : c.correlation >= 0.4
                              ? "Korelasi sedang — diversifikasi parsial"
                              : c.correlation >= 0
                                ? "Korelasi rendah — diversifikasi baik"
                                : "Korelasi negatif — hedging natural"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Sector Concentration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Konsentrasi Sektor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.sectorConcentration.map((s) => (
                <div key={s.sector}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.sector}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          RISK_BADGE[s.riskLevel]
                        )}
                      >
                        {s.riskLevel === "High"
                          ? "Terkonsentrasi"
                          : s.riskLevel === "Medium"
                            ? "Moderat"
                            : "Terdiversifikasi"}
                      </Badge>
                    </div>
                    <span className="font-mono font-semibold">
                      {s.weight}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        s.riskLevel === "High"
                          ? "bg-bearish"
                          : s.riskLevel === "Medium"
                            ? "bg-yellow-500"
                            : "bg-bullish"
                      )}
                      style={{ width: `${s.weight}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Holdings: {s.holdings.join(", ")}
                  </p>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Herfindahl-Hirschman Index (HHI):{" "}
                  <span className="font-mono font-semibold">
                    {report.herfindahlIndex}
                  </span>
                  {report.herfindahlIndex > 0.25
                    ? " — Portofolio terkonsentrasi, pertimbangkan diversifikasi"
                    : " — Konsentrasi wajar"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stress Test Scenarios */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-bearish" />
                Stress Test Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Skenario",
                        "Drawdown",
                        "Probabilitas",
                        "Dampak per Holding",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.stressScenarios.map((s) => (
                      <tr
                        key={s.name}
                        className="border-b border-border last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground max-w-[200px]">
                            {s.description}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-bold text-bearish">
                            -{s.estimatedDrawdown}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">
                            {(s.probability * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {s.affectedHoldings.map((ah) => (
                              <span
                                key={ah.ticker}
                                className="text-[10px] font-mono bg-bearish/10 text-bearish px-1.5 py-0.5 rounded"
                              >
                                {ah.ticker} {ah.impact}%
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tail Risk */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "CVaR 95% (Expected Shortfall)",
                value: `-${report.tailRiskMetrics.cvar95}%`,
                desc: "Rata-rata kerugian di luar VaR",
                icon: AlertTriangle,
              },
              {
                label: "Tail Index",
                value: report.tailRiskMetrics.tailIndex.toFixed(2),
                desc: "CVaR/VaR ratio — fat tail indicator",
                icon: Activity,
              },
              {
                label: "Worst-Case Bulanan",
                value: `-${report.tailRiskMetrics.worstCaseMonthly}%`,
                desc: "Estimasi kerugian bulanan terburuk",
                icon: TrendingDown,
              },
              {
                label: "Black Swan Drawdown",
                value: `-${report.tailRiskMetrics.blackSwanDrawdown}%`,
                desc: "Skenario 2.5x max drawdown",
                icon: ShieldAlert,
              },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <m.icon className="h-3.5 w-3.5 text-bearish" />
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </div>
                  <p className="font-mono text-lg font-semibold text-bearish">
                    {m.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {m.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hedging Strategies */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Strategi Hedging Rekomendasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.hedgingRecommendations.map((h, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-semibold text-bearish">
                      Risiko: {h.risk}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0"
                    >
                      {h.estimatedCost}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {h.strategy}
                  </p>
                  <p className="text-xs">
                    <span className="text-muted-foreground">Instrumen:</span>{" "}
                    <span className="font-medium">{h.instrument}</span>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <AIAnalysis
            framework="portfolio-risk"
            firmName="Bridgewater"
            stockData={{
              holdings: report.holdings,
              portfolioMetrics: {
                volatilitas: `${report.portfolioVolatility}%`,
                beta: report.portfolioBeta,
                sharpe: report.portfolioSharpe,
                var95: `${report.portfolioVaR95}%`,
                maxDrawdown: `${report.portfolioMaxDrawdown}%`,
                overallRisk: report.overallRiskRating,
                herfindahlIndex: report.herfindahlIndex,
              },
              correlationMatrix: report.correlationMatrix,
              sectorConcentration: report.sectorConcentration,
              stressScenarios: report.stressScenarios.map((s) => ({
                nama: s.name,
                drawdown: `${s.estimatedDrawdown}%`,
                probabilitas: `${(s.probability * 100).toFixed(0)}%`,
              })),
              tailRisk: report.tailRiskMetrics,
              hedging: report.hedgingRecommendations,
            }}
          />
        </div>
      )}
    </div>
  );
}
