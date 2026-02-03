"use client";

import { useState, useMemo } from "react";
import { Product } from "@/lib/types";
import { StoreHoursFormValues } from "@/lib/schemas";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  Check,
  MessageCircle,
  PlusCircle,
  ShoppingBasket,
  Clock,
  ChevronDown,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CartItem {
  id: string; // unique cart id (item + extras combination)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  extras: {
    productId: string;
    name: string;
    price: number;
  }[];
}

interface MenuClientProps {
  products: Product[];
  categories: { id: string; name: string }[];
  storeHours: StoreHoursFormValues[];
}

export default function MenuClient({
  products,
  categories,
  storeHours,
}: MenuClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "EFECTIVO" | "TRANSFERENCIA"
  >("EFECTIVO");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [confirmedAddress, setConfirmedAddress] = useState(false);

  // Open/Closed Logic
  // Open/Closed Logic
  const getStatus = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    const todayHours = storeHours.find((h) => h.dayOfWeek === day);

    if (
      !todayHours ||
      !todayHours.isOpen ||
      !todayHours.shifts ||
      todayHours.shifts.length === 0
    )
      return { isOpen: false, text: "Cerrado", hours: "Cerrado" };

    const isOpen = todayHours.shifts.some(
      (shift) =>
        currentTime >= shift.openTime && currentTime <= shift.closeTime,
    );

    const hoursText = todayHours.shifts
      .map((s) => `${s.openTime} - ${s.closeTime}`)
      .join(" / ");

    return {
      isOpen,
      text: isOpen ? "Abierto" : "Cerrado",
      hours: hoursText,
    };
  }, [storeHours]);

  // Filter only public products
  const publicProducts = products.filter((p) => p.showPublic);

  const extrasCategory = categories.find((c) => c.name === "Extras");

  // Group products by category
  const categorizedProducts = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    categories.forEach((cat) => {
      // Don't show "Extras" as a standalone category in the main list
      if (cat.id === extrasCategory?.id) return;

      const filtered = publicProducts.filter((p) => p.categoryId === cat.id);
      if (filtered.length > 0) {
        grouped[cat.name] = filtered;
      }
    });

    // Add uncategorized
    const uncategorized = publicProducts.filter((p) => !p.categoryId);
    if (uncategorized.length > 0) {
      grouped["Otros"] = uncategorized;
    }

    return grouped;
  }, [publicProducts, categories, extrasCategory]);

  const addToCart = (product: Product, extras: string[]) => {
    const extraItems = products
      .filter((p) => extras.includes(p.id))
      .map((p) => ({
        productId: p.id,
        name: p.name,
        price: Number(p.price),
      }));

    const extrasPrice = extraItems.reduce((sum, e) => sum + e.price, 0);
    const basePrice = Number(
      product.isPromo
        ? Number(product.price) * (1 - (product.promoDiscount || 0) / 100)
        : product.price,
    );

    const totalPrice = basePrice + extrasPrice;

    // Create a unique key for item + extras combo
    const extrasKey = extras.sort().join(",");
    const cartId = `${product.id}-${extrasKey}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: cartId,
          productId: product.id,
          name: product.name,
          price: totalPrice,
          quantity: 1,
          extras: extraItems,
        },
      ];
    });

    toast.success(`${product.name} agregado al carrito`);
    setSelectedProduct(null);
    setSelectedExtras([]);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const sendOrder = () => {
    if (!customerName.trim()) {
      toast.error("Por favor, ingresa tu nombre");
      return;
    }

    let message = `*NUEVO PEDIDO - BURGER TILIN*\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `--------------------------\n`;

    cart.forEach((item) => {
      message += `*${item.quantity}x ${item.name}*\n`;
      if (item.extras.length > 0) {
        item.extras.forEach((ex) => {
          message += `  └ + ${ex.name}\n`;
        });
      }
      message += `Subtotal: $${(item.price * item.quantity).toLocaleString()}\n\n`;
    });

    message += `--------------------------\n`;
    message += `💰 *TOTAL: $${cartTotal.toLocaleString()}*\n`;
    message += `💳 *Pago:* ${paymentMethod === "TRANSFERENCIA" ? "Transferencia / Mercadopago" : "Efectivo"}`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/5491132692245?text=${encoded}`, "_blank");
  };

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catName)
        ? prev.filter((c) => c !== catName)
        : [...prev, catName],
    );
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-black pb-24">
      {/* Premium Header */}
      <header className="relative min-h-[60vh] w-full overflow-hidden flex items-start justify-center pt-24 pb-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="/logo.jpg"
            alt="Hero"
            fill
            className="object-cover opacity-30 blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/60 to-black" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-10 px-6"
        >
          <div className="relative h-28 w-28 mx-auto rounded-[2.5rem] overflow-hidden border-2 border-primary/30 shadow-[0_0_50px_rgba(252,169,13,0.3)]">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none">
              BURGER{" "}
              <span className="text-primary text-glow font-black">TILIN</span>
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
              <span
                className={`flex items-center gap-1.5 px-3 py-1 border text-[10px] font-black uppercase rounded-full tracking-widest transition-colors ${
                  getStatus.isOpen
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-500"
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${getStatus.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                />
                {getStatus.text}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-neutral-400 text-[10px] font-black uppercase rounded-full tracking-widest whitespace-normal text-center max-w-[200px] leading-tight">
                <Clock className="h-3 w-3 shrink-0" />
                {getStatus.hours || "Consultar Horarios"}
              </span>
            </div>

            {/* Delivery Area Warning */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl shadow-[0_0_30px_rgba(252,169,13,0.1)]">
                <MapPin className="h-4 w-4 text-primary animate-bounce" />
                <span className="text-[11px] font-black uppercase tracking-widest text-primary italic">
                  Zona Exclusiva: Barrio Kennedy
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest opacity-80 mt-2">
                Av. Juan B. Justo 9100, CABA, Liniers
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Categories & Products */}
      <main className="max-w-3xl mx-auto px-4 relative z-10 space-y-12 pb-12">
        {Object.entries(categorizedProducts).map(([catName, items], catIdx) => {
          const isExpanded = expandedCategories.includes(catName);
          return (
            <motion.section
              key={catName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
              className="space-y-4"
            >
              <button
                onClick={() => toggleCategory(catName)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white/90 group-hover:text-primary transition-colors">
                    {catName}
                  </h2>
                  <div className="h-px flex-1 bg-linear-to-r from-primary/30 to-transparent" />
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 text-neutral-500 group-hover:text-primary transition-colors"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-4 py-2">
                      {items.map((product) => {
                        const price = Number(product.price);
                        const finalPrice = product.isPromo
                          ? price * (1 - (product.promoDiscount || 0) / 100)
                          : price;

                        return (
                          <motion.div
                            key={product.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedProduct(product)}
                            className="group bg-neutral-900/40 border border-white/5 hover:border-primary/20 p-4 rounded-3xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-neutral-900/60"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg text-white group-hover:text-primary transition-colors uppercase tracking-tight italic">
                                  {product.name}
                                </h3>
                                {product.isPromo && (
                                  <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/30 uppercase">
                                    - {product.promoDiscount}%
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 line-clamp-2 font-medium">
                                {product.description ||
                                  "Deliciosa combinación de sabores."}
                              </p>
                              <div className="flex items-center gap-2 pt-1 font-black">
                                <p className="text-primary text-xl tracking-tighter font-black italic">
                                  ${finalPrice.toLocaleString()}
                                </p>
                                {product.isPromo && (
                                  <p className="text-neutral-600 text-xs line-through font-bold">
                                    ${price.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                              <Plus className="h-6 w-6" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </main>

      {/* Product Detail / Extras Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="h-48 relative bg-linear-to-b from-primary/20 to-zinc-950 flex items-center justify-center">
                <ShoppingBasket className="h-20 w-20 text-primary opacity-20" />
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                      {selectedProduct.name}
                    </h2>
                  </div>
                  <p className="text-neutral-400 font-medium">
                    {selectedProduct.description ||
                      "Deliciosa combinación de sabores."}
                  </p>
                </div>

                {/* Extras Section - Restricted to Combos and Hamburguesas (Flexible Match) */}
                {(() => {
                  const categoryName = (
                    categories.find((c) => c.id === selectedProduct.categoryId)
                      ?.name || ""
                  ).toLowerCase();
                  const isEligibleForExtras =
                    categoryName.includes("hamburguesa") ||
                    categoryName.includes("burger") ||
                    categoryName.includes("combo");

                  if (!isEligibleForExtras) return null;

                  // Determine which extras to show
                  const extrasToShow =
                    selectedProduct.allowedExtras &&
                    selectedProduct.allowedExtras.length > 0
                      ? selectedProduct.allowedExtras
                          .map((ref) =>
                            products.find((p) => p.id === ref.extraProductId),
                          )
                          .filter((p): p is Product => !!p && p.showPublic)
                      : publicProducts.filter(
                          (p) => p.categoryId === extrasCategory?.id,
                        );

                  if (extrasToShow.length === 0) return null;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">
                          ¿Deseas agregar algún extra?
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {extrasToShow.map((extraProd) => {
                          const isSelected = selectedExtras.includes(
                            extraProd.id,
                          );

                          return (
                            <div
                              key={extraProd.id}
                              onClick={() => toggleExtra(extraProd.id)}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/10"
                              }`}
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold uppercase italic tracking-tight">
                                  {extraProd.name}
                                </span>
                                <span className="text-[10px] font-black text-primary">
                                  + ${Number(extraProd.price).toLocaleString()}
                                </span>
                              </div>
                              <div
                                className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-primary border-primary scale-110 shadow-[0_0_15px_rgba(252,169,13,0.3)]"
                                    : "border-white/10"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="h-3 w-3 text-black stroke-4" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <Button
                  onClick={() => addToCart(selectedProduct, selectedExtras)}
                  disabled={!getStatus.isOpen}
                  className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-base transition-all ${
                    getStatus.isOpen
                      ? "bg-primary text-black shadow-[0_0_30px_rgba(252,169,13,0.3)] hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed grayscale"
                  }`}
                >
                  {getStatus.isOpen ? "Confirmar y Agregar" : "Local Cerrado"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <motion.div
        animate={{ scale: cartCount > 0 ? 1 : 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-primary text-black px-8 py-4 rounded-full font-black uppercase tracking-widest flex items-center gap-4 shadow-[0_10px_40px_rgba(252,169,13,0.4)] hover:scale-105 active:scale-95 transition-all"
        >
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-black text-primary text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-primary font-black">
              {cartCount}
            </span>
          </div>
          <span className="text-lg italic font-black">
            ${cartTotal.toLocaleString()}
          </span>
        </button>
      </motion.div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-200">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-black italic uppercase tracking-tighter">
                    Tu Pedido
                  </h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                    <ShoppingBasket className="h-20 w-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      Tu carrito está vacío
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-3xl bg-white/3 border border-white/5 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-black uppercase italic tracking-tight">
                            {item.name}
                          </h4>
                          {item.extras.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.extras.map((ex, idx) => (
                                <p
                                  key={idx}
                                  className="text-[10px] text-neutral-500 font-bold uppercase"
                                >
                                  + {ex.name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-black text-primary italic">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3 bg-black/40 rounded-full p-1 border border-white/5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-4 text-center font-black text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, -item.quantity)
                          }
                          className="text-neutral-600 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-white/5 bg-zinc-900/40 space-y-5">
                  {/* Name Input - Compact */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 px-1">
                      Tu Nombre
                    </label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Juan Perez"
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:border-primary/50 outline-none transition-all"
                    />
                  </div>

                  {/* Payment Method - Compact */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 px-1">
                      Pago
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod("EFECTIVO")}
                        className={`py-3 px-4 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                          paymentMethod === "EFECTIVO"
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-black border-white/10 text-neutral-500"
                        }`}
                      >
                        💵 Efectivo
                      </button>
                      <button
                        onClick={() => setPaymentMethod("TRANSFERENCIA")}
                        className={`py-3 px-4 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                          paymentMethod === "TRANSFERENCIA"
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-black border-white/10 text-neutral-500"
                        }`}
                      >
                        💳 Transf.
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">
                      Total a pagar
                    </span>
                    <span className="text-2xl font-black italic text-primary">
                      ${cartTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Address Confirmation Checkbox - Compact */}
                  <div
                    onClick={() => setConfirmedAddress(!confirmedAddress)}
                    className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      confirmedAddress
                        ? "bg-primary/10 border-primary/30"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        confirmedAddress
                          ? "bg-primary border-primary scale-110"
                          : "border-white/10"
                      }`}
                    >
                      {confirmedAddress && (
                        <Check className="h-2.5 w-2.5 text-black stroke-4" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p
                        className={`text-[10px] font-black uppercase italic tracking-tight leading-tight transition-colors ${
                          confirmedAddress ? "text-primary" : "text-white"
                        }`}
                      >
                        Vivo en Barrio Kennedy
                      </p>
                      <p className="text-[8px] font-bold text-neutral-500 uppercase leading-tight">
                        Confirmar dirección para habilitar envío.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={sendOrder}
                    disabled={!confirmedAddress || !getStatus.isOpen}
                    className={`w-full h-14 rounded-xl font-black uppercase tracking-tight text-xs transition-all flex items-center justify-center gap-2 ${
                      confirmedAddress && getStatus.isOpen
                        ? "bg-green-500 text-black shadow-[0_0_25px_rgba(34,197,94,0.2)] hover:bg-green-400 font-black italic"
                        : "bg-neutral-800 text-neutral-500 cursor-not-allowed grayscale"
                    }`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="truncate">
                      {!getStatus.isOpen
                        ? "Local Cerrado"
                        : confirmedAddress
                          ? "Enviar a WhatsApp"
                          : "Confirmar zona para continuar"}
                    </span>
                  </Button>

                  <p className="text-[8px] text-center font-bold text-neutral-600 uppercase tracking-tighter">
                    Tú pedido será enviado por WhatsApp
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
