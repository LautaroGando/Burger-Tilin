"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateIngredient } from "@/app/actions/ingredient-actions";
import { ingredientSchema } from "@/lib/schemas";
import { z } from "zod";

type IngredientFormValues = z.infer<typeof ingredientSchema>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  ingredient: {
    id: string;
    name: string;
    unit: string;
    cost: number | any; // Decimal vs number handling
    stock: number | any;
    minStock: number | any;
  };
  onSuccess?: () => void;
}

export default function EditIngredientForm({ ingredient, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema) as any,
    defaultValues: {
      name: ingredient.name,
      unit: ingredient.unit,
      cost: Number(ingredient.cost),
      stock: Number(ingredient.stock),
      minStock: Number(ingredient.minStock),
    },
  });

  async function onSubmit(data: IngredientFormValues) {
    setLoading(true);
    const res = await updateIngredient(ingredient.id, data);
    if (res.success) {
      toast.success("Insumo actualizado con éxito");
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || "Error al editar insumo");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-400">Nombre</Label>
          <Input
            {...form.register("name")}
            className="bg-white/5 border-white/10 text-white"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-xs">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400">Unidad</Label>
          <Input
            {...form.register("unit")}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
          <Label className="text-gray-400">Costo Unit.</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register("cost")}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400">Stock Actual</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register("stock")}
            className="bg-white/5 border-white/10 text-white font-bold text-primary"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400">Stock Mín.</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register("minStock")}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary text-black font-bold hover:bg-primary/90 w-full"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
        </Button>
      </DialogFooter>
    </form>
  );
}
