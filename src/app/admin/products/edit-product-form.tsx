"use client";

import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProduct } from "@/app/actions/product-actions";
import { productSchema } from "@/lib/schemas";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComboSlotEditor from "./ComboSlotEditor";
import {
  Loader2,
  Package,
  LayoutGrid,
  Tag,
  DollarSign,
  Percent,
  Eye,
  EyeOff,
  PlusCircle,
  Store,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type ProductFormValues = z.infer<typeof productSchema>;

import { Product } from "@/lib/types";

interface Props {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    priceApps?: number | null;
    categoryId: string | null;
    isPromo?: boolean;
    promoDiscount?: number | null;
    isPromoApps?: boolean;
    promoDiscountApps?: number | null;
    showPublic: boolean;
    allowedExtras?: {
      id: string;
      mainProductId: string;
      extraProductId: string;
      extraProduct?: {
        id: string;
        name: string;
        price: number | string;
      };
    }[];
  };
  allProducts?: Product[];
  categories: { id: string; name: string }[];
  onSuccess?: () => void;
  onUpdateExtras?: (
    mainId: string,
    extras: string[],
  ) => Promise<{ success: boolean; error?: string }>;
}

const FormSection = ({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="space-y-4 p-6 rounded-3xl bg-zinc-900/30 border border-white/5 relative overflow-hidden group"
  >
    <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all duration-500" />
    <div className="flex items-center gap-2 mb-2 relative">
      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
        {title}
      </h3>
    </div>
    <div className="relative space-y-4">{children}</div>
  </motion.div>
);

export default function EditProductForm({
  product,
  allProducts,
  categories,
  onSuccess,
  onUpdateExtras,
}: Props) {
  const [loading, setLoading] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(
      productSchema,
    ) as unknown as Resolver<ProductFormValues>,
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: Number(product.price),
      priceApps: product.priceApps ? Number(product.priceApps) : 0,
      categoryId: product.categoryId || "",
      isPromo: product.isPromo || false,
      promoDiscount: product.promoDiscount || 0,
      isPromoApps: product.isPromoApps || false,
      promoDiscountApps: product.promoDiscountApps || 0,
      showPublic: product.showPublic ?? true,
    },
  });

  const [selectedExtras, setSelectedExtras] = useState<string[]>(
    product.allowedExtras?.map((e) => e.extraProductId) || [],
  );

  const extrasCategory = categories.find((c) => c.name === "Extras");
  const availableExtras = allProducts?.filter(
    (p) => p.categoryId === extrasCategory?.id && p.id !== product.id,
  );

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    const result = await updateProduct(product.id, data);
    if (result.success) {
      if (onUpdateExtras) {
        await onUpdateExtras(product.id, selectedExtras);
      }
      toast.success("Producto actualizado correctamente");
      if (onSuccess) onSuccess();
      else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    } else {
      toast.error(result.error || "Error al actualizar el producto");
    }
    setLoading(false);
  }

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const watchPromo = form.watch("isPromo");
  const watchPrice = form.watch("price");
  const watchDiscount = form.watch("promoDiscount");
  const watchPromoApps = form.watch("isPromoApps");
  const watchPriceApps = form.watch("priceApps");
  const watchDiscountApps = form.watch("promoDiscountApps");

  return (
    <Tabs defaultValue="config" className="w-full">
      <TabsList className="bg-zinc-900 border border-white/5 p-1 rounded-2xl mb-6 w-full flex">
        <TabsTrigger
          value="config"
          className="flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-black transition-all"
        >
          Configuración
        </TabsTrigger>
        <TabsTrigger
          value="combo"
          className="flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-black transition-all"
        >
          Componentes (Combo)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="mt-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Basic Info Section */}
            <FormSection title="Información General" icon={Package}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter px-1">
                    Nombre del Producto
                  </Label>
                  <Input
                    {...form.register("name")}
                    className="bg-zinc-900/50 border-white/10 h-11 font-bold text-white focus:border-primary/50 rounded-xl"
                    placeholder="Ej: Burger Tilin"
                  />
                  {form.formState.errors.name && (
                    <p className="text-[10px] font-bold text-red-500 px-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter px-1">
                    Categoría
                  </Label>
                  <div className="relative">
                    <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
                    <select
                      {...form.register("categoryId")}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer hover:bg-white/10"
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

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter px-1">
                  Descripción
                </Label>
                <Textarea
                  {...form.register("description")}
                  className="bg-zinc-900/50 border-white/10 text-sm font-medium text-neutral-300 rounded-xl resize-none"
                  rows={2}
                  placeholder="Detalles sobre el producto, ingredientes, etc..."
                />
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
            </FormSection>

            {/* Extras Selection Section */}
            {product.categoryId !== extrasCategory?.id &&
              availableExtras &&
              availableExtras.length > 0 && (
                <FormSection
                  title="Extras Disponibles"
                  icon={PlusCircle}
                  delay={0.05}
                >
                  <p className="text-[9px] font-bold text-neutral-500 uppercase px-1 -mt-2">
                    Selecciona qué adicionales se pueden agregar a este producto en
                    el menú público.
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
                </FormSection>
              )}

            {/* Pricing Section (Local vs Apps) */}
            <FormSection title="Precios & Ofertas" icon={Tag} delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Precio Local */}
                <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5" /> Local
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...form.register("isPromo")}
                        id="isPromo-edit"
                        className="rounded border-white/10 bg-black/50 accent-primary cursor-pointer h-3.5 w-3.5"
                      />
                      <label htmlFor="isPromo-edit" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest cursor-pointer">
                        En oferta
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register("price")}
                        className="bg-zinc-900/50 border-white/10 text-white focus:border-primary/50 transition-colors pl-9 text-lg font-black"
                        placeholder="0.00"
                      />
                      {watchPromo && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-right">
                          <p className="text-[8px] font-bold text-neutral-500 uppercase">Final</p>
                          <p className="text-xs font-black text-primary">
                            ${(Number(watchPrice || 0) * (1 - Number(watchDiscount || 0) / 100)).toFixed(0)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {watchPromo && (
                      <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          {...form.register("promoDiscount")}
                          className="bg-primary/10 border-primary/20 text-primary focus:border-primary transition-colors pl-9 font-bold h-10"
                          placeholder="20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/50 uppercase">
                          Descuento
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Precio Apps */}
                <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <Label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-blue-400" /> Apps (Peya, Rappi)
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...form.register("isPromoApps")}
                        id="isPromoApps-edit"
                        className="rounded border-white/10 bg-black/50 accent-blue-500 cursor-pointer h-3.5 w-3.5"
                      />
                      <label htmlFor="isPromoApps-edit" className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest cursor-pointer">
                        En oferta
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register("priceApps")}
                        className="bg-zinc-900/50 border-white/10 text-white focus:border-blue-500/50 transition-colors pl-9 text-lg font-black"
                        placeholder="0.00"
                      />
                      {watchPromoApps && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-right">
                          <p className="text-[8px] font-bold text-neutral-500 uppercase">Final</p>
                          <p className="text-xs font-black text-blue-400">
                            ${(Number(watchPriceApps || 0) * (1 - Number(watchDiscountApps || 0) / 100)).toFixed(0)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {watchPromoApps && (
                      <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          {...form.register("promoDiscountApps")}
                          className="bg-blue-500/10 border-blue-500/20 text-blue-400 focus:border-blue-500 transition-colors pl-9 font-bold h-10"
                          placeholder="20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400/50 uppercase">
                          Descuento
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </FormSection>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5">
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-black font-black hover:bg-primary/90 w-full h-14 uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(252,169,13,0.2)] rounded-2xl active:scale-[0.98] transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Guardando Cambios...</span>
                </div>
              ) : (
                "Actualizar Producto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </TabsContent>

      <TabsContent value="combo" className="mt-0">
        <div className="p-1 min-h-[400px]">
          <ComboSlotEditor
            comboId={product.id}
            allProducts={allProducts || []}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
