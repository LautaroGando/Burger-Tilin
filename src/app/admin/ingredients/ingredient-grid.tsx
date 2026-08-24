"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  ChevronDown,
  X,
  ArrowDownLeft,
  DollarSign,
  Package,
  CheckCircle2,
} from "lucide-react";
import { Ingredient } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteIngredient } from "@/app/actions/ingredient-actions";
import EditIngredientForm from "./edit-ingredient-form";
import WasteLogForm from "./waste-log-form";
import PriceHistoryChart from "./PriceHistoryChart";
import { toast } from "sonner";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";

interface IngredientGridProps {
  ingredients: Ingredient[];
}

// ── Stock status ─────────────────────────────────────────────────────────────
type StockStatus = "critical" | "low" | "ok";

function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "critical";
  if (stock <= minStock) return "low";
  return "ok";
}

function StockBadge({ status, stock, unit }: { status: StockStatus; stock: number; unit: string }) {
  const configs = {
    critical: {
      dot: "bg-red-500",
      text: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      label: "Agotado",
    },
    low: {
      dot: "bg-amber-400",
      text: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      label: "Bajo",
    },
    ok: {
      dot: "bg-green-500",
      text: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      label: "OK",
    },
  };

  const cfg = configs[status];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className={cfg.text}>
        {stock.toFixed(1)} {unit} — {cfg.label}
      </span>
    </div>
  );
}

