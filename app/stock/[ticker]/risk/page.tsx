import { getOHLCV, getStockInfo } from "@/lib/sectors";
import { calculateRiskMetrics } from "@/lib/indicators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis }))
);

const RISK_COLOR: Record<string, string> = {
  Low: "text-bullish",
  Medium: "text-yellow-500",
  High: "text-bearish",
};

const RISK_BADGE_COLOR: Record<string, string> = {
  Low: "border-bullish/40 text-bullish",
  Medium: "border-yellow-500/40 text-yellow-500",
  High: "border-bearish/40 text-bearish",
};

const METRIC_INTERPRETATIONS = [
  {
    key: "beta",
    label: "Beta",
    desc: "Sensitivitas harga vs IHSG",
    interpret: (v: number) =>
      v < 0.8 ? "Defensif — bergerak lebih lambat dari market"
      : v < 1.1 ? "Netral — mengikuti pergerakan market"
      : "Agresif — amplifikasi volatilitas market",
    fmt: (v: number) => v.toFixed(2),
  },
  {
    key: "volatility",
    label: "Volatilitas (ann.)",
    desc: "Standar deviasi return harian × √252",
    interpret: (v: number) =>
      v < 20 ? "Rendah — stabil untuk income investor"
      : v < 35 ? "Sedang — tipikal saham growth"
      : "Tinggi — cocok untuk trader, bukan long-term",
    fmt: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    key: "maxDrawdown",
    label: "Max Drawdown",
    desc: "Penurunan terbesar dari puncak ke lembah",
    interpret: (v: number) =>
      v < 15 ? "Kecil — risiko capital loss terkontrol"
      : v < 30 ? "Moderat — wajar untuk saham non-defensif"
      : "Besar — potensi capital loss signifikan",
    fmt: (v: number) => `-${v.toFixed(1)}%`,
  },
  {
    key: "var95",
    label: "VaR 95% (1-hari)",
    desc: "Kerugian maksimum dalam sehari dengan keyakinan 95%",
    interpret: (v: number) =>
      v < 1.5 ? "Rendah — fluktuasi harian terkontrol"
      : v < 3 ? "Sedang — potensi swing harian signifikan"
      : "Tinggi — potensi rugi besar dalam sehari",
    fmt: (v: number) => `-${v.toFixed(2)}%`,
  },
  {
    key: "sharpe",
    label: "Sharpe Ratio",
    desc: "Return per unit risiko (risk-free 6%/tahun)",
    interpret: (v: number) =>
      v >= 1 ? "Baik — return lebih dari kompensasi risiko"
      : v >= 0 ? "Cukup — return tipis setelah risk adjustment"
      : "Buruk — return tidak kompensasi risiko yang diambil",
    fmt: (v: number) => v.toFixed(2),
  },
];

export default async function RiskPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const [ohlcv, stock] = await Promise.all([getOHLCV(ticker), getStockInfo(ticker)]);
  const risk = calculateRiskMetrics(ohlcv);

  const riskData = {
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    beta: risk.beta,
    volatility: risk.volatility,
    maxDrawdown: risk.maxDrawdown,
    var95: risk.var95,
    sharpe: risk.sharpe,
    riskRating: risk.riskRating,
  };

  const metricValues: Record<string, number> = {
    beta: risk.beta,
    volatility: risk.volatility,
    maxDrawdown: risk.maxDrawdown,
    var95: risk.var95,
    sharpe: risk.sharpe,
  };

  return (
    <div className="space-y-6">
      {/* Risk Rating Banner */}
      <Card className={cn(
        "border",
        risk.riskRating === "Low" ? "border-bullish/30 bg-bullish/5"
        : risk.riskRating === "Medium" ? "border-yellow-500/30 bg-yellow-500/5"
        : "border-bearish/30 bg-bearish/5"
      )}>
        <CardContent className="flex items-center gap-4 p-4">
          <ShieldAlert className={cn("h-8 w-8 shrink-0", RISK_COLOR[risk.riskRating])} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{stock.ticker} — Risk Profile</span>
              <Badge variant="outline" className={RISK_BADGE_COLOR[risk.riskRating]}>
                {risk.riskRating === "Low" ? "Risiko Rendah"
                 : risk.riskRating === "Medium" ? "Risiko Sedang"
                 : "Risiko Tinggi"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {risk.riskRating === "Low"
                ? "Saham ini menunjukkan volatilitas rendah dan beta defensif, cocok untuk investor konservatif."
                : risk.riskRating === "Medium"
                ? "Profil risiko moderat, sesuai untuk investor dengan toleransi risiko menengah."
                : "Volatilitas tinggi memerlukan manajemen risiko ketat dan position sizing yang hati-hati."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {METRIC_INTERPRETATIONS.map(m => {
          const val = metricValues[m.key];
          return (
            <Card key={m.key}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="font-mono text-xl font-semibold mt-1">{m.fmt(val)}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">{m.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interpretations Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Interpretasi Metrik Risiko</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Metrik", "Nilai", "Interpretasi"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_INTERPRETATIONS.map(m => {
                const val = metricValues[m.key];
                return (
                  <tr key={m.key} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">{m.fmt(val)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{m.interpret(val)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AIAnalysis framework="risk" firmName="Bridgewater" stockData={riskData} />
    </div>
  );
}
