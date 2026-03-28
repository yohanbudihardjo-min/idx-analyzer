// Mock data untuk 5 emiten IDX representatif
// Akan diganti dengan sectors.app API ketika API key tersedia

export type Ticker = "BBCA" | "TLKM" | "ASII" | "BMRI" | "GOTO";

export interface StockInfo {
  ticker: string;
  name: string;
  sector: string;
  subsector: string;
  marketCap: number; // in trillion IDR
  price: number;
  priceChange: number;
  priceChangePct: number;
  pe: number | null;
  pb: number;
  de: number;
  roe: number;
  roa: number;
  dividendYield: number;
  eps: number;
  beta: number;
  listing: string;
  employees: number;
  description: string;
}

export interface FinancialStatement {
  year: number;
  revenue: number; // billion IDR
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  ebitda: number;
  freeCashFlow: number;
  totalAssets: number;
  totalDebt: number;
  equity: number;
  capex: number;
}

export interface QuarterlyEarnings {
  quarter: string; // e.g. "Q4 2024"
  date: string;
  epsActual: number;
  epsEstimate: number;
  revenueActual: number; // billion IDR
  revenueEstimate: number;
  beat: boolean;
  priceReaction: number; // % change after earnings
}

export interface OHLCVData {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface InsiderTransaction {
  date: string;
  name: string;
  position: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
  value: number; // billion IDR
}

export interface SeasonalityData {
  month: string;
  avgReturn: number; // %
  winRate: number; // %
  avgVolume: number;
}

export interface DividendHistory {
  year: string;
  dps: number;         // IDR per saham
  yield: number;       // %
  payoutRatio: number; // %
  exDate: string;
}

export interface ForeignFlowData {
  date: string;
  netBuy: number;           // miliar IDR, positif = beli
  cumulativeNet: number;    // running total miliar IDR
  foreignOwnership: number; // % kepemilikan asing
}

// ─── COMPETITIVE ANALYSIS ────────────────────────────────────────────────────

export interface CompetitorData {
  ticker: string;
  name: string;
  marketCap: number;        // triliun IDR
  revenue: number;          // miliar IDR
  revenueGrowth: number;    // % YoY
  grossMargin: number;      // %
  netMargin: number;        // %
  roe: number;              // %
  pe: number | null;
  moat: {
    brand: number;     // 1-5
    cost: number;      // 1-5
    network: number;   // 1-5
    switching: number; // 1-5
  };
  marketShare: { year: string; share: number }[];
  managementRating: number; // 1-10
  rdSpendingPct: number;    // % of revenue
  swot?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface SectorCompetitiveData {
  sector: string;
  sectorDescription: string;
  threats: { title: string; detail: string }[];
  competitors: CompetitorData[];
}

export const competitiveData: SectorCompetitiveData[] = [
  {
    sector: "Perbankan",
    sectorDescription: "Sektor perbankan Indonesia dikuasai oleh bank-bank BUKU 4 dengan total aset >Rp1.000 triliun. Persaingan semakin ketat dengan masuknya bank digital.",
    threats: [
      { title: "Kenaikan NPL", detail: "Tekanan kredit macet pasca pandemi terutama di segmen UMKM dan konsumer" },
      { title: "Disrupsi Fintech", detail: "P2P lending dan neobank menggerus fee-based income dan segmen kredit ritel" },
      { title: "Tekanan NIM", detail: "Normalisasi suku bunga BI menekan net interest margin seluruh industri" },
      { title: "Regulasi Modal", detail: "Pengetatan KPMM dan persyaratan likuiditas Basel III meningkatkan cost of capital" },
    ],
    competitors: [
      {
        ticker: "BBCA", name: "Bank Central Asia", marketCap: 878, revenue: 91200,
        revenueGrowth: 12.4, grossMargin: 68.5, netMargin: 42.1, roe: 23.4, pe: 24.8,
        moat: { brand: 5, cost: 4, network: 5, switching: 5 },
        marketShare: [{ year: "2022", share: 12.1 }, { year: "2023", share: 12.5 }, { year: "2024", share: 13.0 }],
        managementRating: 9.2, rdSpendingPct: 3.1,
        swot: {
          strengths: ["CASA ratio tertinggi industri (>80%)", "Brand loyalty dan jaringan ATM terluas", "Cost of fund terendah"],
          weaknesses: ["Valuasi premium vs peers (P/B 5x)", "Eksposur UMKM rendah, growth terbatas"],
          opportunities: ["Ekspansi layanan wealth management", "Cross-selling ke 37 juta nasabah"],
          threats: ["Neobank mengincar nasabah muda", "Kompresi NIM jika BI Rate turun"],
        },
      },
      {
        ticker: "BBRI", name: "Bank Rakyat Indonesia", marketCap: 522, revenue: 152400,
        revenueGrowth: 15.2, grossMargin: 62.1, netMargin: 31.8, roe: 19.6, pe: 12.4,
        moat: { brand: 4, cost: 3, network: 5, switching: 3 },
        marketShare: [{ year: "2022", share: 15.2 }, { year: "2023", share: 15.7 }, { year: "2024", share: 16.1 }],
        managementRating: 8.1, rdSpendingPct: 2.4,
        swot: {
          strengths: ["Market leader UMKM dengan 70+ juta rekening", "Jaringan terluas (10.000+ unit kerja)", "Dukungan pemerintah sebagai BUMN"],
          weaknesses: ["NPL lebih tinggi vs BBCA", "Cost-to-income ratio relatif besar"],
          opportunities: ["BRI Insurance dan BRI Finance sinergi group", "KUR terus tumbuh didukung pemerintah"],
          threats: ["Kredit macet UMKM pasca normalisasi", "Kompetisi P2P lending di segmen mikro"],
        },
      },
      {
        ticker: "BMRI", name: "Bank Mandiri", marketCap: 385, revenue: 108600,
        revenueGrowth: 13.8, grossMargin: 63.4, netMargin: 35.2, roe: 18.7, pe: 11.2,
        moat: { brand: 4, cost: 3, network: 4, switching: 4 },
        marketShare: [{ year: "2022", share: 14.1 }, { year: "2023", share: 14.5 }, { year: "2024", share: 14.8 }],
        managementRating: 8.4, rdSpendingPct: 2.8,
      },
      {
        ticker: "BBNI", name: "Bank Negara Indonesia", marketCap: 178, revenue: 72100,
        revenueGrowth: 9.6, grossMargin: 58.2, netMargin: 26.4, roe: 14.2, pe: 8.7,
        moat: { brand: 3, cost: 3, network: 4, switching: 3 },
        marketShare: [{ year: "2022", share: 9.0 }, { year: "2023", share: 9.2 }, { year: "2024", share: 9.5 }],
        managementRating: 7.5, rdSpendingPct: 2.1,
      },
      {
        ticker: "BRIS", name: "Bank Syariah Indonesia", marketCap: 58, revenue: 22800,
        revenueGrowth: 18.4, grossMargin: 52.1, netMargin: 19.8, roe: 16.3, pe: 18.6,
        moat: { brand: 3, cost: 2, network: 3, switching: 4 },
        marketShare: [{ year: "2022", share: 3.1 }, { year: "2023", share: 3.6 }, { year: "2024", share: 4.2 }],
        managementRating: 7.2, rdSpendingPct: 1.8,
      },
    ],
  },
  {
    sector: "Telekomunikasi",
    sectorDescription: "Industri telekomunikasi Indonesia didominsai Telkom sebagai BUMN dengan subsidiary Telkomsel. Konsolidasi ISAT-Hutchison menciptakan pesaing kedua yang signifikan.",
    threats: [
      { title: "Perang Harga Data", detail: "Harga data seluler terus turun, menekan ARPU (average revenue per user) seluruh operator" },
      { title: "Saturasi Pelanggan", detail: "Penetrasi seluler >120%, pertumbuhan pelanggan baru hampir stagnan di pulau Jawa" },
      { title: "Regulasi Spektrum", detail: "Biaya lisensi frekuensi 5G sangat besar, berpotensi menekan capex dan profitabilitas" },
      { title: "OTT Substitution", detail: "WhatsApp, Telegram menggantikan SMS; streaming menggantikan voice — erosi legacy revenue" },
    ],
    competitors: [
      {
        ticker: "TLKM", name: "Telkom Indonesia", marketCap: 312, revenue: 149200,
        revenueGrowth: 4.2, grossMargin: 54.8, netMargin: 17.1, roe: 21.5, pe: 13.2,
        moat: { brand: 5, cost: 5, network: 5, switching: 4 },
        marketShare: [{ year: "2022", share: 56.2 }, { year: "2023", share: 55.1 }, { year: "2024", share: 54.3 }],
        managementRating: 7.8, rdSpendingPct: 4.2,
        swot: {
          strengths: ["Monopoli infrastruktur fiber dan tower melalui Mitratel", "Telkomsel 170 juta pelanggan aktif", "Diversifikasi ke cloud dan data center"],
          weaknesses: ["Birokrasi BUMN memperlambat inovasi", "Legacy fixed-line menurun terus"],
          opportunities: ["IndiHome 5G dan enterprise connectivity", "Data center tumbuh seiring cloud adoption"],
          threats: ["ISAT pasca merger lebih kompetitif", "Regulasi harga interkoneksi"],
        },
      },
      {
        ticker: "ISAT", name: "Indosat Ooredoo Hutchison", marketCap: 68, revenue: 52400,
        revenueGrowth: 8.6, grossMargin: 46.2, netMargin: 7.8, roe: 8.9, pe: 22.1,
        moat: { brand: 3, cost: 3, network: 4, switching: 3 },
        marketShare: [{ year: "2022", share: 19.8 }, { year: "2023", share: 21.1 }, { year: "2024", share: 22.4 }],
        managementRating: 7.4, rdSpendingPct: 3.8,
        swot: {
          strengths: ["Sinergi merger Indosat + Hutchison mengurangi duplikasi biaya", "Pangsa pasar #2 dengan momentum naik"],
          weaknesses: ["Leverage tinggi pasca merger", "Integrasi sistem masih berjalan"],
          opportunities: ["Konsolidasi jaringan hemat capex Rp7T+/tahun", "5G enterprise solutions"],
          threats: ["Telkomsel mempertahankan dominasi agresif", "Churn pelanggan pasca migrasi nomor"],
        },
      },
      {
        ticker: "EXCL", name: "XL Axiata", marketCap: 29, revenue: 30800,
        revenueGrowth: 5.1, grossMargin: 44.6, netMargin: 5.2, roe: 7.1, pe: 19.4,
        moat: { brand: 3, cost: 2, network: 3, switching: 2 },
        marketShare: [{ year: "2022", share: 12.1 }, { year: "2023", share: 11.8 }, { year: "2024", share: 11.4 }],
        managementRating: 6.8, rdSpendingPct: 3.1,
      },
      {
        ticker: "MTEL", name: "Mitratel (Telkom Infra)", marketCap: 47, revenue: 8200,
        revenueGrowth: 11.4, grossMargin: 72.1, netMargin: 29.6, roe: 8.2, pe: 28.6,
        moat: { brand: 3, cost: 4, network: 4, switching: 5 },
        marketShare: [{ year: "2022", share: 3.1 }, { year: "2023", share: 4.0 }, { year: "2024", share: 4.8 }],
        managementRating: 7.6, rdSpendingPct: 1.2,
      },
      {
        ticker: "TBIG", name: "Tower Bersama Infrastructure", marketCap: 24, revenue: 6900,
        revenueGrowth: 8.2, grossMargin: 74.8, netMargin: 22.4, roe: 11.8, pe: 24.1,
        moat: { brand: 2, cost: 4, network: 3, switching: 5 },
        marketShare: [{ year: "2022", share: 2.6 }, { year: "2023", share: 3.0 }, { year: "2024", share: 3.4 }],
        managementRating: 7.2, rdSpendingPct: 0.8,
      },
    ],
  },
  {
    sector: "Konsumer",
    sectorDescription: "Sektor konsumer Indonesia diuntungkan oleh populasi 280 juta jiwa dan kelas menengah yang terus tumbuh. Tekanan inflasi dan perubahan perilaku konsumen menjadi tantangan utama.",
    threats: [
      { title: "Inflasi Input Cost", detail: "Kenaikan harga CPO, terigu, dan kemasan menekan gross margin produsen FMCG" },
      { title: "Pergeseran ke Private Label", detail: "Minimarket besar meluncurkan produk private label yang menggerus brand nasional" },
      { title: "E-commerce Disruption", detail: "Penjualan online mengubah rantai distribusi, memangkas peran distributor tradisional" },
      { title: "Regulasi Cukai", detail: "Kenaikan cukai rokok memukul volume HMSP; potensi aturan gula tambahan ancam FMCG" },
    ],
    competitors: [
      {
        ticker: "ASII", name: "Astra International", marketCap: 195, revenue: 284600,
        revenueGrowth: 6.8, grossMargin: 18.4, netMargin: 7.2, roe: 17.8, pe: 12.1,
        moat: { brand: 5, cost: 4, network: 5, switching: 3 },
        marketShare: [{ year: "2022", share: 51.2 }, { year: "2023", share: 51.0 }, { year: "2024", share: 50.4 }],
        managementRating: 8.8, rdSpendingPct: 1.4,
        swot: {
          strengths: ["Konglomerat terdiversifikasi: otomotif, keuangan, tambang, agri", "Toyota dan Honda distributor eksklusif", "Cash flow sangat kuat dan konsisten"],
          weaknesses: ["Eksposur tinggi ke siklus otomotif", "Kompleksitas group membebani valuasi"],
          opportunities: ["EV distribution partnership Toyota BZ series", "Pertumbuhan heavy equipment seiring IKN"],
          threats: ["Mobil listrik China masuk pasar dengan harga lebih murah", "Siklus kredit otomotif memburuk"],
        },
      },
      {
        ticker: "ICBP", name: "Indofood CBP Sukses Makmur", marketCap: 63, revenue: 64800,
        revenueGrowth: 9.2, grossMargin: 38.4, netMargin: 10.1, roe: 21.8, pe: 14.6,
        moat: { brand: 5, cost: 4, network: 4, switching: 3 },
        marketShare: [{ year: "2022", share: 24.8 }, { year: "2023", share: 25.4 }, { year: "2024", share: 26.1 }],
        managementRating: 8.2, rdSpendingPct: 1.8,
        swot: {
          strengths: ["Indomie — brand mie instan #1 dunia, dijual di 100+ negara", "Distribusi ke 1 juta+ outlet seluruh Indonesia"],
          weaknesses: ["Leverage dari akuisisi Pinehill (Timur Tengah) masih tinggi"],
          opportunities: ["Ekspansi Indomie ke pasar Afrika dan Eropa", "Premiumisasi produk snack"],
          threats: ["Kenaikan harga gandum impor", "Kompetisi dari Nissin dan brand lokal"],
        },
      },
      {
        ticker: "HMSP", name: "HM Sampoerna", marketCap: 96, revenue: 106200,
        revenueGrowth: -3.2, grossMargin: 24.8, netMargin: 11.4, roe: 78.4, pe: 18.2,
        moat: { brand: 5, cost: 3, network: 4, switching: 4 },
        marketShare: [{ year: "2022", share: 30.1 }, { year: "2023", share: 29.2 }, { year: "2024", share: 28.4 }],
        managementRating: 7.6, rdSpendingPct: 0.8,
      },
      {
        ticker: "UNVR", name: "Unilever Indonesia", marketCap: 38, revenue: 39800,
        revenueGrowth: -2.8, grossMargin: 52.1, netMargin: 12.2, roe: 49.8, pe: 21.4,
        moat: { brand: 5, cost: 3, network: 4, switching: 3 },
        marketShare: [{ year: "2022", share: 20.4 }, { year: "2023", share: 19.1 }, { year: "2024", share: 18.2 }],
        managementRating: 6.4, rdSpendingPct: 2.2,
      },
      {
        ticker: "MYOR", name: "Mayora Indah", marketCap: 22, revenue: 29400,
        revenueGrowth: 11.6, grossMargin: 28.4, netMargin: 8.1, roe: 16.2, pe: 16.8,
        moat: { brand: 3, cost: 3, network: 3, switching: 2 },
        marketShare: [{ year: "2022", share: 15.1 }, { year: "2023", share: 16.0 }, { year: "2024", share: 17.2 }],
        managementRating: 7.4, rdSpendingPct: 1.6,
      },
    ],
  },
];

// ─── STOCK INFO ─────────────────────────────────────────────────────────────

export const stockInfo: Record<string, StockInfo> = {
  BBCA: {
    ticker: "BBCA",
    name: "Bank Central Asia Tbk",
    sector: "Finance",
    subsector: "Banking",
    marketCap: 878,
    price: 9850,
    priceChange: 125,
    priceChangePct: 1.29,
    pe: 24.8,
    pb: 5.2,
    de: 8.1,
    roe: 23.4,
    roa: 3.1,
    dividendYield: 1.8,
    eps: 397,
    beta: 0.82,
    listing: "2000-05-31",
    employees: 26000,
    description:
      "Bank Central Asia (BCA) adalah bank swasta terbesar di Indonesia berdasarkan aset dan kapitalisasi pasar.",
  },
  TLKM: {
    ticker: "TLKM",
    name: "Telkom Indonesia (Persero) Tbk",
    sector: "Communication Services",
    subsector: "Telecommunications",
    marketCap: 312,
    price: 3090,
    priceChange: -40,
    priceChangePct: -1.28,
    pe: 13.2,
    pb: 2.8,
    de: 0.9,
    roe: 21.5,
    roa: 9.2,
    dividendYield: 5.1,
    eps: 234,
    beta: 0.71,
    listing: "1995-11-14",
    employees: 37000,
    description:
      "Telkom Indonesia adalah perusahaan telekomunikasi BUMN terbesar di Indonesia.",
  },
  ASII: {
    ticker: "ASII",
    name: "Astra International Tbk",
    sector: "Industrials",
    subsector: "Conglomerate",
    marketCap: 225,
    price: 5575,
    priceChange: 75,
    priceChangePct: 1.36,
    pe: 11.8,
    pb: 1.7,
    de: 0.6,
    roe: 14.8,
    roa: 6.5,
    dividendYield: 4.2,
    eps: 472,
    beta: 0.95,
    listing: "1990-04-04",
    employees: 240000,
    description:
      "Astra International adalah konglomerat terbesar Indonesia di bidang otomotif, agribisnis, alat berat, dan keuangan.",
  },
  BMRI: {
    ticker: "BMRI",
    name: "Bank Mandiri (Persero) Tbk",
    sector: "Finance",
    subsector: "Banking",
    marketCap: 265,
    price: 5650,
    priceChange: -25,
    priceChangePct: -0.44,
    pe: 10.9,
    pb: 2.1,
    de: 7.4,
    roe: 19.8,
    roa: 2.8,
    dividendYield: 5.8,
    eps: 518,
    beta: 0.88,
    listing: "2003-07-14",
    employees: 40000,
    description:
      "Bank Mandiri adalah bank BUMN terbesar di Indonesia berdasarkan total aset.",
  },
  GOTO: {
    ticker: "GOTO",
    name: "GoTo Gojek Tokopedia Tbk",
    sector: "Technology",
    subsector: "Internet & E-Commerce",
    marketCap: 42,
    price: 73,
    priceChange: 3,
    priceChangePct: 4.28,
    pe: null, // loss-making
    pb: 1.2,
    de: 0.4,
    roe: -8.2,
    roa: -3.4,
    dividendYield: 0,
    eps: -6.1,
    beta: 1.45,
    listing: "2022-04-11",
    employees: 15000,
    description:
      "GoTo adalah perusahaan teknologi terbesar di Indonesia, merger antara Gojek dan Tokopedia.",
  },
};

// ─── FINANCIAL STATEMENTS (5 TAHUN) ─────────────────────────────────────────

export const financials: Record<string, FinancialStatement[]> = {
  BBCA: [
    { year: 2020, revenue: 71200, grossProfit: 41000, operatingIncome: 28500, netIncome: 27100, ebitda: 35200, freeCashFlow: 22800, totalAssets: 1075000, totalDebt: 850000, equity: 215000, capex: 5200 },
    { year: 2021, revenue: 75800, grossProfit: 44500, operatingIncome: 31200, netIncome: 29800, ebitda: 38900, freeCashFlow: 25100, totalAssets: 1181000, totalDebt: 930000, equity: 238000, capex: 5800 },
    { year: 2022, revenue: 84100, grossProfit: 51200, operatingIncome: 36800, netIncome: 34900, ebitda: 44500, freeCashFlow: 28900, totalAssets: 1305000, totalDebt: 1020000, equity: 262000, capex: 6200 },
    { year: 2023, revenue: 95300, grossProfit: 59100, operatingIncome: 43500, netIncome: 41100, ebitda: 51800, freeCashFlow: 34200, totalAssets: 1430000, totalDebt: 1110000, equity: 295000, capex: 7100 },
    { year: 2024, revenue: 107500, grossProfit: 67800, operatingIncome: 50200, netIncome: 48100, ebitda: 59400, freeCashFlow: 39800, totalAssets: 1585000, totalDebt: 1215000, equity: 345000, capex: 8200 },
  ],
  TLKM: [
    { year: 2020, revenue: 136462, grossProfit: 68900, operatingIncome: 31200, netIncome: 20804, ebitda: 62100, freeCashFlow: 18500, totalAssets: 246932, totalDebt: 98200, equity: 110400, capex: 36800 },
    { year: 2021, revenue: 143221, grossProfit: 73100, operatingIncome: 33800, netIncome: 24760, ebitda: 67500, freeCashFlow: 19800, totalAssets: 268900, totalDebt: 102400, equity: 120100, capex: 38200 },
    { year: 2022, revenue: 147306, grossProfit: 74800, operatingIncome: 34100, netIncome: 24291, ebitda: 68200, freeCashFlow: 20100, totalAssets: 284300, totalDebt: 108900, equity: 125800, capex: 39500 },
    { year: 2023, revenue: 149185, grossProfit: 75600, operatingIncome: 35200, netIncome: 24505, ebitda: 70100, freeCashFlow: 20900, totalAssets: 298400, totalDebt: 112100, equity: 130200, capex: 41200 },
    { year: 2024, revenue: 152800, grossProfit: 77100, operatingIncome: 36800, netIncome: 24900, ebitda: 72500, freeCashFlow: 21800, totalAssets: 312100, totalDebt: 115800, equity: 136400, capex: 42100 },
  ],
  ASII: [
    { year: 2020, revenue: 181877, grossProfit: 28100, operatingIncome: 14200, netIncome: 10170, ebitda: 22800, freeCashFlow: 9800, totalAssets: 304973, totalDebt: 98200, equity: 183200, capex: 8100 },
    { year: 2021, revenue: 199065, grossProfit: 31800, operatingIncome: 16900, netIncome: 12820, ebitda: 26400, freeCashFlow: 11200, totalAssets: 321700, totalDebt: 95800, equity: 197400, capex: 8900 },
    { year: 2022, revenue: 258978, grossProfit: 41200, operatingIncome: 24100, netIncome: 19560, ebitda: 34500, freeCashFlow: 16800, totalAssets: 357800, totalDebt: 92100, equity: 224500, capex: 10200 },
    { year: 2023, revenue: 255921, grossProfit: 39800, operatingIncome: 22800, netIncome: 18900, ebitda: 33200, freeCashFlow: 15900, totalAssets: 375200, totalDebt: 89400, equity: 238100, capex: 10800 },
    { year: 2024, revenue: 268100, grossProfit: 42100, operatingIncome: 24200, netIncome: 20100, ebitda: 35800, freeCashFlow: 17200, totalAssets: 390400, totalDebt: 87200, equity: 252800, capex: 11400 },
  ],
  BMRI: [
    { year: 2020, revenue: 91800, grossProfit: 52100, operatingIncome: 28900, netIncome: 17100, ebitda: 36200, freeCashFlow: 14800, totalAssets: 1449000, totalDebt: 1180000, equity: 238000, capex: 4800 },
    { year: 2021, revenue: 98400, grossProfit: 57800, operatingIncome: 33200, netIncome: 25600, ebitda: 41500, freeCashFlow: 21200, totalAssets: 1672000, totalDebt: 1360000, equity: 272000, capex: 5200 },
    { year: 2022, revenue: 116200, grossProfit: 69800, operatingIncome: 43100, netIncome: 38500, ebitda: 52800, freeCashFlow: 31800, totalAssets: 1843000, totalDebt: 1490000, equity: 315000, capex: 5800 },
    { year: 2023, revenue: 131500, grossProfit: 80200, operatingIncome: 50800, netIncome: 46900, ebitda: 61200, freeCashFlow: 38700, totalAssets: 2036000, totalDebt: 1638000, equity: 360000, capex: 6400 },
    { year: 2024, revenue: 145800, grossProfit: 89800, operatingIncome: 57200, netIncome: 54100, ebitda: 68900, freeCashFlow: 44500, totalAssets: 2228000, totalDebt: 1792000, equity: 400000, capex: 7100 },
  ],
  GOTO: [
    { year: 2020, revenue: 3900, grossProfit: -8200, operatingIncome: -18500, netIncome: -20100, ebitda: -16800, freeCashFlow: -17200, totalAssets: 68400, totalDebt: 12800, equity: 42100, capex: 2800 },
    { year: 2021, revenue: 5900, grossProfit: -9100, operatingIncome: -24800, netIncome: -26400, ebitda: -22100, freeCashFlow: -21800, totalAssets: 89200, totalDebt: 14200, equity: 52800, capex: 3200 },
    { year: 2022, revenue: 8800, grossProfit: -4200, operatingIncome: -22100, netIncome: -40100, ebitda: -19400, freeCashFlow: -18900, totalAssets: 86800, totalDebt: 11900, equity: 48200, capex: 2400 },
    { year: 2023, revenue: 12100, grossProfit: 1800, operatingIncome: -8200, netIncome: -10400, ebitda: -5800, freeCashFlow: -7200, totalAssets: 79800, totalDebt: 10100, equity: 43900, capex: 1900 },
    { year: 2024, revenue: 15800, grossProfit: 5200, operatingIncome: -3400, netIncome: -4800, ebitda: -1200, freeCashFlow: -2800, totalAssets: 75200, totalDebt: 8900, equity: 38200, capex: 1600 },
  ],
};

// ─── QUARTERLY EARNINGS ───────────────────────────────────────────────────────

export const quarterlyEarnings: Record<string, QuarterlyEarnings[]> = {
  BBCA: [
    { quarter: "Q1 2024", date: "2024-04-25", epsActual: 91, epsEstimate: 87, revenueActual: 25100, revenueEstimate: 24200, beat: true, priceReaction: 2.4 },
    { quarter: "Q2 2024", date: "2024-07-24", epsActual: 98, epsEstimate: 95, revenueActual: 26800, revenueEstimate: 26100, beat: true, priceReaction: 1.8 },
    { quarter: "Q3 2024", date: "2024-10-24", epsActual: 103, epsEstimate: 105, revenueActual: 27900, revenueEstimate: 27100, beat: false, priceReaction: -1.2 },
    { quarter: "Q4 2024", date: "2025-01-30", epsActual: 105, epsEstimate: 102, revenueActual: 27700, revenueEstimate: 27000, beat: true, priceReaction: 3.1 },
  ],
  TLKM: [
    { quarter: "Q1 2024", date: "2024-04-30", epsActual: 57, epsEstimate: 60, revenueActual: 37200, revenueEstimate: 38100, beat: false, priceReaction: -2.8 },
    { quarter: "Q2 2024", date: "2024-07-30", epsActual: 62, epsEstimate: 61, revenueActual: 38100, revenueEstimate: 37800, beat: true, priceReaction: 0.9 },
    { quarter: "Q3 2024", date: "2024-10-29", epsActual: 59, epsEstimate: 63, revenueActual: 37900, revenueEstimate: 38900, beat: false, priceReaction: -3.4 },
    { quarter: "Q4 2024", date: "2025-01-28", epsActual: 56, epsEstimate: 58, revenueActual: 39600, revenueEstimate: 38800, beat: false, priceReaction: -1.8 },
  ],
  ASII: [
    { quarter: "Q1 2024", date: "2024-04-29", epsActual: 112, epsEstimate: 108, revenueActual: 64200, revenueEstimate: 63100, beat: true, priceReaction: 1.5 },
    { quarter: "Q2 2024", date: "2024-07-29", epsActual: 118, epsEstimate: 115, revenueActual: 67800, revenueEstimate: 66900, beat: true, priceReaction: 2.1 },
    { quarter: "Q3 2024", date: "2024-10-28", epsActual: 108, epsEstimate: 112, revenueActual: 65100, revenueEstimate: 66800, beat: false, priceReaction: -2.4 },
    { quarter: "Q4 2024", date: "2025-01-27", epsActual: 134, epsEstimate: 128, revenueActual: 71000, revenueEstimate: 69400, beat: true, priceReaction: 3.8 },
  ],
  BMRI: [
    { quarter: "Q1 2024", date: "2024-04-22", epsActual: 128, epsEstimate: 124, revenueActual: 35200, revenueEstimate: 34100, beat: true, priceReaction: 2.9 },
    { quarter: "Q2 2024", date: "2024-07-22", epsActual: 133, epsEstimate: 130, revenueActual: 36800, revenueEstimate: 36100, beat: true, priceReaction: 1.4 },
    { quarter: "Q3 2024", date: "2024-10-22", epsActual: 131, epsEstimate: 135, revenueActual: 36500, revenueEstimate: 37200, beat: false, priceReaction: -1.8 },
    { quarter: "Q4 2024", date: "2025-01-21", epsActual: 126, epsEstimate: 130, revenueActual: 37300, revenueEstimate: 37100, beat: false, priceReaction: -2.1 },
  ],
  GOTO: [
    { quarter: "Q1 2024", date: "2024-05-07", epsActual: -1.2, epsEstimate: -1.5, revenueActual: 3800, revenueEstimate: 3600, beat: true, priceReaction: 8.2 },
    { quarter: "Q2 2024", date: "2024-08-06", epsActual: -1.1, epsEstimate: -1.2, revenueActual: 3950, revenueEstimate: 3850, beat: true, priceReaction: 5.4 },
    { quarter: "Q3 2024", date: "2024-11-05", epsActual: -1.3, epsEstimate: -1.1, revenueActual: 4100, revenueEstimate: 4200, beat: false, priceReaction: -4.8 },
    { quarter: "Q4 2024", date: "2025-02-04", epsActual: -1.2, epsEstimate: -1.4, revenueActual: 3950, revenueEstimate: 3900, beat: true, priceReaction: 6.1 },
  ],
};

// ─── OHLCV DATA (2 TAHUN — GENERATED) ────────────────────────────────────────

function generateOHLCV(
  startPrice: number,
  volatility: number,
  trend: number,
  days: number
): OHLCVData[] {
  const data: OHLCVData[] = [];
  let price = startPrice;
  const start = new Date("2023-03-27");

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.48) * volatility + trend;
    const open = price * (1 + (Math.random() - 0.5) * 0.005);
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low = Math.min(open, close) * (1 - Math.random() * 0.012);
    const volume = Math.floor(
      (Math.random() * 50000000 + 20000000) * (1 + Math.abs(change) * 20)
    );

