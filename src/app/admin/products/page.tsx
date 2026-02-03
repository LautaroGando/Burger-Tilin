import { getProducts } from "@/app/actions/product-actions";
export const dynamic = "force-dynamic";
import { getIngredients } from "@/app/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Tag,
  ArrowLeft,
  Package,
  Percent,
  Settings,
  LogOut,
} from "lucide-react";
import CreateProductForm from "./create-product-form";
import CategoryManager from "./category-manager";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import Link from "next/link";
import { getCategories } from "@/app/actions/category-actions";
import ProductList from "./product-list";
import ProfitabilityHeatmap from "./ProfitabilityHeatmap";
import { getPlatformConfigs } from "@/app/actions/config-actions";
import PlatformConfigManager from "./platform-config-manager";
import { logout } from "@/app/actions/auth-actions";

export default async function ProductsPage() {
  const { data: products } = await getProducts();
  const ingredients = await getIngredients();
  const { data: categories } = await getCategories();
  const { data: platformConfigs } = await getPlatformConfigs();

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
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white flex items-end gap-2 uppercase text-glow">
                PRODUCTOS{" "}
                <span className="text-primary text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Gestión del Menú & Análisis de Márgenes
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap gap-3">
            <ProfitabilityHeatmap />

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none rounded-full px-6 py-4 sm:py-6 font-bold border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white"
                >
                  <Tag className="mr-2 h-5 w-5" /> CATEGORÍAS
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-2xl p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="bg-linear-to-b from-primary/10 to-transparent p-8 pb-4">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
                        <Tag className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                          Gestionar{" "}
                          <span className="text-primary">Categorías</span>
                        </DialogTitle>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">
                          Organiza tu menú por secciones
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
                <div className="p-8 pt-0">
                  <CategoryManager />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none rounded-full px-6 py-4 sm:py-6 font-bold border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white"
                >
                  <Percent className="mr-2 h-5 w-5" /> COMISIONES
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-2xl p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="bg-linear-to-b from-primary/10 to-transparent p-8 pb-4">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                          Configurar{" "}
                          <span className="text-primary">Plataformas</span>
                        </DialogTitle>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">
                          Ajusta las comisiones de cada canal
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
                <div className="p-8 pt-0">
                  <PlatformConfigManager
                    configs={(platformConfigs as any[]) || []}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none rounded-full px-6 py-4 sm:py-6 font-bold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all text-sm">
                  <Plus className="mr-2 h-5 w-5" /> CREAR PRODUCTO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950/90 backdrop-blur-2xl border-white/10 rounded-[2.5rem] w-[95%] max-w-2xl p-0 shadow-2xl text-white max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="bg-linear-to-b from-white/10 to-transparent p-8 pb-4">
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                          Nuevo <span className="text-white/60">Producto</span>
                        </DialogTitle>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-0.5">
                          Agrega una nueva delicia a tu menú
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
                <div className="p-8 pt-0 max-h-[70vh] overflow-y-auto no-scrollbar">
                  <CreateProductForm />
                </div>
              </DialogContent>
            </Dialog>

            <form
              action={logout}
              className="w-full sm:w-auto order-last sm:order-none"
            >
              <Button
                type="submit"
                variant="ghost"
                className="w-full sm:w-auto h-12 sm:h-auto rounded-full px-4 py-2 sm:py-6 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 font-bold transition-all border border-white/5 sm:border-none"
              >
                <LogOut className="h-4 w-4 mr-2" />
                SALIR
              </Button>
            </form>
          </div>
        </MotionItem>

        <ProductList
          products={products || []}
          categories={categories || []}
          ingredients={ingredients || []}
          platformConfigs={(platformConfigs as any[]) || []}
        />

        {products?.length === 0 && (
          <div className="col-span-full py-32 text-center flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-zinc-900 mb-6 animate-pulse border border-white/5">
              <Package className="h-10 w-10 text-neutral-600" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Menú Vacío</h3>
            <p className="text-neutral-500 max-w-md mx-auto mb-8">
              Tu carta está esperando. Comienza creando tu primer producto
              estrella para empezar a vender.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full px-8 py-6 font-bold bg-primary text-black hover:bg-primary/80 hover:scale-105 active:scale-95 transition-all">
                  <Plus className="mr-2 h-5 w-5" /> CREAR PRIMER PRODUCTO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    Nuevo Producto
                  </DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Agrega una nueva delicia a tu menú.
                  </DialogDescription>
                </DialogHeader>
                <CreateProductForm />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </MotionDiv>
    </div>
  );
}
