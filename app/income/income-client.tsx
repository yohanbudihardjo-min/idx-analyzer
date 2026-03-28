"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Coins } from "lucide-react";

const AllocationPieChart = dynamic(
  () => import("@/components/charts/allocation-pie-chart").then((m) => ({ default: m.AllocationPieChart }))
);
const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then((m) => ({ default: m.AIAnalysis })),
  { ssr: false }
);

// ─── Data ────────────────────────────────────────────────────────────────────

type RiskLevel = "aman" | "moderat" | "agresif";

interface DividendStock {
  ticker: string;
  name: string;
  sector: string;
  yield: number;
  safetyScore: number;
  consecutiveGrowth: number;
  payoutRatio: number;
  dgr5Y: number;
  dps: number;
  price: number;
  riskLevel: RiskLevel;
  notes: string;
}

const STOCKS: DividendStock[] = [
  { ticker: "BBCA", name: "Bank Central Asia", sector: "Perbankan", yield: 1.8, safetyScore: 9.5, consecutiveGrowth: 8, payoutRatio: 45, dgr5Y: 8.0, dps: 177, price: 9850, riskLevel: "aman", notes: "DPS tumbuh konsisten 8%/th; CASA ratio tertinggi menjamin keberlanjutan dividen" },
  { ticker: "BMRI", name: "Bank Mandiri", sector: "Perbankan", yield: 4.5, safetyScore: 8.5, consecutiveGrowth: 6, payoutRatio: 55, dgr5Y: 6.0, dps: 635, price: 5800, riskLevel: "aman", notes: "Yield menarik dengan coverage ratio kuat; BUMN bank terbesar Indonesia" },
  { ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", yield: 4.8, safetyScore: 8.2, consecutiveGrowth: 7, payoutRatio: 58, dgr5Y: 5.5, dps: 208, price: 4350, riskLevel: "aman", notes: "Dividen stabil dari earnings UMKM; free float besar dan likuiditas tinggi" },
  { ticker: "BBNI", name: "Bank Negara Indonesia", sector: "Perbankan", yield: 3.2, safetyScore: 7.8, consecutiveGrowth: 5, payoutRatio: 48, dgr5Y: 5.0, dps: 140, price: 4400, riskLevel: "aman", notes: "Payout ratio aman; valuasi murah vs peers BUKU 4" },
  { ticker: "TLKM", name: "Telkom Indonesia", sector: "Telekomunikasi", yield: 5.1, safetyScore: 8.0, consecutiveGrowth: 5, payoutRatio: 62, dgr5Y: 3.0, dps: 158, price: 3090, riskLevel: "aman", notes: "Yield tertinggi di sektor defensif; monopoli infrastruktur melindungi FCF" },
  { ticker: "ASII", name: "Astra International", sector: "Industri", yield: 4.2, safetyScore: 8.5, consecutiveGrowth: 6, payoutRatio: 52, dgr5Y: 5.0, dps: 246, price: 5850, riskLevel: "aman", notes: "Konglomerat terdiversifikasi; dividen konsisten meski ada siklus otomotif" },
  { ticker: "ICBP", name: "Indofood CBP", sector: "Konsumer", yield: 2.8, safetyScore: 8.0, consecutiveGrowth: 5, payoutRatio: 48, dgr5Y: 6.0, dps: 285, price: 10200, riskLevel: "aman", notes: "Pertumbuhan dividen stabil; margin terjaga dari kenaikan harga Indomie" },
  { ticker: "KLBF", name: "Kalbe Farma", sector: "Kesehatan", yield: 2.1, safetyScore: 8.2, consecutiveGrowth: 7, payoutRatio: 42, dgr5Y: 7.0, dps: 44, price: 2090, riskLevel: "aman", notes: "7 tahun tumbuh berturut; payout rendah = ruang pertumbuhan dividen besar" },
  { ticker: "INDF", name: "Indofood Sukses Makmur", sector: "Konsumer", yield: 5.2, safetyScore: 7.5, consecutiveGrowth: 4, payoutRatio: 58, dgr5Y: 4.0, dps: 370, price: 7100, riskLevel: "aman", notes: "Yield tinggi untuk sektor konsumer; dilindungi brand Indomie global" },
  { ticker: "SMGR", name: "Semen Indonesia", sector: "Material", yield: 3.8, safetyScore: 7.0, consecutiveGrowth: 3, payoutRatio: 55, dgr5Y: 3.0, dps: 181, price: 4760, riskLevel: "moderat", notes: "BUMN semen terbesar; tergantung siklus konstruksi & infrastruktur IKN" },
  { ticker: "JSMR", name: "Jasa Marga", sector: "Infrastruktur", yield: 3.1, safetyScore: 7.2, consecutiveGrowth: 4, payoutRatio: 50, dgr5Y: 4.0, dps: 110, price: 3540, riskLevel: "moderat", notes: "Pendapatan tol stabil dan terprediksi; leverage moderat perlu dipantau" },
  { ticker: "MYOR", name: "Mayora Indah", sector: "Konsumer", yield: 1.4, safetyScore: 7.5, consecutiveGrowth: 4, payoutRatio: 38, dgr5Y: 8.0, dps: 62, price: 4430, riskLevel: "moderat", notes: "Yield rendah tapi DGR tinggi; ekspor diversifikasi risiko domestik" },
  { ticker: "HMSP", name: "HM Sampoerna", sector: "Konsumer", yield: 6.2, safetyScore: 6.8, consecutiveGrowth: 3, payoutRatio: 82, dgr5Y: -3.0, dps: 56, price: 905, riskLevel: "moderat", notes: "Yield sangat tinggi tapi DPS menurun — tekanan regulasi cukai rokok" },
  { ticker: "UNVR", name: "Unilever Indonesia", sector: "Konsumer", yield: 5.8, safetyScore: 6.5, consecutiveGrowth: 2, payoutRatio: 95, dgr5Y: -2.0, dps: 101, price: 1735, riskLevel: "moderat", notes: "Payout hampir 100% — rentan jika earnings turun; revenue sedang tertekan" },
  { ticker: "MDKA", name: "Merdeka Copper Gold", sector: "Material", yield: 1.2, safetyScore: 6.5, consecutiveGrowth: 2, payoutRatio: 30, dgr5Y: 10.0, dps: 14, price: 1170, riskLevel: "moderat", notes: "Yield rendah, potensi DGR besar; ekspansi tembaga untuk EV supply chain" },
  { ticker: "PTBA", name: "Bukit Asam", sector: "Energi", yield: 12.0, safetyScore: 5.5, consecutiveGrowth: 2, payoutRatio: 80, dgr5Y: -5.0, dps: 428, price: 3570, riskLevel: "agresif", notes: "Yield extraordinary tapi sangat siklikal; DPS turun tajam saat harga batu bara normal" },
  { ticker: "ADRO", name: "Adaro Energy", sector: "Energi", yield: 8.5, safetyScore: 5.8, consecutiveGrowth: 2, payoutRatio: 70, dgr5Y: -3.0, dps: 238, price: 2800, riskLevel: "agresif", notes: "Yield tinggi saat harga coal tinggi; risiko penurunan dividen besar saat siklus turun" },
  { ticker: "ITMG", name: "Indo Tambangraya Megah", sector: "Energi", yield: 15.0, safetyScore: 4.5, consecutiveGrowth: 1, payoutRatio: 85, dgr5Y: -8.0, dps: 4219, price: 28100, riskLevel: "agresif", notes: "Yield tertinggi IDX — sangat siklikal; tidak cocok untuk income investing jangka panjang" },
];

const SECTOR_COLORS: Record<string, string> = {
  Perbankan: "#3b82f6",
  Telekomunikasi: "#22c55e",
  Industri: "#f59e0b",
  Konsumer: "#a855f7",
  Kesehatan: "#06b6d4",
  Material: "#f97316",
  Infrastruktur: "#ec4899",
  Energi: "#ef4444",
};

// ─── Computation ─────────────────────────────────────────────────────────────

function filterStocks(risk: "aman" | "seimbang" | "agresif"): DividendStock[] {
  if (risk === "aman") return STOCKS.filter((s) => s.riskLevel === "aman");
  if (risk === "seimbang") return STOCKS.filter((s) => s.riskLevel !== "agresif");
  return STOCKS;
}

function computeWeights(stocks: DividendStock[]): Map<string, number> {
  const raw = stocks.map((s) => s.safetyScore * s.safetyScore * Math.log(s.yield + 1));
  const total = raw.reduce((a, b) => a + b, 0);
  const pcts = raw.map((r) => Math.round((r / total) * 100));
  // Adjust rounding so they sum to exactly 100
  const diff = 100 - pcts.reduce((a, b) => a + b, 0);
  pcts[0] += diff;
  const map = new Map<string, number>();
  stocks.forEach((s, i) => map.set(s.ticker, pcts[i]));
  return map;
}

function weightedAvg(stocks: DividendStock[], weights: Map<string, number>, key: keyof DividendStock): number {
  return stocks.reduce((sum, s) => sum + (weights.get(s.ticker) ?? 0) * (s[key] as number), 0) / 100;
}

function computeDRIP(investment: number, yieldPct: number, dgrPct: number, years = 10) {
  const rows = [];
  let portfolio = investment;
  let effectiveYield = yieldPct;
  let cumulative = 0;
  for (let y = 0; y <= years; y++) {
    const annualGross = y === 0 ? 0 : portfolio * effectiveYield / 100;
    const annualNet = annualGross * 0.9;
    cumulative += annualNet;
    rows.push({
      year: y,
      portfolio: Math.round(portfolio),
      annualGross: Math.round(annualGross),
      annualNet: Math.round(annualNet),
      monthlyNet: Math.round(annualNet / 12),
      cumulative: Math.round(cumulative),
    });
    portfolio += annualNet; // DRIP: reinvest net dividends
    effectiveYield = effectiveYield * (1 + dgrPct / 100); // DGR applied
  }
  return rows;
}

function sectorBreakdown(stocks: DividendStock[], weights: Map<string, number>) {
  const map: Record<string, number> = {};
  stocks.forEach((s) => {
    map[s.sector] = (map[s.sector] ?? 0) + (weights.get(s.ticker) ?? 0);
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value, color: SECTOR_COLORS[name] ?? "#a1a1aa" }))
    .sort((a, b) => b.value - a.value);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function safetyColor(score: number) {
  if (score >= 8.5) return "bg-bullish/15 text-bullish border-bullish/30";
  if (score >= 7.0) return "bg-primary/15 text-primary border-primary/30";
  if (score >= 5.5) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-bearish/15 text-bearish border-bearish/30";
}

function payoutColor(ratio: number) {
  if (ratio <= 60) return "text-bullish";
  if (ratio <= 80) return "text-amber-400";
  return "text-bearish";
}

function dgrColor(dgr: number) {
  if (dgr >= 5) return "text-bullish";
  if (dgr >= 0) return "text-muted-foreground";
  return "text-bearish";
}

// ─── Component ───────────────────────────────────────────────────────────────

type FilterRisk = "aman" | "seimbang" | "agresif";
type AccountType = "saham" | "reksa-dana" | "campuran";

interface Inputs {
  investment: number;
  monthlyGoal: number;
  risk: FilterRisk;
  accountType: AccountType;
}

const DEFAULTS: Inputs = {
  investment: 500_000_000,
  monthlyGoal: 3_000_000,
  risk: "seimbang",
  accountType: "campuran",
};

export function IncomeClient() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof Inputs>(k: K, v: Inputs[K]) {
    setInputs((p) => ({ ...p, [k]: v }));
  }

  const stocks = filterStocks(inputs.risk);
  const weights = computeWeights(stocks);
  const wYield = weightedAvg(stocks, weights, "yield");
  const wDGR = weightedAvg(stocks, weights, "dgr5Y");
  const annualGross = inputs.investment * wYield / 100;
  const monthlyNet = (annualGross * 0.9) / 12;
  const capitalNeeded = inputs.monthlyGoal > 0 ? Math.round((inputs.monthlyGoal / 0.9) * 12 / (wYield / 100)) : 0;
  const drip = computeDRIP(inputs.investment, wYield, wDGR);
  const sectors = sectorBreakdown(stocks, weights);

  const sortedStocks = [...stocks].sort((a, b) => b.safetyScore - a.safetyScore);

  const aiData = {
    profil: {
      modal: formatIDR(inputs.investment),
      targetIncomeBulanan: formatIDR(inputs.monthlyGoal),
      riskPreference: inputs.risk,
      jenisAkun: inputs.accountType,
    },
    portofolio: {
      weightedYield: `${wYield.toFixed(2)}%`,
      weightedDGR: `${wDGR.toFixed(1)}%/th`,
      incomeKotorTahunan: formatIDR(annualGross),
      incomeNetBulanan: formatIDR(monthlyNet),
    },
    saham: sortedStocks.map((s) => ({
      ticker: s.ticker,
      nama: s.name,
      sektor: s.sector,
      yield: `${s.yield}%`,
      safetyScore: s.safetyScore,
      consecutiveGrowth: `${s.consecutiveGrowth} tahun`,
      payoutRatio: `${s.payoutRatio}%`,
      dgr5Y: `${s.dgr5Y}%/th`,
      bobot: `${weights.get(s.ticker)}%`,
      catatan: s.notes,
    })),
    drip10Y: drip.map((r) => ({
      tahun: r.year,
      nilaiPortofolio: formatIDR(r.portfolio),
      incomeBulananNet: formatIDR(r.monthlyNet),
    })),
    sektorDiversifikasi: sectors.map((s) => `${s.name}: ${s.value}%`),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground">Harvard Management Company</p>
        <h1 className="text-2xl font-bold">Dividend Income Strategy</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bangun portofolio saham dividen IDX yang menghasilkan passive income andal dan tumbuh setiap tahun.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Profil Investor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Modal Investasi (IDR)</p>
              <Input type="number" value={inputs.investment}
                onChange={(e) => set("investment", parseInt(e.target.value) || 0)}
                className="h-8 text-xs" />
              <p className="text-[10px] text-muted-foreground mt-1">{formatIDR(inputs.investment)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Target Income / Bulan (IDR)</p>
              <Input type="number" value={inputs.monthlyGoal}
                onChange={(e) => set("monthlyGoal", parseInt(e.target.value) || 0)}
                className="h-8 text-xs" />
              {capitalNeeded > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">Modal dibutuhkan: {formatIDR(capitalNeeded)}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Jenis Akun</p>
              <Select value={inputs.accountType} onValueChange={(v) => set("accountType", v as AccountType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saham" className="text-xs">Saham Langsung (sekuritas)</SelectItem>
                  <SelectItem value="reksa-dana" className="text-xs">Reksa Dana Dividen</SelectItem>
                  <SelectItem value="campuran" className="text-xs">Campuran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Risk Preference</p>
              <div className="flex gap-1.5">
                {(["aman", "seimbang", "agresif"] as FilterRisk[]).map((r) => (
                  <button key={r} onClick={() => set("risk", r)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs border transition-colors capitalize",
                      inputs.risk === r
                        ? r === "aman" ? "bg-bullish/15 border-bullish/40 text-bullish"
                          : r === "agresif" ? "bg-bearish/15 border-bearish/40 text-bearish"
                          : "bg-primary/15 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    )}>
                    {r === "aman" ? "Aman" : r === "seimbang" ? "Seimbang" : "Agresif"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{stocks.length} saham dipilih</p>
            </div>
          </div>
          <Button onClick={() => setSubmitted(true)} className="mt-4 gap-2">
            Bangun Portofolio Dividen <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Income Preview Cards — always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Blended Yield", value: `${wYield.toFixed(2)}%/th`, sub: "rata-rata tertimbang", icon: TrendingUp, color: "text-bullish" },
          { label: "Income Kotor / Tahun", value: formatIDR(annualGross), sub: "sebelum pajak 10%", icon: Coins, color: "text-primary" },
          { label: "Income Bersih / Bulan", value: formatIDR(monthlyNet), sub: "setelah PPh final 10%", icon: Coins, color: "text-bullish" },
          { label: "DGR Proyeksi 5Y", value: `${wDGR.toFixed(1)}%/th`, sub: "pertumbuhan dividen", icon: wDGR >= 0 ? TrendingUp : TrendingDown, color: wDGR >= 0 ? "text-bullish" : "text-bearish" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <c.icon className={cn("h-4 w-4 mt-0.5 shrink-0", c.color)} />
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={cn("font-mono font-bold text-base mt-0.5", c.color)}>{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Daftar Saham Dividen — Paling Aman ke Agresif</CardTitle>
            {submitted && (
              <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)} className="gap-1 text-xs h-7">
                <RefreshCw className="h-3 w-3" /> Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Saham", "Sektor", "Yield", "Safety", "Cons. Growth", "Payout", "DGR 5Y", "Bobot", "Status"].map((h) => (
                    <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-3",
                      h === "Saham" || h === "Sektor" ? "text-left" : "text-center"
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedStocks.map((s, i) => (
                  <tr key={s.ticker} className="hover:bg-muted/20">
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-mono font-semibold text-xs">{s.ticker}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{s.name}</p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.sector}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-xs font-semibold text-bullish">{s.yield.toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge className={cn("text-[10px] px-1.5", safetyColor(s.safetyScore))}>{s.safetyScore.toFixed(1)}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs font-mono">{s.consecutiveGrowth}th</td>
                    <td className={cn("px-3 py-2.5 text-center font-mono text-xs", payoutColor(s.payoutRatio))}>
                      {s.payoutRatio}%
                      {s.payoutRatio > 80 && <AlertTriangle className="inline h-3 w-3 ml-0.5" />}
                    </td>
                    <td className={cn("px-3 py-2.5 text-center font-mono text-xs", dgrColor(s.dgr5Y))}>
                      {s.dgr5Y >= 0 ? "+" : ""}{s.dgr5Y.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-xs font-semibold">{weights.get(s.ticker)}%</td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5",
                        s.riskLevel === "aman" ? "text-bullish border-bullish/30"
                          : s.riskLevel === "moderat" ? "text-amber-400 border-amber-400/30"
                          : "text-bearish border-bearish/30"
                      )}>{s.riskLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground px-4 pb-3 mt-1">
            Safety Score 1-10: warna hijau ≥8.5 (excellent), biru ≥7 (good), kuning ≥5.5 (moderate), merah &lt;5.5 (risky). Payout &gt;80% diberi tanda peringatan.
          </p>
        </CardContent>
      </Card>

      {/* Sector + Individual Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Diversifikasi Sektor</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationPieChart data={sectors} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Alokasi per Sektor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sectors.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="font-mono font-semibold">{s.value}%</span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full">
                  <div className="h-2 rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatIDR(inputs.investment * s.value / 100)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* DRIP Projection */}
      <Card>
        <CardHeader className="pb-2">
          <div>
            <CardTitle className="text-sm">Proyeksi DRIP Reinvestment — 10 Tahun</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Dividen bersih (setelah pajak 10%) seluruhnya diinvestasikan kembali. DGR rata-rata {wDGR.toFixed(1)}%/th.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Tahun", "Nilai Portofolio", "Dividen Kotor / Th", "Dividen Bersih / Th", "Income / Bulan (net)", "Kumulatif Income"].map((h) => (
                    <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-4",
                      h === "Tahun" ? "text-center" : "text-right"
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drip.map((row) => (
                  <tr key={row.year} className={cn("hover:bg-muted/20", row.year === 0 && "bg-muted/10")}>
                    <td className="px-4 py-2.5 text-center font-mono text-xs font-semibold">
                      {row.year === 0 ? "Awal" : `Th ${row.year}`}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{formatIDR(row.portfolio)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{row.year === 0 ? "—" : formatIDR(row.annualGross)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{row.year === 0 ? "—" : formatIDR(row.annualNet)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-semibold", row.year > 0 ? "text-bullish" : "")}>
                      {row.year === 0 ? "—" : formatIDR(row.monthlyNet)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{row.year === 0 ? "—" : formatIDR(row.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Implikasi Pajak — Konteks Indonesia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Dividen Saham", badge: "PPh Final 10%", desc: "Dipotong langsung oleh emiten. Tidak perlu lapor lagi di SPT jika sudah dipotong." },
              { title: "Capital Gain", badge: "Bebas Pajak", desc: "Keuntungan jual beli saham di BEI tidak dikenakan pajak capital gain — hanya biaya transaksi 0.1%." },
              { title: "Reksa Dana Dividen", badge: "Lebih Efisien", desc: "Hasil dividen di dalam reksa dana tidak langsung dipotong pajak — lebih efisien untuk akumulasi jangka panjang." },
            ].map((t) => (
              <div key={t.title} className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold">{t.title}</p>
                  <Badge variant="outline" className="text-[10px]">{t.badge}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {submitted && (
        <AIAnalysis framework="income" firmName="Harvard Management Company" stockData={aiData} />
      )}
    </div>
  );
}
