"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DividendHistory } from "@/lib/mock-data";

interface Props {
  data: DividendHistory[];
}

export function DividendChart({ data }: Props) {
  if (data.every(d => d.dps === 0)) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) =>
            name === "dps"
              ? [`Rp ${value.toLocaleString("id-ID")}`, "DPS"]
              : [`${(value as number).toFixed(2)}%`, "Yield"]
          }
        />
        <Bar dataKey="dps" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i === data.length - 1 ? "#3b82f6" : "#3b82f680"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

