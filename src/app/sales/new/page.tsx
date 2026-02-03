"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSale } from "@/app/actions/sale-actions";
import { getProducts } from "@/app/actions/product-actions";
import { getCategories } from "@/app/actions/category-actions";
import { searchCustomers } from "@/app/actions/customer-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { generateWhatsAppLink } from "@/lib/whatsapp";

// Types
type Product = {
  id: string;
  name: string;
  price: number;
  pricePedidosYa: number | null;
  priceRappi: number | null;
  priceMP: number | null;
  isPromo: boolean;
  promoDiscount: number | null;
  isPromoPY: boolean;
  promoDiscountPY: number | null;
  isPromoRappi: boolean;
  promoDiscountRappi: number | null;
  isPromoMP: boolean;
  promoDiscountMP: number | null;
  description: string | null;
  categoryId?: string | null;
};

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
};

// Helper to calculate price based on channel and promotions
const calculateItemPrice = (product: Product, channel: string) => {
  let basePrice = Number(product.price);
  let discount = 0;
  let isPromoActive = false;

  if (channel === "RAPPI") {
    basePrice = Number(product.priceRappi || product.price);
    isPromoActive = product.isPromoRappi;
    discount = Number(product.promoDiscountRappi || 0);
  } else if (channel === "PEYA") {
    basePrice = Number(product.pricePedidosYa || product.price);
    isPromoActive = product.isPromoPY;
    discount = Number(product.promoDiscountPY || 0);
  } else if (channel === "MERCADOPAGO") {
    basePrice = Number(product.priceMP || product.price);
    isPromoActive = product.isPromoMP;
    discount = Number(product.promoDiscountMP || 0);
  } else {
    // COUNTER, WHATSAPP, etc use direct price
    basePrice = Number(product.price);
    isPromoActive = product.isPromo;
    discount = Number(product.promoDiscount || 0);
  }

  const finalPrice = isPromoActive
    ? basePrice * (1 - discount / 100)
    : basePrice;

  return { basePrice, finalPrice, discount, isPromoActive };
};

