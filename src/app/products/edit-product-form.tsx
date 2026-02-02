"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProduct } from "@/app/actions/product-actions";
import { productSchema } from "@/lib/schemas";
import { z } from "zod";

type ProductFormValues = z.infer<typeof productSchema>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number | any;
    categoryId: string | null;
  };
  onSuccess?: () => void;
}

export default function EditProductForm({ product, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: Number(product.price),
      categoryId: product.categoryId || "",
    },
  });

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    const result = await updateProduct(product.id, data);
    if (result.success) {
      toast.success("Producto actualizado");
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || "Error al actualizar el producto");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-400">Nombre</Label>
        <Input
          {...form.register("name")}
          className="bg-white/5 border-white/10 text-white"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400">Precio</Label>
        <Input
          type="number"
          step="0.01"
          {...form.register("price")}
          className="bg-white/5 border-white/10 text-white font-bold"
        />
        {form.formState.errors.price && (
          <p className="text-sm text-red-500">
            {form.formState.errors.price.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400">Descripción</Label>
        <Textarea
          {...form.register("description")}
          className="bg-white/5 border-white/10 text-white"
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary text-black font-bold hover:bg-primary/90 w-full"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
        </Button>
      </DialogFooter>
    </form>
  );
}
