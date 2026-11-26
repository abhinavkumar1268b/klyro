"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/calculations";
import type { NeedWantBreakdown } from "@/lib/calculations/insights";

export function NeedWantChart({ data }: { data: NeedWantBreakdown }) {
  const classified = data.need + data.want;

  if (classified === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-elevated/30 px-4 py-8 text-center">
        <p className="text-sm text-foreground">No classified expenses</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Mark expenses as need or want when adding them to see this split.
        </p>
      </div>
    );
  }

  const slices = [
    { name: "Need", value: data.need, count: data.needCount, color: "#B9F36B" },
    { name: "Want", value: data.want, count: data.wantCount, color: "#8995A3" },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="flex flex-col items-center gap-5 xl:flex-row">
      <div className="h-40 w-40 shrink-0 xl:h-44 xl:w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={74}
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{
                background: "#11161D",
                border: "1px solid rgba(232, 237, 242, 0.09)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#E8EDF2" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full flex-1 space-y-3">
        {slices.map((slice) => (
          <div key={slice.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ background: slice.color }} aria-hidden="true" />
              {slice.name} <span className="text-xs">({slice.count})</span>
            </span>
            <span className="tabular-nums text-foreground">{formatCurrency(slice.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
