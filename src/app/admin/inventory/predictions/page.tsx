import { getStockPredictions } from "@/app/actions/prediction-actions";
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { ArrowLeft, Brain, AlertCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function PredictionsPage() {
  const { data: predictions } = await getStockPredictions();

  return (
    <div className="min-h-screen bg-black p-4 md:p-10 text-white selection:bg-primary selection:text-black">
      <MotionDiv className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/admin/ingredients">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 md:h-12 md:w-12 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white flex items-end gap-2 uppercase tracking-tighter">
                Stock Predictivo{" "}
                <span className="text-primary text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Estimaciones basadas en inteligencia artificial (30 días)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-white/5 self-start">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-[10px] sm:text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Powered by BurgerBrain™
            </span>
          </div>
        </div>

        {!predictions || predictions.length === 0 ? (
          <div className="p-10 sm:p-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-zinc-900/20">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-neutral-600" />
            </div>
            <p className="text-neutral-400 font-bold text-base sm:text-lg">
              No hay suficientes datos de ventas para generar predicciones.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <MotionItem>
                <Card className="glass-card border-red-500/20 bg-red-500/5 flex flex-col justify-between h-full group hover:border-red-500/40 transition-all">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                        Crítico
                      </span>
                    </div>
                    <div>
                      <p className="text-3xl sm:text-5xl font-black text-white tracking-tighter">
                        {
                          predictions.filter((p) => p.status === "CRITICAL")
                            .length
                        }
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-red-400 uppercase tracking-wide mt-1">
                        Reponer &lt; 3 días
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </MotionItem>

              <MotionItem>
                <Card className="glass-card border-yellow-500/20 bg-yellow-500/5 flex flex-col justify-between h-full group hover:border-yellow-500/40 transition-all">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full">
                        Alerta
                      </span>
                    </div>
                    <div>
                      <p className="text-3xl sm:text-5xl font-black text-white tracking-tighter">
                        {
                          predictions.filter((p) => p.status === "WARNING")
                            .length
                        }
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-yellow-400 uppercase tracking-wide mt-1">
                        Reponer &lt; 7 días
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </MotionItem>

              <MotionItem>
                <Card className="glass-card border-green-500/20 bg-green-500/5 flex flex-col justify-between h-full group hover:border-green-500/40 transition-all">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                        Sugerido
                      </span>
                    </div>
                    <div>
                      <p className="text-3xl sm:text-5xl font-black text-white tracking-tighter">
                        {predictions.filter((p) => p.daysRemaining < 7).length}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-green-400 uppercase tracking-wide mt-1">
                        Total a comprar
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </MotionItem>
            </div>

            {/* Prediction Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/20">
              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                  Proyecciones de Agotamiento
                </h2>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-white/5 text-neutral-500 border-b border-white/5 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="p-5">Insumo</th>
                      <th className="p-5 text-center">Stock Actual</th>
                      <th className="p-5 text-center">Consumo Diario</th>
                      <th className="p-5 text-center">Días Restantes</th>
                      <th className="p-5 text-right">Se acaba el...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {predictions.map((item) => (
                      <tr
                        key={item.ingredientId}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="p-5 font-bold text-white flex items-center gap-3">
                          {item.status === "CRITICAL" && (
                            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse shrink-0" />
                          )}
                          {item.status === "WARNING" && (
                            <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] shrink-0" />
                          )}
                          {item.status === "SAFE" && (
                            <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50 shrink-0" />
                          )}
                          <span className="group-hover:text-primary transition-colors truncate max-w-[150px] md:max-w-none">
                            {item.ingredientName}
                          </span>
                        </td>
                        <td className="p-5 text-center text-neutral-400 font-mono">
                          {item.currentStock.toFixed(2)}
                        </td>
                        <td className="p-5 text-center text-neutral-500">
                          {item.avgDailyConsumption.toFixed(2)}{" "}
                          <span className="text-[10px] uppercase">/ día</span>
                        </td>
                        <td className="p-5 text-center">
                          <Badge
                            className={`
                                            border-0 font-bold uppercase tracking-wide text-[10px] px-3
                                            ${item.status === "CRITICAL" ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : ""}
                                            ${item.status === "WARNING" ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" : ""}
                                            ${item.status === "SAFE" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
                                            ${item.status === "UNKNOWN" ? "bg-zinc-800 text-neutral-400" : ""}
                                        `}
                          >
                            {item.daysRemaining > 365
                              ? "> 1 año"
                              : item.daysRemaining === 999
                                ? "Suficiente"
                                : Math.floor(item.daysRemaining) + " días"}
                          </Badge>
                        </td>
                        <td className="p-5 text-right text-white font-black tracking-tight">
                          {item.projectedDepletionDate
                            ? item.projectedDepletionDate.toLocaleDateString(
                                "es-AR",
                                { day: "2-digit", month: "short" },
                              )
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </MotionDiv>
    </div>
  );
}
