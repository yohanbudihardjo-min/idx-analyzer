"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import type { ForeignFlowData } from "@/lib/mock-data";

interface Props {
  data: ForeignFlowData[];
}

export function ForeignFlowChart({ data }: Props) {
  // Show last 60 data points for readability
  const display = data.slice(-60);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={display} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => v.slice(5)} // show MM-DD
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="bar"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}B`}
        />
        <YAxis
          yAxisId="line"
          orientation="right"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}B`}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            `${value >= 0 ? "+" : ""}${value.toFixed(1)}B`,
            name === "netBuy" ? "Net Buy/Sell" : "Kumulatif",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          formatter={(v: string) => v === "netBuy" ? "Net Buy/Sell Harian" : "Kumulatif"}
        />
        <Bar yAxisId="bar" dataKey="netBuy" radius={[2, 2, 0, 0]}>
          {display.map((d, i) => (
            <Cell key={i} fill={d.netBuy >= 0 ? "hsl(var(--chart-2) / 0.7)" : "hsl(var(--destructive) / 0.7)"} />
          ))}
        </Bar>
        <Line
          yAxisId="line"
          type="monotone"
          dataKey="cumulativeNet"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
