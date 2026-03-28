"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MarketSharePoint {
  year: string;
  share: number;
}

interface CompetitorShare {
  name: string;
  ticker: string;
  data: MarketSharePoint[];
}

interface Props {
  competitors: CompetitorShare[];
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#f97316"];

export function MarketShareChart({ competitors }: Props) {
  // Pivot: [{year, BBCA: 12, BMRI: 14, ...}]
  const years = competitors[0]?.data.map((d) => d.year) ?? [];
  const chartData = years.map((year) => {
    const row: Record<string, string | number> = { year };
    competitors.forEach((c) => {
      const pt = c.data.find((d) => d.year === year);
      row[c.ticker] = pt?.share ?? 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
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
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f4f4f5",
          }}
          formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px", color: "#a1a1aa" }} />
        {competitors.map((c, i) => (
          <Line
            key={c.ticker}
            type="monotone"
            dataKey={c.ticker}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4, fill: COLORS[i % COLORS.length] }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
