"use client";

import { useState, useEffect } from "react";
import { Product, ComboSlot } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import { getComboSlots } from "@/app/actions/combo-actions";

interface Props {
  combo: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fulfillments: { slotId: string; configuredProductId: string; deliveredProductId: string; extraPrice: number }[]) => void;
}

export function ComboComponentSelector({ combo, isOpen, onClose, onConfirm }: Props) {
  const [slots, setSlots] = useState<ComboSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, string>>({}); // slotId -> productId

  const loadSlots = async () => {
    setLoading(true);
    const res = await getComboSlots(combo.id);
    if (res.success && res.data) {
      const data = res.data as unknown as ComboSlot[];
      setSlots(data);
      // Initialize selections with default products
      const initSels: Record<string, string> = {};
      data.forEach((slot: ComboSlot) => {
        initSels[slot.id] = slot.defaultProductId;
      });
      setSelections(initSels);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadSlots();
    }
  }, [isOpen, combo.id]);

  const handleConfirm = () => {
    const fulfillments = slots.map((slot) => {
      let extraPrice = 0;
      const deliveredProductId = selections[slot.id] || slot.defaultProductId;
      if (deliveredProductId !== slot.defaultProductId) {
        const alt = slot.alternatives?.find((a: any) => a.productId === deliveredProductId);
        if (alt) extraPrice = alt.extraPrice || 0;
      }

      return {
        slotId: slot.id,
        configuredProductId: slot.defaultProductId,
        deliveredProductId,
        extraPrice,
      };
    });
    onConfirm(fulfillments);
  };

  // If no slots, this combo doesn't have customization
  if (!loading && slots.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-xl p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="bg-gradient-to-b from-primary/10 to-transparent p-8 pb-4">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
              Personalizar <span className="text-primary">{combo.name}</span>
            </DialogTitle>
            <p className="text-zinc-400 text-sm font-medium mt-1">
              Seleccioná los componentes para este combo.
            </p>
          </DialogHeader>
        </div>
        <div className="p-8 pt-0 space-y-8">
          {loading ? (
            <div className="flex justify-center p-8 text-primary animate-pulse">
              Cargando opciones...
            </div>
          ) : (
            <div className="space-y-6">
              {slots.map((slot) => {
                const options = [
                  { product: slot.defaultProduct, isDefault: true, extraPrice: 0 },
                  ...(slot.alternatives?.map((a: any) => ({ product: a.product, isDefault: false, extraPrice: a.extraPrice || 0 })) || []),
                ];

                return (
                  <div key={slot.id} className="space-y-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                        {slot.sortOrder + 1}
                      </div>
                      {slot.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.map((opt, i) => {
                        if (!opt.product) return null;
                        const isSelected = selections[slot.id] === opt.product.id;
                        return (
                          <div
                            key={i}
                            onClick={() =>
                              setSelections({ ...selections, [slot.id]: opt.product!.id })
                            }
                            className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(252,169,13,0.1)]"
                                : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-black font-bold" />
                              </div>
                            )}
                            <p className={`text-sm font-bold pr-6 ${isSelected ? "text-primary" : "text-white"}`}>
                              {opt.product.name}
                            </p>
                            {opt.isDefault ? (
                              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">POR DEFECTO</p>
                            ) : opt.extraPrice > 0 ? (
                              <p className="text-[10px] text-primary uppercase tracking-widest mt-1">+ ${opt.extraPrice.toLocaleString("es-AR")}</p>
                            ) : (
                              <p className="text-[10px] text-green-400/80 uppercase tracking-widest mt-1">SIN CARGO ADICIONAL</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <Info className="h-5 w-5 text-neutral-400 shrink-0" />
                <p className="text-xs text-neutral-400">
                  El stock se descontará automáticamente de los productos que selecciones aquí, garantizando un inventario exacto.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-14 rounded-2xl border-white/10 text-white hover:bg-white/10 font-bold tracking-widest uppercase text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(252,169,13,0.2)]"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
