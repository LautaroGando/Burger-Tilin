"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { getPriceHistory } from "@/app/actions/ingredient-actions";

export default function PriceHistoryChart({
  ingredientId,
}: {
  ingredientId: string;
}) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const history = await getPriceHistory(ingredientId);
      if (history.length > 0) {
        // Reverse to show oldest to newest for the chart
        const chartData = [...history].reverse().map((h) => ({
          date: new Date(h.date).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
          }),
          cost: h.cost,
        }));
        setData(chartData);
      }
    }
    load();
  }, [ingredientId]);

  if (data.length < 2)
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center px-4">
        Sin historial de precios suficiente
      </div>
    );

  return (
    <div className="h-full w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ffffff05"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#666", fontSize: 9, fontWeight: 700 }}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#000",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,1)",
            }}
            itemStyle={{
              color: "#fca90d",
              fontWeight: "bold",
              fontSize: "12px",
            }}
            labelStyle={{
              color: "#666",
              fontSize: "10px",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
            formatter={(value: any) => [`$${value}`, "Costo"]}
          />
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#fca90d"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fca90d", strokeWidth: 0 }}
            activeDot={{
              r: 6,
              fill: "#fff",
              stroke: "#fca90d",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