    data.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    });

    price = close;
  }

  return data;
}

export const ohlcvData: Record<string, OHLCVData[]> = {
  BBCA: generateOHLCV(8500, 0.012, 0.0004, 520),
  TLKM: generateOHLCV(3800, 0.015, -0.0003, 520),
  ASII: generateOHLCV(5200, 0.018, 0.0002, 520),
  BMRI: generateOHLCV(5100, 0.016, 0.0003, 520),
  GOTO: generateOHLCV(130, 0.045, -0.0008, 520),
};

// ─── INSIDER TRANSACTIONS ─────────────────────────────────────────────────────

export const insiderTransactions: Record<string, InsiderTransaction[]> = {
  BBCA: [
    { date: "2025-02-15", name: "Jahja Setiaatmadja", position: "Direktur Utama", type: "buy", shares: 500000, price: 9500, value: 4.75 },
    { date: "2025-01-20", name: "Suwignyo Budiman", position: "Direktur", type: "buy", shares: 200000, price: 9300, value: 1.86 },
    { date: "2024-11-10", name: "Djohan Emir Setijoso", position: "Komisaris", type: "sell", shares: 1000000, price: 9800, value: 9.8 },
  ],
  TLKM: [
    { date: "2025-02-28", name: "Ririek Adriansyah", position: "Direktur Utama", type: "sell", shares: 2000000, price: 3200, value: 6.4 },
    { date: "2025-01-15", name: "Budi Setyawan Wijaya", position: "Direktur", type: "sell", shares: 1500000, price: 3150, value: 4.725 },
    { date: "2024-12-05", name: "Bambang Brodjonegoro", position: "Komisaris", type: "buy", shares: 500000, price: 3100, value: 1.55 },
  ],
  ASII: [
    { date: "2025-03-10", name: "Djony Bunarto Tjondro", position: "Direktur Utama", type: "buy", shares: 1000000, price: 5400, value: 5.4 },
    { date: "2025-02-01", name: "Gidion Hasan", position: "Direktur", type: "buy", shares: 800000, price: 5350, value: 4.28 },
    { date: "2024-12-20", name: "Patrick Walujo", position: "Komisaris", type: "sell", shares: 3000000, price: 5500, value: 16.5 },
  ],
  BMRI: [
    { date: "2025-03-05", name: "Darmawan Junaidi", position: "Direktur Utama", type: "buy", shares: 500000, price: 5600, value: 2.8 },
    { date: "2025-01-25", name: "Susana Indah Kris Indriasari", position: "Direktur", type: "buy", shares: 300000, price: 5500, value: 1.65 },
    { date: "2024-11-30", name: "Muhamad Chatib Basri", position: "Komisaris", type: "sell", shares: 1000000, price: 5700, value: 5.7 },
  ],
  GOTO: [
    { date: "2025-03-01", name: "Patrick Walujo", position: "Direktur Utama", type: "buy", shares: 100000000, price: 70, value: 7.0 },
    { date: "2025-02-10", name: "Andre Soelistyo", position: "CEO Gojek", type: "buy", shares: 50000000, price: 68, value: 3.4 },
    { date: "2024-12-15", name: "Wei-Jye Jacky Lo", position: "CFO", type: "sell", shares: 80000000, price: 75, value: 6.0 },
  ],
};

