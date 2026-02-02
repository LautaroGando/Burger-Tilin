import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Package,
  ChefHat,
  Brain,
  Activity,
  Receipt,
  Percent,
  Zap,
  Sparkles,
  ArrowRight,
  ShoppingBasket,
} from "lucide-react";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { getAdvancedAnalytics } from "@/app/actions/analytics-actions";
import { getDashboardMetrics } from "@/app/actions/sale-actions";
import { getLowStockAlerts } from "@/app/actions/ingredient-actions";
import BusinessHealthGauge from "@/components/bi/BusinessHealthGauge";
import PeakHoursChart from "@/components/bi/PeakHoursChart";
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
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const quickActions = [
    {
      title: "Nueva Venta",
      icon: Plus,
      href: "/sales/new",
      color: "text-primary",
      bg: "bg-primary/5 hover:bg-primary/20",
    },
    {
      title: "Cocina",
      icon: ChefHat,
      href: "/kitchen",
      color: "text-orange-500",
      bg: "bg-orange-500/5 hover:bg-orange-500/20",
    },
    {
      title: "Productos",
      icon: ShoppingBasket,
      href: "/products",
      color: "text-pink-500",
      bg: "bg-pink-500/5 hover:bg-pink-500/20",
    },
    {
      title: "Inventario",
      icon: Package,
      href: "/ingredients",
      color: "text-blue-400",
      bg: "bg-blue-400/5 hover:bg-blue-400/20",
    },
    {
      title: "Finanzas",
      icon: Activity,
      href: "/analytics",
      color: "text-green-400",
      bg: "bg-green-400/5 hover:bg-green-400/20",
    },
    {
      title: "Cerebro IA",
      icon: Brain,
      href: "/brain",
      color: "text-purple-400",
      bg: "bg-purple-400/5 hover:bg-purple-400/20",
    },
    {
      title: "Gastos",
      icon: Receipt,
      href: "/expenses",
      color: "text-red-400",
      bg: "bg-red-400/5 hover:bg-red-400/20",
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-12 text-foreground overflow-x-hidden bg-black selection:bg-primary selection:text-black">
      <MotionDiv
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-10"
      >
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 sm:h-24 sm:w-24 rounded-3xl overflow-hidden border-2 border-primary/20 shadow-[0_0_20px_rgba(252,169,13,0.3)] bg-neutral-900">
                <Image
                  src="/logo.jpg"
                  alt="Burger Tilin Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h1 className="text-2xl sm:text-5xl font-black tracking-tighter text-white leading-none">
                  BURGER <span className="text-primary text-glow">TILIN</span>
                </h1>
                <p className="text-[9px] sm:text-xs font-bold text-neutral-500 uppercase tracking-[0.3em]">
                  Smash Burgers
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {lowStockCount > 0 && (
              <Link
                href="/ingredients"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] sm:text-xs font-bold hover:bg-red-500/20 transition-all animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{lowStockCount} ALERTAS</span>
              </Link>
            )}
            <Link href="/sales/new" className="w-full sm:w-auto">
              <Button className="w-full rounded-full px-6 sm:px-8 py-4 sm:py-6 font-bold bg-primary text-black hover:bg-primary/80 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(252,169,13,0.3)] hover:shadow-[0_0_30px_rgba(252,169,13,0.5)]">
                <Plus className="h-5 w-5 mr-2" />
                NUEVA VENTA
              </Button>
            </Link>
          </div>
        </header>

        {/* Top Metrics - Floating Cards */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {[
            {
              label: "Ingresos Hoy",
              value: metrics.totalSales,
              icon: DollarSign,
              sub: "Venta directa",
            },
            {
              label: "Margen Neto",
              value: `${metrics.margin.toFixed(1)}%`,
              icon: Percent,
              sub: "Rentabilidad real",
            },
            {
              label: "Pedidos",
              value: metrics.totalOrders,
              icon: ShoppingBag,
              sub: "Órdenes procesadas",
            },
          ].map((m, i) => (
            <MotionItem key={i} variants={item}>
              <Card className="glass-card border-none h-32 relative overflow-hidden group bg-neutral-900/30 hover:bg-neutral-800/50">
                <div className="absolute -right-6 -top-6 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12">
                  <m.icon className="h-32 w-32" />
                </div>
                <CardContent className="pt-6 relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {m.label}
                    </p>
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
                      <m.icon className="h-4 w-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-black tracking-tight text-white group-hover:text-primary transition-colors duration-300">
                      {typeof m.value === "number" && m.value > 100
                        ? `$${m.value.toLocaleString()}`
                        : m.value}
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-1 font-medium group-hover:text-neutral-500 transition-colors">
                      {m.sub}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </MotionItem>
          ))}
        </div>

        {/* Business Intelligence Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 min-h-[400px]">
          {/* Health Gauge - 4 cols */}
          <MotionItem
            variants={item}
            className="lg:col-span-4 glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="mb-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
                  Diagnóstico IA
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-medium px-4 mb-2">
                Análisis en tiempo real de la estabilidad y rentabilidad de tu
                negocio.
              </p>

              <div className="scale-100 md:scale-125 mb-8 mt-4">
                <BusinessHealthGauge score={advanced.data?.healthScore || 0} />
              </div>

              <div className="mb-4">
                <span
                  className={`text-xs font-black uppercase tracking-widest ${
                    (advanced.data?.totalSales || 0) === 0
                      ? "text-neutral-500"
                      : (advanced.data?.healthScore || 0) >= 80
                        ? "text-green-500"
                        : (advanced.data?.healthScore || 0) >= 50
                          ? "text-primary"
                          : "text-red-500"
                  }`}
                >
                  Estado:{" "}
                  {(advanced.data?.totalSales || 0) === 0
                    ? "Sin Datos"
                    : (advanced.data?.healthScore || 0) >= 80
                      ? "Excelente"
                      : (advanced.data?.healthScore || 0) >= 50
                        ? "Estable"
                        : "Crítico"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-6">
                <div>
                  <p className="text-2xl font-black text-white">
                    {advanced.data?.customerRecurrence.toFixed(0)}%
                  </p>
                  <p className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider">
                    Recurrencia
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-primary">
                    +
                    {metrics.estimatedProfit.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider">
                    Ganancia Est.
                  </p>
                </div>
              </div>
            </div>
          </MotionItem>

          {/* Charts & Trends - 5 cols */}
          <MotionItem
            variants={item}
            className="lg:col-span-5 glass-card flex flex-col min-h-[300px] lg:min-h-0"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 bg-white/[0.01]">
              <div>
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">
                  Ritmo de Ventas
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-neutral-500 uppercase">
                  Actualizado
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              <PeakHoursChart data={advanced.data?.peakHours || []} />
            </CardContent>
          </MotionItem>

          {/* Quick Actions - 3 cols */}
          <MotionItem variants={item} className="lg:col-span-3">
            <div className="h-full flex flex-col gap-3">
              <div className="flex items-center justify-between px-1 mb-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Acceso Rápido
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 h-full">
                {quickActions.map((action, i) => (
                  <Link key={i} href={action.href} className="group relative">
                    <div
                      className={`h-full min-h-[100px] p-4 rounded-2xl bg-neutral-900/40 border border-white/5 ${action.bg.split(" ")[0]} group-hover:border-primary/30 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-center overflow-hidden relative isolate`}
                    >
                      <div
                        className={`absolute inset-0 ${action.bg.split(" ")[1]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
                      />
                      <action.icon
                        className={`h-6 w-6 ${action.color} relative z-10 group-hover:scale-110 transition-transform duration-300`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors relative z-10">
                        {action.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </MotionItem>
        </div>

        {/* Top Products Strip */}
        <MotionItem variants={item} className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Productos Estrella
                </h3>
                <p className="text-xs text-neutral-500">
                  Ranking por margen y volumen
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-xs text-neutral-400 hover:text-white hover:bg-white/5"
            >
              Ver Todo <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {(advanced.data?.topProducts || []).slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                className="group relative p-4 rounded-xl bg-black/40 border border-white/5 hover:border-primary/30 transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-50">
                  <span className="text-4xl font-black text-neutral-800/50 group-hover:text-primary/10 transition-colors">
                    #{i + 1}
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="font-bold text-white group-hover:text-primary transition-colors truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-medium mb-3">
                    {p.sales} unidades vendidas
                  </p>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">
                        Ganancia
                      </p>
                      <p className="font-bold text-sm text-white">
                        ${p.profit.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-900/80 px-2 py-1 rounded-md border border-white/5">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-primary font-bold">
                        {p.margin.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MotionItem>
      </MotionDiv>
    </div>
  );
}
