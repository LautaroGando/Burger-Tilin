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
import { Plus } from "lucide-react";
import CreateIngredientForm from "./create-ingredient-form";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import IngredientGrid from "./ingredient-grid";
import { AdminPageHeader } from "@/components/admin-page-header";
import { Ingredient } from "@/lib/types";
import SmartPurchaseModal from "./SmartPurchaseModal";

export default async function IngredientsPage() {
  const ingredients = await getIngredients();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 text-white selection:bg-primary selection:text-black">
      <MotionDiv
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <MotionItem variants={item}>
          <AdminPageHeader
            title="Inventario"
            subtitle="Control de stock, costos y mermas"
          >
            <SmartPurchaseModal />

            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full h-9 px-4 text-xs font-bold bg-primary text-black hover:bg-primary/90 transition-colors">
                  <Plus className="mr-1.5 h-4 w-4" /> Nuevo Insumo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-0 shadow-2xl rounded-3xl w-[95%] max-w-lg p-0 ring-1 ring-white/10 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="bg-gradient-to-b from-primary/20 to-transparent p-7 pb-4">
                  <DialogHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3 ring-1 ring-primary/30">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                      Nuevo <span className="text-primary">Insumo</span>
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 font-medium pt-0.5 text-sm">
                      Completa los datos para el nuevo{" "}
                      <span className="text-white">insumo de inventario</span>.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-7 pt-3">
                  <CreateIngredientForm />
                </div>
              </DialogContent>
            </Dialog>
          </AdminPageHeader>
        </MotionItem>

        {/* Ingredient Table */}
        <MotionItem variants={item}>
          <IngredientGrid ingredients={ingredients as Ingredient[]} />
        </MotionItem>
      </MotionDiv>
    </div>
  );
}
