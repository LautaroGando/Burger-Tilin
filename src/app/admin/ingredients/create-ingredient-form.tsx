"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createIngredient } from "@/app/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ingredientSchema = z.object({
  name: z.string().min(2, "Requerido"),
  unit: z.string().min(1, "Requerido (kg, l, un)"),
  cost: z.coerce.number().min(0),
  stock: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof ingredientSchema>;

export default function CreateIngredientForm() {
  const router = useRouter();
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
      window.location.reload();
      // closes dialog by unmounting ideally if parent re-renders, but reload handles it.
    } else {
      toast.error(res.error || "Error al crear insumo");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Nombre del Insumo
            </Label>
            <Input
              {...form.register("name")}
              placeholder="Ej: Carne 100% Vacuna"
              className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-lg font-medium px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-zinc-700"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Unidad (kg, u, l)
            </Label>
            <Input
              {...form.register("unit")}
              placeholder="Ej: kg"
              className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-lg font-medium px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-zinc-700"
            />
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
                className="h-14 pl-10 bg-white/[0.03] border-white/10 rounded-2xl text-xl font-black focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Stock Actual
            </Label>
            <Input
              type="number"
              step="0.01"
              {...form.register("stock")}
              className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-xl font-black px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
              Alerta Mín.
            </Label>
            <Input
              type="number"
              step="0.01"
              {...form.register("minStock")}
              className="h-14 bg-red-500/5 border-red-500/10 hover:border-red-500/20 rounded-2xl text-xl font-black px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all text-red-500"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-16 bg-primary text-black font-black text-xl italic uppercase tracking-tighter rounded-2xl shadow-[0_10px_30px_-10px_rgba(251,146,60,0.4)] hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        {loading ? "GUARDANDO..." : "CREAR INSUMO"}
      </Button>
    </form>
  );
}
