"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  icon?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-lg p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
        <div
          className={`bg-linear-to-b ${
            isDestructive ? "from-red-500/10" : "from-primary/10"
          } to-transparent p-8 pb-4`}
        >
          <DialogHeader>
            <div className="flex items-center gap-4">
              {icon && (
                <div
                  className={`w-12 h-12 rounded-2xl ${
                    isDestructive
                      ? "bg-red-500/20 ring-red-500/30"
                      : "bg-primary/20 ring-primary/30"
                  } flex items-center justify-center ring-1`}
                >
                  {icon}
                </div>
              )}
              <div>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                  {title}
                </DialogTitle>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">
                  {isDestructive
                    ? "Esta acción no se puede deshacer"
                    : "Confirmación requerida"}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="p-8 pt-0 space-y-6">
          <div className="text-gray-400 text-sm font-medium leading-relaxed">
            {description}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl border-white/5 bg-white/5 h-12 font-bold uppercase tracking-wider hover:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              className={`flex-1 rounded-2xl h-12 font-black uppercase tracking-wider text-sm ${
                isDestructive
                  ? "bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.2)] text-white"
                  : "bg-primary text-black hover:bg-primary/90"
              }`}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
