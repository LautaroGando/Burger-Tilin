"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { createSale } from "@/app/actions/sale-actions";
import { getProducts } from "@/app/actions/product-actions";
import { getCategories } from "@/app/actions/category-actions";
import { searchCustomers } from "@/app/actions/customer-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionDiv, MotionItem } from "@/components/ui/motion";

export const dynamic = "force-dynamic";
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
  Receipt,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  Search,
  ChevronDown,
  X,
  AlertTriangle,
  Package,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import UpsellRecommender from "./UpsellRecommender";
import { ComboComponentSelector } from "./ComboComponentSelector";
import { Product } from "@/lib/types";

// ── Types ───────────────────────────────────────────────────────────────────
type CartItem = {
  cartItemId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  note?: string; // e.g. "Reemplazo: Coca por Pepsi"
  fulfillments?: { slotId: string; configuredProductId: string; deliveredProductId: string }[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const calculateItemPrice = (product: Product, channel: string) => {
  const isAppChannel = ["PEYA", "RAPPI", "MERCADOPAGO"].includes(channel);
  const basePrice = isAppChannel && product.priceApps ? Number(product.priceApps) : Number(product.price);
  const isPromoActive = isAppChannel ? product.isPromoApps : product.isPromo;
  const discount = isAppChannel ? Number(product.promoDiscountApps || 0) : Number(product.promoDiscount || 0);
  const finalPrice = isPromoActive ? basePrice * (1 - discount / 100) : basePrice;
  return { basePrice, finalPrice, discount, isPromoActive };
};

const CHANNELS = [
  { id: "COUNTER", label: "Mostrador", icon: Package },
  { id: "RAPPI", label: "Rappi", icon: Smartphone },
  { id: "PEYA", label: "Peya", icon: Smartphone },
  { id: "MERCADOPAGO", label: "MP Delivery", icon: Smartphone },
  { id: "WHATSAPP", label: "WhatsApp", icon: Smartphone },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function NewSalePage() {
  const router = useRouter();
  void router;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeComboProduct, setActiveComboProduct] = useState<Product | null>(null);

  // Ticket data
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [channel, setChannel] = useState("COUNTER");
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string | null; phone: string | null }[]
  >([]);
  const [lastSaleData, setLastSaleData] = useState<{
    date: Date;
    total: number;
    items: CartItem[];
    clientName: string;
    paymentMethod: string;
  } | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Load products + categories
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      setLoading(false);
    }
    load();
  }, []);

  // Recalculate prices when channel changes
  useEffect(() => {
    if (products.length === 0) return;
    setCart((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        const { finalPrice } = calculateItemPrice(product, channel);
        return { ...item, price: finalPrice };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, products.length]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.isActive);
    if (selectedCategoryId !== "ALL") {
      if (selectedCategoryId === "NONE") result = result.filter((p) => !p.categoryId);
      else result = result.filter((p) => p.categoryId === selectedCategoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategoryId, searchQuery]);

  const addToCart = useCallback(
    (product: Product) => {
      // If it's a configurable combo, open the selector modal instead
      if (product.comboSlots && product.comboSlots.length > 0) {
        setActiveComboProduct(product);
        return;
      }

      setCart((prev) => {
        const existing = prev.find((item) => item.productId === product.id && !item.fulfillments);
        const { finalPrice } = calculateItemPrice(product, channel);
        if (existing) {
          return prev.map((item) =>
            item.productId === product.id && !item.fulfillments
              ? { ...item, quantity: item.quantity + 1, price: finalPrice }
              : item
          );
        }
        return [
          ...prev,
          {
            cartItemId: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            price: finalPrice,
            quantity: 1,
          },
        ];
      });
    },
    [channel]
  );

  const handleConfirmCombo = (fulfillments: { slotId: string; configuredProductId: string; deliveredProductId: string; extraPrice: number }[]) => {
    if (!activeComboProduct) return;
    const { finalPrice } = calculateItemPrice(activeComboProduct, channel);
    const extraCharge = fulfillments.reduce((acc, f) => acc + (f.extraPrice || 0), 0);
    const totalPrice = finalPrice + extraCharge;
    
    // We add combos as unique items if they have different fulfillments, 
    // but for simplicity here we just add a new row to the cart for each combo configured
    setCart((prev) => [
      ...prev,
      {
        cartItemId: crypto.randomUUID(),
        productId: activeComboProduct.id,
        productName: activeComboProduct.name,
        price: totalPrice,
        quantity: 1,
        fulfillments,
      },
    ]);
    setActiveComboProduct(null);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    const res = await createSale({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        fulfillments: item.fulfillments,
      })),
      paymentMethod,
      total,
      discount,
      clientName,
      channel,
      customerId: selectedCustomerId || undefined,
    });

    if (res.success) {
      toast.success("✓ Venta registrada");
      setLastSaleData({
        date: new Date(),
        total,
        items: [...cart],
        clientName: clientName || "Mostrador",
        paymentMethod,
      });
      setShowReceipt(true);
      setCart([]);
      setClientName("");
      setSelectedCustomerId(null);
      setPaymentMethod("CASH");
      setChannel("COUNTER");
      setDiscount(0);
      setShowMobileCart(false);
    } else {
      toast.error(res.error || "Error al registrar venta");
    }
    setSubmitting(false);
  };

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          LEFT — CATALOG
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#080808] shrink-0">
          <Link href="/admin">
            <button className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
              Punto de Venta
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </h1>
            <p className="text-[9px] text-neutral-600 font-medium uppercase tracking-wider">
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Channel selector compact */}
            <div className="relative">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white pl-3 pr-7 py-1.5 outline-none focus:border-primary/50 cursor-pointer"
              >
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-black">
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500 pointer-events-none" />
            </div>

            {/* Mobile cart toggle */}
            <button
              onClick={() => setShowMobileCart(true)}
              className="lg:hidden relative h-8 px-3 rounded-lg bg-primary text-black font-bold text-xs flex items-center gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {cartCount > 0 && (
                <span className="bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {cartCount}
                </span>
              )}
              <span className="font-black">
                ${total.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </span>
            </button>
          </div>
        </div>

        {/* Category filter + search */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar">
          {/* Search */}
          <div className="relative shrink-0 w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs text-white placeholder:text-neutral-700 outline-none focus:border-primary/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[{ id: "ALL", name: "Todos" }, ...categories].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-black"
                    : "bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin h-8 w-8 text-neutral-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-600">
              <Package className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-bold">
                {searchQuery ? "Sin resultados" : "No hay productos en esta categoría"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <MotionDiv
                key={selectedCategoryId + searchQuery}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.02 } } }}
              >
                {filteredProducts.map((product) => {
                  const { finalPrice, isPromoActive, basePrice, discount: promoDiscount } =
                    calculateItemPrice(product, channel);
                  const cartItem = cart.find((i) => i.productId === product.id);
                  const inCart = cartItem?.quantity ?? 0;

                  // Stock check (from recipe ingredients)
                  const hasLowStock = product.recipe?.some(
                    (ri) => ri.ingredient.stock <= ri.ingredient.minStock
                  );

                  return (
                    <MotionItem
                      key={product.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        show: { opacity: 1, scale: 1 },
                      }}
                    >
                      <button
                        onClick={() => addToCart(product)}
                        className={`w-full h-full flex flex-col justify-between relative rounded-xl border p-3 text-left transition-all active:scale-[0.97] group
                          ${inCart > 0
                            ? "bg-primary/5 border-primary/40"
                            : "bg-neutral-950 border-white/5 hover:border-white/15 hover:bg-neutral-900"
                          }`}
                      >
                        {/* Promo badge */}
                        {isPromoActive && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-primary text-black text-[8px] font-black px-1.5 py-0.5 rounded">
                              -{promoDiscount}%
                            </span>
                          </div>
                        )}

                        {/* Low stock warning */}
                        {hasLowStock && (
                          <div className="absolute top-2 left-2">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          </div>
                        )}

                        {/* Cart quantity badge */}
                        {inCart > 0 && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-[9px] font-black text-black">{inCart}</span>
                          </div>
                        )}

                        <p className="text-xs font-bold text-white line-clamp-2 leading-tight mb-2 pr-5">
                          {product.name}
                        </p>

                        <div className="flex items-end justify-between mt-auto">
                          <div>
                            {isPromoActive && (
                              <p className="text-[9px] text-neutral-600 line-through">
                                ${Math.round(basePrice).toLocaleString("es-AR")}
                              </p>
                            )}
                            <p className="text-sm font-black text-primary">
                              ${Math.round(finalPrice).toLocaleString("es-AR")}
                            </p>
                          </div>
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors
                            ${inCart > 0 ? "bg-primary text-black" : "bg-white/5 text-neutral-500 group-hover:bg-white/10 group-hover:text-white"}`}>
                            <Plus className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </button>
                    </MotionItem>
                  );
                })}
              </MotionDiv>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT — TICKET (Desktop sticky, mobile overlay)
      ═══════════════════════════════════════════════════════ */}
      <>
        {/* Mobile floating button */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full h-14 rounded-xl bg-primary text-black font-black flex items-center justify-between px-5 shadow-[0_0_30px_rgba(252,169,13,0.3)]"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-5 w-5" />
              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-black">
                {cartCount}
              </span>
              Ver pedido
            </span>
            <span className="text-lg font-black">
              ${total.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
            </span>
          </button>
        </div>

        {/* Ticket panel */}
        <div
          className={`
            fixed lg:relative inset-0 z-40 lg:z-auto
            bg-[#0c0c0c] lg:bg-[#0a0a0a]
            lg:w-[340px] xl:w-[380px] lg:border-l lg:border-white/5
            flex flex-col h-full
            transform transition-transform duration-300 ease-out
            ${showMobileCart ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
          `}
        >
          {/* Ticket header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-white uppercase tracking-wide">
                Ticket
              </span>
              {cartCount > 0 && (
                <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full">
                  {cartCount} items
                </span>
              )}
            </div>
            <button
              onClick={() => setShowMobileCart(false)}
              className="lg:hidden h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-700 gap-3">
                <ShoppingCart className="h-12 w-12 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  Seleccioná productos
                </p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-black text-white w-5 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <p className="flex-1 text-xs font-semibold text-neutral-300 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs font-bold text-white tabular-nums shrink-0">
                      ${(item.price * item.quantity).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}

                <UpsellRecommender cart={cart} products={products} onAdd={addToCart} />
              </>
            )}
          </div>

          {/* Ticket footer */}
          <div className="shrink-0 border-t border-white/5 p-4 space-y-3 bg-[#080808]">
            {/* Client name search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
              <Input
                placeholder="Cliente (opcional)"
                value={clientName}
                onChange={async (e) => {
                  setClientName(e.target.value);
                  if (selectedCustomerId) setSelectedCustomerId(null);
                  if (e.target.value.length > 1) {
                    const res = await searchCustomers(e.target.value);
                    if (res.success && res.data) setSearchResults(res.data);
                  } else {
                    setSearchResults([]);
                  }
                }}
                className="pl-8 h-8 bg-white/5 border-white/5 rounded-lg text-xs focus:border-primary/50 text-white"
              />
              {searchResults.length > 0 && !selectedCustomerId && (
                <div className="absolute bottom-full left-0 w-full bg-neutral-950 border border-white/10 rounded-xl shadow-2xl z-50 mb-1 max-h-32 overflow-y-auto">
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      className="px-3 py-2 hover:bg-white/5 cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setClientName(c.name || "Cliente");
                        setSelectedCustomerId(c.id);
                        setSearchResults([]);
                      }}
                    >
                      <span className="text-xs font-bold text-white">{c.name}</span>
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment method + channel */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mb-1">
                  Pago
                </p>
                <div className="flex gap-1">
                  {[
                    { id: "CASH", icon: Banknote },
                    { id: "TRANSFER", icon: CreditCard },
                    { id: "QR", icon: QrCode },
                  ].map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      className={`flex-1 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                        paymentMethod === id
                          ? "bg-primary border-primary text-black"
                          : "border-white/10 text-neutral-500 hover:border-white/20"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mb-1">
                  Descuento
                </p>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-600">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={discount || ""}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-5 pr-2 h-8 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1 pt-1 border-t border-white/5">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs text-red-400">
                  <span>Descuento</span>
                  <span>-${discount.toLocaleString("es-AR")}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-black text-white uppercase">Total</span>
                <span className="text-2xl font-black text-primary tracking-tighter">
                  ${total.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <Button
              className="w-full h-12 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(252,169,13,0.2)] hover:shadow-[0_0_30px_rgba(252,169,13,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
              disabled={cart.length === 0 || submitting}
              onClick={handleCheckout}
            >
              {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Cobrar venta"}
            </Button>
          </div>
        </div>
      </>

      {/* ═══════════════════════════════════════════════════════
          RECEIPT MODAL
      ═══════════════════════════════════════════════════════ */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-neutral-950 text-white border border-white/10 max-w-sm p-0 rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
          {/* Success header */}
          <div className="bg-primary p-8 text-center rounded-t-3xl">
            <div className="bg-black/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
            <h2 className="text-2xl font-black text-black tracking-tight">
              ¡Venta registrada!
            </h2>
            <p className="text-black/60 text-xs font-bold mt-1 uppercase tracking-widest">
              Burger Tilín POS
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Total */}
            <div className="text-center pb-4 border-b border-white/5">
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">
                Total cobrado
              </p>
              <p className="text-4xl font-black text-white tracking-tighter">
                ${lastSaleData?.total.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-mono text-neutral-500">
                  {lastSaleData?.date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase">
                  {lastSaleData?.paymentMethod === "CASH"
                    ? "Efectivo"
                    : lastSaleData?.paymentMethod === "TRANSFER"
                      ? "Transferencia"
                      : "QR MP"}
                </span>
              </div>
              {lastSaleData?.clientName && (
                <p className="text-xs text-neutral-400 mt-2">
                  Cliente: <span className="text-white font-bold">{lastSaleData.clientName}</span>
                </p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2">
              {lastSaleData?.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-neutral-400">
                    <strong className="text-white">{item.quantity}×</strong> {item.productName}
                  </span>
                  <span className="font-bold text-white">
                    ${(item.price * item.quantity).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <Button
                className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a] font-bold h-10 rounded-xl text-sm"
                onClick={() => {
                  if (lastSaleData) {
                    const link = generateWhatsAppLink({
                      id: "N/A",
                      date: lastSaleData.date,
                      clientName: lastSaleData.clientName,
                      total: lastSaleData.total,
                      items: lastSaleData.items.map((i) => ({
                        quantity: i.quantity,
                        product: { name: i.productName },
                        unitPrice: i.price,
                      })),
                    });
                    window.open(link, "_blank");
                  }
                }}
              >
                💬 Enviar comprobante
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white font-bold h-10 rounded-xl text-sm"
                onClick={() => setShowReceipt(false)}
              >
                <Receipt className="mr-2 h-4 w-4" /> Nueva venta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Combo Configuration Modal */}
      {activeComboProduct && (
        <ComboComponentSelector
          combo={activeComboProduct}
          isOpen={!!activeComboProduct}
          onClose={() => setActiveComboProduct(null)}
          onConfirm={handleConfirmCombo}
        />
      )}
    </div>
  );
}
