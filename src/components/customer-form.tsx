"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { createCustomer } from "@/app/actions/customer-actions";

const formSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export function CustomerForm({
  asDialog = false,
  children,
}: {
  asDialog?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const res = await createCustomer(data);
    setSubmitting(false);

    if (res.success) {
      reset();
      setOpen(false);
    } else {
      alert("Error: " + res.error);
    }
  };

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Nombre *</label>
        <Input {...register("name")} placeholder="Ej. Juan Pérez" />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Teléfono</label>
          <Input {...register("phone")} placeholder="+54 9 11..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <Input {...register("email")} placeholder="juan@mail.com" />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-black font-bold hover:bg-primary/90 mt-4"
      >
        {submitting ? (
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Registrar Cliente
      </Button>
    </form>
  );

  if (asDialog) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || <Button>Nuevo Cliente</Button>}
        </DialogTrigger>
        <DialogContent className="bg-[#1a1a1a] text-white border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Registra un cliente fiel para trackear sus compras.
            </DialogDescription>
          </DialogHeader>
          {FormContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4">
        Registrar Nuevo Cliente
      </h3>
      {FormContent}
    </div>
  );
}