// ─── SEASONALITY ──────────────────────────────────────────────────────────────

export const seasonalityData: Record<string, SeasonalityData[]> = {
  BBCA: [
    { month: "Jan", avgReturn: 2.8, winRate: 68, avgVolume: 85000000 },
    { month: "Feb", avgReturn: 1.2, winRate: 58, avgVolume: 78000000 },
    { month: "Mar", avgReturn: -0.8, winRate: 42, avgVolume: 92000000 },
    { month: "Apr", avgReturn: 3.5, winRate: 72, avgVolume: 88000000 },
    { month: "Mei", avgReturn: -1.2, winRate: 38, avgVolume: 95000000 },
    { month: "Jun", avgReturn: -2.1, winRate: 35, avgVolume: 102000000 },
    { month: "Jul", avgReturn: 1.8, winRate: 62, avgVolume: 79000000 },
    { month: "Agu", avgReturn: 2.4, winRate: 65, avgVolume: 82000000 },
    { month: "Sep", avgReturn: -1.5, winRate: 40, avgVolume: 89000000 },
    { month: "Okt", avgReturn: 1.1, winRate: 55, avgVolume: 91000000 },
    { month: "Nov", avgReturn: 3.2, winRate: 70, avgVolume: 86000000 },
    { month: "Des", avgReturn: 4.1, winRate: 75, avgVolume: 81000000 },
  ],
  TLKM: [
    { month: "Jan", avgReturn: 1.2, winRate: 55, avgVolume: 120000000 },
    { month: "Feb", avgReturn: 0.8, winRate: 52, avgVolume: 115000000 },
    { month: "Mar", avgReturn: -1.8, winRate: 38, avgVolume: 135000000 },
    { month: "Apr", avgReturn: 2.1, winRate: 62, avgVolume: 125000000 },
    { month: "Mei", avgReturn: -2.4, winRate: 32, avgVolume: 142000000 },
    { month: "Jun", avgReturn: -1.5, winRate: 40, avgVolume: 138000000 },
    { month: "Jul", avgReturn: 0.9, winRate: 55, avgVolume: 118000000 },
    { month: "Agu", avgReturn: 1.4, winRate: 58, avgVolume: 122000000 },
    { month: "Sep", avgReturn: -2.1, winRate: 35, avgVolume: 131000000 },
    { month: "Okt", avgReturn: 0.5, winRate: 50, avgVolume: 128000000 },
    { month: "Nov", avgReturn: 1.8, winRate: 60, avgVolume: 119000000 },
    { month: "Des", avgReturn: 2.8, winRate: 68, avgVolume: 112000000 },
  ],
  ASII: [
    { month: "Jan", avgReturn: 1.8, winRate: 60, avgVolume: 90000000 },
    { month: "Feb", avgReturn: 0.5, winRate: 50, avgVolume: 85000000 },
    { month: "Mar", avgReturn: -1.2, winRate: 42, avgVolume: 98000000 },
    { month: "Apr", avgReturn: 2.8, winRate: 68, avgVolume: 94000000 },
    { month: "Mei", avgReturn: -0.8, winRate: 45, avgVolume: 102000000 },
    { month: "Jun", avgReturn: -1.8, winRate: 38, avgVolume: 108000000 },
    { month: "Jul", avgReturn: 1.2, winRate: 58, avgVolume: 88000000 },
    { month: "Agu", avgReturn: 3.1, winRate: 70, avgVolume: 91000000 },
    { month: "Sep", avgReturn: -1.1, winRate: 42, avgVolume: 95000000 },
    { month: "Okt", avgReturn: 1.9, winRate: 62, avgVolume: 97000000 },
    { month: "Nov", avgReturn: 2.4, winRate: 65, avgVolume: 90000000 },
    { month: "Des", avgReturn: 3.8, winRate: 72, avgVolume: 86000000 },
  ],
  BMRI: [
    { month: "Jan", avgReturn: 2.5, winRate: 65, avgVolume: 100000000 },
    { month: "Feb", avgReturn: 1.1, winRate: 55, avgVolume: 95000000 },
    { month: "Mar", avgReturn: -0.9, winRate: 44, avgVolume: 108000000 },
    { month: "Apr", avgReturn: 3.2, winRate: 70, avgVolume: 104000000 },
    { month: "Mei", avgReturn: -1.4, winRate: 40, avgVolume: 112000000 },
    { month: "Jun", avgReturn: -2.0, winRate: 36, avgVolume: 118000000 },
    { month: "Jul", avgReturn: 1.5, winRate: 60, avgVolume: 96000000 },
    { month: "Agu", avgReturn: 2.2, winRate: 64, avgVolume: 99000000 },
    { month: "Sep", avgReturn: -1.3, winRate: 41, avgVolume: 105000000 },
    { month: "Okt", avgReturn: 0.8, winRate: 52, avgVolume: 107000000 },
    { month: "Nov", avgReturn: 2.9, winRate: 68, avgVolume: 98000000 },
    { month: "Des", avgReturn: 3.6, winRate: 73, avgVolume: 93000000 },
  ],
  GOTO: [
    { month: "Jan", avgReturn: 8.2, winRate: 60, avgVolume: 8000000000 },
    { month: "Feb", avgReturn: -4.5, winRate: 35, avgVolume: 7500000000 },
    { month: "Mar", avgReturn: 5.8, winRate: 58, avgVolume: 9200000000 },
    { month: "Apr", avgReturn: 3.1, winRate: 55, avgVolume: 8800000000 },
    { month: "Mei", avgReturn: -8.2, winRate: 28, avgVolume: 10100000000 },
    { month: "Jun", avgReturn: -6.4, winRate: 32, avgVolume: 9800000000 },
    { month: "Jul", avgReturn: 4.9, winRate: 58, avgVolume: 7800000000 },
    { month: "Agu", avgReturn: 7.1, winRate: 65, avgVolume: 8200000000 },
    { month: "Sep", avgReturn: -5.8, winRate: 30, avgVolume: 9100000000 },
    { month: "Okt", avgReturn: 2.4, winRate: 52, avgVolume: 9400000000 },
    { month: "Nov", avgReturn: 6.2, winRate: 62, avgVolume: 8600000000 },
    { month: "Des", avgReturn: 9.8, winRate: 70, avgVolume: 8100000000 },
  ],
};

