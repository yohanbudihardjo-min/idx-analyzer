"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart3, Search, TrendingUp, Globe, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/screener", label: "Screener", icon: SlidersHorizontal },
  { href: "/macro", label: "Makro", icon: Globe },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = search.trim().toUpperCase();
    if (ticker) {
      router.push(`/stock/${ticker}`);
      setSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">IDX Analyzer</span>
          <Badge variant="secondary" className="text-xs hidden sm:flex">Demo</Badge>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname === href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs ml-auto md:ml-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari saham... (BBCA, TLKM)"
              className="pl-8 h-8 text-sm bg-muted/50"
            />
          </div>
        </form>

        {/* Quick tickers */}
        <div className="hidden lg:flex items-center gap-1">
          {["BBCA", "TLKM", "ASII", "BMRI", "GOTO"].map((t) => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-mono text-muted-foreground hover:text-foreground"
              onClick={() => router.push(`/stock/${t}`)}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}
