"use client";

import { useState, useEffect } from "react";
import { getRealTimeProfitability } from "@/app/actions/analytics-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Percent, Loader2, Search, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductProfit {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  margin: number;
  pYaMargin: number;
  rappiMargin: number;
  mpMargin: number;
  isCritical: boolean;
}

export default function ProfitabilityHeatmap() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductProfit[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoading(true);
        try {
          const res = await getRealTimeProfitability();
          if (res.success && res.data) {
            setProducts(res.data as ProductProfit[]);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [open]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-12 border-orange-500/20 bg-orange-500/5 text-orange-500 hover:bg-orange-500/20 hover:border-orange-500/50 font-bold uppercase tracking-wider group"
        >
          <Flame className="mr-2 h-4 w-4 group-hover:animate-bounce" />
          Mapa de Rentabilidad
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-4xl p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="bg-linear-to-b from-orange-500/10 to-transparent p-6 sm:p-8 pb-4">
          <DialogHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center ring-1 ring-orange-500/30 shrink-0">
                  <Percent className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <DialogTitle className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">
                    Profitability{" "}
                    <span className="text-orange-500">Heatmap</span>
                  </DialogTitle>
                  <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-widest mt-0.5">
                    Márgenes en tiempo real por plataforma
                  </p>
                </div>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white/5 border-white/10 pl-10 h-11 md:h-10 rounded-xl focus:ring-orange-500/50 w-full"
                />
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 pt-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <p className="font-bold uppercase tracking-widest text-[10px]">
                Calculando márgenes operativos...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar max-h-[60vh]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-transparent backdrop-blur-md z-10">
                  <tr className="border-b border-white/5 bg-zinc-950/50">
                    <th className="text-left py-4 px-2 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      Producto
                    </th>
                    <th className="text-center py-4 px-2 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      Local
                    </th>
                    <th className="text-center py-4 px-2 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      P. Ya
                    </th>
                    <th className="text-center py-4 px-2 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      Rappi
                    </th>
                    <th className="text-center py-4 px-2 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      MP
                    </th>
                    <th className="text-right py-4 px-2 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-2">
                        <p className="font-black text-white italic uppercase tracking-tighter">
                          {p.name}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-bold">
                          {p.category} | Costo: ${p.cost.toFixed(0)}
                        </p>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl font-black italic tracking-tighter text-sm ${
                            p.margin < 25
                              ? "bg-red-500/10 text-red-500"
                              : "bg-green-500/10 text-green-500"
                          }`}
                        >
                          {p.margin.toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl font-black italic tracking-tighter text-sm ${
                            p.pYaMargin < 15
                              ? "bg-red-500/10 text-red-500"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {p.pYaMargin.toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl font-black italic tracking-tighter text-sm ${
                            p.rappiMargin < 15
                              ? "bg-red-500/10 text-red-500"
                              : "bg-[#FF441F]/10 text-[#FF441F]"
                          }`}
                        >
                          {p.rappiMargin.toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl font-black italic tracking-tighter text-sm ${
                            p.mpMargin < 15
                              ? "bg-red-500/10 text-red-500"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {p.mpMargin.toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {p.isCritical ? (
                          <div className="flex items-center justify-end gap-1.5 text-red-500">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Alerta
                            </span>
                            <AlertTriangle className="h-4 w-4 animate-pulse" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                            Saludable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
