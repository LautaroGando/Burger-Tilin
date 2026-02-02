"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createIngredient } from "@/app/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const ingredientSchema = z.object({
  name: z.string().min(2, "Requerido"),
  unit: z.string().min(1, "Requerido (kg, l, un)"),
  cost: z.coerce.number().min(0),
  stock: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof ingredientSchema>;

export default function CreateIngredientForm() {
  const [loading, setLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      unit: "unidad",
      cost: 0,
      stock: 0,
      minStock: 5,
    },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    const res = await createIngredient(data);
    if (res.success) {
      toast.success("Insumo creado correctamente");
      form.reset();
      // close dialog idealmente
    } else {
      toast.error(res.error || "Error al crear insumo");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input {...form.register("name")} placeholder="Pan de Papa" />
          {form.formState.errors.name && (
            <p className="text-red-500 text-xs">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Unidad</Label>
          <Input {...form.register("unit")} placeholder="unidad, kg..." />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-2">
          <Label>Costo Unit.</Label>
          <Input type="number" step="0.01" {...form.register("cost")} />
        </div>
        <div className="space-y-2">
          <Label>Stock Actual</Label>
          <Input type="number" step="0.01" {...form.register("stock")} />
        </div>
        <div className="space-y-2">
          <Label>Stock Mín.</Label>
          <Input type="number" step="0.01" {...form.register("minStock")} />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Crear Insumo"}
        </Button>
      </DialogFooter>
    </form>
  );
}
