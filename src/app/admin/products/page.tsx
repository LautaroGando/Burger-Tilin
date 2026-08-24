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
  Package,
  Percent,
  Settings,
  LogOut,
} from "lucide-react";
import CreateProductForm from "./create-product-form";
import CategoryManager from "./category-manager";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getCategories } from "@/app/actions/category-actions";
import ProductList from "./product-list";
import { getPlatformConfigs } from "@/app/actions/config-actions";
import PlatformConfigManager from "./platform-config-manager";
import { logout } from "@/app/actions/auth-actions";

interface PlatformConfig {
  id: string;
  name: string;
  commission: number;
  updatedAt: Date;
}

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
        <MotionItem variants={item}>
          <AdminPageHeader
            title="PRODUCTOS"
            subtitle="Gestión del Menú & Análisis de Márgenes"
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full h-9 px-4 text-xs font-semibold border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
                >
                  <Tag className="mr-2 h-4 w-4" /> CATEGORÍAS
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
                  className="rounded-full h-9 px-4 text-xs font-semibold border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
                >
                  <Percent className="mr-2 h-4 w-4" /> COMISIONES
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
                    configs={
                      (platformConfigs as unknown as PlatformConfig[]) || []
                    }
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full h-9 px-4 text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-colors">
                  <Plus className="mr-2 h-4 w-4" /> CREAR PRODUCTO
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

            <form action={logout} className="ml-1">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Salir"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </AdminPageHeader>
        </MotionItem>

        <ProductList
          products={products || []}
          categories={categories || []}
          ingredients={ingredients || []}
          platformConfigs={
            (platformConfigs as unknown as PlatformConfig[]) || []
          }
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
