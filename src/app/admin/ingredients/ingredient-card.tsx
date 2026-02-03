"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pencil,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Info,
  History,
} from "lucide-react";
import { deleteIngredient } from "@/app/actions/ingredient-actions";
import { toast } from "sonner";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ingredient } from "@/lib/types";
import EditIngredientForm from "./edit-ingredient-form";
import WasteLogForm from "./waste-log-form";
import PriceHistoryChart from "./PriceHistoryChart";

interface IngredientCardProps {
  ingredient: Ingredient;
}

export default function IngredientCard({ ingredient }: IngredientCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showWaste, setShowWaste] = useState(false);

  // Calcula el valor total del stock
  const stockValue = Number(ingredient.cost) * Number(ingredient.stock);
  const isLowStock = Number(ingredient.stock) <= Number(ingredient.minStock);

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl h-full flex flex-col ${
        isLowStock
          ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40 shadow-red-500/5"
          : "bg-zinc-900/40 backdrop-blur-3xl border-white/5 hover:border-primary/30 shadow-black/40"
      }`}
      style={{
        borderRadius: "2rem",
      }}
    >
      {/* Top Status Indicator Line (Subtle) */}
      <div
        className={`absolute top-0 left-0 w-full h-[2px] transition-all duration-500 ${
          isLowStock
            ? "bg-red-500"
            : "bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100"
        }`}
      />

      <CardHeader className="p-5 pb-3 shrink-0">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                  isLowStock
                    ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    : "bg-green-500/50"
                }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                  isLowStock ? "text-red-400" : "text-zinc-500"
                }`}
              >
                {isLowStock ? "CRÍTICO" : "DISPONIBLE"}
              </span>
            </div>
            <CardTitle className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight truncate pr-8">
              {ingredient.name}
            </CardTitle>
          </div>

          <div className="absolute right-4 top-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 ring-1 ring-white/5 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-zinc-950 border-white/10 text-white"
              >
                <DropdownMenuItem
                  onClick={() => setShowEdit(true)}
                  className="hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDelete(true)}
                  className="hover:bg-red-500/20 hover:text-red-500 text-red-400 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <div className="grow flex flex-col px-5 pb-5 overflow-hidden">
        <Tabs defaultValue="info" className="flex flex-col grow">
          <TabsList className="bg-white/3 border border-white/5 p-1 rounded-xl h-10 mb-4 w-full sm:w-fit mx-auto overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="info"
              className="flex-1 sm:flex-none rounded-lg px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <Info className="h-3 w-3 mr-2 hidden xs:block" /> Info
            </TabsTrigger>
            <TabsTrigger
              value="hist"
              className="flex-1 sm:flex-none rounded-lg px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <History className="h-3 w-3 mr-2 hidden xs:block" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="info"
            className="grow flex flex-col focus-visible:ring-0 mt-0"
          >
            <div className="space-y-4 grow">
              {/* Stock Indicator */}
              <div className="bg-white/3 rounded-3xl p-5 border border-white/5 transition-all">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Stock en Depósito
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white italic tracking-tighter">
                      {Number(ingredient.stock).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">
                      {ingredient.unit}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden ring-1 ring-white/5">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isLowStock
                        ? "bg-red-500 shadow-[0_0_10px_#ef4444]"
                        : "bg-primary shadow-[0_0_10px_#fca90d33]"
                    }`}
                    style={{
                      width: `${Math.min((Number(ingredient.stock) / (Number(ingredient.minStock) * 3)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/3 rounded-3xl p-4 border border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-2">
                    Costo x {ingredient.unit}
                  </p>
                  <p className="text-xl font-black text-white italic tracking-tighter">
                    ${Number(ingredient.cost).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/3 rounded-3xl p-4 border border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-2">
                    Valor Activo
                  </p>
                  <p
                    className={`text-xl font-black italic tracking-tighter ${isLowStock ? "text-red-400" : "text-primary"}`}
                  >
                    ${stockValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowWaste(true)}
              className="mt-6 w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-200 transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Registrar Merma
            </Button>
          </TabsContent>

          <TabsContent
            value="hist"
            className="grow flex flex-col focus-visible:ring-0 mt-0 h-[240px]"
          >
            <PriceHistoryChart ingredientId={ingredient.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-lg p-0 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="bg-linear-to-b from-primary/20 to-transparent p-8 pb-4">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 ring-1 ring-primary/30">
                <Pencil className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                Editar <span className="text-primary">Insumo</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 pt-4 text-white">
            <EditIngredientForm
              ingredient={ingredient}
              onSuccess={() => setShowEdit(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWaste} onOpenChange={setShowWaste}>
        <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-lg p-0 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="bg-linear-to-b from-orange-500/20 to-transparent p-8 pb-4">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-4 ring-1 ring-orange-500/30">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                Registrar <span className="text-orange-500">Merma</span>
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 pt-4">
            <WasteLogForm
              ingredientId={ingredient.id}
              unit={ingredient.unit}
              onSuccess={() => setShowWaste(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-md p-0 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
          <div className="bg-linear-to-b from-red-500/20 to-transparent p-8 pb-4 text-white">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4 ring-1 ring-red-500/30">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                Eliminar <span className="text-red-500">Insumo</span>
              </DialogTitle>
              <DialogDescription className="text-zinc-500">
                ¿Seguro que deseas eliminar <b>{ingredient.name}</b>? Esta
                acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-6">
              <Button
                variant="destructive"
                className="h-14 rounded-2xl font-black uppercase text-lg italic"
                onClick={async () => {
                  const res = await deleteIngredient(ingredient.id);
                  if (res.success) {
                    toast.success("Insumo eliminado");
                    setShowDelete(false);
                  } else {
                    toast.error(res.error);
                  }
                }}
              >
                Confirmar Baja
              </Button>
              <Button
                variant="ghost"
                className="h-12 text-zinc-500 hover:text-white"
                onClick={() => setShowDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
