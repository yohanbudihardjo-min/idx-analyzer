"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Technical", href: "/technical", firm: "Citadel" },
  { label: "Valuation", href: "/valuation", firm: "Morgan Stanley" },
  { label: "Earnings", href: "/earnings", firm: "JPMorgan" },
  { label: "Patterns", href: "/patterns", firm: "Renaissance" },
  { label: "Dividend", href: "/dividend", firm: "Fidelity" },
  { label: "Risk", href: "/risk", firm: "Bridgewater" },
  { label: "Foreign", href: "/foreign", firm: "CLSA" },
];

export function StockTabNav({ ticker }: { ticker: string }) {
  const pathname = usePathname();
  const base = `/stock/${ticker}`;

  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto pb-0 -mb-px">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = tab.href === ""
          ? pathname === base || pathname === `${base}/`
          : pathname.startsWith(href);

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
            {tab.firm && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                · {tab.firm}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
