"use client";

import { useMemo } from "react";
import { MotionDiv } from "@/components/ui/motion";
import { Sparkles, Plus } from "lucide-react";

import { Product } from "@/lib/types";

interface CartItem {
  productId: string;
  productName: string;
}

interface UpsellRecommenderProps {
  cart: CartItem[];
  products: Product[];
  onAdd: (product: Product) => void;
}

export default function UpsellRecommender({
  cart,
  products,
  onAdd,
}: UpsellRecommenderProps) {
  const recommendations = useMemo(() => {
    if (cart.length === 0) return [];

    const cartProductNames = cart.map((item) => item.productName.toLowerCase());
    const hasBurger = cartProductNames.some(
      (name) => name.includes("burger") || name.includes("hamburguesa"),
    );
    const hasDrink = cartProductNames.some(
      (name) =>
        name.includes("bebida") ||
        name.includes("gaseosa") ||
        name.includes("coca") ||
        name.includes("agua"),
    );
    const hasFries = cartProductNames.some(
      (name) => name.includes("papas") || name.includes("fritas"),
    );

    const recs: Product[] = [];

    // Rule 1: Suggest Drinks if there's a Burger but no Drinks
    if (hasBurger && !hasDrink) {
      const drink = products.find(
        (p) =>
          p.name.toLowerCase().includes("coca") ||
          p.name.toLowerCase().includes("bebida"),
      );
      if (drink) recs.push(drink);
    }

    // Rule 2: Suggest Fries if there's a Burger but no Fries
    if (hasBurger && !hasFries) {
      const fries = products.find((p) =>
        p.name.toLowerCase().includes("papas"),
      );
      if (fries) recs.push(fries);
    }

    // Rule 3: Suggest a top item if cart is small
    if (recs.length < 2) {
      const topItem = products.find(
        (p) => !cart.some((c) => c.productId === p.id),
      );
      if (topItem && !recs.some((r) => r.id === topItem.id)) recs.push(topItem);
    }

    // Filter out items already in cart
    return recs
      .filter((r) => !cart.some((c) => c.productId === r.id))
      .slice(0, 2);
  }, [cart, products]);

  if (recommendations.length === 0) return null;

  return (
    <MotionDiv
      className="mt-6 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          ¿Deseas agregar algo más?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {recommendations.map((p) => (
          <button
            key={p.id}
            onClick={() => onAdd(p)}
            className="flex items-center justify-between p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-left group min-w-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-black text-white italic uppercase tracking-tighter truncate">
                {p.name}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-primary">
                ${Number(p.price).toLocaleString()}
              </p>
            </div>
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-lg bg-primary text-black flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 ml-1">
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </MotionDiv>
  );
}
