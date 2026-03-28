"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AllocationData {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: AllocationData[];
}

export function AllocationPieChart({ data }: Props) {
  const filtered = data.filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={filtered}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={({ name, value }) => `${name} ${value}%`}
          labelLine={{ stroke: "#3f3f46", strokeWidth: 1 }}
        >
          {filtered.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#f4f4f5",
          }}
          formatter={(value: number, name: string) => [`${value}%`, name]}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px", color: "#a1a1aa" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
