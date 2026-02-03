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
import { useRouter } from "next/navigation";
import {
  Loader2,
  Package,
  LayoutGrid,
  Tag,
  DollarSign,
  Smartphone,
  PlusCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateProductExtras } from "@/app/actions/product-actions";

type ProductFormValues = z.infer<typeof productSchema>;

export default function CreateProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
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
      window.location.reload();
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
          <select
            {...form.register("categoryId")}
            className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer hover:bg-white/10"
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
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/card">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-neutral-500 uppercase font-black tracking-widest group-hover/card:text-primary transition-colors">
                PedidosYa
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isPromoPY")}
                  className="h-3 w-3 cursor-pointer accent-primary"
                />
                {form.watch("isPromoPY") && (
                  <div className="flex items-center bg-primary/20 px-1.5 py-0.5 rounded border border-primary/30">
                    <input
                      type="number"
                      {...form.register("promoDiscountPY")}
                      className="w-8 bg-transparent text-[10px] text-primary font-black focus:outline-none text-center"
                      placeholder="%"
                    />
                    <span className="text-[8px] font-black text-primary">
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("pricePedidosYa")}
                  className="bg-black/40 border-white/5 h-10 pl-6 text-sm text-white font-black rounded-xl focus:border-primary/50 transition-all"
                  placeholder="0.00"
                />
              </div>
              {form.watch("isPromoPY") && (
                <p className="text-[10px] font-black text-primary text-right italic tracking-tighter">
                  NETO: $
                  {(
                    Number(form.watch("pricePedidosYa") || 0) *
                    (1 - Number(form.watch("promoDiscountPY") || 0) / 100)
                  ).toFixed(0)}
                </p>
              )}
            </div>
          </div>

          {/* Rappi */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/card">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-neutral-500 uppercase font-black tracking-widest group-hover/card:text-[#FF441F] transition-colors">
                Rappi
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isPromoRappi")}
                  className="h-3 w-3 cursor-pointer accent-[#FF441F]"
                />
                {form.watch("isPromoRappi") && (
                  <div className="flex items-center bg-[#FF441F]/20 px-1.5 py-0.5 rounded border border-[#FF441F]/30">
                    <input
                      type="number"
                      {...form.register("promoDiscountRappi")}
                      className="w-8 bg-transparent text-[10px] text-[#FF441F] font-black focus:outline-none text-center"
                      placeholder="%"
                    />
                    <span className="text-[8px] font-black text-[#FF441F]">
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("priceRappi")}
                  className="bg-black/40 border-white/5 h-10 pl-6 text-sm text-white font-black rounded-xl focus:border-[#FF441F]/50 transition-all"
                  placeholder="0.00"
                />
              </div>
              {form.watch("isPromoRappi") && (
                <p className="text-[10px] font-black text-[#FF441F] text-right italic tracking-tighter">
                  NETO: $
                  {(
                    Number(form.watch("priceRappi") || 0) *
                    (1 - Number(form.watch("promoDiscountRappi") || 0) / 100)
                  ).toFixed(0)}
                </p>
              )}
            </div>
          </div>

          {/* MercadoPago */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group/card">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-neutral-500 uppercase font-black tracking-widest group-hover/card:text-blue-400 transition-colors">
                MercadoPago
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isPromoMP")}
                  className="h-3 w-3 cursor-pointer accent-blue-400"
                />
                {form.watch("isPromoMP") && (
                  <div className="flex items-center bg-blue-400/20 px-1.5 py-0.5 rounded border border-blue-400/30">
                    <input
                      type="number"
                      {...form.register("promoDiscountMP")}
                      className="w-8 bg-transparent text-[10px] text-blue-400 font-black focus:outline-none text-center"
                      placeholder="%"
                    />
                    <span className="text-[8px] font-black text-blue-400">
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("priceMP")}
                  className="bg-black/40 border-white/5 h-10 pl-6 text-sm text-white font-black rounded-xl focus:border-blue-400/50 transition-all"
                  placeholder="0.00"
                />
              </div>
              {form.watch("isPromoMP") && (
                <p className="text-[10px] font-black text-blue-400 text-right italic tracking-tighter">
                  NETO: $
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
