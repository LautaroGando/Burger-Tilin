"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProduct } from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

// Re-defining schema here for client-side validation sync or import from types
const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  categoryId: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function CreateProductForm() {
  const [loading, setLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
    },
  });

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    const result = await createProduct({ ...data, isActive: true });
    if (result.success) {
      toast.success("Producto creado con éxito");
      // Close dialog logic would be here if controlled, for now just reset
      form.reset();
      // Ideally we close the dialog via context or props
    } else {
      toast.error(result.error || "Error al crear producto");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Ej: Burger Doble"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Precio</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          {...form.register("price")}
        />
        {form.formState.errors.price && (
          <p className="text-sm text-red-500">
            {form.formState.errors.price.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Ingredientes..."
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Producto"}
        </Button>
      </DialogFooter>
    </form>
  );
}
