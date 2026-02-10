"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { AdvancedAnalytics } from "@/app/actions/analytics-actions";
import Link from "next/link";
import { useState } from "react";
import { Progress } from "../ui/progress";

interface HealthDetailsDialogProps {
  children: React.ReactNode;
  data: AdvancedAnalytics["healthBreakdown"];
  totalScore: number;
}

export default function HealthDetailsDialog({
  children,
  data,
  totalScore,
}: HealthDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to get color based on score ratio
  const getScoreColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.8) return "text-green-500";
    if (ratio >= 0.5) return "text-primary";
    return "text-red-500";
  };

  const getProgressColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.8) return "bg-green-500";
    if (ratio >= 0.5) return "bg-primary";
    return "bg-red-500";
  };

  // Generate Tips
  const getTips = () => {
    const tips = [];

    // Margin Tips
    if (data.margin.value < 30) {
      tips.push({
        icon: TrendingUp,
        title: "Mejorar Margen Neto",
        desc: "Revisá costos de recetas y comisiones de delivery. Tu margen está por debajo del 30%.",
        cta: "Ir a Rentabilidad",
        link: "/admin/analytics",
      });
    }

    // Stock Tips
    if (data.stock.lowStockCount > 0) {
      tips.push({
        icon: Package,
        title: "Reponer Stock Crítico",
        desc: `Tenés ${data.stock.lowStockCount} ingredientes con stock bajo o nulo. Esto afecta la disponibilidad.`,
        cta: "Ver Inventario",
        link: "/admin/ingredients",
      });
    }

    // Volume Tips
    if (data.volume.value < data.volume.target) {
      tips.push({
        icon: ShoppingBag,
        title: "Aumentar Volumen de Ventas",
        desc: `El promedio diario es ${data.volume.value.toFixed(1)} ventas. El objetivo base es ${data.volume.target}. Considerá promociones.`,
        cta: "Nueva Venta",
        link: "/admin/sales/new",
      });
    }

    if (tips.length === 0) {
      tips.push({
        icon: CheckCircle2,
        title: "Todo en orden",
        desc: "Tu negocio está saludable. ¡Seguí así!",
        cta: null,
        link: null,
      });
    }

    return tips;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-neutral-900 border-white/10 text-white p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-2 bg-neutral-900">
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl font-bold">Diagnóstico de Salud</span>
            <span
              className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-black ${
                totalScore >= 80
                  ? "text-green-500"
                  : totalScore >= 50
                    ? "text-primary"
                    : "text-red-500"
              }`}
            >
              {totalScore}/100
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* 1. Rentabilidad */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neutral-400" />
                <span className="text-sm font-bold text-neutral-300">
                  Rentabilidad (Margen)
                </span>
              </div>
              <span
                className={`text-sm font-black ${getScoreColor(data.margin.score, data.margin.max)}`}
              >
                +{Math.round(data.margin.score)} pts
              </span>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between text-xs">
                <span className="text-neutral-500">
                  Actual: {data.margin.value.toFixed(1)}%
                </span>
                <span className="text-neutral-500">
                  Objetivo: {data.margin.target}%
                </span>
              </div>
              <Progress
                value={(data.margin.value / data.margin.target) * 100}
                className="h-2 bg-white/5"
                indicatorClassName={getProgressColor(
                  data.margin.score,
                  data.margin.max,
                )}
              />
            </div>
          </div>

          {/* 2. Inventario */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-neutral-400" />
                <span className="text-sm font-bold text-neutral-300">
                  Salud de Inventario
                </span>
              </div>
              <span
                className={`text-sm font-black ${getScoreColor(data.stock.score, data.stock.max)}`}
              >
                +{Math.round(data.stock.score)} pts
              </span>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between text-xs">
                <span className="text-neutral-500">
                  {data.stock.lowStockCount > 0
                    ? `${data.stock.lowStockCount} alertas críticas`
                    : "Sin alertas"}
                </span>
                <span className="text-neutral-500">
                  Total Insumos: {data.stock.totalIngredients}
                </span>
              </div>
              <Progress
                value={data.stock.value}
                className="h-2 bg-white/5"
                indicatorClassName={getProgressColor(
                  data.stock.score,
                  data.stock.max,
                )}
              />
            </div>
          </div>

          {/* 3. Volumen */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-neutral-400" />
                <span className="text-sm font-bold text-neutral-300">
                  Ritmo de Ventas
                </span>
              </div>
              <span
                className={`text-sm font-black ${getScoreColor(data.volume.score, data.volume.max)}`}
              >
                +{Math.round(data.volume.score)} pts
              </span>
            </div>

            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between text-xs">
                <span className="text-neutral-500">
                  Promedio: {data.volume.value.toFixed(1)} / día
                </span>
                <span className="text-neutral-500">
                  Objetivo: {data.volume.target} / día
                </span>
              </div>
              <Progress
                value={(data.volume.value / data.volume.target) * 100}
                className="h-2 bg-white/5"
                indicatorClassName={getProgressColor(
                  data.volume.score,
                  data.volume.max,
                )}
              />
            </div>
          </div>

          {/* Tips Section */}
          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                Recomendaciones
              </h4>
            </div>
            <div className="grid gap-3">
              {getTips().map((tip, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-black/40">
                      <tip.icon className="h-4 w-4 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">
                        {tip.title}
                      </p>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-2">
                        {tip.desc}
                      </p>
                      {tip.cta && tip.link && (
                        <Link href={tip.link} legacyBehavior={false}>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider cursor-pointer hover:underline">
                            {tip.cta} &rarr;
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
