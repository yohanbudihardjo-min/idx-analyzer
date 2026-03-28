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
import { ArrowRight, RefreshCw, TrendingUp, ShieldCheck, CalendarClock, Wallet } from "lucide-react";

const AllocationPieChart = dynamic(
  () => import("@/components/charts/allocation-pie-chart").then((m) => ({ default: m.AllocationPieChart }))
);
const AIAnalysis = dynamic(
  () => import("@/components/ai-analysis").then((m) => ({ default: m.AIAnalysis })),
  { ssr: false }
);

// ─── Types ──────────────────────────────────────────────────────────────────

type GoalType = "pensiun" | "rumah" | "pendidikan" | "kekayaan";
type RiskType = "konservatif" | "moderat" | "agresif";
type AccountType = "reksa-dana" | "saham" | "campuran";
type Category = "equity" | "bond" | "alternative" | "cash";

interface PortfolioInputs {
  age: number;
  monthlyIncome: number;
  currentSavings: number;
  goal: GoalType;
  horizon: number;
  targetValue: number;
  riskTolerance: RiskType;
  accountType: AccountType;
  monthlyDCA: number;
}

interface Allocation {
  equity: number;
  bond: number;
  alternative: number;
  cash: number;
}

interface Instrument {
  name: string;
  ticker: string;
  type: "core" | "satellite";
  category: Category;
  pct: number;
  description: string;
}

