"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/calculations";
import type { DailyTrendPoint } from "@/lib/calculations/insights";

export function DailySpendingChart({ data }: { data: DailyTrendPoint[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No days in this range.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(232, 237, 242, 0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#8995A3", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={20}
          interval="preserveStartEnd"
        />
        <YAxis
          width={56}
          tick={{ fill: "#8995A3", fontSize: 11 }}
          tickFormatter={(value: number) => formatCompactCurrency(value)}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(232, 237, 242, 0.04)" }}
          formatter={(value) => formatCurrency(Number(value ?? 0))}
          labelFormatter={(_label, payload) => payload?.[0]?.payload?.date ?? ""}
          contentStyle={{
            background: "#11161D",
            border: "1px solid rgba(232, 237, 242, 0.09)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "#E8EDF2" }}
        />
        <Bar dataKey="amount" fill="#B9F36B" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
