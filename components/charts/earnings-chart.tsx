"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { QuarterlyEarnings } from "@/lib/mock-data";

export function EarningsChart({
  earnings,
  height = 250,
}: {
  earnings: QuarterlyEarnings[];
  height?: number;
}) {
  const data = [...earnings].reverse().map((e) => ({
    quarter: e.quarter,
    actual: e.epsActual,
    estimate: e.epsEstimate ?? 0,
    beat: e.beat,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="quarter"
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
          tickFormatter={(v) => v.toLocaleString("id-ID")}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            `Rp ${value.toLocaleString("id-ID")}`,
            name === "actual" ? "EPS Aktual" : "EPS Estimasi",
          ]}
        />
        <Legend
          formatter={(v) => (v === "actual" ? "EPS Aktual" : "EPS Estimasi")}
          wrapperStyle={{ fontSize: "12px" }}
        />
        <Bar dataKey="estimate" fill="#3f3f46" radius={[2, 2, 0, 0]} />
        <Bar
          dataKey="actual"
          radius={[2, 2, 0, 0]}
          fill="#22c55e"
          // @ts-expect-error recharts cell coloring
          isAnimationActive={false}
          label={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
