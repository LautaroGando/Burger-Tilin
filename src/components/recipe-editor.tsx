"use client";

import { useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addIngredientToRecipe,
  removeIngredientFromRecipe,
} from "@/app/actions/recipe-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Calculator,
  ChefHat,
  Info,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = z.object({
  ingredientId: z.string().min(1, "Selecciona un insumo"),
  quantity: z.coerce.number().min(0.0001, "Cantidad requerida"),
});

type FormValues = z.infer<typeof schema>;

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

interface RecipeItem {
  id: string;
  ingredient: Ingredient;
  quantity: number;
}

interface RecipeEditorProps {
  productId: string;
  existingRecipe: RecipeItem[];
  availableIngredients: Ingredient[];
}

export default function RecipeEditor({
  productId,
  existingRecipe,
  availableIngredients,
}: RecipeEditorProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      ingredientId: "",
      quantity: 0,
    },
  });

  const totalCost = existingRecipe.reduce((sum, item) => {
    return sum + Number(item.ingredient.cost) * Number(item.quantity);
  }, 0);

  async function onSubmit(data: FormValues) {
    setLoading(true);
    const res = await addIngredientToRecipe({
      productId,
      ingredientId: data.ingredientId,
      quantity: data.quantity,
    });

    if (res.success) {
      form.reset();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await removeIngredientFromRecipe(id);
  }

  return (
    <div className="space-y-8 py-2">
      {/* Total Cost Header */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-zinc-900/50 border border-white/5 shadow-2xl group">
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-500" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">
                Costo de Producción
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">$</span>
              <span className="text-4xl font-black text-white">
                {totalCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Composition List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
            Composición Actual
          </h4>
          <span className="text-[10px] font-bold text-neutral-600 bg-white/5 px-2 py-0.5 rounded-full">
            {existingRecipe.length} Insumos
          </span>
        </div>

        <div className="min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {existingRecipe.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4 rounded-3xl border border-dashed border-white/5 bg-white/[0.01]"
              >
                <div className="p-3 bg-white/5 rounded-2xl mb-3">
                  <Info className="h-5 w-5 text-neutral-600" />
                </div>
                <p className="text-sm font-bold text-neutral-500 text-center">
                  No hay ingredientes cargados todavía
                </p>
                <p className="text-[10px] text-neutral-600 text-center mt-1 uppercase tracking-wider">
                  Empieza por agregar los insumos debajo
                </p>
              </motion.div>
            ) : (
              existingRecipe.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-primary/20 hover:bg-zinc-900/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <span className="text-xs font-black text-neutral-400 group-hover:text-primary">
                        {item.ingredient.unit}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white group-hover:text-primary transition-colors">
                        {item.ingredient.name}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">
                        {Number(item.quantity)} x $
                        {Number(item.ingredient.cost).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                        Subtotal
                      </p>
                      <p className="text-sm font-black text-white">
                        $
                        {(
                          Number(item.ingredient.cost) * Number(item.quantity)
                        ).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Form */}
      <div className="pt-6 border-t border-white/5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <PlusCircle className="h-3 w-3" /> Agregar Insumo
            </h4>
          </div>

          <div className="grid grid-cols-[1fr,100px,auto] gap-3 items-start">
            <div className="space-y-2">
              <select
                {...form.register("ingredientId")}
                className="w-full h-12 bg-zinc-900/50 border border-white/10 rounded-2xl px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none custom-select-arrow"
              >
                <option value="" className="bg-zinc-950">
                  Insumo...
                </option>
                {availableIngredients.map((ing) => (
                  <option key={ing.id} value={ing.id} className="bg-zinc-950">
                    {ing.name} ({ing.unit})
                  </option>
                ))}
              </select>
              {form.formState.errors.ingredientId && (
                <p className="text-[10px] font-bold text-red-500 px-1">
                  {form.formState.errors.ingredientId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="number"
                step="0.0001"
                placeholder="Cant."
                className="h-12 bg-zinc-900/50 border border-white/10 rounded-2xl px-4 text-sm font-bold text-white focus:outline-none"
                {...form.register("quantity")}
              />
              {form.formState.errors.quantity && (
                <p className="text-[10px] font-bold text-red-500 px-1">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/80 text-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center shrink-0"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <Plus className="h-5 w-5 font-black" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
