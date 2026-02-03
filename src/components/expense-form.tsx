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
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-lg p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="bg-linear-to-b from-red-500/10 to-transparent p-8 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center ring-1 ring-red-500/30">
                <Plus className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                  {expense ? "Editar" : "Nuevo"}{" "}
                  <span className="text-red-500">Gasto</span>
                </DialogTitle>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">
                  Registra una salida de dinero
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-8 pt-0 space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter px-1">
                Descripción
              </label>
              <Input
                {...form.register("description")}
                placeholder="Ej: Compra de Servilletas"
                className="bg-white/5 border-white/10 h-12 rounded-2xl focus:border-red-500/50 transition-all font-medium text-white"
              />
              {form.formState.errors.description && (
                <p className="text-red-400 text-[10px] font-bold px-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter px-1">
                  Monto ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("amount")}
                    className="bg-white/5 border-white/10 h-12 pl-6 rounded-2xl focus:border-red-500/50 transition-all font-black text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter px-1">
                  Categoría
                </label>
                <select
                  {...form.register("category")}
                  onChange={(e) => {
                    form.setValue("category", e.target.value);
                    const fixedCategories = [
                      "Servicios",
                      "Alquiler",
                      "Sueldos",
                    ];
                    form.setValue(
                      "isFixed",
                      fixedCategories.includes(e.target.value),
                    );
                  }}
                  className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all cursor-pointer hover:bg-white/10 appearance-none font-bold"
                >
                  <option className="bg-zinc-950 text-white" value="Insumos">
                    Insumos (Variable)
                  </option>
                  <option className="bg-zinc-950 text-white" value="Servicios">
                    Servicios (Fijo)
                  </option>
                  <option className="bg-zinc-950 text-white" value="Alquiler">
                    Alquiler (Fijo)
                  </option>
                  <option className="bg-zinc-950 text-white" value="Sueldos">
                    Sueldos (Fijo)
                  </option>
                  <option
                    className="bg-zinc-950 text-white"
                    value="Mantenimiento"
                  >
                    Mantenimiento
                  </option>
                  <option className="bg-zinc-950 text-white" value="Marketing">
                    Marketing
                  </option>
                  <option className="bg-zinc-950 text-white" value="Otros">
                    Otros
                  </option>
                </select>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer"
              onClick={() => form.setValue("isFixed", !form.watch("isFixed"))}
            >
              <input
                type="checkbox"
                id="isFixed"
                {...form.register("isFixed")}
                className="w-4 h-4 rounded border-white/10 text-red-500 focus:ring-red-500 accent-red-500"
              />
              <label
                htmlFor="isFixed"
                className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight group-hover:text-white transition-colors cursor-pointer"
              >
                Gasto fijo mensual (Alquiler, Luz, Sueldos, etc)
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-red-600 text-white font-black hover:bg-red-700 h-14 uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(220,38,38,0.2)] rounded-2xl active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : expense ? (
              "Actualizar Gasto"
            ) : (
              "Registrar Gasto"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