// ─── MARKET OVERVIEW (MOCK IHSG) ──────────────────────────────────────────────

export const marketOverview = {
  ihsg: {
    value: 7428.52,
    change: 42.18,
    changePct: 0.57,
    volume: 18420000000,
    value2: 9820000000000, // IDR
    advancers: 248,
    decliners: 189,
    unchanged: 82,
  },
  sectorPerformance: [
    { sector: "Finance", change: 0.89, color: "text-bullish" },
    { sector: "Technology", change: 1.42, color: "text-bullish" },
    { sector: "Consumer", change: 0.31, color: "text-bullish" },
    { sector: "Industrials", change: -0.21, color: "text-bearish" },
    { sector: "Healthcare", change: 0.58, color: "text-bullish" },
    { sector: "Energy", change: -0.85, color: "text-bearish" },
    { sector: "Telecoms", change: -1.28, color: "text-bearish" },
    { sector: "Properties", change: 0.12, color: "text-bullish" },
  ],
};

// ─── MACRO DATA (MOCK) ────────────────────────────────────────────────────────

export const macroData = {
  biRate: { current: 6.0, previous: 6.25, trend: "down" as const, lastMeeting: "2025-01-15" },
  inflation: { current: 2.25, previous: 2.41, trend: "down" as const, target: "2-4%" },
  gdpGrowth: { current: 5.02, previous: 5.11, trend: "stable" as const, forecast2025: 5.2 },
  usdIdr: { current: 16248, change: -52, changePct: -0.32 },
  biRateHistory: [
    { date: "2024-01", rate: 6.0 }, { date: "2024-02", rate: 6.0 },
    { date: "2024-03", rate: 6.0 }, { date: "2024-04", rate: 6.25 },
    { date: "2024-05", rate: 6.25 }, { date: "2024-06", rate: 6.25 },
    { date: "2024-07", rate: 6.25 }, { date: "2024-08", rate: 6.25 },
    { date: "2024-09", rate: 6.0 }, { date: "2024-10", rate: 6.0 },
    { date: "2024-11", rate: 6.0 }, { date: "2024-12", rate: 6.0 },
    { date: "2025-01", rate: 5.75 }, { date: "2025-02", rate: 5.75 },
    { date: "2025-03", rate: 5.75 },
  ],
  inflationHistory: [
    { date: "2024-01", cpi: 2.57 }, { date: "2024-02", cpi: 2.75 },
    { date: "2024-03", cpi: 3.05 }, { date: "2024-04", cpi: 3.0 },
    { date: "2024-05", cpi: 2.84 }, { date: "2024-06", cpi: 2.51 },
    { date: "2024-07", cpi: 2.13 }, { date: "2024-08", cpi: 2.12 },
    { date: "2024-09", cpi: 1.84 }, { date: "2024-10", cpi: 1.71 },
    { date: "2024-11", cpi: 1.55 }, { date: "2024-12", cpi: 1.57 },
    { date: "2025-01", cpi: 0.76 }, { date: "2025-02", cpi: 0.09 },
    { date: "2025-03", cpi: 1.03 },
  ],
};

