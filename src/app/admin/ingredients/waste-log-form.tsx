"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logWaste } from "@/app/actions/ingredient-actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const wasteSchema = z.object({
  quantity: z.number().min(0.001, "La cantidad debe ser mayor a 0"),
  description: z.string().min(3, "El motivo debe tener al menos 3 caracteres"),
});

type WasteFormValues = z.infer<typeof wasteSchema>;

interface WasteLogFormProps {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  onSuccess: () => void;
}

export default function WasteLogForm({
  ingredientId,
  unit,
  onSuccess,
}: Omit<WasteLogFormProps, "ingredientName">) {
  const [loading, setLoading] = useState(false);

  const form = useForm<WasteFormValues>({
    resolver: zodResolver(wasteSchema),
    defaultValues: {
      quantity: 0,
      description: "",
    },
  });

  async function onSubmit(data: WasteFormValues) {
    setLoading(true);
    try {
      const res = await logWaste({
        ingredientId,
        ...data,
      });

      if (res.success) {
        toast.success("Merma registrada correctamente");
        onSuccess();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Error al registrar merma");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
            Cantidad a Descontar ({unit})
          </Label>
          <div className="relative group">
            <Input
              type="number"
              step="0.001"
              {...form.register("quantity", { valueAsNumber: true })}
              className="h-14 bg-white/3 border-white/10 rounded-2xl text-xl font-black px-4 focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all shadow-inner text-red-500"
            />
          </div>
          {form.formState.errors.quantity && (
            <p className="text-red-500 text-xs font-bold uppercase tracking-tighter">
              {form.formState.errors.quantity.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-zinc-400 font-bold uppercase tracking-tighter text-[10px]">
            Motivo de la Merma
          </Label>
          <Textarea
            {...form.register("description")}
            placeholder="Ej: Producto vencido, error en cocina, etc."
            className="min-h-[120px] bg-white/3 border-white/10 rounded-2xl text-lg font-medium p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-zinc-700 resize-none"
          />
          {form.formState.errors.description && (
            <p className="text-red-500 text-xs font-bold uppercase tracking-tighter">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-16 bg-red-600 text-white font-black text-xl italic uppercase tracking-tighter rounded-2xl shadow-[0_10px_30px_-10px_rgba(220,38,38,0.4)] hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        {loading ? <Loader2 className="animate-spin" /> : "REGISTRAR PÉRDIDA"}
      </Button>
    </form>
  );
}
