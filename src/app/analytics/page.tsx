import { getBreakEvenAnalysis } from "@/app/actions/analytics-actions";
export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesDashboard from "./sales-dashboard";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  const { data } = await getBreakEvenAnalysis();

  if (!data)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse">Cargando datos financieros...</div>
      </div>
    );

  const {
    fixedCosts,
    variableCosts,
    totalSales,
    grossMargin,
    breakEvenPoint,
    progress,
    hasActivity,
  } = data;

  // Calculate if the business is ACTUALLY profitable (covers BOTH fixed and variable)
  const totalExpenses = fixedCosts + variableCosts;
  const isProfitable = totalSales > totalExpenses && grossMargin > 0;

  // If progress is Infinity or calculation isn't possible, we cap it
  const percentage = isFinite(progress) ? Math.min(progress, 100) : 0;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-12 text-white selection:bg-primary selection:text-black">
      <MotionDiv
        className="max-w-6xl mx-auto space-y-8 md:space-y-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <MotionItem
          variants={item}
          className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-6 border-b border-white/5"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white flex items-end gap-2 uppercase">
                CENTRO DE CÓMPUTO{" "}
                <span className="text-primary text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Análisis Financiero & Proyecciones
              </p>
            </div>
          </div>
        </MotionItem>

        <MotionItem variants={item}>
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="bg-zinc-900 border border-white/5 p-1 rounded-3xl sm:rounded-full mb-8 flex flex-col sm:flex-row h-auto w-full">
              <TabsTrigger
                value="sales"
                className="w-full sm:w-auto rounded-2xl sm:rounded-full px-6 py-3 sm:py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-black transition-all"
              >
                VENTAS & HISTORIAL
              </TabsTrigger>
              <TabsTrigger
                value="financials"
                className="w-full sm:w-auto rounded-2xl sm:rounded-full px-6 py-3 sm:py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                Punto de Equilibrio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-0">
              <SalesDashboard />
            </TabsContent>

            <TabsContent value="financials" className="mt-0 space-y-8">
              {/* Break-Even Visualizer */}
              <div className="glass-card p-6 md:p-10 rounded-3xl border border-white/5 relative overflow-hidden bg-zinc-900/20">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                  <Target className="h-96 w-96 text-white" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row gap-8 md:gap-12 items-center">
                  <div className="flex-1 space-y-8 w-full">
                    <div>
                      <h2 className="text-xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                        <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Punto de Equilibrio
                      </h2>
                      <p className="text-neutral-400 mt-2 text-sm sm:text-lg leading-relaxed max-w-xl">
                        Es el objetivo crítico. Cubre tus{" "}
                        <span className="text-white font-bold">
                          Costos Fijos
                        </span>{" "}
                        y{" "}
                        <span className="text-white font-bold">Variables</span>{" "}
                        para desbloquear la zona de ganancia pura.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                        <span className="text-neutral-400">
                          Progreso Actual
                        </span>
                        <span
                          className={
                            isProfitable ? "text-green-400" : "text-primary"
                          }
                        >
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-1000 ease-out ${isProfitable ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" : "bg-primary shadow-[0_0_20px_rgba(252,169,13,0.5)]"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-medium text-neutral-500">
                        <span>$0</span>
                        <span>Meta: ${breakEvenPoint.toLocaleString()}</span>
                      </div>
                    </div>

                    <div
                      className={`p-6 rounded-2xl border ${
                        isProfitable
                          ? "bg-green-500/10 border-green-500/20"
                          : !hasActivity || totalSales === 0
                            ? "bg-neutral-500/10 border-neutral-500/20"
                            : grossMargin <= 0
                              ? "bg-red-500/10 border-red-500/20"
                              : "bg-yellow-500/10 border-yellow-500/20"
                      } flex items-start gap-4`}
                    >
                      <div
                        className={`p-3 rounded-full ${isProfitable ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}`}
                      >
                        {isProfitable ? (
                          <TrendingUp className="h-6 w-6" />
                        ) : grossMargin <= 0 ? (
                          <AlertTriangle className="h-6 w-6" />
                        ) : (
                          <TrendingDown className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3
                          className={`font-bold text-lg ${
                            isProfitable
                              ? "text-green-400"
                              : !hasActivity || totalSales === 0
                                ? "text-neutral-400"
                                : grossMargin <= 0
                                  ? "text-red-400"
                                  : "text-yellow-400"
                          }`}
                        >
                          {isProfitable
                            ? "¡Zona de Ganancia!"
                            : !hasActivity || totalSales === 0
                              ? "Esperando Actividad"
                              : grossMargin <= 0
                                ? "Pérdida Crítica"
                                : "Zona de Cobertura"}
                        </h3>
                        <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
                          {isProfitable
                            ? `Has superado el punto de equilibrio por $${(totalSales - breakEvenPoint).toLocaleString()}. Cada venta adicional es utilidad neta para el negocio.`
                            : !hasActivity || totalSales === 0
                              ? "Todavía no hay ventas registradas este mes. Una vez que comiences a vender, el sistema calculará tu progreso."
                              : grossMargin <= 0
                                ? `Tus ventas ($${totalSales.toLocaleString()}) no cubren ni siquiera tus costos variables ($${variableCosts.toLocaleString()}). Estás perdiendo plata por cada producto que vendés.`
                                : `Aún necesitas facturar $${(breakEvenPoint - totalSales).toLocaleString()} más para cubrir tus costos operativos totales ($${totalExpenses.toLocaleString()}).`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="w-full lg:w-1/3 grid gap-4">
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                      <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-2">
                        Costos Fijos
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-white">
                        ${fixedCosts.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Alquiler, Servicios, Sueldos
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                      <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-2">
                        Costos Variables
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-white">
                        ${variableCosts.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Materia Prima (COGS)
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-primary/30 transition-colors">
                      <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mb-2">
                        Contribución Marginal
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-primary">
                        ${grossMargin.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Ventas - Costos Variables
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass-card border-white/5 bg-zinc-900/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3 text-lg">
                      <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      Diagnóstico IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-zinc-400 text-sm leading-relaxed space-y-4">
                    {fixedCosts === 0 ? (
                      <p className="flex items-start gap-2">
                        <span className="text-orange-500 font-bold">•</span>
                        <span>
                          No has registrado <strong>Gastos Fijos</strong>. Ve a
                          la sección de Finanzas y carga alquiler o sueldos para
                          obtener un cálculo real.
                        </span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>
                          Tu estructura de costos fijos es de{" "}
                          <strong>${fixedCosts}</strong>. Dado tu margen actual,
                          tu objetivo mensual mínimo es{" "}
                          <strong>${Math.ceil(breakEvenPoint)}</strong>.
                        </span>
                      </p>
                    )}
                    {variableCosts === 0 && totalSales > 0 && (
                      <p className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>
                          Tus costos variables son $0. Asegúrate de cargar las{" "}
                          <strong>Recetas</strong> en tus productos para
                          calcular el margen real.
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/5 bg-zinc-900/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-3 text-lg">
                      <div className="p-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      Acciones Sugeridas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "Revisar el costo de los insumos principales (Carne, Pan).",
                      "Promover productos con alto margen para llegar más rápido al equilibrio.",
                      "Analizar si hay gastos fijos reducibles este mes.",
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                        <p className="text-sm text-zinc-300">{item}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </MotionItem>
      </MotionDiv>
    </div>
  );
}