interface PortfolioResult {
  allocation: Allocation;
  instruments: Instrument[];
  expectedReturnLow: number;
  expectedReturnHigh: number;
  maxDrawdown: number;
  benchmark: string;
  rebalanceSchedule: string;
  rebalanceTrigger: string;
  dcaBreakdown: { name: string; ticker: string; amount: number }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOCATION_COLORS: Record<Category, string> = {
  equity: "#3b82f6",
  bond: "#22c55e",
  alternative: "#f59e0b",
  cash: "#a1a1aa",
};

const CATEGORY_LABEL: Record<Category, string> = {
  equity: "Saham",
  bond: "Obligasi",
  alternative: "Alternatif",
  cash: "Pasar Uang",
};

const GOAL_LABEL: Record<GoalType, string> = {
  pensiun: "Dana Pensiun",
  rumah: "Uang Muka Properti",
  pendidikan: "Dana Pendidikan",
  kekayaan: "Pertumbuhan Kekayaan",
};

const RISK_LABEL: Record<RiskType, string> = {
  konservatif: "Konservatif",
  moderat: "Moderat",
  agresif: "Agresif",
};

// ─── Computation ─────────────────────────────────────────────────────────────

function computeAllocation(inputs: PortfolioInputs): Allocation {
  // Base equity from age (rule of 110)
  let equity = 110 - inputs.age;

  // Risk tolerance adjustment
  if (inputs.riskTolerance === "konservatif") equity -= 20;
  if (inputs.riskTolerance === "agresif") equity += 15;

  // Horizon adjustment
  if (inputs.horizon < 5) equity -= 15;
  else if (inputs.horizon > 15) equity += 5;

  // Goal adjustment (capital preservation for short-term goals)
  if (inputs.goal === "rumah" && inputs.horizon < 7) equity -= 10;

  equity = Math.max(10, Math.min(85, equity));

  const alternative = inputs.riskTolerance === "konservatif" ? 0
    : inputs.riskTolerance === "moderat" ? Math.round(equity * 0.12)
    : Math.round(equity * 0.18);

  const bond = Math.max(10, Math.round((100 - equity) * 0.75));
  const cash = Math.max(5, 100 - equity - bond - alternative);

  // Normalize
  const total = equity + bond + alternative + cash;
  const scale = 100 / total;
  return {
    equity: Math.round(equity * scale),
    bond: Math.round(bond * scale),
    alternative: Math.round(alternative * scale),
    cash: 100 - Math.round(equity * scale) - Math.round(bond * scale) - Math.round(alternative * scale),
  };
}

function buildInstruments(alloc: Allocation, accountType: AccountType): Instrument[] {
  const list: Instrument[] = [];

  if (alloc.equity > 0) {
    const coreEq = Math.round(alloc.equity * 0.65);
    const midEq = Math.round(alloc.equity * 0.22);
    const satEq = alloc.equity - coreEq - midEq;

    if (accountType === "saham" || accountType === "campuran") {
      list.push({ name: "ETF LQ45", ticker: "R-LQ45X", type: "core", category: "equity", pct: coreEq, description: "45 saham paling likuid di BEI — diversifikasi blue chip IDX sekaligus" });
      list.push({ name: "ETF IDX30", ticker: "XIIT", type: "core", category: "equity", pct: midEq, description: "30 saham terpilih IDX berdasarkan likuiditas dan fundamental" });
    } else {
      list.push({ name: "Reksa Dana Indeks LQ45", ticker: "RD-LQ45", type: "core", category: "equity", pct: coreEq + midEq, description: "Reksa Dana indeks tracking LQ45 melalui manajer investasi terkemuka" });
    }
    list.push({ name: "Reksa Dana Saham Asia", ticker: "RD-Asia", type: "satellite", category: "equity", pct: satEq, description: "Diversifikasi regional Asia Pasifik ex-Indonesia untuk mengurangi country risk" });
  }

  if (alloc.bond > 0) {
    const coreB = Math.round(alloc.bond * 0.60);
    const satB = alloc.bond - coreB;
    list.push({ name: "ORI / SBR Pemerintah", ticker: "ORI026", type: "core", category: "bond", pct: coreB, description: "Obligasi Negara Ritel — dijamin penuh pemerintah, kupon ~6.5–7%/tahun, bebas risiko default" });
    list.push({ name: "Reksa Dana Obligasi Pemerintah", ticker: "RD-Obligasi", type: "satellite", category: "bond", pct: satB, description: "Portofolio obligasi pemerintah dan korporasi investment grade IDR yang dikelola aktif" });
  }

  if (alloc.alternative > 0) {
    const reit = Math.round(alloc.alternative * 0.5);
    const gold = alloc.alternative - reit;
    list.push({ name: "DIRE / REIT Listed BEI", ticker: "CTRA-REIT", type: "satellite", category: "alternative", pct: reit, description: "Pendapatan sewa properti komersial — imbal hasil stabil 7–9%/tahun" });
    list.push({ name: "Reksa Dana Emas", ticker: "RD-Emas", type: "satellite", category: "alternative", pct: gold, description: "Lindung nilai inflasi dan geopolitik — korelasi rendah dengan saham dan obligasi" });
  }

  if (alloc.cash > 0) {
    list.push({ name: "Reksa Dana Pasar Uang", ticker: "RDPU", type: "core", category: "cash", pct: alloc.cash, description: "Buffer likuiditas ~5%/tahun — bisa dicairkan T+1, digunakan untuk rebalancing dan peluang" });
  }

  return list;
}

function computeExpectedReturn(alloc: Allocation): [number, number] {
  const base =
    alloc.equity * 0.12 / 100 +
    alloc.bond * 0.07 / 100 +
    alloc.alternative * 0.08 / 100 +
    alloc.cash * 0.05 / 100;
  const pessimistic =
    alloc.equity * 0.06 / 100 +
    alloc.bond * 0.055 / 100 +
    alloc.alternative * 0.05 / 100 +
    alloc.cash * 0.045 / 100;
  return [Math.round(pessimistic * 100 * 10) / 10, Math.round(base * 100 * 10) / 10];
}

function computeMaxDrawdown(alloc: Allocation): number {
  const dd =
    alloc.equity * -0.35 / 100 +
    alloc.bond * -0.08 / 100 +
    alloc.alternative * -0.20 / 100 +
    alloc.cash * 0;
  return Math.round(dd * 100 * 10) / 10;
}

function buildDCA(instruments: Instrument[], monthlyDCA: number) {
  return instruments.map((inst) => ({
    name: inst.name,
    ticker: inst.ticker,
    amount: Math.round((inst.pct / 100) * monthlyDCA / 50000) * 50000,
  })).filter((d) => d.amount > 0);
}

function getBenchmark(alloc: Allocation): string {
  if (alloc.equity >= 60) return "IHSG Total Return Index";
  if (alloc.equity >= 35) return "60/40 Blended (60% IHSG + 40% Obligasi Pemerintah)";
  return "Reksa Dana Campuran Konservatif Composite";
}

function computePortfolio(inputs: PortfolioInputs): PortfolioResult {
  const allocation = computeAllocation(inputs);
  const instruments = buildInstruments(allocation, inputs.accountType);
  const [low, high] = computeExpectedReturn(allocation);
  const maxDrawdown = computeMaxDrawdown(allocation);
  const benchmark = getBenchmark(allocation);
  const dcaBreakdown = buildDCA(instruments, inputs.monthlyDCA);

  const rebalanceSchedule = inputs.riskTolerance === "agresif"
    ? "Kuartalan (Januari, April, Juli, Oktober)"
    : "Tahunan (setiap Januari)";
  const rebalanceTrigger = "Rebalance jika bobot aset manapun menyimpang >5% dari target alokasi";

  return { allocation, instruments, expectedReturnLow: low, expectedReturnHigh: high, maxDrawdown, benchmark, rebalanceSchedule, rebalanceTrigger, dcaBreakdown };
}

function formatIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)} jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

