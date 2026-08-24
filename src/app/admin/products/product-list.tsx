"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import {
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  Check,
  X,
  Percent,
  ToggleLeft,
  ToggleRight,
  Tag,
  Filter,
  Zap,
} from "lucide-react";
import { Product, Ingredient } from "@/lib/types";

import { MarginCell } from "./margin-cell";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
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
import {
  updateProductPrice,
  bulkToggleProducts,
  bulkApplyPromo,
} from "@/app/actions/product-actions";
import { toast } from "sonner";
import { CategoryPromoSheet } from "./product-channel-sheet";

interface PlatformConfig {
  id: string;
  name: string;
  commission: number;
  updatedAt: Date;
}

interface ProductListProps {
  products: Product[];
  categories: { id: string; name: string }[];
  ingredients: Ingredient[];
  platformConfigs: PlatformConfig[];
}

// ── Inline editable price cell ───────────────────────────────────────────────
function InlinePrice({
  productId,
  value,
}: {
  productId: string;
  value: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    const n = Number(draft);
    if (!isNaN(n) && n > 0 && n !== value) {
      setSaving(true);
      const res = await updateProductPrice(productId, n);
      if (res.success) toast.success("✓ Precio actualizado");
      else toast.error("Error al guardar");
      setSaving(false);
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
          setTimeout(() => inputRef.current?.select(), 10);
        }}
        className="text-sm font-bold text-white hover:text-primary transition-colors cursor-pointer tabular-nums group flex items-center gap-1"
        title="Click para editar"
      >
        ${value.toLocaleString("es-AR")}
        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-neutral-500">$</span>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={save}
        autoFocus
        className="w-20 bg-white/10 border border-primary/50 rounded px-1 py-0.5 text-xs text-white outline-none tabular-nums"
        disabled={saving}
      />
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
        active
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-neutral-800 text-neutral-500 border border-white/5"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-400" : "bg-neutral-600"}`}
      />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

// ── Promo badge ──────────────────────────────────────────────────────────────
function PromoBadge({
  isPromo,
  discount,
  isPromoApps,
  discountApps,
}: {
  isPromo: boolean;
  discount: number;
  isPromoApps?: boolean;
  discountApps?: number | null;
}) {
  if (!isPromo && !isPromoApps) return <span className="text-neutral-700 text-xs">—</span>;
  
  return (
    <div className="flex flex-col gap-1">
      {isPromo && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 w-fit">
          <span className="text-[8px] uppercase">L</span>
          {discount}%
        </span>
      )}
      {isPromoApps && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
          <span className="text-[8px] uppercase">A</span>
          {discountApps}%
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductList({
  products,
  categories,
  ingredients,
  platformConfigs,
}: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPromo, setFilterPromo] = useState<boolean | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showBulkPromoModal, setShowBulkPromoModal] = useState(false);
  const [showCategoryPromoSheet, setShowCategoryPromoSheet] = useState(false);
  const [bulkDiscount, setBulkDiscount] = useState("20");
  const [isPending, startTransition] = useTransition();

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const calculateCost = (product: Product) => {
    if (!product.recipe || product.recipe.length === 0) return 0;
    return product.recipe.reduce((sum, ri) => {
      return sum + Number(ri.quantity) * Number(ri.ingredient.cost);
    }, 0);
  };

  const calculateMargin = (price: number, cost: number) => {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  };

  // ── Filtered products ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "ALL" ||
        (filterCategory === "NONE" ? !p.categoryId : p.categoryId === filterCategory);
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" ? p.isActive : !p.isActive);
      const matchesPromo = filterPromo === null || p.isPromo === filterPromo;
      return matchesSearch && matchesCategory && matchesStatus && matchesPromo;
    });
  }, [products, searchTerm, filterCategory, filterStatus, filterPromo]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filtered.forEach((p) => {
      const cat = p.category?.name || "Sin Categoría";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === "Sin Categoría") return 1;
        if (b === "Sin Categoría") return -1;
        return a.localeCompare(b);
      })
      .map((k) => ({ category: k, products: groups[k] }));
  }, [filtered]);

  // ── Product counts per category for promo sheet ───────────────────────────
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // ── Selection handlers ─────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedList = Array.from(selectedIds);

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const handleBulkActivate = (active: boolean) => {
    startTransition(async () => {
      const res = await bulkToggleProducts(selectedList, active);
      if (res.success) {
        toast.success(`✓ ${selectedList.length} productos ${active ? "activados" : "desactivados"}`);
        clearSelection();
      } else {
        toast.error("Error al actualizar");
      }
    });
  };

  const handleBulkPromo = async () => {
    const d = Number(bulkDiscount);
    if (isNaN(d) || d < 0 || d > 100) {
      toast.error("Descuento inválido");
      return;
    }
    const res = await bulkApplyPromo(selectedList, d, true);
    if (res.success) {
      toast.success(`✓ Oferta del ${d}% aplicada a ${selectedList.length} productos`);
      setShowBulkPromoModal(false);
      clearSelection();
    } else {
      toast.error("Error al aplicar oferta");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">

      {/* ── Quick Promo Banner ────────────────────────────────────────────── */}
      <button
        onClick={() => setShowCategoryPromoSheet(true)}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15 text-primary group-hover:bg-primary/25 transition-colors">
            <Zap className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-primary uppercase tracking-wider">
              Gestionar Promociones por Categoría
            </p>
            <p className="text-[10px] font-bold text-neutral-500 uppercase">
              Aplicar o quitar descuentos a toda una categoría de una vez
            </p>
          </div>
        </div>
        <Tag className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
      </button>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-white/5 rounded-xl text-sm text-white placeholder:text-neutral-700 outline-none focus:border-primary/40 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600 pointer-events-none" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none pl-8 pr-7 py-2 bg-neutral-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-primary/40 cursor-pointer"
          >
            <option value="ALL">Todas las categorías</option>
            <option value="NONE">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none px-3 pr-7 py-2 bg-neutral-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-primary/40 cursor-pointer"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
        </div>

        {/* Promo filter */}
        <button
          onClick={() => setFilterPromo(filterPromo === true ? null : true)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
            filterPromo === true
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-neutral-950 border-white/5 text-neutral-500 hover:border-white/10"
          }`}
        >
          <Percent className="h-3 w-3 inline mr-1" />
          En oferta
        </button>

        <span className="text-xs text-neutral-600 ml-auto">
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-xs font-bold text-primary">
            {selectedIds.size} seleccionados
          </span>
          <div className="h-3 w-px bg-primary/20 mx-1" />
          <button
            onClick={() => handleBulkActivate(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors"
          >
            <ToggleRight className="h-3.5 w-3.5" /> Activar
          </button>
          <button
            onClick={() => handleBulkActivate(false)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 border border-white/5 text-neutral-400 text-xs font-bold hover:bg-neutral-700 transition-colors"
          >
            <ToggleLeft className="h-3.5 w-3.5" /> Desactivar
          </button>
          <button
            onClick={() => setShowBulkPromoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <Tag className="h-3.5 w-3.5" /> Aplicar oferta
          </button>
          <button
            onClick={clearSelection}
            className="ml-auto text-neutral-600 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid items-center px-4 py-2.5 border-b border-white/5 bg-white/[0.02]"
          style={{ gridTemplateColumns: "2rem 1fr 7rem 6rem 7rem 5rem 6rem 5rem 5rem" }}>
          <input
            type="checkbox"
            checked={selectedIds.size === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll}
            className="rounded border-white/20 bg-white/5 accent-primary cursor-pointer h-3.5 w-3.5"
          />
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            Producto
          </span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            Categoría
          </span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            Precio
          </span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            Costo
          </span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            Margen
          </span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            Oferta
          </span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
            Estado
          </span>
          <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider text-right">
            Acción
          </span>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-white/[0.04]">
          {groupedProducts.map((group) => (
            <div key={group.category}>
              {/* Category Header */}
              <div
                className="px-4 py-2 bg-white/[0.02] border-b border-t border-white/5 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-white/[0.04]"
                onClick={() => toggleCategory(group.category)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-primary">
                    {group.category}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                    {group.products.length}
                  </span>
                </div>
                <div className="text-neutral-500">
                  {collapsedCategories.has(group.category) ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest">Mostrar</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest">Ocultar</span>
                  )}
                </div>
              </div>
              {!collapsedCategories.has(group.category) && (
                <div className="divide-y divide-white/[0.04]">
                  {group.products.map((product) => {
                    const cost = calculateCost(product);
                    const basePrice = Number(product.price);
                    const finalPrice = product.isPromo ? basePrice * (1 - (product.promoDiscount || 0) / 100) : basePrice;
                    const margin = calculateMargin(finalPrice, cost);
                    const isSelected = selectedIds.has(product.id);

                    const pYaConfig = platformConfigs?.find(c => c.name === "PEYA");
                    const rappiConfig = platformConfigs?.find(c => c.name === "RAPPI");
                    const mpConfig = platformConfigs?.find(c => c.name === "MERCADOPAGO" || c.name === "MP");

                    const getAppStats = (config: PlatformConfig | undefined, icon: string, color: string) => {
                      if (!config) return null;
                      const baseAppPrice = product.priceApps ? Number(product.priceApps) : basePrice;
                      const appFinalPrice = product.isPromoApps 
                        ? baseAppPrice * (1 - (product.promoDiscountApps || 0) / 100) 
                        : baseAppPrice;

                      const commPercent = Number(config.commission);
                      const commAmount = appFinalPrice * (commPercent / 100);
                      const net = appFinalPrice - commAmount;
                      const appMargin = appFinalPrice > 0 ? ((net - cost) / appFinalPrice) * 100 : 0;
                      return { commPercent, commAmount, appMargin, icon, color, appFinalPrice };
                    };

                    const apps = [
                      getAppStats(pYaConfig, "🔴", "text-red-500"),
                      getAppStats(rappiConfig, "🟠", "text-orange-400"),
                      getAppStats(mpConfig, "🔵", "text-blue-400"),
                    ].filter(Boolean) as { commPercent: number, commAmount: number, appMargin: number, icon: string, color: string, appFinalPrice: number }[];

                    return (
                      <div
                        key={product.id}
                        className={`group grid items-center px-4 py-3 transition-colors hover:bg-white/[0.04] ${
                          isSelected ? "bg-primary/[0.03]" : ""
                        }`}
                        style={{ gridTemplateColumns: "2rem 1fr 7rem 6rem 7rem 5rem 6rem 5rem 5rem" }}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded border-white/20 bg-white/5 accent-primary cursor-pointer h-3.5 w-3.5 prevent-row-click"
                        />

                        {/* Name */}
                        <div>
                          <p className="text-sm font-semibold text-white truncate">
                            {product.name}
                          </p>
                          {product.description && (
                            <p className="text-[9px] text-neutral-600 truncate mt-0.5">
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Category */}
                        <span className="text-xs text-neutral-500 truncate">
                          {product.category?.name ?? "—"}
                        </span>

                        {/* Price (inline edit) */}
                        <div className="prevent-row-click flex flex-col gap-1.5 py-1">
                          <InlinePrice productId={product.id} value={Number(product.price)} />
                          {apps.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {apps.map((app, i) => (
                                <span key={i} className="text-[9px] font-bold text-neutral-500 flex items-center gap-1 opacity-70">
                                  <span className="text-[8px]">{app.icon}</span> ${Math.round(app.appFinalPrice).toLocaleString("es-AR")}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Cost */}
                        <div className="flex flex-col gap-1.5 py-1">
                          <span className="text-xs text-neutral-500 tabular-nums">
                            {cost > 0 ? `$${Math.round(cost).toLocaleString("es-AR")}` : "—"}
                          </span>
                          {apps.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {apps.map((app, i) => (
                                <span key={i} className="text-[9px] font-bold text-red-400 flex items-center gap-1 tabular-nums opacity-80">
                                  -${Math.round(app.commAmount).toLocaleString("es-AR")} <span className="text-[8px] opacity-60">({Math.round(app.commPercent)}%)</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Margin */}
                        <div className="flex flex-col gap-1.5 py-1">
                          {cost > 0 ? (
                            <MarginCell margin={margin} />
                          ) : (
                            <span className="text-neutral-700 text-xs">—</span>
                          )}
                          {apps.length > 0 && cost > 0 && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {apps.map((app, i) => (
                                <span key={i} className={`text-[10px] font-black ${app.color} flex items-center gap-1 tabular-nums opacity-90`}>
                                  {Math.round(app.appMargin)}%
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Promo */}
                        <PromoBadge 
                          isPromo={product.isPromo} 
                          discount={product.promoDiscount}
                          isPromoApps={product.isPromoApps}
                          discountApps={product.promoDiscountApps} 
                        />

                        {/* Status */}
                        <StatusBadge active={product.isActive} />

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 prevent-row-click">
                          {/* Edit */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <div>
                                <IconButton
                                  icon={<Pencil className="h-4 w-4" />}
                                  tooltip="Editar producto"
                                  variant="ghost"
                                  className="action-btn"
                                />
                              </div>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-white/10 rounded-3xl w-[95%] max-w-2xl p-0 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar">
                              <div className="bg-gradient-to-b from-primary/10 to-transparent p-6 pb-4">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                    Editar <span className="text-primary">{product.name}</span>
                                  </DialogTitle>
                                </DialogHeader>
                              </div>
                              <div className="p-6 pt-2">
                                <EditProductForm
                                  product={product}
                                  categories={categories}
                                  allProducts={products}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Recipe editor */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <div>
                                <IconButton
                                  icon={<span className="text-[10px] font-black">R</span>}
                                  tooltip="Receta e insumos"
                                  variant="ghost"
                                  className="action-btn text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                />
                              </div>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-white/10 rounded-3xl w-[95%] max-w-2xl p-0 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar">
                              <div className="bg-gradient-to-b from-blue-500/10 to-transparent p-6 pb-4">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-black text-white">
                                    Receta — <span className="text-blue-400">{product.name}</span>
                                  </DialogTitle>
                                </DialogHeader>
                              </div>
                              <div className="p-6 pt-2">
                                <RecipeEditor
                                  productId={product.id}
                                  productPrice={product.price}
                                  existingRecipe={product.recipe || []}
                                  availableIngredients={ingredients}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Delete */}
                          <DeleteProductButton productId={product.id} productName={product.name} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <Search className="h-10 w-10 text-neutral-800" />
            <p className="text-neutral-500 font-bold text-sm">
              {searchTerm ? "No hay productos con ese nombre" : "No hay productos en esta categoría"}
            </p>
            {(searchTerm || filterCategory !== "ALL" || filterStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("ALL");
                  setFilterStatus("ALL");
                  setFilterPromo(null);
                }}
                className="text-xs text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Bulk promo modal (for selected products) ──────────────────────── */}
      <Dialog open={showBulkPromoModal} onOpenChange={setShowBulkPromoModal}>
        <DialogContent className="bg-zinc-950 border border-white/10 rounded-3xl max-w-sm p-6 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white">
              Aplicar <span className="text-primary">oferta a selección</span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500 mt-1">
            Aplicar a <strong className="text-white">{selectedIds.size} productos</strong>
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                Descuento (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={bulkDiscount}
                  onChange={(e) => setBulkDiscount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-black outline-none focus:border-primary/50 transition-colors pr-8"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-neutral-400 hover:text-white font-bold rounded-xl"
                onClick={() => setShowBulkPromoModal(false)}
              >
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button
                className="flex-1 bg-primary text-black font-black rounded-xl hover:bg-primary/80"
                onClick={handleBulkPromo}
              >
                <Check className="h-4 w-4 mr-2" /> Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Category Promo Sheet ───────────────────────────────────────────── */}
      <CategoryPromoSheet
        open={showCategoryPromoSheet}
        onClose={() => setShowCategoryPromoSheet(false)}
        categories={categories}
        productCountByCategory={productCountByCategory}
        totalProducts={products.length}
      />
    </div>
  );
}
