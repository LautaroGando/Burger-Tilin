"use client";

import { useEffect, useState, useMemo } from "react";
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
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import UpsellRecommender from "./UpsellRecommender";

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
  const [showMobileCart, setShowMobileCart] = useState(false);
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
      setShowMobileCart(false);
    } else {
      toast.error(
        res.error || "Error al registrar venta (Posible falta de stock)",
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black text-white selection:bg-primary selection:text-black overflow-hidden relative">
      {/* --- LEFT SIDE: PRODUCTS --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-8 pb-32 lg:pb-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 sm:mb-8">
            <Link href="/admin">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
                Punto de Venta
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </h1>
              <p className="hidden sm:block text-sm text-neutral-500 font-medium">
                Selecciona productos para generar la orden
              </p>
            </div>
          </div>

          {/* Category Filters (Sticky) */}
          <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl py-4 mb-4 -mx-3 px-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/5">
            {!loading && categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId("ALL")}
                  className={`flex-none px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border ${
                    selectedCategoryId === "ALL"
                      ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                      : "bg-white/5 text-neutral-500 border-white/5 hover:bg-white/10"
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex-none px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border ${
                      selectedCategoryId === cat.id
                        ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                        : "bg-white/5 text-neutral-500 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}

                <button
                  onClick={() => setSelectedCategoryId("NONE")}
                  className={`flex-none px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border ${
                    selectedCategoryId === "NONE"
                      ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                      : "bg-white/5 text-neutral-500 border-white/5 hover:bg-white/10"
                  }`}
                >
                  Otros
                </button>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex justify-center py-32 text-neutral-500">
                <Loader2 className="animate-spin h-10 w-10" />
              </div>
            ) : (
              <MotionDiv
                key={selectedCategoryId}
                className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 auto-rows-fr"
                initial="hidden"
                animate="show"
                variants={{
                  show: { transition: { staggerChildren: 0.03 } },
                }}
              >
                {filteredProducts.map((product) => {
                  const { finalPrice, isPromoActive, basePrice, discount } =
                    calculateItemPrice(product, channel);

                  return (
                    <MotionItem
                      key={product.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, scale: 0.9 },
                        show: { opacity: 1, scale: 1 },
                      }}
                    >
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full h-full flex flex-col justify-between group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-3 sm:p-4 text-left transition-all hover:bg-zinc-800/80 hover:border-white/20 active:scale-[0.98]"
                      >
                        {/* Status/Promo Badges */}
                        {isPromoActive && (
                          <div className="absolute top-0 right-0 p-2 sm:p-3">
                            <span className="bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-yellow-500/20">
                              -{discount}%
                            </span>
                          </div>
                        )}

                        <div className="space-y-1 mb-2">
                          <h3 className="text-xs sm:text-sm font-bold leading-tight text-white group-hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </div>

                        <div className="mt-auto pt-2 border-t border-white/5 border-dashed flex items-end justify-between w-full">
                          <div className="flex flex-col leading-none">
                            {isPromoActive && (
                              <span className="text-[10px] text-neutral-500 line-through mb-0.5">
                                ${Math.round(basePrice).toLocaleString()}
                              </span>
                            )}
                            <span className="text-sm sm:text-lg font-black text-primary tracking-tight">
                              ${Math.round(finalPrice).toLocaleString()}
                            </span>
                          </div>
                          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 group-hover:bg-primary group-hover:text-black transition-all">
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                        </div>
                      </button>
                    </MotionItem>
                  );
                })}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- RIGHT SIDE: CART (Desktop Sticky, Mobile Overlay) --- */}
      <>
        {/* Mobile Toggle Button (Floating) */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <Button
            onClick={() => setShowMobileCart(true)}
            className="w-full h-16 rounded-2xl bg-primary text-black font-black uppercase text-lg shadow-[0_0_30px_rgba(251,191,36,0.3)] flex justify-between px-6 items-center"
          >
            <span className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-5 w-5" />
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
              Ver Pedido
            </span>
            <span>${total.toLocaleString()}</span>
          </Button>
        </div>

        {/* Cart Container */}
        <div
          className={`
            fixed lg:relative inset-0 z-40 lg:z-10
            bg-zinc-950 lg:bg-[#070707] 
            lg:w-[420px] xl:w-[480px] lg:border-l lg:border-white/10
            flex flex-col h-full
            transform transition-transform duration-300 ease-in-out
            ${showMobileCart ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
          `}
        >
          {/* Mobile Header (Close Button) */}
          <div className="lg:hidden p-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Tu Pedido
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileCart(false)}
              className="rounded-full text-neutral-400 hover:text-white"
            >
              <ChevronUp className="h-6 w-6 rotate-180" />
            </Button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex p-6 border-b border-white/5 items-center justify-between bg-zinc-900/30">
            <h2 className="text-xl font-black text-white uppercase flex items-center gap-2 tracking-wide">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Ticket Actual
            </h2>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-neutral-400">
              {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Cart Items (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-6 opacity-30">
                <ShoppingCart className="h-16 w-16" />
                <p className="font-bold text-sm uppercase tracking-widest">
                  Esperando productos...
                </p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="group flex items-center justify-between p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-white font-bold text-sm mb-0.5 truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-primary font-bold font-mono">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/5 shrink-0">
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
                ))}

                {/* Upsell Recommender Inline */}
                <UpsellRecommender
                  cart={cart}
                  products={products}
                  onAdd={addToCart}
                />
              </>
            )}
          </div>

          {/* Settings & Totals (Fixed Bottom) */}
          <div className="p-4 lg:p-6 bg-zinc-900/50 lg:bg-[#0A0A0A] border-t border-white/10 backdrop-blur-xl">
            <div className="space-y-5">
              {/* Customer Search */}
              <div className="relative z-20">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Cliente (Opcional)"
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
                  className="pl-10 h-10 bg-white/5 border-white/5 rounded-xl text-sm focus:border-primary/50"
                  onFocus={() => setShowMobileCart(true)} // Ensure keyboard doesn't hide cart on mobile
                />
                {searchResults.length > 0 && !selectedCustomerId && (
                  <div className="absolute top-full left-0 w-full bg-[#151515] border border-white/10 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto mt-2 p-1">
                    {searchResults.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 hover:bg-white/5 cursor-pointer rounded-lg flex justify-between items-center group"
                        onClick={() => {
                          setClientName(c.name || "Cliente");
                          setSelectedCustomerId(c.id);
                          setSearchResults([]);
                        }}
                      >
                        <span className="text-sm font-bold text-white group-hover:text-primary">
                          {c.name}
                        </span>
                        <CheckCircle className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Methods & Channels */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">
                    Método de Pago
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPaymentMethod("CASH")}
                      className={`flex-1 h-8 rounded-lg border flex items-center justify-center ${paymentMethod === "CASH" ? "bg-primary border-primary text-black" : "border-white/10 text-neutral-500"}`}
                    >
                      <Banknote className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPaymentMethod("TRANSFER")}
                      className={`flex-1 h-8 rounded-lg border flex items-center justify-center ${paymentMethod === "TRANSFER" ? "bg-primary border-primary text-black" : "border-white/10 text-neutral-500"}`}
                    >
                      <CreditCard className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPaymentMethod("QR")}
                      className={`flex-1 h-8 rounded-lg border flex items-center justify-center ${paymentMethod === "QR" ? "bg-primary border-primary text-black" : "border-white/10 text-neutral-500"}`}
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">
                    Canal
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full h-8 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white px-2 outline-none focus:border-primary/50 flex items-center justify-between">
                        <span>
                          {channel === "COUNTER" && "Mostrador"}
                          {channel === "RAPPI" && "Rappi"}
                          {channel === "PEYA" && "Peya"}
                          {channel === "MERCADOPAGO" && "MP Delivery"}
                          {channel === "WHATSAPP" && "WhatsApp"}
                        </span>
                        <ChevronUp className="h-3 w-3 rotate-180 text-neutral-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#111] border-white/10 text-white min-w-[200px]">
                      {[
                        { id: "COUNTER", label: "Mostrador" },
                        { id: "RAPPI", label: "Rappi" },
                        { id: "PEYA", label: "Peya" },
                        { id: "MERCADOPAGO", label: "MP Delivery" },
                        { id: "WHATSAPP", label: "WhatsApp" },
                      ].map((c) => (
                        <DropdownMenuItem
                          key={c.id}
                          onClick={() => setChannel(c.id)}
                          className="hover:bg-white/10 cursor-pointer font-medium text-xs py-2"
                        >
                          {c.label}
                          {channel === c.id && (
                            <CheckCircle className="ml-auto h-3 w-3 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-white/5 border-dashed space-y-1">
                <div className="flex justify-between text-neutral-400 text-xs">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <span className="text-xl font-black text-white uppercase tracking-tight">
                    Total
                  </span>
                  <span className="text-3xl font-black text-primary tracking-tighter">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                size="lg"
                className="w-full h-14 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                disabled={cart.length === 0 || submitting}
                onClick={handleCheckout}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "COBRAR VENTA"
                )}
              </Button>
            </div>
          </div>
        </div>
      </>

      {/* Receipt Modal (Unchanged logic, style tweaks) */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-zinc-950 text-white border border-white/10 max-w-sm p-0 sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
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
                  <span className="text-white">{lastSaleData.clientName}</span>
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
  );
}
