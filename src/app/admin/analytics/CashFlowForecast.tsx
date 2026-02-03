"use client";

import { useEffect, useState } from "react";
import { getCashFlowForecast } from "@/app/actions/analytics-actions";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Info,
} from "lucide-react";

interface ForecastData {
  avgDailyIncome: number;
  dailyFixed: number;
  expectedProcurementCost: number;
  projectedIncome: number;
  projectedFixedExpenses: number;
  netCashFlow: number;
  days: number;
}

export default function CashFlowForecast() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getCashFlowForecast();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 rounded-[2.5rem] border border-white/10 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Proyectando flujo de caja...
        </p>
      </div>
    );

  if (!data) return null;

  const isPositive = data.netCashFlow > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
              Cash Flow <span className="text-primary">Forecast</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Proyección próxima semana ({data.days} días)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Project Income */}
        <Card className="bg-zinc-900/40 backdrop-blur-3xl border-white/5 p-5 sm:p-6 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpRight className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
            Ingresos Estimados
          </p>
          <p className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">
            $
            {data.projectedIncome.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
          <div className="mt-4 flex items-center gap-2 text-green-500 font-bold text-[10px] sm:text-xs uppercase tracking-tighter">
            <TrendingUp className="h-3 w-3" /> Promedio: $
            {data.avgDailyIncome.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            /día
          </div>
        </Card>

        {/* Expected Outflow */}
        <Card className="bg-zinc-900/40 backdrop-blur-3xl border-white/5 p-5 sm:p-6 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowDownRight className="h-8 w-8 sm:h-12 sm:w-12 text-red-500" />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
            Salidas Totales
          </p>
          <p className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">
            $
            {(
              data.projectedFixedExpenses + data.expectedProcurementCost
            ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-500">
              <span className="truncate mr-2">Fijos:</span>
              <span className="text-zinc-300 shrink-0">
                $
                {data.projectedFixedExpenses.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-500">
              <span className="truncate mr-2">Stock:</span>
              <span className="text-zinc-300 shrink-0">
                $
                {data.expectedProcurementCost.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Net Forecast */}
        <Card
          className={`p-5 sm:p-6 rounded-[2rem] relative overflow-hidden group border-2 sm:col-span-2 lg:col-span-1 ${
            isPositive
              ? "bg-primary/10 border-primary/20"
              : "bg-red-500/10 border-red-500/20"
          }`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet
              className={`h-8 w-8 sm:h-12 sm:w-12 ${isPositive ? "text-primary" : "text-red-500"}`}
            />
          </div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
            Balance Neto
          </p>
          <p
            className={`text-3xl sm:text-4xl font-black italic tracking-tighter ${isPositive ? "text-primary" : "text-red-500"}`}
          >
            {isPositive ? "+" : ""}$
            {data.netCashFlow.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="mt-4 text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5 leading-tight">
            <Info className="h-3 w-3 shrink-0" /> Tendencia actual
          </p>
        </Card>
      </div>
    </div>
  );
}
