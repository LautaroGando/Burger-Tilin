import { getIngredients } from "@/app/actions/ingredient-actions";
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Brain, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CreateIngredientForm from "./create-ingredient-form";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import IngredientGrid from "./ingredient-grid";
import { Ingredient } from "@/lib/types";
import ReportButton from "./ReportButton";
import SmartPurchaseModal from "./SmartPurchaseModal";

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
    <div className="min-h-screen bg-black p-4 md:p-12 text-white selection:bg-primary selection:text-black">
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
            <Link href="/admin">
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
            <Link
              href="/admin/inventory/predictions"
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:border-primary/50 font-bold uppercase tracking-wider"
              >
                <Brain className="mr-2 h-4 w-4" /> Stock Predictivo
              </Button>
            </Link>

            <SmartPurchaseModal />

            <ReportButton />

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-12 px-6 font-bold bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(251,146,60,0.1)] hover:scale-105 transition-all text-sm">
                  <Plus className="mr-2 h-5 w-5" /> NUEVO INSUMO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-0 shadow-[0_0_100px_-20px_rgba(251,146,60,0.3)] rounded-[2.5rem] w-[95%] max-w-lg p-0 ring-1 ring-white/10 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="bg-linear-to-b from-primary/20 to-transparent p-8 pb-4">
                  <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 ring-1 ring-primary/30">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                      Nuevo <span className="text-primary">Insumo</span>
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 font-medium pt-1">
                      Completa los datos para el nuevo{" "}
                      <span className="text-white">producto base</span>.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-8 pt-4">
                  <CreateIngredientForm />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </MotionItem>

        <IngredientGrid ingredients={ingredients as Ingredient[]} />
      </MotionDiv>
    </div>
  );
}
