import { getScreenerData } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScreenerClient } from "./screener-client";

export default async function ScreenerPage() {
  const stocks = await getScreenerData();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Stock Screener</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Framework Goldman Sachs — Filter saham IDX berdasarkan fundamental
        </p>
      </div>

      <ScreenerClient initialStocks={stocks} />
    </div>
  );
}