// ─── DIVIDEND HISTORY ─────────────────────────────────────────────────────────

export const dividendData: Record<string, DividendHistory[]> = {
  BBCA: [
    { year: "2020", dps: 130, yield: 1.4, payoutRatio: 32.8, exDate: "2020-06-15" },
    { year: "2021", dps: 150, yield: 1.6, payoutRatio: 37.8, exDate: "2021-06-18" },
    { year: "2022", dps: 170, yield: 1.7, payoutRatio: 38.5, exDate: "2022-06-17" },
    { year: "2023", dps: 185, yield: 1.8, payoutRatio: 38.9, exDate: "2023-06-16" },
    { year: "2024", dps: 210, yield: 2.1, payoutRatio: 39.7, exDate: "2024-06-14" },
  ],
  TLKM: [
    { year: "2020", dps: 148, yield: 4.2, payoutRatio: 71.2, exDate: "2020-06-10" },
    { year: "2021", dps: 162, yield: 4.5, payoutRatio: 65.5, exDate: "2021-06-09" },
    { year: "2022", dps: 168, yield: 4.8, payoutRatio: 69.2, exDate: "2022-06-08" },
    { year: "2023", dps: 172, yield: 5.0, payoutRatio: 70.2, exDate: "2023-06-07" },
    { year: "2024", dps: 178, yield: 5.8, payoutRatio: 71.5, exDate: "2024-06-12" },
  ],
  ASII: [
    { year: "2020", dps: 135, yield: 2.8, payoutRatio: 28.6, exDate: "2020-06-22" },
    { year: "2021", dps: 188, yield: 3.5, payoutRatio: 32.3, exDate: "2021-06-21" },
    { year: "2022", dps: 220, yield: 3.9, payoutRatio: 36.4, exDate: "2022-06-20" },
    { year: "2023", dps: 235, yield: 4.1, payoutRatio: 37.2, exDate: "2023-06-19" },
    { year: "2024", dps: 248, yield: 4.4, payoutRatio: 37.8, exDate: "2024-06-17" },
  ],
  BMRI: [
    { year: "2020", dps: 157, yield: 3.8, payoutRatio: 60.2, exDate: "2020-06-08" },
    { year: "2021", dps: 196, yield: 4.5, payoutRatio: 60.9, exDate: "2021-06-07" },
    { year: "2022", dps: 282, yield: 5.2, payoutRatio: 61.0, exDate: "2022-06-06" },
    { year: "2023", dps: 315, yield: 5.6, payoutRatio: 61.8, exDate: "2023-06-05" },
    { year: "2024", dps: 348, yield: 6.2, payoutRatio: 62.5, exDate: "2024-06-10" },
  ],
  GOTO: [
    { year: "2020", dps: 0, yield: 0, payoutRatio: 0, exDate: "-" },
    { year: "2021", dps: 0, yield: 0, payoutRatio: 0, exDate: "-" },
    { year: "2022", dps: 0, yield: 0, payoutRatio: 0, exDate: "-" },
    { year: "2023", dps: 0, yield: 0, payoutRatio: 0, exDate: "-" },
    { year: "2024", dps: 0, yield: 0, payoutRatio: 0, exDate: "-" },
  ],
};

