"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findSaleById, refundSale } from "@/app/actions/operations-actions";
import { Loader2, Search, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SaleItemType = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string };
};

type SaleType = {
  id: string;
  date: Date | string;
  clientName: string | null;
  total: number;
  status: string;
  items: SaleItemType[];
};

export default function RefundSearch() {
  const [query, setQuery] = useState("");
  const [sale, setSale] = useState<SaleType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    setSale(null);

    const res = await findSaleById(query);
    if (res.success && res.data) {
      setSale(res.data as unknown as SaleType);
    } else {
      setError(res.error || "No encontrado");
    }
    setLoading(false);
  };

  const handleRefund = async () => {
    if (!sale) return;
    setIsConfirming(true);
  };

  const executeRefund = async () => {
    if (!sale) return;
    setRefunding(true);
    const res = await refundSale(sale.id);
    if (res.success) {
      setSale({ ...sale, status: "REFUNDED" });
      toast.success("Venta reembolsada correctamente");
      setIsConfirming(false);
    } else {
      toast.error(res.error || "Error al reembolsar");
      setIsConfirming(false);
    }
    setRefunding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="ID de Venta (Ej: UUID o fragmento)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-black/20 border-white/10"
        />
        <Button onClick={handleSearch} disabled={loading} variant="secondary">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {sale && (
        <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg text-white">
                Venta #{sale.id.slice(0, 8)}
              </p>
              <p className="text-sm text-gray-400">
                {new Date(sale.date).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Cliente: {sale.clientName || "Mostrador"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">
                ${Number(sale.total).toFixed(2)}
              </p>
              <div
                className={`
                                inline-block px-2 py-1 rounded text-xs font-bold mt-2
                                ${sale.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : ""}
                                ${sale.status === "REFUNDED" ? "bg-red-500/20 text-red-500" : ""}
                                ${sale.status === "PENDING" ? "bg-yellow-500/20 text-yellow-500" : ""}
                             `}
              >
                {sale.status}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-gray-500 mb-2 font-bold uppercase">
              Items
            </p>
            <ul className="space-y-1 text-sm text-gray-300">
              {sale.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span>${Number(item.unitPrice).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {sale.status !== "REFUNDED" && (
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleRefund}
                disabled={refunding}
                variant="destructive"
                className="font-bold bg-red-600 hover:bg-red-700"
              >
                {refunding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reembolsar Venta
              </Button>
            </div>
          )}
          {sale.status === "REFUNDED" && (
            <div className="pt-4 flex items-center gap-2 text-red-400 text-sm font-bold justify-end">
              <AlertTriangle className="h-4 w-4" /> Venta ya reembolsada
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="bg-[#1a1a1a] border border-white/10 text-white shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              ¿Confirmar Reembolso?
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-4">
              Esta acción marcará la venta como reembolsada y revertirá los
              efectos en el sistema si aplica. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-4">
            <Button
              variant="outline"
              className="border-white/10"
              onClick={() => setIsConfirming(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 font-bold"
              onClick={executeRefund}
              disabled={refunding}
            >
              {refunding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Confirmar Reembolso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
