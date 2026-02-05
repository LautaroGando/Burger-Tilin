"use client";

import { useState, useEffect } from "react";
import {
  getSalesHistory,
  SalesHistoryFilter,
} from "@/app/actions/analytics-actions";
import { deleteSale } from "@/app/actions/sale-actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  DollarSign,
  ShoppingBag,
  Trash2,
  Calendar,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sale } from "@/lib/types";

export default function SalesDashboard() {
  const [filter, setFilter] = useState<SalesHistoryFilter>("week");
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [data, setData] = useState<{
    sales: Sale[];
    chartData: { name: string; value: number }[];
    totalRevenue: number;
    totalNetRevenue: number;
    estimatedProfit: number;
    totalCommissions: number;
    totalCount: number;
    commMap?: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await getSalesHistory(filter);
      if (res.success) {
        setData({
          sales: res.sales || [],
          chartData: res.chartData || [],
          totalRevenue: res.totalRevenue || 0,
          totalNetRevenue: res.totalNetRevenue || 0,
          estimatedProfit: res.estimatedProfit || 0,
          totalCommissions: res.totalCommissions || 0,
          totalCount: res.totalCount || 0,
          commMap: res.commMap,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [filter]);

  const filters: { label: string; value: SalesHistoryFilter }[] = [
    { label: "Hoy", value: "day" },
    { label: "Semana", value: "week" },
    { label: "Mes", value: "month" },
    { label: "Año", value: "year" },
    { label: "Histórico", value: "all" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            className={`rounded-full px-6 transition-all ${
              filter === f.value
                ? "bg-primary text-black font-bold shadow-[0_0_15px_rgba(252,169,13,0.3)] hover:bg-primary/90"
                : "border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <div className="text-neutral-500 text-center py-20 bg-white/5 rounded-3xl border border-white/5 disabled-stripes">
          Error al cargar datos.
        </div>
      ) : (
        <MotionDiv
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MotionItem variants={item}>
              <Card className="glass-card border-white/5 bg-zinc-900/20 p-6 flex items-center justify-between group hover:border-white/10 transition-all h-full">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Ventas Totales
                  </p>
                  <div className="text-3xl font-black text-white tracking-tight">
                    ${Math.round(data.totalRevenue).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-neutral-500 font-medium italic">
                    Suma total de tickets
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-neutral-400">
                  <DollarSign className="h-6 w-6" />
                </div>
              </Card>
            </MotionItem>

            <MotionItem variants={item}>
              <Card className="glass-card border-white/5 bg-zinc-900/20 p-6 flex items-center justify-between group hover:border-white/10 transition-all h-full">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Ingreso Neto (Caja)
                  </p>
                  <div className="text-3xl font-black text-blue-400 tracking-tight">
                    ${Math.round(data.totalNetRevenue).toLocaleString()}
                  </div>
                  {data.totalCommissions > 0 ? (
                    <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-wider">
                      Apps: -$
                      {Math.round(data.totalCommissions).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-[10px] text-neutral-500 font-medium italic">
                      Ventas - Comisiones Apps
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <CreditCard className="h-6 w-6" />
                </div>
              </Card>
            </MotionItem>

            <MotionItem variants={item}>
              <Card className="glass-card border-white/10 bg-zinc-900/40 p-6 flex items-center justify-between group hover:border-primary/20 transition-all h-full shadow-lg shadow-yellow-500/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Ganancia Real Est.
                  </p>
                  <div className="text-4xl font-black text-primary tracking-tight">
                    ${Math.round(data.estimatedProfit).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-neutral-500 font-medium italic">
                    Ventas - Apps - Materia Prima
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-[0_0_20px_rgba(252,169,13,0.1)]">
                  <ShoppingBag className="h-7 w-7" />
                </div>
              </Card>
            </MotionItem>
          </div>

          {/* Chart */}
          <MotionItem variants={item}>
            <Card className="glass-card border-white/5 bg-zinc-900/20">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Tendencia de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData}>
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#FCA90D"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#FCA90D"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#555"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#555"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      }}
                      itemStyle={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "12px",
                      }}
                      labelStyle={{
                        color: "#666",
                        fontSize: "10px",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                      formatter={(value: number | string | undefined) => [
                        `$${Number(value || 0).toLocaleString()}`,
                        "Ingresos",
                      ]}
                      cursor={{
                        stroke: "rgba(255,255,255,0.1)",
                        strokeWidth: 1,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#FCA90D"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </MotionItem>

          {/* Table */}
          <MotionItem variants={item}>
            <Card className="glass-card border-white/5 bg-zinc-900/20 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-black/20">
                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-neutral-400" />
                  Últimos Movimientos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-500 uppercase bg-white/5 font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Canal</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.sales.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-neutral-600 font-medium"
                          >
                            No hay ventas registradas en este periodo.
                          </td>
                        </tr>
                      ) : (
                        data.sales.map((sale) => (
                          <tr
                            key={sale.id}
                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <td className="px-6 py-4 text-neutral-400 font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {new Date(sale.date).toLocaleString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-white">
                              <div className="flex items-center gap-2">
                                {sale.clientName || "Consumidor Final"}
                                {sale.customer && (
                                  <div
                                    className="h-1.5 w-1.5 rounded-full bg-primary"
                                    title="Registrado"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="secondary"
                                className="bg-white/5 text-neutral-400 border border-white/5 font-mono text-[10px] uppercase font-bold tracking-wider"
                              >
                                {sale.channel}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-white tracking-tight">
                              <div className="flex flex-col items-end">
                                <span>
                                  ${Number(sale.total).toLocaleString()}
                                </span>
                                {(() => {
                                  const frozenComm =
                                    Number(sale.discount) < 0
                                      ? Math.abs(Number(sale.discount)) / 100
                                      : null;
                                  const currentComm = data.commMap
                                    ? data.commMap[
                                        sale.channel.toUpperCase()
                                      ] ||
                                      data.commMap[sale.channel] ||
                                      0
                                    : 0;
                                  const commToUse =
                                    frozenComm !== null
                                      ? frozenComm
                                      : currentComm;

                                  if (commToUse > 0) {
                                    return (
                                      <span className="text-[10px] text-red-500/70 font-bold">
                                        Neto (-{Math.round(commToUse * 100)}%):
                                        $
                                        {(
                                          Number(sale.total) *
                                          (1 - commToUse)
                                        ).toLocaleString()}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                  sale.status === "COMPLETED"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : sale.status === "CANCELLED"
                                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                }`}
                              >
                                {sale.status === "COMPLETED"
                                  ? "Completado"
                                  : sale.status === "CANCELLED"
                                    ? "Cancelado"
                                    : sale.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-white transition-colors" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </MotionItem>
        </MotionDiv>
      )}

      {/* Sale Detail Dialog */}
      <Dialog
        open={!!selectedSale}
        onOpenChange={(open) => !open && setSelectedSale(null)}
      >
        <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-lg p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="bg-zinc-900/50 p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black text-white tracking-tight uppercase">
                Ticket Detalles
              </DialogTitle>
              <DialogDescription className="text-neutral-500 font-mono text-xs mt-1">
                ID: {selectedSale?.id.slice(0, 8)}...
              </DialogDescription>
            </div>
            {selectedSale && (
              <div
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  selectedSale.status === "COMPLETED"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : selectedSale.status === "CANCELLED"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                }`}
              >
                {selectedSale.status}
              </div>
            )}
          </div>

          {selectedSale && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">
                    Cliente
                  </p>
                  <p className="font-bold text-white text-sm">
                    {selectedSale.clientName || "Mostrador"}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">
                    Método
                  </p>
                  <p className="font-bold text-white text-sm">
                    {selectedSale.paymentMethod} • {selectedSale.channel}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">
                  Items Compra
                </p>
                {selectedSale.items.map((item, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs border border-primary/20">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          ${Number(item.unitPrice).toLocaleString()} c/u
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-white font-mono">
                      $
                      {(
                        Number(item.quantity) * Number(item.unitPrice)
                      ).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center py-4 border-t border-white/5 border-dashed">
                <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
                  Total Final
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-black text-primary tracking-tight">
                    ${Number(selectedSale.total).toLocaleString()}
                  </span>
                  {(() => {
                    const frozenComm =
                      Number(selectedSale.discount) < 0
                        ? Math.abs(Number(selectedSale.discount)) / 100
                        : null;
                    const currentComm =
                      data && data.commMap
                        ? data.commMap[selectedSale.channel.toUpperCase()] ||
                          data.commMap[selectedSale.channel] ||
                          0
                        : 0;
                    const commToUse =
                      frozenComm !== null ? frozenComm : currentComm;

                    if (commToUse > 0) {
                      return (
                        <span className="text-xs text-red-500 font-bold uppercase tracking-tighter">
                          Neto (-{Math.round(commToUse * 100)}%): $
                          {(
                            Number(selectedSale.total) *
                            (1 - commToUse)
                          ).toLocaleString()}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                {!isDeleting ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold"
                    onClick={() => setIsDeleting(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar Ticket
                  </Button>
                ) : (
                  <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 w-full animate-in fade-in zoom-in duration-200">
                    <p className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      ¿Eliminar venta? Se repondrá el stock.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border border-white/10 text-white hover:bg-white/10"
                        onClick={() => setIsDeleting(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 font-bold text-black"
                        onClick={async () => {
                          const res = await deleteSale(selectedSale.id);
                          if (res.success) {
                            toast.success("Venta eliminada correctamente");
                            setSelectedSale(null);
                            setIsDeleting(false);
                            window.location.reload();
                          } else {
                            toast.error(res.error);
                            setIsDeleting(false);
                          }
                        }}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
