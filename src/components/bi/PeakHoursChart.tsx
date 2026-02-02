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

interface PeakHoursChartProps {
  data: { hour: number; count: number }[];
}

export default function PeakHoursChart({ data }: PeakHoursChartProps) {
  // Sort by hour to ensure correct sequence
  const sortedData = [...data].sort((a, b) => a.hour - b.hour);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="hour"
            stroke="#555"
            fontSize={10}
            tickFormatter={(h) => `${h}h`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#fca90d" }}
            labelFormatter={(h) => `Hora: ${h}:00`}
            formatter={(value: any) =>
              [Number(value || 0), "Pedidos"] as [number, string]
            }
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.count > 0 ? "#fca90d" : "rgba(255,255,255,0.05)"}
                fillOpacity={entry.count > 0 ? 0.8 : 0.2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
