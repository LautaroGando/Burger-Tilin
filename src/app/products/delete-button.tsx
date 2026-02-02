"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/product-actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="bg-[#1a1a1a] border border-white/10 text-white shadow-2xl border-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            ¿Eliminar Producto?
          </DialogTitle>
          <DialogDescription className="text-gray-400 pt-4">
            Esta acción no se puede deshacer. Se eliminará el producto{" "}
            {productName} y su receta asociada.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            className="border-white/10"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
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
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
