"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SeasonalityData } from "@/lib/mock-data";

const MONTH_ORDER = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function SeasonalityChart({
  data,
  height = 240,
}: {
  data: SeasonalityData[];
  height?: number;
}) {
  const chartData = [...data]
    .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
    .map((d) => ({
      month: d.month,
      return: d.avgReturn,
      winRate: d.winRate,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f4f4f5",
          }}
          formatter={(value: number, name: string) => [
            name === "return" ? `${value.toFixed(2)}%` : `${value.toFixed(0)}%`,
            name === "return" ? "Avg Return" : "Win Rate",
          ]}
        />
        <ReferenceLine y={0} stroke="#3f3f46" />
        <Bar dataKey="return" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.return >= 0 ? "#22c55e" : "#ef4444"}
              opacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