// ─── FOREIGN FLOW DATA ────────────────────────────────────────────────────────

function generateForeignFlow(
  baseOwnership: number,
  trend: number,
  volatility: number
): ForeignFlowData[] {
  const data: ForeignFlowData[] = [];
  let cumulative = 0;
  let ownership = baseOwnership;
  const start = new Date("2024-10-01");

  for (let i = 0; i < 90; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const netBuy = Math.round((Math.random() - 0.5 + trend) * volatility * 10) / 10;
    cumulative = Math.round((cumulative + netBuy) * 10) / 10;
    ownership = Math.min(99, Math.max(1, Math.round((ownership + netBuy * 0.001) * 10) / 10));

    data.push({
      date: date.toISOString().split("T")[0],
      netBuy,
      cumulativeNet: cumulative,
      foreignOwnership: ownership,
    });
  }
  return data;
}

export const foreignFlowData: Record<string, ForeignFlowData[]> = {
  BBCA: generateForeignFlow(47.8, 0.05, 8),
  TLKM: generateForeignFlow(28.4, -0.02, 6),
  ASII: generateForeignFlow(35.2, 0.01, 10),
  BMRI: generateForeignFlow(32.1, 0.03, 9),
  GOTO: generateForeignFlow(52.6, -0.08, 15),
};

// ─── SCREENER DATA ────────────────────────────────────────────────────────────

export const allStocks = Object.values(stockInfo).map((s) => ({
  ...s,
  revenue5YrGrowth:
    s.ticker === "BBCA" ? 10.8 :
    s.ticker === "TLKM" ? 2.9 :
    s.ticker === "ASII" ? 10.2 :
    s.ticker === "BMRI" ? 12.1 :
    31.0,
  moat: (s.ticker === "BBCA" || s.ticker === "BMRI") ? "Strong" :
        s.ticker === "TLKM" ? "Strong" :
        s.ticker === "ASII" ? "Moderate" : "Weak",
  riskRating: s.ticker === "GOTO" ? 9 : s.ticker === "TLKM" ? 5 : s.ticker === "ASII" ? 4 : 3,
}));
