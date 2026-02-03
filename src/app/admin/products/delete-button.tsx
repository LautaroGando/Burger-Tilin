"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/product-actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-400 hover:text-white"
        >
          <Trash2 className="h-4 w-4 text-red-500/70 hover:text-red-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-lg p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="bg-linear-to-b from-red-500/10 to-transparent p-8 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center ring-1 ring-red-500/30">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                  ¿Eliminar <span className="text-red-500">Producto</span>?
                </DialogTitle>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="p-8 pt-0 space-y-6">
          <p className="text-gray-400 text-sm font-medium leading-relaxed">
            Se eliminará el producto{" "}
            <span className="text-white font-bold italic">{productName}</span> y
            su receta asociada. ¿Estás seguro de que deseas continuar?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl border-white/5 bg-white/5 h-12 font-bold uppercase tracking-wider hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 h-12 font-black uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(220,38,38,0.2)]"
              onClick={async () => {
                const res = await deleteProduct(productId);
                if (!res.success) {
                  toast.error(res.error);
                } else {
                  toast.success("Producto eliminado correctamente");
                  setOpen(false);
                  window.location.reload();
                }
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