const DEFAULT_INPUTS: PortfolioInputs = {
  age: 30,
  monthlyIncome: 15_000_000,
  currentSavings: 100_000_000,
  goal: "kekayaan",
  horizon: 10,
  targetValue: 1_000_000_000,
  riskTolerance: "moderat",
  accountType: "campuran",
  monthlyDCA: 3_000_000,
};

export function PortfolioClient() {
  const [inputs, setInputs] = useState<PortfolioInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    const r = computePortfolio(inputs);
    setResult(r);
    setSubmitted(true);
  }

  function handleReset() {
    setSubmitted(false);
    setResult(null);
  }

  function set<K extends keyof PortfolioInputs>(key: K, value: PortfolioInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  const pieData = result
    ? (Object.entries(result.allocation) as [Category, number][])
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: CATEGORY_LABEL[k], value: v, color: ALLOCATION_COLORS[k] }))
    : [];

  const aiData = result
    ? {
        profil: {
          usia: inputs.age,
          pendapatanBulanan: formatIDR(inputs.monthlyIncome),
          tabunganSaatIni: formatIDR(inputs.currentSavings),
          tujuan: GOAL_LABEL[inputs.goal],
          horizonInvestasi: `${inputs.horizon} tahun`,
          targetNilai: formatIDR(inputs.targetValue),
          riskTolerance: RISK_LABEL[inputs.riskTolerance],
          jenisAkun: inputs.accountType,
          dcaBulanan: formatIDR(inputs.monthlyDCA),
        },
        alokasi: result.allocation,
        instrumen: result.instruments.map((i) => ({
          nama: i.name,
          ticker: i.ticker,
          tipe: i.type,
          kategori: CATEGORY_LABEL[i.category],
          persentase: `${i.pct}%`,
          deskripsi: i.description,
        })),
        returnDiharapkan: `${result.expectedReturnLow}%–${result.expectedReturnHigh}% per tahun`,
        maxDrawdown: `${result.maxDrawdown}%`,
        benchmark: result.benchmark,
        rebalancing: result.rebalanceSchedule,
        dcaBulanan: result.dcaBreakdown.map((d) => `${d.ticker}: ${formatIDR(d.amount)}`),
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground">BlackRock</p>
        <h1 className="text-2xl font-bold">Portfolio Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bangun portofolio investasi personal dari nol berdasarkan profil dan tujuan keuangan Anda.
        </p>
      </div>

      {/* Form */}
      {!submitted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profil */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Profil Investor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Usia (tahun)</p>
                  <Input type="number" min={18} max={70} value={inputs.age}
                    onChange={(e) => set("age", parseInt(e.target.value) || 30)}
                    className="h-8 text-xs" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pendapatan / Bulan (IDR)</p>
                  <Input type="number" value={inputs.monthlyIncome}
                    onChange={(e) => set("monthlyIncome", parseInt(e.target.value) || 0)}
                    className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Tabungan / Investasi Saat Ini (IDR)</p>
                <Input type="number" value={inputs.currentSavings}
                  onChange={(e) => set("currentSavings", parseInt(e.target.value) || 0)}
                  className="h-8 text-xs" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tujuan Investasi</p>
                <Select value={inputs.goal} onValueChange={(v) => set("goal", v as GoalType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(GOAL_LABEL) as [GoalType, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Horizon Investasi (tahun)</p>
                  <Input type="number" min={1} max={40} value={inputs.horizon}
                    onChange={(e) => set("horizon", parseInt(e.target.value) || 10)}
                    className="h-8 text-xs" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Nilai Portofolio (IDR)</p>
                  <Input type="number" value={inputs.targetValue}
                    onChange={(e) => set("targetValue", parseInt(e.target.value) || 0)}
                    className="h-8 text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferensi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preferensi & Strategi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Risk Tolerance</p>
                <div className="flex gap-2">
                  {(["konservatif", "moderat", "agresif"] as RiskType[]).map((r) => (
                    <button key={r} onClick={() => set("riskTolerance", r)}
                      className={cn("flex-1 py-2 rounded-lg text-xs border transition-colors capitalize",
                        inputs.riskTolerance === r
                          ? r === "konservatif" ? "bg-bullish/15 border-bullish/40 text-bullish"
                            : r === "agresif" ? "bg-bearish/15 border-bearish/40 text-bearish"
                            : "bg-primary/15 border-primary/40 text-primary"
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      )}>
                      {RISK_LABEL[r]}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {inputs.riskTolerance === "konservatif" && "Prioritas modal terlindungi, return lebih rendah tapi stabil"}
                  {inputs.riskTolerance === "moderat" && "Keseimbangan antara pertumbuhan dan stabilitas modal"}
                  {inputs.riskTolerance === "agresif" && "Maksimalkan pertumbuhan jangka panjang, siap fluktuasi besar"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Jenis Akun / Instrumen</p>
                <Select value={inputs.accountType} onValueChange={(v) => set("accountType", v as AccountType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reksa-dana" className="text-xs">Reksa Dana (via aplikasi)</SelectItem>
                    <SelectItem value="saham" className="text-xs">Saham & ETF langsung (akun sekuritas)</SelectItem>
                    <SelectItem value="campuran" className="text-xs">Campuran (reksa dana + ETF/saham)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Jumlah DCA per Bulan (IDR)</p>
                <Input type="number" value={inputs.monthlyDCA}
                  onChange={(e) => set("monthlyDCA", parseInt(e.target.value) || 0)}
                  className="h-8 text-xs" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {inputs.monthlyDCA > 0 && `${Math.round(inputs.monthlyDCA / inputs.monthlyIncome * 100)}% dari pendapatan bulanan`}
                </p>
              </div>

              {/* Quick preview */}
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-xs text-muted-foreground mb-2">Preview alokasi berdasarkan profil:</p>
                {(() => {
                  const preview = computeAllocation(inputs);
                  return (
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                      {(Object.entries(preview) as [Category, number][]).filter(([, v]) => v > 0).map(([k, v]) => (
                        <div key={k} className="h-full transition-all" style={{ width: `${v}%`, background: ALLOCATION_COLORS[k] }} title={`${CATEGORY_LABEL[k]}: ${v}%`} />
                      ))}
                    </div>
                  );
                })()}
                <div className="flex gap-3 mt-2 flex-wrap">
                  {(Object.entries(computeAllocation(inputs)) as [Category, number][]).filter(([, v]) => v > 0).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: ALLOCATION_COLORS[k] }} />
                      <span className="text-[10px] text-muted-foreground">{CATEGORY_LABEL[k]} {v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Button onClick={handleSubmit} className="w-full h-11 gap-2">
              Bangun Portofolio Saya <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {submitted && result && (
        <div className="space-y-6">
          {/* Back button + summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {RISK_LABEL[inputs.riskTolerance]} · {inputs.age} tahun · {GOAL_LABEL[inputs.goal]} · {inputs.horizon}Y horizon
              </p>
              <h2 className="text-lg font-semibold">Portofolio Personal Anda</h2>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Ubah Profil
            </Button>
          </div>

          {/* Pie + Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alokasi Aset</CardTitle>
              </CardHeader>
              <CardContent>
                <AllocationPieChart data={pieData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Breakdown Alokasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.entries(result.allocation) as [Category, number][]).filter(([, v]) => v > 0).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{CATEGORY_LABEL[k]}</span>
                      <span className="font-mono font-semibold">{v}%</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${v}%`, background: ALLOCATION_COLORS[k] }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {inputs.currentSavings > 0 && `Saat ini: ${formatIDR(inputs.currentSavings * v / 100)}`}
                    </p>
                  </div>
                ))}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Expected Return</p>
                    <p className="font-mono font-bold text-bullish text-sm">{result.expectedReturnLow}–{result.expectedReturnHigh}%/th</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Max Drawdown</p>
                    <p className="font-mono font-bold text-bearish text-sm">{result.maxDrawdown}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instruments Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Instrumen Rekomendasi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Instrumen", "Ticker", "Posisi", "Kategori", "Alokasi", "Keterangan"].map((h) => (
                        <th key={h} className={cn("text-xs text-muted-foreground font-normal py-3 px-4",
                          h === "Instrumen" || h === "Keterangan" ? "text-left" : "text-center"
                        )}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.instruments.map((inst) => (
                      <tr key={inst.ticker} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-xs font-medium">{inst.name}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs font-semibold">{inst.ticker}</td>
                        <td className="px-4 py-3 text-center">
                          {inst.type === "core"
                            ? <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">Core</Badge>
                            : <Badge variant="outline" className="text-muted-foreground text-[10px]">Satellite</Badge>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: ALLOCATION_COLORS[inst.category] }} />
                            <span className="text-xs">{CATEGORY_LABEL[inst.category]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs font-semibold">{inst.pct}%</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px]">{inst.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-bullish mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Benchmark</p>
                    <p className="text-xs font-semibold mt-0.5">{result.benchmark}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Rebalancing</p>
                    <p className="text-xs font-semibold mt-0.5">{result.rebalanceSchedule}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{result.rebalanceTrigger}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Efisiensi Pajak</p>
                    <p className="text-xs font-semibold mt-0.5">Capital gain saham & ETF: bebas pajak</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Dividen & kupon obligasi: PPh final 10%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Wallet className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">DCA Total / Bulan</p>
                    <p className="text-sm font-bold font-mono mt-0.5">{formatIDR(inputs.monthlyDCA)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {Math.round(inputs.monthlyDCA / inputs.monthlyIncome * 100)}% dari pendapatan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DCA Breakdown */}
          {inputs.monthlyDCA > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rencana DCA Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.dcaBreakdown.map((d) => (
                    <div key={d.ticker} className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5">
                      <div>
                        <p className="font-mono text-xs font-semibold">{d.ticker}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{d.name}</p>
                      </div>
                      <p className="font-mono text-xs font-bold text-primary">{formatIDR(d.amount)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Dibulatkan ke kelipatan Rp 50.000. Investasikan setiap tanggal yang sama tiap bulan untuk memaksimalkan efek dollar-cost averaging.
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI IPS */}
          {aiData && (
            <AIAnalysis
              framework="portfolio"
              firmName="BlackRock"
              stockData={aiData}
            />
          )}
        </div>
      )}
    </div>
  );
}
