"use client";

import { useState } from "react";
import { ChefHat, Pencil, Tag, ChevronDown, Store, Search } from "lucide-react";
import { Product, Ingredient, RecipeItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteProductButton } from "./delete-button";
import RecipeEditor from "@/components/recipe-editor";
import EditProductForm from "./edit-product-form";
import { updateProductExtras } from "@/app/actions/product-actions";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

interface ProductListProps {
  products: Product[];
  categories: { id: string; name: string }[];
  ingredients: Ingredient[];
  platformConfigs: any[];
}

export default function ProductList({
  products,
  categories,
  ingredients,
  platformConfigs,
}: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    all: true,
  });

  const commMap: Record<string, number> = {};
  platformConfigs?.forEach((c) => {
    commMap[c.name] = c.commission / 100;
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

  const getPlatformRevenue = (price: number, channel: string) => {
    const rate = commMap[channel] ?? 0;
    return price * (1 - rate);
  };

  const categoriesWithUncategorized = [
    { id: "un-categorized", name: "Sin Categoría" },
    ...(categories || []),
  ];

  return (
    <div className="space-y-8">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-500" />
        </div>
        <input
          type="text"
          placeholder="Buscar productos por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-white/5 text-white text-sm rounded-2xl focus:ring-primary focus:border-primary block pl-12 p-4 placeholder:text-neutral-600 font-medium transition-all focus:bg-zinc-900/80 outline-none"
        />
      </div>

      <div className="space-y-12">
        {categoriesWithUncategorized.map((category) => {
          const filteredProducts = products?.filter((p: Product) => {
            const matchesCategory =
              category.id === "un-categorized"
                ? !p.categoryId
                : p.categoryId === category.id;
            const matchesSearch = p.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
          });

          if (!filteredProducts || filteredProducts.length === 0) return null;

          // Auto-expand if searching, otherwise use state
          const isExpanded = searchTerm
            ? true
            : expandedCategories[category.id] !== false;

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
                    className="overflow-visible"
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

                            const channelKey =
                              p.id === "PY"
                                ? "PedidosYa"
                                : p.id === "Rappi"
                                  ? "Rappi"
                                  : "MercadoPago";
                            const netRevenue = getPlatformRevenue(
                              final,
                              channelKey,
                            );
                            // Margin calculated over what the customer pays (final price)
                            // Formula: (NetRevenue - Cost) / FinalPrice
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

                              {marginDirect < 25 && (
                                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                                  <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-red-400 animate-pulse uppercase tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                                    Margen Crítico
                                  </span>
                                </div>
                              )}

                              <CardHeader className="p-5 pb-2 relative z-10">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <CardTitle className="text-base sm:text-lg font-black text-white group-hover:text-primary transition-colors leading-tight truncate max-w-[150px] sm:max-w-none">
                                        {product.name}
                                      </CardTitle>
                                      {!product.showPublic && (
                                        <div
                                          className="shrink-0 p-1 rounded-md bg-zinc-800 text-neutral-500"
                                          title="No visible en menú público"
                                        >
                                          <EyeOff className="h-3.5 w-3.5" />
                                        </div>
                                      )}
                                      {product.showPublic && (
                                        <div
                                          className="shrink-0 p-1 rounded-md bg-primary/10 text-primary/50"
                                          title="Visible en menú público"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </div>
                                      )}
                                      {isAnyPromo && (
                                        <span className="shrink-0 bg-primary/10 text-primary text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/20">
                                          Promo
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] text-neutral-500 line-clamp-1 italic font-medium">
                                      {product.description || "Sin descripción"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative z-50">
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
                                      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-2xl p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
                                        <div className="bg-linear-to-b from-primary/10 to-transparent p-6 sm:p-8 pb-4">
                                          <DialogHeader>
                                            <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shrink-0">
                                                <Pencil className="h-6 w-6 text-primary" />
                                              </div>
                                              <div>
                                                <DialogTitle className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">
                                                  Editar{" "}
                                                  <span className="text-primary">
                                                    Producto
                                                  </span>
                                                </DialogTitle>
                                                <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-widest mt-0.5">
                                                  Actualiza los detalles de{" "}
                                                  {product.name}
                                                </p>
                                              </div>
                                            </div>
                                          </DialogHeader>
                                        </div>
                                        <div className="p-6 sm:p-8 pt-0 max-h-[70vh] overflow-y-auto no-scrollbar">
                                          <EditProductForm
                                            product={product}
                                            allProducts={products}
                                            categories={categories}
                                            onUpdateExtras={updateProductExtras}
                                          />
                                        </div>
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
                                        Local
                                      </span>
                                    </div>
                                    <div
                                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                        marginDirect > 45
                                          ? "bg-green-500/10 text-green-400"
                                          : marginDirect > 25
                                            ? "bg-yellow-500/10 text-yellow-400"
                                            : "bg-red-500/20 text-red-500 border border-red-500/30"
                                      }`}
                                    >
                                      {marginDirect.toFixed(0)}% MG
                                    </div>
                                  </div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-black text-white">
                                      $
                                      {Math.round(
                                        currentPriceDirect,
                                      ).toLocaleString()}
                                    </span>
                                    {product.isPromo && (
                                      <span className="text-[10px] sm:text-xs text-neutral-600 line-through font-bold">
                                        $
                                        {Number(product.price).toLocaleString()}
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
                                            <span className="text-[8px] sm:text-[9px] font-bold text-neutral-500 uppercase tracking-tighter truncate">
                                              {app.label}
                                            </span>
                                            {app.isPromo && (
                                              <span className="bg-primary/10 text-primary text-[7px] font-black px-1 py-0.5 rounded border border-primary/20 shrink-0">
                                                {app.discount}% OFF
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`text-xs sm:text-sm font-black ${app.isPromo ? "text-primary" : "text-neutral-300"}`}
                                            >
                                              $
                                              {Math.round(
                                                app.final,
                                              ).toLocaleString()}
                                            </span>
                                            {app.isPromo && (
                                              <span className="text-[7px] sm:text-[8px] text-neutral-700 line-through">
                                                ${Number(app.base).toFixed(0)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[7px] font-black text-neutral-600 uppercase">
                                            MG
                                          </p>
                                          <span
                                            className={`text-[10px] sm:text-xs font-black ${
                                              app.margin > 30
                                                ? "text-green-500"
                                                : app.margin > 15
                                                  ? "text-yellow-500"
                                                  : "text-red-500 animate-pulse"
                                            }`}
                                          >
                                            {app.margin.toFixed(0)}%
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-3 rounded-xl border border-dashed border-white/5 text-center">
                                      <p className="text-[8px] font-bold text-neutral-600 uppercase">
                                        Sin precios app
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-auto space-y-3 pt-2">
                                  <div className="flex flex-row items-center justify-between gap-2 px-1">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <ChefHat className="h-3.5 w-3.5 text-neutral-600" />
                                      <span className="text-[8px] sm:text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                        Cost:{" "}
                                        <span className="text-neutral-300">
                                          ${totalCost.toFixed(0)}
                                        </span>
                                      </span>
                                    </div>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <button className="text-[8px] sm:text-[10px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer pointer-events-auto shrink-0">
                                          Receta{" "}
                                          <ChevronDown className="h-3 w-3" />
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-2xl p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
                                        <div className="bg-linear-to-b from-primary/10 to-transparent p-6 sm:p-8 pb-4">
                                          <DialogHeader>
                                            <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shrink-0">
                                                <ChefHat className="h-6 w-6 text-primary" />
                                              </div>
                                              <div>
                                                <DialogTitle className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">
                                                  Receta{" "}
                                                  <span className="text-primary">
                                                    Maestra
                                                  </span>
                                                </DialogTitle>
                                                <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-widest mt-0.5">
                                                  Ingredientes para{" "}
                                                  {product.name}
                                                </p>
                                              </div>
                                            </div>
                                          </DialogHeader>
                                        </div>
                                        <div className="p-6 sm:p-8 pt-0 max-h-[70vh] overflow-y-auto no-scrollbar">
                                          <RecipeEditor
                                            productId={product.id}
                                            existingRecipe={
                                              product.recipe || []
                                            }
                                            availableIngredients={ingredients}
                                          />
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                  <div className="h-0.5 w-full bg-white/2 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full ${
                                        marginDirect > 45
                                          ? "bg-green-500"
                                          : marginDirect > 25
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                      }`}
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min(Math.max(marginDirect, 0), 100)}%`,
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
    </div>
  );
}
