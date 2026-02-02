import { getIngredients } from "@/app/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Scale,
  AlertCircle,
  Brain,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
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

        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {ingredients.map((ing) => {
            const isLowStock = Number(ing.stock) < Number(ing.minStock);
            return (
              <MotionItem
                key={ing.id}
                variants={item}
                initial="hidden"
                animate="show"
              >
                <Card
                  className={`glass-card h-full group bg-zinc-900/20 border-white/5 hover:bg-zinc-900/40 ${isLowStock ? "ring-1 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : ""}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5 mx-6 px-0 pt-6">
                    <CardTitle className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate pr-2">
                      {ing.name}
                    </CardTitle>
                    <div
                      className={`p-2 rounded-full ${isLowStock ? "bg-red-500/10 text-red-500" : "bg-white/5 text-neutral-500 group-hover:text-primary"}`}
                    >
                      {isLowStock ? (
                        <AlertCircle className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Scale className="h-4 w-4" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-black text-white tracking-tight">
                        ${Number(ing.cost).toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-neutral-500 uppercase">
                        / {ing.unit}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase">
                          Stock Actual
                        </span>
                        <span
                          className={`text-lg font-bold ${isLowStock ? "text-red-500" : "text-white"}`}
                        >
                          {Number(ing.stock)}
                        </span>
                      </div>

                      {isLowStock && (
                        <div className="text-[10px] font-bold text-red-400 text-center uppercase tracking-wider animate-pulse">
                          ⚠️ Stock Crítico (Min: {Number(ing.minStock)})
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-white/10 hover:bg-white/10 hover:text-white group-hover:border-white/20"
                          >
                            <Pencil className="mr-2 h-3 w-3" /> Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl">
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
