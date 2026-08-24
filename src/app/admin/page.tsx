import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Package,
  Activity,
  Receipt,
  Percent,
  Zap,
  ArrowRight,
  LogOut,
  Users,
  Settings,
  BarChart3,
  ShoppingBasket,
} from "lucide-react";
import { logout } from "@/app/actions/auth-actions";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { getAdvancedAnalytics } from "@/app/actions/analytics-actions";
import { getDashboardMetrics } from "@/app/actions/sale-actions";
import { getLowStockAlerts } from "@/app/actions/ingredient-actions";
import BusinessHealthGauge from "@/components/bi/BusinessHealthGauge";
import PeakHoursChart from "@/components/bi/PeakHoursChart";
import HealthDetailsDialog from "@/components/bi/HealthDetailsDialog";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const metrics = await getDashboardMetrics();
  const lowStockCount = await getLowStockAlerts();
  const advanced = await getAdvancedAnalytics();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const quickActions = [
    {
      title: "Nueva Venta",
      icon: Plus,
      href: "/sales/new",
      accent: "bg-primary text-black hover:bg-primary/80",
      primary: true,
    },
    {
      title: "Productos",
      icon: ShoppingBasket,
      href: "/admin/products",
      accent: "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10",
    },
    {
      title: "Inventario",
      icon: Package,
      href: "/admin/ingredients",
      accent: "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10",
    },
    {
      title: "Finanzas",
      icon: BarChart3,
      href: "/admin/analytics",
      accent: "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10",
    },
    {
      title: "Gastos",
      icon: Receipt,
      href: "/admin/expenses",
      accent: "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10",
    },
    {
      title: "Clientes",
      icon: Users,
      href: "/admin/customers",
      accent: "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10",
    },
    {
      title: "Config",
      icon: Settings,
      href: "/admin/settings",
      accent: "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10",
    },
  ];

  const dailyAvg =
    (advanced.data?.totalSales || 0) > 0
      ? ((advanced.data?.totalSales ?? 0) / 30).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black overflow-x-hidden">
      <MotionDiv
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-7 space-y-5"
      >
        {/* ─── HEADER ──────────────────────────────────────────────── */}
        <MotionItem variants={item}>
          <header className="flex items-center justify-between gap-3">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_12px_rgba(252,169,13,0.2)] bg-neutral-900 shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Burger Tilin Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-white leading-none uppercase">
                  Burger <span className="text-primary text-glow">Tilín</span>
                </h1>
                <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.25em]">
                  Panel de gestión
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {lowStockCount > 0 && (
                <Link href="/admin/ingredients">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all animate-pulse">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{lowStockCount} alertas</span>
                  </div>
                </Link>
              )}
              <Link href="/menu" target="_blank">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex rounded-full text-neutral-500 hover:text-white hover:bg-white/5 font-semibold border border-white/5 text-xs"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                  Ver Menú
                </Button>
              </Link>
              <Link href="/sales/new">
                <Button
                  size="sm"
                  className="rounded-full font-bold bg-primary text-black hover:bg-primary/80 shadow-[0_0_16px_rgba(252,169,13,0.25)] px-4 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nueva Venta
                </Button>
              </Link>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="rounded-full w-8 h-8 p-0 text-neutral-600 hover:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </header>
        </MotionItem>

        {/* ─── KPI ROW ─────────────────────────────────────────────── */}
        <MotionItem variants={item}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              {
                label: "Ingresos hoy",
                value: `$${metrics.totalSales.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`,
                sub: "neto",
                color: "text-primary",
              },
              {
                label: "Ventas 30d",
                value: `${advanced.data?.totalSales ?? 0}`,
                sub: "órdenes",
                color: "text-blue-400",
              },
              {
                label: "Ticket prom.",
                value:
                  (advanced.data?.totalSales ?? 0) > 0
                    ? `$${Math.round(
                        (advanced.data?.salesProjection ?? 0) /
                          (advanced.data?.totalSales ?? 1)
                      ).toLocaleString("es-AR")}`
                    : "$0",
                sub: "por orden",
                color: "text-white",
              },
              {
                label: "Margen neto",
                value: `${metrics.margin.toFixed(1)}%`,
                sub: "rentabilidad",
                color:
                  metrics.margin >= 40
                    ? "text-green-400"
                    : metrics.margin >= 25
                      ? "text-primary"
                      : "text-red-400",
              },
              {
                label: "Mermas 30d",
                value: `$${Math.round(advanced.data?.totalWastage || 0).toLocaleString("es-AR")}`,
                sub: "desperdicio",
                color:
                  (advanced.data?.totalWastage ?? 0) > 5000
                    ? "text-red-400"
                    : "text-neutral-400",
              },
              {
                label: "Pedidos hoy",
                value: `${metrics.totalOrders}`,
                sub: "órdenes",
                color: "text-white",
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className="bg-neutral-950 border border-white/5 rounded-xl p-3 flex flex-col gap-1 hover:border-primary/20 transition-colors"
              >
                <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest truncate">
                  {kpi.label}
                </p>
                <p className={`text-xl font-black tracking-tight ${kpi.color}`}>
                  {kpi.value}
                </p>
                <p className="text-[9px] text-neutral-700 font-medium">
                  {kpi.sub}
                </p>
              </div>
            ))}
          </div>
        </MotionItem>

        {/* ─── QUICK ACTIONS ───────────────────────────────────────── */}
        <MotionItem variants={item}>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${action.accent}`}
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.title}
                </button>
              </Link>
            ))}
          </div>
        </MotionItem>

        {/* ─── MAIN GRID ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Health Gauge — 3 cols */}
          <MotionItem
            variants={item}
            className="lg:col-span-3 bg-neutral-950 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-3 z-10">
              Diagnóstico
            </p>

            {(advanced.data?.totalWastage || 0) > 5000 && (
              <div className="mb-2 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-1.5 z-10">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[9px] font-bold text-red-400 uppercase">
                  Mermas elevadas
                </span>
              </div>
            )}

            <HealthDetailsDialog
              data={
                advanced.data?.healthBreakdown || {
                  margin: { score: 0, value: 0, max: 40, target: 40 },
                  stock: {
                    score: 0,
                    value: 0,
                    max: 30,
                    totalIngredients: 0,
                    lowStockCount: 0,
                  },
                  volume: { score: 0, value: 0, max: 30, target: 10 },
                }
              }
              totalScore={advanced.data?.healthScore || 0}
            >
              <div className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center z-10">
                <div className="scale-90 my-1">
                  <BusinessHealthGauge score={advanced.data?.healthScore || 0} />
                </div>
                <span
                  className={`text-xs font-black uppercase tracking-widest ${
                    (advanced.data?.totalSales || 0) === 0
                      ? "text-neutral-500"
                      : (advanced.data?.healthScore || 0) >= 80
                        ? "text-green-400"
                        : (advanced.data?.healthScore || 0) >= 50
                          ? "text-primary"
                          : "text-red-400"
                  }`}
                >
                  {(advanced.data?.totalSales || 0) === 0
                    ? "Sin datos"
                    : (advanced.data?.healthScore || 0) >= 80
                      ? "Excelente"
                      : (advanced.data?.healthScore || 0) >= 50
                        ? "Estable"
                        : "Crítico"}
                </span>
                <p className="text-[9px] text-neutral-600 mt-0.5">
                  Click para detalles
                </p>
              </div>
            </HealthDetailsDialog>

            <div className="w-full mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 z-10">
              <div className="text-center">
                <p className="text-lg font-black text-white">
                  {advanced.data?.customerRecurrence.toFixed(0)}%
                </p>
                <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider">
                  Recurrencia
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-primary">
                  +$
                  {Math.round(metrics.estimatedProfit).toLocaleString("es-AR", {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider">
                  Ganancia
                </p>
              </div>
            </div>
          </MotionItem>

          {/* Ritmo de ventas — 6 cols */}
          <MotionItem
            variants={item}
            className="lg:col-span-6 bg-neutral-950 border border-white/5 rounded-2xl p-5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                  Ritmo de Ventas
                </p>
                <p className="text-sm font-bold text-white">Horas pico</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold text-neutral-600 uppercase">
                  En vivo
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-[140px]">
              <PeakHoursChart data={advanced.data?.peakHours || []} />
            </div>
          </MotionItem>

          {/* Proyección — 3 cols */}
          <MotionItem
            variants={item}
            className="lg:col-span-3 bg-neutral-950 border border-white/5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 opacity-[0.03]">
              <TrendingUp className="h-32 w-32" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
                Proyección mensual
              </p>
              <p className="text-3xl font-black text-primary tracking-tighter">
                $
                {Math.round(
                  advanced.data?.salesProjection || 0
                ).toLocaleString("es-AR")}
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5 font-medium">
                facturación estimada
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-white">
                  {advanced.data?.totalSales ?? 0}
                </p>
                <p className="text-[9px] text-neutral-600 font-bold uppercase">
                  Ventas 30d
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-white">{dailyAvg}</p>
                <p className="text-[9px] text-neutral-600 font-bold uppercase">
                  Prom. diario
                </p>
              </div>
            </div>
          </MotionItem>
        </div>

        {/* ─── BOTTOM GRID ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Productos Estrella */}
          <MotionItem
            variants={item}
            className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-white">
                  Productos Estrella
                </p>
              </div>
              <Link href="/admin/analytics">
                <button className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors">
                  Ver todo <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {(advanced.data?.topProducts || [])
                .slice(0, 5)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-xs font-black text-neutral-700 w-4 shrink-0">
                      #{i + 1}
                    </span>
                    <p className="flex-1 text-sm font-semibold text-neutral-200 truncate">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-white">
                          {p.sales}u
                        </p>
                        <p className="text-[9px] text-neutral-600">vendidas</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-white">
                          ${p.profit.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[9px] text-neutral-600">ganancia</p>
                      </div>
                      <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        <Percent className="h-2.5 w-2.5 text-primary" />
                        <span className="text-[10px] text-primary font-bold">
                          {p.margin.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {(advanced.data?.topProducts || []).length === 0 && (
                <div className="py-8 text-center text-neutral-600 text-xs">
                  Sin datos de ventas aún
                </div>
              )}
            </div>
          </MotionItem>

          {/* Capital Inmovilizado */}
          <MotionItem
            variants={item}
            className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                <p className="text-sm font-bold text-white">
                  Capital Inmovilizado
                </p>
              </div>
              <Link href="/admin/ingredients">
                <button className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 transition-colors">
                  Ver inventario <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>

            {/* Header de tabla */}
            <div className="grid grid-cols-12 px-5 py-2 border-b border-white/[0.04]">
              <span className="col-span-8 text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
                Insumo
              </span>
              <span className="col-span-4 text-[9px] font-bold text-neutral-600 uppercase tracking-wider text-right">
                Capital
              </span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {(advanced.data?.topIngredients || []).map((ing, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="col-span-8 flex items-center gap-2">
                    <span className="text-[9px] font-black text-neutral-700">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-neutral-300 truncate">
                      {ing.name}
                    </span>
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-sm font-bold text-white">
                      $
                      {Math.round(ing.stockValue).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              ))}
              {(advanced.data?.topIngredients || []).length === 0 && (
                <div className="py-8 text-center text-neutral-600 text-xs">
                  Sin insumos registrados
                </div>
              )}
            </div>
          </MotionItem>
        </div>
      </MotionDiv>
    </div>
  );
}
