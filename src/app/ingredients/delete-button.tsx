"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteIngredient } from "@/app/actions/ingredient-actions";
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
  ingredientId: string;
  ingredientName: string;
}

export function DeleteIngredientButton({
  ingredientId,
  ingredientName,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
        >
          <Trash2 className="mr-2 h-3 w-3" /> Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border border-white/10 text-white shadow-2xl border-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            ¿Eliminar Insumo?
          </DialogTitle>
          <DialogDescription className="text-gray-400 pt-4">
            Esta acción no se puede deshacer. Se eliminará el insumo{" "}
            <span className="text-white font-bold">{ingredientName}</span>.
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
              const res = await deleteIngredient(ingredientId);
              if (!res.success) {
                toast.error(res.error);
              } else {
                toast.success("Insumo eliminado correctamente");
                setOpen(false);
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
