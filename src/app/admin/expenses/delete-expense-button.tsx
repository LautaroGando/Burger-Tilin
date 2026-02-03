"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteExpense } from "@/app/actions/expense-actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  expenseId: string;
  description: string;
}

export function DeleteExpenseButton({ expenseId, description }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteExpense(expenseId);
    if (res.success) {
      toast.success("Gasto eliminado correctamente");
      setOpen(false);

      // Force reload to update stats
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      toast.error(res.error || "Error al eliminar");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-md p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="bg-linear-to-b from-red-500/10 to-transparent p-8 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center ring-1 ring-red-500/30">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  Eliminar <span className="text-red-500">Gasto</span>
                </DialogTitle>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Esta acción es irreversible
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 pt-2 space-y-6">
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-200">¿Estás seguro?</p>
              <p className="text-[11px] text-red-200/60 leading-relaxed">
                Vas a eliminar el gasto{" "}
                <strong className="text-white">
                  &quot;{description}&quot;
                </strong>
                . Esto afectará los reportes financieros históricos.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(220,38,38,0.2)]"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              CONFIRMAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
