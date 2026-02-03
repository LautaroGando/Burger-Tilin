"use client";

import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { createExpense, updateExpense } from "@/app/actions/expense-actions";
import { toast } from "sonner";

// Schema matching the server action
const formSchema = z.object({
  description: z.string().min(2, "Descripción requerida"),
  amount: z.coerce.number().min(0.01, "Monto inválido"),
  category: z.string().min(1, "Categoría requerida"),
  isFixed: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  expense?: {
    id: string;
    description: string;
    amount: number;
    category: string;
    isFixed: boolean;
  };
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ExpenseForm({ expense, onSuccess, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      description: expense?.description || "",
      amount: expense ? Number(expense.amount) : 0,
      category: expense?.category || "Insumos",
      isFixed: expense?.isFixed || false,
    },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    let res;
    if (expense) {
      res = await updateExpense(expense.id, { ...data, date: new Date() });
    } else {
      res = await createExpense({ ...data, date: new Date() });
    }
    setLoading(false);

    if (res.success) {
      toast.success(expense ? "Gasto actualizado" : "Gasto registrado");
      setOpen(false);
      if (!expense) form.reset();
      if (onSuccess) onSuccess();

      // Forces a hard reload to ensure server data is updated in the UI
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      toast.error(res.error || "Error al guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">
            <Plus className="mr-2 h-4 w-4" /> Registrar Gasto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Descripción</label>
            <Input
              {...form.register("description")}
              placeholder="Ej: Compra de Servilletas"
              className="glass-input mt-1"
            />
            {form.formState.errors.description && (
              <p className="text-red-400 text-xs mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Monto ($)</label>
              <Input
                type="number"
                step="0.01"
                {...form.register("amount")}
                className="glass-input mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Categoría</label>
              <select
                {...form.register("category")}
                onChange={(e) => {
                  form.setValue("category", e.target.value);
                  // Auto-set isFixed based on category
                  const fixedCategories = ["Servicios", "Alquiler", "Sueldos"];
                  form.setValue(
                    "isFixed",
                    fixedCategories.includes(e.target.value),
                  );
                }}
                className="w-full h-10 rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass-input mt-1 bg-black/50"
              >
                <option className="bg-[#1a1a1a] text-white" value="Insumos">
                  Insumos (Variable)
                </option>
                <option className="bg-[#1a1a1a] text-white" value="Servicios">
                  Servicios (Fijo)
                </option>
                <option className="bg-[#1a1a1a] text-white" value="Alquiler">
                  Alquiler (Fijo)
                </option>
                <option className="bg-[#1a1a1a] text-white" value="Sueldos">
                  Sueldos (Fijo)
                </option>
                <option
                  className="bg-[#1a1a1a] text-white"
                  value="Mantenimiento"
                >
                  Mantenimiento
                </option>
                <option className="bg-[#1a1a1a] text-white" value="Marketing">
                  Marketing
                </option>
                <option className="bg-[#1a1a1a] text-white" value="Otros">
                  Otros
                </option>
              </select>
            </div>
          </div>

          <div className="flex items-start sm:items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isFixed"
              {...form.register("isFixed")}
              className="w-4 h-4 mt-0.5 sm:mt-0 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isFixed" className="text-xs sm:text-sm text-white">
              Gasto fijo mensual (Alquiler, Luz, Sueldos, etc)
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-black font-bold hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : expense ? (
              "Guardar Cambios"
            ) : (
              "Guardar Gasto"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