const PaymentMethodButton = ({
  method,
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  method: string;
  icon: React.ElementType;
  label: string;
  selected: boolean;
  onClick: (method: string) => void;
}) => (
  <button
    onClick={() => onClick(method)}
    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
      selected
        ? "bg-primary text-black border-primary font-bold shadow-lg shadow-yellow-500/20"
        : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:border-white/10"
    }`}
  >
    <Icon className="h-5 w-5 mb-1" />
    <span className="text-[10px] uppercase font-bold tracking-wider">
      {label}
    </span>
  </button>
);

export default function NewSalePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Ticket Data
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [channel, setChannel] = useState("COUNTER");
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
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

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data as Product[]);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  // When channel changes, update prices in the cart if they exist for the new channel
  useEffect(() => {
    if (products.length === 0) return;

    setCart((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;

        const { finalPrice } = calculateItemPrice(product, channel);
        return { ...item, price: finalPrice };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, products.length]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryId === "ALL") return true;
      if (selectedCategoryId === "NONE") return !p.categoryId;
      return p.categoryId === selectedCategoryId;
    });
  }, [products, selectedCategoryId]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const { finalPrice } = calculateItemPrice(product, channel);

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, price: finalPrice }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: finalPrice,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    const res = await createSale({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      paymentMethod,
      total: total, // Correct: send net total after all discounts to the server
      discount: discount, // This is the manual discount
      clientName,
      channel,
      customerId: selectedCustomerId || undefined,
    });

    if (res.success) {
      toast.success("Venta registrada correctamente");
      setLastSaleData({
        date: new Date(),
        total,
        items: [...cart],
        clientName: clientName || "Cliente Mostrador",
        paymentMethod,
      });
      setShowReceipt(true);
      setCart([]);
      setClientName("");
      setSelectedCustomerId(null);
      setPaymentMethod("CASH");
      setChannel("COUNTER");
      setDiscount(0);
    } else {
      toast.error(
        res.error || "Error al registrar venta (Posible falta de stock)",
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-12 text-white selection:bg-primary selection:text-black">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-12">
        {/* Product Grid (Left) */}
        <div className="flex-1 space-y-10">
          <MotionItem className="flex items-center gap-3 sm:gap-6 pb-4 sm:pb-6 border-b border-white/5">
            <Link href="/">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-4xl font-black tracking-tighter text-white flex items-end gap-2 uppercase">
                NUEVA VENTA{" "}
                <span className="text-primary text-3xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-[10px] sm:text-base text-neutral-500 font-medium tracking-wide">
                Selecciona productos para agregar al ticket
              </p>
            </div>
          </MotionItem>

          {/* Category Tabs */}
          {!loading && categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
              <button
                onClick={() => setSelectedCategoryId("ALL")}
                className={`flex-none px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  selectedCategoryId === "ALL"
                    ? "bg-primary text-black border-primary shadow-lg shadow-yellow-500/10"
                    : "bg-white/5 text-neutral-500 border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex-none px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedCategoryId === cat.id
                      ? "bg-primary text-black border-primary shadow-lg shadow-yellow-500/10"
                      : "bg-white/5 text-neutral-500 border-white/5 hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() => setSelectedCategoryId("NONE")}
                className={`flex-none px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  selectedCategoryId === "NONE"
                    ? "bg-primary text-black border-primary shadow-lg shadow-yellow-500/10"
                    : "bg-white/5 text-neutral-500 border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                Otros
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-32 text-neutral-500"
              >
                <Loader2 className="animate-spin h-10 w-10" />
              </motion.div>
            ) : (
              <MotionDiv
                key={selectedCategoryId}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4"
                initial="hidden"
                animate="show"
                variants={{
                  show: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {filteredProducts.map((product) => {
                  const { basePrice, finalPrice, discount, isPromoActive } =
                    calculateItemPrice(product, channel);

                  return (
                    <MotionItem
                      key={product.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, scale: 0.9, y: 20 },
                        show: {
                          opacity: 1,
                          scale: 1,
                          y: 0,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          },
                        },
                      }}
                    >
                      <Card
                        onClick={() => addToCart(product)}
                        className="glass-card cursor-pointer hover:bg-zinc-900/40 active:scale-95 transition-all text-left border-white/5 bg-zinc-900/20 h-full flex flex-col justify-between p-5 group hover:border-white/10"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors flex-1 truncate">
                              {product.name}
                            </h3>
                            {isPromoActive && (
                              <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/20 shrink-0 ml-2 animate-pulse uppercase">
                                {discount}% OFF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 line-clamp-2 h-8 font-medium">
                            {product.description || "Sin descripción"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 border-dashed">
                          <div className="flex flex-col">
                            <span className="text-2xl font-black text-white tracking-tight leading-none">
                              ${Math.round(finalPrice).toLocaleString()}
                            </span>
                            {isPromoActive && (
                              <span className="text-[10px] text-neutral-600 line-through font-bold mt-1">
                                ${Math.round(basePrice).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 group-hover:bg-primary group-hover:text-black transition-all shadow-lg">
                            <Plus className="h-5 w-5" />
                          </div>
                        </div>
                      </Card>
                    </MotionItem>
                  );
                })}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Cart (Right) */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="glass-card sticky top-4 md:top-8 rounded-3xl flex flex-col border border-white/10 overflow-hidden bg-[#0A0A0A] shadow-2xl h-auto">
            <div className="p-4 md:p-6 border-b border-white/5 bg-zinc-900/30 backdrop-blur-md">
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                <ShoppingCart className="h-5 w-5 text-neutral-400" />
                Ticket Actual
              </h2>
            </div>

            <div className="flex-1 p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4 opacity-50">
                  <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <p className="font-bold text-sm uppercase tracking-widest">
                    El carrito está vacío
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/50 border border-white/5 group hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm mb-1">
                        {item.productName}
                      </p>
                      <p className="text-xs text-primary font-bold font-mono">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/5">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="h-8 w-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-black text-white w-6 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="h-8 w-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-zinc-900/50 border-t border-white/5 space-y-6 backdrop-blur-md">
              {/* Ticket Options */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative group">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
                    <Input
                      placeholder="Buscar Cliente (Nombre/Tel)"
                      value={clientName}
                      onChange={async (e) => {
                        setClientName(e.target.value);
                        // Reset customer ID if user types manually to ensure they can do walk-ins
                        if (selectedCustomerId) setSelectedCustomerId(null);

                        if (e.target.value.length > 1) {
                          const res = await searchCustomers(e.target.value);
                          if (res.success && res.data) {
                            setSearchResults(res.data);
                          }
                        } else {
                          setSearchResults([]);
                        }
                      }}
                      className="glass-input pl-10 h-10 text-sm bg-black/40 border-white/5 focus:border-primary/50 rounded-xl"
                    />
                    {searchResults.length > 0 && !selectedCustomerId && (
                      <div className="absolute top-full left-0 w-full bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto mt-2 p-1">
                        {searchResults.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 hover:bg-white/5 cursor-pointer rounded-lg flex justify-between items-center group/item"
                            onClick={() => {
                              setClientName(c.name || "Cliente");
                              setSelectedCustomerId(c.id);
                              setSearchResults([]);
                            }}
                          >
                            <div>
                              <p className="font-bold text-white text-sm group-hover/item:text-primary transition-colors">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-neutral-500 font-mono">
                                {c.phone}
                              </p>
                            </div>
                            <CheckCircle className="h-4 w-4 text-neutral-600 group-hover/item:text-primary opacity-0 group-hover/item:opacity-100 transition-all" />
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedCustomerId && (
                      <div className="absolute right-2 top-2">
                        <span className="text-[10px] bg-primary text-black px-2 py-1 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle className="h-3 w-3" />
                          Cliente Registrado
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <PaymentMethodButton
                    method="CASH"
                    icon={Banknote}
                    label="Efectivo"
                    selected={paymentMethod === "CASH"}
                    onClick={setPaymentMethod}
                  />
                  <PaymentMethodButton
                    method="TRANSFER"
                    icon={CreditCard}
                    label="Transf."
                    selected={paymentMethod === "TRANSFER"}
                    onClick={setPaymentMethod}
                  />
                  <PaymentMethodButton
                    method="QR"
                    icon={QrCode}
                    label="QR MP"
                    selected={paymentMethod === "QR"}
                    onClick={setPaymentMethod}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    Canal de Venta
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: "COUNTER", label: "Mostrador" },
                      { id: "RAPPI", label: "Rappi" },
                      { id: "PEYA", label: "Peya" },
                      { id: "WHATSAPP", label: "WApp" },
                      { id: "MERCADOPAGO", label: "MP Delivery" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setChannel(c.id)}
                        className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-all ${
                          channel === c.id
                            ? "bg-primary text-black border-primary shadow-lg shadow-yellow-500/10"
                            : "bg-transparent text-neutral-500 border-white/5 hover:bg-white/5"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex justify-between items-center">
                    Descuento Manual
                    {discount > 0 && (
                      <span className="text-primary">-${discount}</span>
                    )}
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discount || ""}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="glass-input pl-6 h-10 text-sm bg-black/40 border-white/5 focus:border-primary/50 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5 border-dashed">
                <div className="flex justify-between text-neutral-400 text-sm font-medium">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-primary text-sm font-bold">
                    <span>Descuento</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                {["RAPPI", "PEYA", "MERCADOPAGO"].includes(channel) && (
                  <div className="flex justify-between text-red-400/80 text-[11px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      Comisión App (35%)
                    </span>
                    <span>-${(total * 0.35).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-black text-2xl items-end pt-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider leading-none">
                      {["RAPPI", "PEYA", "MERCADOPAGO"].includes(channel)
                        ? "Neto Real"
                        : "Total"}
                    </span>
                    {["RAPPI", "PEYA", "MERCADOPAGO"].includes(channel) && (
                      <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-tighter mt-1">
                        Bruto: ${total.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span>
                    $
                    {(["RAPPI", "PEYA", "MERCADOPAGO"].includes(channel)
                      ? total * 0.65
                      : total
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full font-bold text-sm uppercase tracking-widest h-14 bg-primary text-black hover:bg-primary/90 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={cart.length === 0 || submitting}
                onClick={handleCheckout}
              >
                {submitting ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Cobrar Venta"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Receipt Modal */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="bg-zinc-950 text-white border border-white/10 max-w-sm p-0 overflow-hidden sm:rounded-3xl shadow-2xl">
            <div className="bg-primary p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 blur-3xl" />
              <div className="bg-black/10 backdrop-blur-sm h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 text-black relative z-10 shadow-xl">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black text-black tracking-tight relative z-10">
                ¡Venta Exitosa!
              </h2>
              <p className="font-bold text-black/60 relative z-10 uppercase tracking-widest text-xs mt-1">
                Burgertilin KDS
              </p>
            </div>

            <div className="p-8 space-y-6 relative">
              <div className="absolute top-0 left-0 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTAgTTEwIDAgTDIwIDEwIiBmaWxsPSIjZmJYM2IyNCIgLz48L3N2Zz4=')] -mt-3 transform rotate-180"></div>

              <div className="text-center pb-6 border-b border-white/5 border-dashed">
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">
                  Total Pagado
                </p>
                <p className="text-5xl font-black text-white tracking-tighter">
                  ${lastSaleData?.total.toFixed(0)}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-neutral-400">
                    {lastSaleData?.date.toLocaleTimeString()}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-[10px] font-bold text-primary uppercase">
                    {lastSaleData?.paymentMethod === "CASH"
                      ? "Efectivo"
                      : lastSaleData?.paymentMethod === "TRANSFER"
                        ? "Transferencia"
                        : "QR MP"}
                  </span>
                </div>
                {lastSaleData?.clientName && (
                  <p className="text-sm font-bold mt-4 text-neutral-300">
                    Cliente:{" "}
                    <span className="text-white">
                      {lastSaleData.clientName}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {lastSaleData?.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-sm items-baseline"
                  >
                    <span className="text-neutral-400 font-medium">
                      <strong className="text-white">{item.quantity}x</strong>{" "}
                      {item.productName}
                    </span>
                    <span className="font-bold font-mono text-white">
                      ${(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-6 space-y-3">
                <Button
                  className="w-full bg-[#25D366] text-black hover:bg-[#20bd5a] font-bold h-12 rounded-xl"
                  onClick={() => {
                    if (lastSaleData) {
                      const link = generateWhatsAppLink({
                        id: "N/A", // We don't have ID here easily without waiting for server, but logic works without it for message text
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
                  💬 Enviar Comprobante
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/10 hover:bg-white/5 hover:text-white text-neutral-400 font-bold h-12 rounded-xl"
                  onClick={() => setShowReceipt(false)}
                >
                  <Receipt className="mr-2 h-4 w-4" /> Nueva Venta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
