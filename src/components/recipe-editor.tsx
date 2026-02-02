"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addIngredientToRecipe,
  removeIngredientFromRecipe,
} from "@/app/actions/recipe-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Calculator } from "lucide-react";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      ingredientId: "",
      quantity: 0,
    },
  });

  // Calculate total cost
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
    if (!confirm("¿Quitar insumo?")) return;
    await removeIngredientFromRecipe(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Costo Total Estimado</p>
            <p className="text-2xl font-black text-white">
              ${totalCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Composición
        </h4>

        {existingRecipe.length === 0 ? (
          <p className="text-center text-gray-500 py-4 text-sm italic">
            Este producto no tiene receta definida.
          </p>
        ) : (
          <div className="space-y-2">
            {existingRecipe.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div>
                  <p className="text-white font-medium">
                    {item.ingredient.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Number(item.quantity)} {item.ingredient.unit} x $
                    {Number(item.ingredient.cost).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-mono text-primary font-bold">
                    $
                    {(
                      Number(item.ingredient.cost) * Number(item.quantity)
                    ).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 pt-4 border-t border-white/10"
      >
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Agregar Insumo
        </h4>
        <div className="grid grid-cols-[2fr,1fr,auto] gap-2 items-end">
          <div className="space-y-2">
            <select
              {...form.register("ingredientId")}
              className="flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
            >
              <option value="" className="bg-gray-900">
                Seleccionar...
              </option>
              {availableIngredients.map((ing) => (
                <option key={ing.id} value={ing.id} className="bg-gray-900">
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              step="0.0001"
              placeholder="Cant."
              {...form.register("quantity")}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {form.formState.errors.ingredientId && (
          <p className="text-xs text-red-500">
            {form.formState.errors.ingredientId.message}
          </p>
        )}
        {form.formState.errors.quantity && (
          <p className="text-xs text-red-500">
            {form.formState.errors.quantity.message}
          </p>
        )}
      </form>
    </div>
  );
}
