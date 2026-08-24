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
import { useEffect, useState } from "react";
import {
  Loader2,
  Package,
  LayoutGrid,
  PlusCircle,
  Eye,
  EyeOff,
  Percent,
  Store,
  Smartphone,
  DollarSign,
} from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateProductExtras } from "@/app/actions/product-actions";

type ProductFormValues = z.infer<typeof productSchema>;

import { Product } from "@/lib/types";

export default function CreateProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(
      productSchema,
    ) as unknown as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      priceApps: 0,
      categoryId: "",
      isActive: true,
      isPromo: false,
      promoDiscount: 0,
      isPromoApps: false,
      promoDiscountApps: 0,
      showPublic: true,
    },
  });

  useEffect(() => {
    async function load() {
      const catRes = await getCategories();
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }

      const { getProducts } = await import("@/app/actions/product-actions");
      const prodRes = await getProducts();
      if (prodRes.success && prodRes.data) {
        setAllProducts(prodRes.data);
      }
    }
    load();
  }, []);

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    const result = await createProduct({ ...data, isActive: true });
    if (result.success && result.id) {
      if (selectedExtras.length > 0) {
        await updateProductExtras(result.id, selectedExtras);
      }
      toast.success("Producto creado con éxito");
      form.reset();
      setSelectedExtras([]);
      if (onSuccess) onSuccess();
      else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    } else {
      toast.error(result.error || "Error al crear producto");
    }
    setLoading(false);
  }

  const extrasCategory = categories.find((c) => c.name === "Extras");
  const availableExtras = allProducts.filter(
    (p) => p.categoryId === extrasCategory?.id,
  );

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

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
          <div className="relative">
            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
            <select
              {...form.register("categoryId")}
              className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer hover:bg-white/10"
            >
              <option value="" className="bg-zinc-950">
                Sin Categoría
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-zinc-950">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Precios (Local y Apps) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Precio Local */}
        <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" /> Precio Local
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register("isPromo")}
                className="rounded border-white/20 bg-black/50 accent-primary cursor-pointer h-3.5 w-3.5"
              />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                En oferta
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              <Input
                type="number"
                step="0.01"
                {...form.register("price")}
                className="bg-zinc-950 border-white/10 text-white focus:border-primary/50 transition-colors pl-9 text-lg font-bold"
                placeholder="0.00"
              />
            </div>
            
            {form.watch("isPromo") && (
              <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                <input
                  type="number"
                  {...form.register("promoDiscount")}
                  className="w-10 bg-transparent text-xs text-primary font-black focus:outline-none"
                  placeholder="0"
                  min={1}
                  max={99}
                />
                <Percent className="h-3 w-3 text-primary" />
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
            <div className="text-right shrink-0">
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

      {/* Public visibility */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${form.watch("showPublic") ? "bg-primary/20 text-primary" : "bg-zinc-800 text-neutral-500"}`}
          >
            {form.watch("showPublic") ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-white">
              Visibilidad Pública (Menú)
            </p>
            <p className="text-[9px] font-bold text-neutral-500 uppercase">
              {form.watch("showPublic")
                ? "Visible en la app pública"
                : "Solo para venta interna"}
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          {...form.register("showPublic")}
          className="h-5 w-5 rounded-md border-white/10 bg-zinc-900 accent-primary cursor-pointer"
        />
      </div>

      {/* Extras Selection */}
      {form.watch("categoryId") !== extrasCategory?.id &&
        availableExtras.length > 0 && (
          <div className="p-6 rounded-3xl bg-zinc-900/30 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-2 relative">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <PlusCircle className="h-4 w-4" />
              </div>
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                Extras Disponibles
              </h3>
            </div>
            <p className="text-[9px] font-bold text-neutral-500 uppercase px-1 -mt-2">
              Selecciona qué adicionales se pueden agregar a este producto en el
              menú público.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableExtras.map((extra) => (
                <div
                  key={extra.id}
                  onClick={() => toggleExtra(extra.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedExtras.includes(extra.id)
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-black/20 border-white/5 text-neutral-400 hover:border-white/10"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">
                    {extra.name}
                  </span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      selectedExtras.includes(extra.id)
                        ? "bg-primary border-primary text-black"
                        : "border-white/10"
                    }`}
                  >
                    {selectedExtras.includes(extra.id) && (
                      <div className="h-2 w-2 bg-black rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
