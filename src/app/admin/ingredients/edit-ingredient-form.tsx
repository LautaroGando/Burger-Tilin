"use client";

import { useForm, Resolver } from "react-hook-form";
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
    cost: number;
    stock: number;
    minStock: number;
  };
  onSuccess?: () => void;
}

export default function EditIngredientForm({ ingredient, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(
      ingredientSchema,
    ) as unknown as Resolver<IngredientFormValues>,
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Nombre
            </Label>
            <Input
              {...form.register("name")}
              className="h-14 bg-white/3 border-white/10 rounded-2xl text-lg font-medium px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-zinc-700"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Unidad
            </Label>
            <Input
              {...form.register("unit")}
              className="h-14 bg-white/3 border-white/10 rounded-2xl text-lg font-medium px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-zinc-700"
            />
            {form.formState.errors.unit && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.unit.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Costo Unit.
            </Label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                {...form.register("cost")}
                className="h-14 pl-10 bg-white/3 border-white/10 rounded-2xl text-xl font-black focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-inner"
              />
            </div>
            {form.formState.errors.cost && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.cost.message}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Stock Actual
            </Label>
            <Input
              type="number"
              step="0.01"
              {...form.register("stock")}
              className="h-14 bg-white/3 border-white/10 rounded-2xl text-xl font-black px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
            {form.formState.errors.stock && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.stock.message}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Stock Mín.
            </Label>
            <Input
              type="number"
              step="0.01"
              {...form.register("minStock")}
              className="h-14 bg-red-500/5 border-red-500/10 hover:border-red-500/20 rounded-2xl text-xl font-black px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all text-red-500"
            />
            {form.formState.errors.minStock && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.minStock.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-16 bg-primary text-black font-black text-xl italic uppercase tracking-tighter rounded-2xl shadow-[0_10px_30px_-10px_rgba(251,146,60,0.4)] hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : "GUARDAR CAMBIOS"}
        </Button>
      </DialogFooter>
    </form>
  );
}
