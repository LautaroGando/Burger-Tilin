import { getIngredients } from "@/app/actions/ingredient-actions";
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Brain, Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import CreateIngredientForm from "./create-ingredient-form";
import EditIngredientForm from "./edit-ingredient-form";
import { DeleteIngredientButton } from "./delete-button";
import { MotionDiv, MotionItem } from "@/components/ui/motion";

export default async function IngredientsPage() {
  const ingredients = await getIngredients();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-black p-6 md:p-12 text-white selection:bg-primary selection:text-black">
      <MotionDiv
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-10"
      >
        <MotionItem
          variants={item}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5"
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white flex items-end gap-2 uppercase">
                INSUMOS{" "}
                <span className="text-primary text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Control de Stock, Costos & Mermas
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/inventory/predictions" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:border-primary/50 font-bold uppercase tracking-wider"
              >
                <Brain className="mr-2 h-4 w-4" /> Stock Predictivo
              </Button>
            </Link>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-12 px-6 font-bold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 transition-all text-sm">
                  <Plus className="mr-2 h-5 w-5" /> NUEVO INSUMO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    Agregar Insumo
                  </DialogTitle>
                </DialogHeader>
                <CreateIngredientForm />
              </DialogContent>
            </Dialog>
          </div>
        </MotionItem>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ingredients.map((ing) => {
            const isLowStock = Number(ing.stock) < Number(ing.minStock);
            const stockValue = Number(ing.stock) * Number(ing.cost);

            return (
              <MotionItem
                key={ing.id}
                variants={item}
                initial="hidden"
                animate="show"
              >
                <Card
                  className={`glass-card h-full group flex flex-col border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all duration-300 relative overflow-hidden ${isLowStock ? "ring-1 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : ""}`}
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate max-w-[150px]">
                        {ing.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${isLowStock ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                        />
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                          {isLowStock ? "Stock Crítico" : "Stock Saludable"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">
                              Editar {ing.name}
                            </DialogTitle>
                          </DialogHeader>
                          <EditIngredientForm ingredient={ing} />
                        </DialogContent>
                      </Dialog>
                      <DeleteIngredientButton
                        ingredientId={ing.id}
                        ingredientName={ing.name}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 flex-1 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                          Costo Unitario
                        </Label>
                        <div className="text-2xl font-black text-white">
                          ${Number(ing.cost).toLocaleString()}
                        </div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">
                          / {ing.unit}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                          Inversión Stock
                        </Label>
                        <div className="text-xl font-bold text-neutral-400">
                          ${stockValue.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">
                          valor total
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-end justify-between p-4 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden group-hover:border-primary/20 transition-colors">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">
                            Disponible en Almacén
                          </span>
                          <div
                            className={`text-3xl font-black ${isLowStock ? "text-red-500" : "text-white group-hover:text-primary transition-colors"}`}
                          >
                            {Number(ing.stock)}
                            <span className="text-xs ml-1 font-bold text-neutral-500 lowercase">
                              {ing.unit}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-neutral-600 uppercase">
                            Mínimo
                          </span>
                          <p className="font-bold text-white/50">
                            {Number(ing.minStock)}
                          </p>
                        </div>

                        {/* Progress bar visual */}
                        <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                          <div
                            className={`h-full transition-all duration-500 ${isLowStock ? "bg-red-500/50" : "bg-primary/50"}`}
                            style={{
                              width: `${Math.min((Number(ing.stock) / (Number(ing.minStock) * 2)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </MotionItem>
            );
          })}
        </div>
      </MotionDiv>
    </div>
  );
}
