"use client";

import { useId } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  /** 7 view-counts ordered oldest → newest */
  data: number[];
  color?: string;
}

export function CardSparkline({ data, color = "#0F172A" }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `sg-${uid}`;
  const chartData = data.map((count, i) => ({ i, count }));
  const hasData = data.some((v) => v > 0);

  if (!hasData) {
    return (
      <div className="w-20 h-8 flex items-end">
        <div className="w-full h-px bg-border opacity-40" />
      </div>
    );
  }

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