// ── Stock bar ─────────────────────────────────────────────────────────────────
function StockBar({ stock, minStock }: { stock: number; minStock: number }) {
  const maxDisplay = Math.max(stock, minStock * 3, 1);
  const pct = Math.max(0, Math.min((stock / maxDisplay) * 100, 100));
  const status = getStockStatus(stock, minStock);

  const barColor =
    status === "critical"
      ? "bg-red-500"
      : status === "low"
        ? "bg-amber-400"
        : "bg-green-500";

  return (
    <div className="w-full bg-white/5 rounded-full h-1">
      <div
        className={`h-1 rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Quick waste panel ─────────────────────────────────────────────────────────
function QuickWastePanel({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient;
  onClose: () => void;
}) {
  return (
    <div className="bg-neutral-950 border border-red-500/20 rounded-2xl p-5 shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <ArrowDownLeft className="h-4 w-4 text-red-400" />
        <p className="text-sm font-bold text-white">Registrar merma</p>
        <span className="text-xs text-neutral-500">— {ingredient.name}</span>
        <button onClick={onClose} className="ml-auto text-neutral-600 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <WasteLogForm
        ingredientId={ingredient.id}
        unit={ingredient.unit}
        onSuccess={onClose}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function IngredientGrid({ ingredients }: IngredientGridProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "critical" | "low" | "ok">("ALL");
  const [wastePanel, setWastePanel] = useState<string | null>(null); // ingredientId
  const [editId, setEditId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getStockStatus(Number(ing.stock), Number(ing.minStock));
      const matchStatus = filterStatus === "ALL" || status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [ingredients, searchTerm, filterStatus]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalValue = ingredients.reduce(
    (sum, ing) => sum + Number(ing.cost) * Number(ing.stock),
    0
  );
  const criticalCount = ingredients.filter(
    (ing) => Number(ing.stock) <= 0
  ).length;
  const lowCount = ingredients.filter(
    (ing) =>
      Number(ing.stock) > 0 && Number(ing.stock) <= Number(ing.minStock)
  ).length;
  const okCount = ingredients.length - criticalCount - lowCount;

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const res = await deleteIngredient(id);
    if (res.success) {
      toast.success("✓ Insumo eliminado");
      setDeleteDialogId(null);
      router.refresh();
    } else {
      toast.error(res.error || "Error al eliminar");
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            label: "Capital inventario",
            value: `$${Math.round(totalValue).toLocaleString("es-AR")}`,
            color: "text-primary",
            icon: DollarSign,
          },
          {
            label: "Agotados",
            value: `${criticalCount}`,
            color: criticalCount > 0 ? "text-red-400" : "text-neutral-500",
            icon: AlertTriangle,
          },
          {
            label: "Stock bajo",
            value: `${lowCount}`,
            color: lowCount > 0 ? "text-amber-400" : "text-neutral-500",
            icon: Package,
          },
          {
            label: "En orden",
            value: `${okCount}`,
            color: "text-green-400",
            icon: CheckCircle2,
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-neutral-950 border border-white/5 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="shrink-0 h-8 w-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div>
              <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider">
                {kpi.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar insumo..."
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

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as typeof filterStatus)
            }
            className="appearance-none pl-3 pr-7 py-2 bg-neutral-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-primary/40 cursor-pointer"
          >
            <option value="ALL">Todos los estados</option>
            <option value="critical">🔴 Agotados</option>
            <option value="low">🟡 Stock bajo</option>
            <option value="ok">🟢 En orden</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
        </div>

        <span className="text-xs text-neutral-600 ml-auto">
          {filtered.length} insumo{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center px-4 py-2.5 border-b border-white/5 bg-white/[0.02]"
          style={{ gridTemplateColumns: "1fr 6rem 5rem 5rem 6rem 7rem 8rem 7rem" }}
        >
          {["Insumo", "Stock actual", "Mínimo", "Unidad", "Costo u.", "Valor stock", "Estado", "Acciones"].map(
            (h) => (
              <span
                key={h}
                className={`text-[9px] font-bold text-neutral-600 uppercase tracking-wider ${h === "Acciones" ? "text-right" : ""}`}
              >
                {h}
              </span>
            )
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((ing) => {
            const status = getStockStatus(Number(ing.stock), Number(ing.minStock));
            const stockValue = Number(ing.cost) * Number(ing.stock);
            const isWasteOpen = wastePanel === ing.id;

            return (
              <div key={ing.id}>
                {/* Main row */}
                <div
                  className={`grid items-center px-4 py-3 transition-colors hover:bg-white/[0.02] group ${
                    status === "critical"
                      ? "bg-red-500/[0.02]"
                      : status === "low"
                        ? "bg-amber-500/[0.02]"
                        : ""
                  }`}
                  style={{ gridTemplateColumns: "1fr 6rem 5rem 5rem 6rem 7rem 8rem 7rem" }}
                >
                  {/* Name + bar */}
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      {status !== "ok" && (
                        <AlertTriangle
                          className={`h-3 w-3 shrink-0 ${
                            status === "critical" ? "text-red-500" : "text-amber-400"
                          }`}
                        />
                      )}
                      <p className="text-sm font-semibold text-white truncate">
                        {ing.name}
                      </p>
                    </div>
                    <div className="mt-1.5 mr-4 max-w-32">
                      <StockBar
                        stock={Number(ing.stock)}
                        minStock={Number(ing.minStock)}
                      />
                    </div>
                  </div>

                  {/* Stock */}
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      status === "critical"
                        ? "text-red-400"
                        : status === "low"
                          ? "text-amber-400"
                          : "text-white"
                    }`}
                  >
                    {Number(ing.stock).toFixed(2)}
                  </span>

                  {/* Min stock */}
                  <span className="text-xs text-neutral-600 tabular-nums">
                    {Number(ing.minStock).toFixed(2)}
                  </span>

                  {/* Unit */}
                  <span className="text-xs text-neutral-500 uppercase font-bold">
                    {ing.unit}
                  </span>

                  {/* Unit cost */}
                  <span className="text-xs text-neutral-400 tabular-nums">
                    ${Number(ing.cost).toLocaleString("es-AR")}
                  </span>

                  {/* Stock value */}
                  <span className="text-sm font-bold text-white tabular-nums">
                    ${Math.round(stockValue).toLocaleString("es-AR")}
                  </span>

                  {/* Status */}
                  <div className="flex items-center">
                    <StockBadge
                      status={status}
                      stock={Number(ing.stock)}
                      unit={ing.unit}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">

                    {/* Waste quick action */}
                    <IconButton
                      icon={<ArrowDownLeft className="h-4 w-4" />}
                      tooltip="Registrar merma"
                      variant="ghost"
                      onClick={() => setWastePanel(isWasteOpen ? null : ing.id)}
                      className={
                        isWasteOpen
                          ? "bg-red-500/20 text-red-400"
                          : "action-btn"
                      }
                    />

                    {/* Edit */}
                    <IconButton
                      icon={<Pencil className="h-4 w-4" />}
                      tooltip="Editar insumo"
                      variant="ghost"
                      onClick={() => setEditId(ing.id)}
                      className="action-btn"
                    />

                    {/* History */}
                    <IconButton
                      icon={<span className="text-[10px] font-black">$</span>}
                      tooltip="Historial de precios"
                      variant="ghost"
                      onClick={() => setHistoryId(ing.id)}
                      className="action-btn"
                    />

                    {/* Delete */}
                    <IconButton
                      icon={<Trash2 className="h-4 w-4" />}
                      tooltip="Eliminar"
                      variant="ghost"
                      onClick={() => setDeleteDialogId(ing.id)}
                      className="action-btn-danger"
                    />
                  </div>
                </div>

                {/* Inline waste panel */}
                {isWasteOpen && (
                  <div className="px-4 pb-4">
                    <QuickWastePanel
                      ingredient={ing}
                      onClose={() => setWastePanel(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <Search className="h-10 w-10 text-neutral-800" />
            <p className="text-neutral-500 font-bold text-sm">
              No se encontraron insumos
            </p>
            {(searchTerm || filterStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("ALL");
                }}
                className="text-xs text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-white/10 rounded-3xl w-[95%] max-w-lg p-0 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="bg-gradient-to-b from-primary/10 to-transparent p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white">
                Editar <span className="text-primary">Insumo</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 pt-2">
            {editId && (
              <EditIngredientForm
                ingredient={ingredients.find((i) => i.id === editId)!}
                onSuccess={() => setEditId(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Price history modal ──────────────────────────────────────────── */}
      <Dialog open={!!historyId} onOpenChange={(open) => !open && setHistoryId(null)}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-white/10 rounded-3xl w-[95%] max-w-lg p-0 shadow-2xl text-white max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="bg-gradient-to-b from-blue-500/10 to-transparent p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white">
                Historial de <span className="text-blue-400">Precios</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 pt-2 h-64">
            {historyId && (
              <PriceHistoryChart ingredientId={historyId} />
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* ── Confirm Delete ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteDialogId}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
        icon={<Trash2 className="h-6 w-6 text-red-500" />}
        title={
          <>
            ¿Eliminar <span className="text-red-500">Insumo</span>?
          </>
        }
        description={
          <>
            Se eliminará este insumo y se quitará de todas las recetas asociadas.
          </>
        }
        onConfirm={() => {
          if (deleteDialogId) handleDelete(deleteDialogId);
        }}
      />
    </div>
  );
}
