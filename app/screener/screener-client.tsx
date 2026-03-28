"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const AIAnalysis = dynamic(() => import("@/components/ai-analysis").then(m => ({ default: m.AIAnalysis })), { ssr: false });
import { cn } from "@/lib/utils";
import { Search, ArrowUpDown, Filter } from "lucide-react";

interface ScreenerStock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  priceChange: number;
  priceChangePct: number;
  pe: number | null;
  pb: number;
  de: number;
  roe: number;
  dividendYield: number;
  marketCap: number;
  revenue5YrGrowth?: number;
  moat?: string;
  riskRating?: string;
}

interface ScreenerClientProps {
  initialStocks: ScreenerStock[];
}

const SECTORS = ["All", "Banking", "Telecommunications", "Industrials", "Technology"];

export function ScreenerClient({ initialStocks }: ScreenerClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [maxPE, setMaxPE] = useState("");
  const [minROE, setMinROE] = useState("");
  const [minDividend, setMinDividend] = useState("");
  const [maxDE, setMaxDE] = useState("");
  const [sortBy, setSortBy] = useState<keyof ScreenerStock>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...initialStocks];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }

    if (sector !== "All") {
      result = result.filter((s) => s.sector === sector);
    }

    if (maxPE) {
      const v = parseFloat(maxPE);
      result = result.filter((s) => s.pe !== null && s.pe <= v);
    }

    if (minROE) {
      const v = parseFloat(minROE);
      result = result.filter((s) => s.roe >= v);
    }

    if (minDividend) {
      const v = parseFloat(minDividend);
      result = result.filter((s) => s.dividendYield >= v);
    }

    if (maxDE) {
      const v = parseFloat(maxDE);
      result = result.filter((s) => s.de <= v);
    }

    result.sort((a, b) => {
      const va = (a[sortBy] as number) ?? 0;
      const vb = (b[sortBy] as number) ?? 0;
      return sortDir === "desc" ? vb - va : va - vb;
    });

    return result;
  }, [initialStocks, search, sector, maxPE, minROE, minDividend, maxDE, sortBy, sortDir]);

  function toggleSort(col: keyof ScreenerStock) {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  function resetFilters() {
    setSearch("");
    setSector("All");
    setMaxPE("");
    setMinROE("");
    setMinDividend("");
    setMaxDE("");
  }

  const screenData = { results: filtered.slice(0, 10), filters: { maxPE, minROE, minDividend, maxDE, sector } };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground mb-1">Search</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Ticker / nama"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Sektor</p>
              <Select value={sector} onValueChange={(v) => setSector(v ?? "All")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Max P/E</p>
              <Input
                type="number"
                placeholder="e.g. 20"
                value={maxPE}
                onChange={(e) => setMaxPE(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Min ROE (%)</p>
              <Input
                type="number"
                placeholder="e.g. 15"
                value={minROE}
                onChange={(e) => setMinROE(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Min Div (%)</p>
              <Input
                type="number"
                placeholder="e.g. 2"
                value={minDividend}
                onChange={(e) => setMinDividend(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Max D/E</p>
              <Input
                type="number"
                placeholder="e.g. 1.5"
                value={maxDE}
                onChange={(e) => setMaxDE(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Hasil ({filtered.length} saham)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { label: "Ticker", key: "ticker" as const },
                    { label: "Price", key: "price" as const },
                    { label: "Chg%", key: "priceChangePct" as const },
                    { label: "P/E", key: "pe" as const },
                    { label: "P/B", key: "pb" as const },
                    { label: "ROE%", key: "roe" as const },
                    { label: "D/E", key: "de" as const },
                    { label: "Div%", key: "dividendYield" as const },
                    { label: "Market Cap", key: "marketCap" as const },
                  ].map(({ label, key }) => (
                    <th
                      key={key}
                      className={cn(
                        "text-xs text-muted-foreground font-normal py-3 px-4 cursor-pointer hover:text-foreground transition-colors",
                        key === "ticker" ? "text-left" : "text-right"
                      )}
                      onClick={() => toggleSort(key)}
                    >
                      <span className="flex items-center gap-1 justify-end">
                        {key === "ticker" && <span className="justify-start">{label}</span>}
                        {key !== "ticker" && label}
                        {sortBy === key && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-sm">
                      Tidak ada saham yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr
                      key={s.ticker}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => router.push(`/stock/${s.ticker}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold">{s.ticker}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {s.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {s.price.toLocaleString("id-ID")}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs", s.priceChangePct >= 0 ? "text-bullish" : "text-bearish")}>
                        {s.priceChangePct >= 0 ? "+" : ""}{s.priceChangePct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {s.pe?.toFixed(1) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {s.pb.toFixed(2)}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs", s.roe >= 15 ? "text-bullish" : "")}>
                        {s.roe.toFixed(1)}%
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs", s.de > 2 ? "text-bearish" : "")}>
                        {s.de.toFixed(2)}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono text-xs", s.dividendYield >= 3 ? "text-bullish" : "")}>
                        {s.dividendYield.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {s.marketCap >= 1000
                          ? `${(s.marketCap / 1000).toFixed(1)}T`
                          : `${s.marketCap.toFixed(0)}B`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <AIAnalysis
        framework="screener"
        firmName="Goldman Sachs"
        stockData={screenData}
      />
    </div>
  );
}
