"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Percent,
  Tag,
  Zap,
  X,
  CheckCircle2,
  Filter,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  bulkApplyPromoByCategory,
  removeAllPromos,
} from "@/app/actions/product-actions";

interface CategoryPromoSheetProps {
  open: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  /** Pass productCounts per category for UX */
  productCountByCategory?: Record<string, number>;
  totalProducts?: number;
}

export function CategoryPromoSheet({
  open,
  onClose,
  categories,
  productCountByCategory = {},
  totalProducts = 0,
}: CategoryPromoSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [discount, setDiscount] = useState<string>("20");
  const [target, setTarget] = useState<"LOCAL" | "APPS" | "BOTH">("BOTH");
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    const d = Number(discount);
    if (isNaN(d) || d <= 0 || d > 99) {
      toast.error("El descuento debe ser entre 1% y 99%");
      return;
    }
    startTransition(async () => {
      const res = await bulkApplyPromoByCategory(selectedCategory, d, true, target);
      if (res.success) {
        const label =
          selectedCategory === "ALL"
            ? "todos los productos"
            : categories.find((c) => c.id === selectedCategory)?.name ?? "";
        toast.success(`✓ Promo del ${d}% aplicada a ${label}`);
        onClose();
      } else {
        toast.error(res.error || "Error al aplicar promoción");
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeAllPromos(target);
      if (res.success) {
        toast.success("✓ Todas las promos desactivadas");
        onClose();
      } else {
        toast.error(res.error || "Error al desactivar promos");
      }
    });
  };

  const selectedCount =
    selectedCategory === "ALL"
      ? totalProducts
      : (productCountByCategory[selectedCategory] ?? 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full max-w-sm bg-zinc-950 border-l border-white/10 text-white p-0 flex flex-col"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-primary/10 to-transparent border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(252,169,13,0.08),transparent_70%)]" />
          <SheetHeader className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-xl font-black text-white tracking-tight">
                  Gestionar Promos
                </SheetTitle>
                <SheetDescription className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">
                  Aplicar descuentos por categoría
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Filter className="h-3 w-3" />
              Categoría
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-white/[0.03] border-white/5 text-neutral-400 hover:border-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-bold">Todos los productos</span>
                </div>
                <span className="text-xs font-black opacity-60">
                  {totalProducts}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-white/[0.03] border-white/5 text-neutral-400 hover:border-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-sm font-bold">{cat.name}</span>
                  <span className="text-xs font-black opacity-60">
                    {productCountByCategory[cat.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Discount input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Percent className="h-3 w-3" />
              Descuento
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={99}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-3xl font-black outline-none focus:border-primary/50 transition-colors pr-12 tabular-nums"
                placeholder="20"
              />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-600" />
            </div>
            {selectedCount > 0 && Number(discount) > 0 && (
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide px-1">
                Afecta a{" "}
                <span className="text-primary font-black">{selectedCount}</span>{" "}
                producto{selectedCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Target selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Aplicar en
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(["BOTH", "LOCAL", "APPS"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-colors ${
                    target === t
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                  }`}
                >
                  {t === "BOTH" ? "Ambos" : t === "LOCAL" ? "Local" : "Apps"}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-[10px] font-bold text-neutral-500 uppercase leading-relaxed">
              Puedes elegir si el descuento se aplica solo en el local, solo en apps, o en ambos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 space-y-3">
          <Button
            onClick={handleApply}
            disabled={isPending || !discount || Number(discount) <= 0}
            className="w-full h-12 bg-primary text-black font-black uppercase tracking-widest hover:bg-primary/80 rounded-xl shadow-[0_0_20px_rgba(252,169,13,0.2)] transition-all disabled:opacity-40"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 animate-pulse" /> Aplicando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Activar Promo
              </span>
            )}
          </Button>

          <Button
            onClick={handleRemove}
            disabled={isPending}
            variant="outline"
            className="w-full h-10 border-white/10 text-neutral-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 font-bold rounded-xl transition-all"
          >
            <X className="h-4 w-4 mr-2" /> Quitar todas las promos
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
