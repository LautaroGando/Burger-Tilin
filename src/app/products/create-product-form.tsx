"use client";

import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProduct } from "@/app/actions/product-actions";
import { productSchema } from "@/lib/schemas";
import { getCategories } from "@/app/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type ProductFormValues = z.infer<typeof productSchema>;

export default function CreateProductForm() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(
      productSchema,
    ) as unknown as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      pricePedidosYa: 0,
      priceRappi: 0,
      priceMP: 0,
      categoryId: "",
      isPromo: false,
      promoDiscount: 0,
      isPromoPY: false,
      promoDiscountPY: 0,
      isPromoRappi: false,
      promoDiscountRappi: 0,
      isPromoMP: false,
      promoDiscountMP: 0,
    },
  });

  useEffect(() => {
    async function load() {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    load();
  }, []);

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    const result = await createProduct({ ...data, isActive: true });
    if (result.success) {
      toast.success("Producto creado con éxito");
      form.reset();
    } else {
      toast.error(result.error || "Error al crear producto");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">
            Nombre
          </Label>
          <Input
            {...form.register("name")}
            className="bg-white/5 border-white/10 text-white focus:border-primary/50 transition-colors"
            placeholder="Ej: Burger Doble"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">
            Categoría
          </Label>
          <select
            {...form.register("categoryId")}
            className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Sin Categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">
            Precio de Venta Directa
          </Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register("isPromo")}
                className="h-4 w-4 bg-zinc-900 border-white/10 rounded cursor-pointer"
              />
              <span className="text-[10px] font-bold text-primary uppercase">
                Promoción
              </span>
            </div>
            {form.watch("isPromo") && (
              <div className="flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                <span className="text-[10px] font-bold text-primary">%</span>
                <input
                  type="number"
                  {...form.register("promoDiscount")}
                  className="w-10 bg-transparent text-xs text-primary font-black focus:outline-none"
                  placeholder="0"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="number"
            step="0.01"
            {...form.register("price")}
            className="bg-white/5 border-white/10 text-white font-black text-xl h-12 flex-1"
            placeholder="0.00"
          />
          {form.watch("isPromo") && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-neutral-500 uppercase">
                Final
              </p>
              <p className="text-xl font-black text-primary">
                $
                {(
                  Number(form.watch("price") || 0) *
                  (1 - Number(form.watch("promoDiscount") || 0) / 100)
                ).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-4">
        <Label className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest block">
          Precios por Plataforma & Promociones
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* PedidosYa */}
          <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-neutral-400 uppercase font-black">
                PedidosYa
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isPromoPY")}
                  className="h-3 w-3 cursor-pointer"
                />
                {form.watch("isPromoPY") && (
                  <input
                    type="number"
                    {...form.register("promoDiscountPY")}
                    className="w-10 bg-primary/10 text-[10px] text-primary font-bold rounded focus:outline-none px-1"
                    placeholder="%"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                step="0.01"
                {...form.register("pricePedidosYa")}
                className="bg-black/20 border-white/5 h-8 text-sm text-white font-bold"
                placeholder="0.00"
              />
              {form.watch("isPromoPY") && (
                <p className="text-[10px] font-bold text-primary text-right italic">
                  → $
                  {(
                    Number(form.watch("pricePedidosYa") || 0) *
                    (1 - Number(form.watch("promoDiscountPY") || 0) / 100)
                  ).toFixed(0)}
                </p>
              )}
            </div>
          </div>

          {/* Rappi */}
          <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-neutral-400 uppercase font-black">
                Rappi
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isPromoRappi")}
                  className="h-3 w-3 cursor-pointer"
                />
                {form.watch("isPromoRappi") && (
                  <input
                    type="number"
                    {...form.register("promoDiscountRappi")}
                    className="w-10 bg-primary/10 text-[10px] text-primary font-bold rounded focus:outline-none px-1"
                    placeholder="%"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                step="0.01"
                {...form.register("priceRappi")}
                className="bg-black/20 border-white/5 h-8 text-sm text-white font-bold"
                placeholder="0.00"
              />
              {form.watch("isPromoRappi") && (
                <p className="text-[10px] font-bold text-primary text-right italic">
                  → $
                  {(
                    Number(form.watch("priceRappi") || 0) *
                    (1 - Number(form.watch("promoDiscountRappi") || 0) / 100)
                  ).toFixed(0)}
                </p>
              )}
            </div>
          </div>

          {/* MercadoPago */}
          <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-neutral-400 uppercase font-black">
                MercadoPago
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isPromoMP")}
                  className="h-3 w-3 cursor-pointer"
                />
                {form.watch("isPromoMP") && (
                  <input
                    type="number"
                    {...form.register("promoDiscountMP")}
                    className="w-10 bg-primary/10 text-[10px] text-primary font-bold rounded focus:outline-none px-1"
                    placeholder="%"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                step="0.01"
                {...form.register("priceMP")}
                className="bg-black/20 border-white/5 h-8 text-sm text-white font-bold"
                placeholder="0.00"
              />
              {form.watch("isPromoMP") && (
                <p className="text-[10px] font-bold text-primary text-right italic">
                  → $
                  {(
                    Number(form.watch("priceMP") || 0) *
                    (1 - Number(form.watch("promoDiscountMP") || 0) / 100)
                  ).toFixed(0)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          Descripción / Notas
        </Label>
        <Textarea
          {...form.register("description")}
          className="bg-zinc-900 border-white/5 text-white text-sm"
          rows={2}
          placeholder="Ej: Incluye papas, doble carne..."
        />
      </div>

      <DialogFooter className="pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary text-black font-black hover:bg-primary/90 w-full h-12 uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(252,169,13,0.3)] transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Crear Producto"}
        </Button>
      </DialogFooter>
    </form>
  );
}
