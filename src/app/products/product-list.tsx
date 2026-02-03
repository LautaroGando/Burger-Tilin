"use client";

import { useState } from "react";
import { ChefHat, Pencil, Tag, ChevronDown, Store } from "lucide-react";
import { Product, Ingredient, RecipeItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteProductButton } from "./delete-button";
import RecipeEditor from "@/components/recipe-editor";
import EditProductForm from "./edit-product-form";
import { motion, AnimatePresence } from "framer-motion";

interface ProductListProps {
  products: Product[];
  categories: { id: string; name: string }[];
  ingredients: Ingredient[];
}

export default function ProductList({
  products,
  categories,
  ingredients,
}: ProductListProps) {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    all: true,
  });

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const calculateMargin = (price: number, cost: number) => {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const getPlatformRevenue = (price: number) => price * 0.65; // 35% commission

  const categoriesWithUncategorized = [
    { id: "un-categorized", name: "Sin Categoría" },
    ...(categories || []),
  ];

  return (
    <div className="space-y-12">
      {categoriesWithUncategorized.map((category) => {
        const filteredProducts = products?.filter((p: Product) =>
          category.id === "un-categorized"
            ? !p.categoryId
            : p.categoryId === category.id,
        );

        if (!filteredProducts || filteredProducts.length === 0) return null;

        const isExpanded = expandedCategories[category.id] !== false; // Default to true

        return (
          <div key={category.id} className="space-y-6">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-4 group"
            >
              <div className="flex items-center gap-2 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isExpanded ? "up" : "down"}
                    initial={{ rotate: -90 }}
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-primary" />
                  </motion.div>
                </AnimatePresence>
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
                  {category.name}
                </h2>
                <div className="h-px flex-1 bg-white/5 group-hover:bg-white/10 transition-colors" />
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "Producto" : "Productos"}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-visible" // Changed to overflow-visible to prevent hover clipping
                >
                  <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 pb-8 pt-2">
                    {filteredProducts.map((product: Product) => {
                      // Cost and price calculation with discounts
                      const totalCost =
                        product.recipe?.reduce(
                          (sum: number, item: RecipeItem) => {
                            return (
                              sum +
                              Number(item.ingredient.cost) *
                                Number(item.quantity)
                            );
                          },
                          0,
                        ) || 0;

                      const currentPriceDirect = product.isPromo
                        ? Number(product.price) *
                          (1 - Number(product.promoDiscount || 0) / 100)
                        : Number(product.price);

                      const marginDirect = calculateMargin(
                        currentPriceDirect,
                        totalCost,
                      );

                      // Detailed app analysis
                      const platformData = [
                        {
                          id: "PY",
                          label: "PedidosYa",
                          price: product.pricePedidosYa,
                          isPromo: product.isPromoPY,
                          discount: product.promoDiscountPY,
                        },
                        {
                          id: "Rappi",
                          label: "Rappi",
                          price: product.priceRappi,
                          isPromo: product.isPromoRappi,
                          discount: product.promoDiscountRappi,
                        },
                        {
                          id: "MP",
                          label: "MercadoPago",
                          price: product.priceMP,
                          isPromo: product.isPromoMP,
                          discount: product.promoDiscountMP,
                        },
                      ]
                        .filter((p) => p.price && Number(p.price) > 0)
                        .map((p) => {
                          const base = Number(p.price);
                          const final = p.isPromo
                            ? base * (1 - Number(p.discount || 0) / 100)
                            : base;
                          const netRevenue = getPlatformRevenue(final);
                          // Margin calculated over what the customer pays (final price)
                          // Formula: ((FinalPrice * 0.65) - Cost) / FinalPrice
                          const margin =
                            final > 0
                              ? ((netRevenue - totalCost) / final) * 100
                              : 0;
                          return { ...p, base, final, margin };
                        });

                      const isAnyPromo =
                        product.isPromo ||
                        product.isPromoPY ||
                        product.isPromoRappi ||
                        product.isPromoMP;

                      return (
                        <div key={product.id} className="h-full">
                          <Card className="glass-card h-full group flex flex-col border-white/5 bg-zinc-900/20 hover:bg-zinc-900/50 transition-all duration-500 relative overflow-hidden rounded-3xl hover:-translate-y-0.5">
                            {/* Decorative background glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none" />

                            <CardHeader className="p-5 pb-2 relative z-10">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg font-black text-white group-hover:text-primary transition-colors leading-tight truncate">
                                      {product.name}
                                    </CardTitle>
                                    {isAnyPromo && (
                                      <span className="shrink-0 bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/20">
                                        Promo
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-500 line-clamp-1 italic font-medium">
                                    {product.description || "Sin descripción"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 ml-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative z-50">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 shrink-0 pointer-events-auto"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">
                                          Editar Producto
                                        </DialogTitle>
                                      </DialogHeader>
                                      <EditProductForm
                                        product={product}
                                        categories={categories}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                  <div className="pointer-events-auto">
                                    <DeleteProductButton
                                      productId={product.id}
                                      productName={product.name}
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="p-5 pt-2 flex-1 flex flex-col gap-4 relative z-10">
                              {/* Direct Sale Section */}
                              <div className="bg-white/3 rounded-2xl p-3 border border-white/5 relative group/section">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <Store className="h-3 w-3 text-primary" />
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                      Local / Directo
                                    </span>
                                  </div>
                                  <div
                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${marginDirect > 40 ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}
                                  >
                                    {marginDirect.toFixed(0)}% MG
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-white">
                                    $
                                    {Math.round(
                                      currentPriceDirect,
                                    ).toLocaleString()}
                                  </span>
                                  {product.isPromo && (
                                    <span className="text-xs text-neutral-600 line-through font-bold">
                                      ${Number(product.price).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Platform Grid */}
                              <div className="grid grid-cols-1 gap-2">
                                {platformData.length > 0 ? (
                                  platformData.map((app) => (
                                    <div
                                      key={app.id}
                                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/2 hover:border-white/5 transition-colors"
                                    >
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter truncate">
                                            {app.label}
                                          </span>
                                          {app.isPromo && (
                                            <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                              {app.discount}% OFF
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`text-sm font-black ${app.isPromo ? "text-primary" : "text-neutral-300"}`}
                                          >
                                            $
                                            {Math.round(
                                              app.final,
                                            ).toLocaleString()}
                                          </span>
                                          {app.isPromo && (
                                            <span className="text-[8px] text-neutral-700 line-through">
                                              ${Number(app.base).toFixed(0)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[8px] font-black text-neutral-600 uppercase">
                                          Margen App
                                        </p>
                                        <span
                                          className={`text-xs font-black ${app.margin > 30 ? "text-green-500" : app.margin > 15 ? "text-yellow-500" : "text-red-500"}`}
                                        >
                                          {app.margin.toFixed(0)}%
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 rounded-xl border border-dashed border-white/5 text-center">
                                    <p className="text-[9px] font-bold text-neutral-600 uppercase">
                                      Sin precios de plataforma
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-auto space-y-3 pt-2">
                                <div className="flex items-center justify-between px-1">
                                  <div className="flex items-center gap-2">
                                    <ChefHat className="h-3.5 w-3.5 text-neutral-600" />
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                      Costo:{" "}
                                      <span className="text-neutral-300">
                                        ${totalCost.toFixed(2)}
                                      </span>
                                    </span>
                                  </div>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <button className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer pointer-events-auto">
                                        Editar Receta{" "}
                                        <ChevronDown className="h-3 w-3" />
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-w-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                                      <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">
                                          Receta Maestra
                                        </DialogTitle>
                                        <DialogDescription>
                                          Configura los ingredientes para{" "}
                                          {product.name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <RecipeEditor
                                        productId={product.id}
                                        existingRecipe={product.recipe || []}
                                        availableIngredients={ingredients}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <div className="h-0.5 w-full bg-white/2 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full ${marginDirect > 40 ? "bg-green-500" : "bg-yellow-500"}`}
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${Math.min(marginDirect, 100)}%`,
                                    }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
