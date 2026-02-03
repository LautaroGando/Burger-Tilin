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
import { Plus, Tag, ArrowLeft, Package } from "lucide-react";
import CreateProductForm from "./create-product-form";
import CategoryManager from "./category-manager";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import Link from "next/link";
import { getCategories } from "@/app/actions/category-actions";
import ProductList from "./product-list";

export default async function ProductsPage() {
  const { data: products } = await getProducts();
  const ingredients = await getIngredients();
  const { data: categories } = await getCategories();

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
            <Link href="/">
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
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none rounded-full px-6 py-4 sm:py-6 font-bold border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white"
                >
                  <Tag className="mr-2 h-5 w-5" /> CATEGORÍAS
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-h-[95vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    Gestionar Categorías
                  </DialogTitle>
                </DialogHeader>
                <CategoryManager />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none rounded-full px-6 py-4 sm:py-6 font-bold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all text-sm">
                  <Plus className="mr-2 h-5 w-5" /> CREAR PRODUCTO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-h-[95vh] overflow-y-auto custom-scrollbar">
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
        </MotionItem>

        <ProductList
          products={products || []}
          categories={categories || []}
          ingredients={ingredients || []}
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
              <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-h-[95vh] overflow-y-auto custom-scrollbar">
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
