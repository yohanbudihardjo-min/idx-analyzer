"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MacroChartsProps {
  biRate: { date: string; rate: number }[];
  inflation: { date: string; cpi: number }[];
  gdp: { quarter: string; growth: number }[];
}

export function MacroCharts({ biRate, inflation, gdp }: MacroChartsProps) {
  const tooltipStyle = {
    contentStyle: {
      background: "#18181b",
      border: "1px solid #3f3f46",
      borderRadius: "8px",
      fontSize: "12px",
    },
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* BI Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">BI Rate History</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={biRate} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v) => [`${Number(v).toFixed(2)}%`, "BI Rate"]}
              />
              <Line
                type="stepAfter"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Inflation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Inflasi CPI (YoY)</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={inflation} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "CPI"]}
              />
              <ReferenceLine y={4} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={2} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="cpi"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* GDP */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">GDP Growth (YoY)</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gdp} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="quarter"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, "auto"]}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "GDP Growth"]}
              />
              <Bar dataKey="growth" fill="#22c55e" radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
