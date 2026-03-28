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
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => v.slice(5)}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="bar"
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}B`}
        />
        <YAxis
          yAxisId="line"
          orientation="right"
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}B`}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
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
            <Cell key={i} fill={d.netBuy >= 0 ? "#22c55e99" : "#ef444499"} />
          ))}
        </Bar>
        <Line
          yAxisId="line"
          type="monotone"
          dataKey="cumulativeNet"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

