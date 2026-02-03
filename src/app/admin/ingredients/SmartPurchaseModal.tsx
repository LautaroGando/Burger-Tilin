"use client";

import { useState, useEffect, useCallback } from "react";
import { getOptimalPurchaseList } from "@/app/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  dailyAvg: number;
  suggestedPurchase: number;
  urgencyScore: number;
}

interface GetOptimalPurchaseListResponse {
  success: boolean;
  data?: Suggestion[];
  // Add other potential fields like 'error' if your action returns them
}

export default function SmartPurchaseModal() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  // Memoize loadSuggestions to ensure it's stable across renders,
  // preventing it from being a missing dependency in useEffect.
  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    // Explicitly type the response from the action
    const res = await getOptimalPurchaseList();
    if (res.success && res.data) {
      setSuggestions(res.data as Suggestion[]);
    } else {
      toast.error("Error al cargar sugerencias");
    }
    setLoading(false);
  }, []); // Dependencies are stable state setters and imported action, so empty array is fine.

  useEffect(() => {
    if (open) {
      void loadSuggestions();
    }
  }, [open, loadSuggestions]);

  const generateWhatsAppReport = () => {
    const message =
      `🛒 *LISTA DE COMPRA SUGERIDA - Burger Tilin* 🛒\n\n` +
      suggestions
        .map(
          (s) =>
            `• *${s.name}*: Pedir ${s.suggestedPurchase} ${s.unit} ${s.urgencyScore === 2 ? "🚨 (STOCK CRÍTICO)" : ""}`,
        )
        .join("\n") +
      `\n\n📅 Generado: ${new Date().toLocaleDateString()}`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-12 border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:border-primary/50 font-bold uppercase tracking-wider relative group"
        >
          <ShoppingCart className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
          Compra Inteligente
          {suggestions.some((s) => s.urgencyScore === 2) && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-2xl p-0 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="bg-linear-to-b from-primary/10 to-transparent p-6 sm:p-8 pb-4 text-white">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter">
                  Smart <span className="text-primary">Purchase</span>
                </DialogTitle>
                <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-widest mt-0.5">
                  Basado en consumo real (30d)
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 pt-4 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-bold uppercase tracking-widest text-[10px]">
                Analizando patrones...
              </p>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="grid gap-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                      s.urgencyScore === 2
                        ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
                        : "bg-white/3 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base sm:text-lg truncate">
                          {s.name}
                        </span>
                        {s.urgencyScore === 2 && (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter text-zinc-500">
                        <span className="truncate">
                          Stock:{" "}
                          <span className="text-zinc-300">
                            {s.currentStock} {s.unit}
                          </span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">
                          Uso:{" "}
                          <span className="text-zinc-300">
                            {s.dailyAvg.toFixed(2)}/día
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 bg-black/20 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-white/5 sm:border-none">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                          Pedir
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-white italic tracking-tighter">
                          +{s.suggestedPurchase}{" "}
                          <span className="text-[10px] uppercase ml-0.5">
                            {s.unit}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <p className="text-[10px] text-zinc-500 font-medium text-center italic">
                  * Las sugerencias incluyen un 20% de stock de seguridad para
                  evitar quiebres.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={generateWhatsAppReport}
                    className="flex-1 h-14 bg-[#25D366] text-black font-black text-lg italic uppercase tracking-tighter rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <MessageSquare className="mr-2 h-5 w-5" /> Enviar a
                    Proveedor
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    className="h-14 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-black text-xl italic uppercase tracking-tighter">
                  Stock Saludable
                </p>
                <p className="text-zinc-500 text-sm font-medium">
                  No necesitas realizar compras por el momento.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
