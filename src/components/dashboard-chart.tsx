"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardChartProps = {
  data: { name: string; value: number }[];
};

export default function DashboardChart({ data }: DashboardChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
        No hay datos suficientes
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValueClient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FCA90D" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#FCA90D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#666"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          hide // Hide Y Axis for cleaner look on dashboard card
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#222",
            border: "1px solid #333",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          itemStyle={{ color: "#fff" }}
          formatter={(value: number | undefined) => [
            `$${(value || 0).toLocaleString()}`,
            "Ventas",
          ]}
          labelStyle={{ color: "#aaa", marginBottom: "0.25rem" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#FCA90D"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValueClient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
