"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logWaste } from "@/app/actions/operations-actions";
import { Loader2, Save } from "lucide-react";

type IngredientProp = {
  id: string;
  name: string;
  unit: string;
  cost: unknown;
};

export default function WasteForm({
  ingredients,
}: {
  ingredients: IngredientProp[];
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(""); // Cost
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description && !selectedIngredient) return;
    setLoading(true);

    // Estimate cost if ingredient selected
    let finalCost = Number(amount);
    if (selectedIngredient) {
      const ing = ingredients.find((i) => i.id === selectedIngredient);
      if (ing && quantity) {
        // If user didn't override cost, calculate it
        if (!amount) {
          finalCost = Number(ing.cost) * Number(quantity);
        }
      }
    }

    await logWaste({
      description: selectedIngredient
        ? `Desperdicio: ${ingredients.find((i) => i.id === selectedIngredient)?.name}`
        : description,
      cost: finalCost || 0,
      ingredientId: selectedIngredient || undefined,
      quantity: quantity ? Number(quantity) : undefined,
    });

    // Reset
    setDescription("");
    setAmount("");
    setSelectedIngredient("");
    setQuantity("");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs text-gray-400 mb-1 block">
            Insumo (Opcional)
          </label>
          <select
            className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-white text-sm"
            value={selectedIngredient}
            onChange={(e) => setSelectedIngredient(e.target.value)}
          >
            <option value="">-- Seleccionar Insumo --</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name} ({ing.unit})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500 mt-1">
            Si seleccionas un insumo, se descontará del stock.
          </p>
        </div>

        {selectedIngredient ? (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Cantidad (
              {ingredients.find((i) => i.id === selectedIngredient)?.unit})
            </label>
            <Input
              placeholder="Ej: 0.5"
              type="number"
              className="bg-black/20"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        ) : (
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">
              Descripción del Error
            </label>
            <Input
              placeholder="Ej: Se quemaron 3 hamburguesas"
              className="bg-black/20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            Costo Estimado ($)
          </label>
          <Input
            placeholder={
              selectedIngredient ? "Auto-calculado si vacío" : "Monto perdido"
            }
            type="number"
            className="bg-black/20"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || (!description && !selectedIngredient)}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Registrar
      </Button>
    </div>
  );
}
