import { getProducts } from "@/app/actions/product-actions";
import { getIngredients } from "@/app/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Package, ChefHat, Pencil, ArrowLeft } from "lucide-react";
import CreateProductForm from "./create-product-form";
import { DeleteProductButton } from "./delete-button";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import RecipeEditor from "@/components/recipe-editor";
import EditProductForm from "./edit-product-form";
import Link from "next/link";

export default async function ProductsPage() {
  const { data: products } = await getProducts();
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
                PRODUCTOS{" "}
                <span className="text-primary text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Gestión del Menú & Costos
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto rounded-full px-6 py-4 sm:py-6 font-bold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all">
                  <Plus className="mr-2 h-5 w-5" /> CREAR PRODUCTO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl">
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

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products?.map((product) => {
            // Calculate cost from recipe
            const totalCost =
              product.recipe?.reduce((sum, item) => {
                return (
                  sum + Number(item.ingredient.cost) * Number(item.quantity)
                );
              }, 0) || 0;
            const margin =
              Number(product.price) > 0
                ? ((Number(product.price) - totalCost) /
                    Number(product.price)) *
                  100
                : 0;

            return (
              <MotionItem
                key={product.id}
                variants={item}
                initial="hidden"
                animate="show"
              >
                <Card className="glass-card h-full group flex flex-col justify-between border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40">
                  <div>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                          {product.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] uppercase font-bold tracking-wider bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                              >
                                <Pencil className="h-3 w-3 mr-1" /> Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black">
                                  Editar Producto
                                </DialogTitle>
                              </DialogHeader>
                              <EditProductForm product={product} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                        />
                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Package className="h-5 w-5 text-neutral-500 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white tracking-tight">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <span className="text-sm font-medium text-neutral-500">
                          precio
                        </span>
                      </div>

                      <p className="text-sm text-neutral-400 line-clamp-2 h-10">
                        {product.description || "Sin descripción disponible."}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                          <p className="text-[10px] uppercase font-bold text-neutral-500">
                            Costo
                          </p>
                          <p className="font-bold text-white text-lg">
                            ${totalCost.toFixed(2)}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-xl border border-white/5 ${margin < 30 ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}
                        >
                          <p
                            className={`text-[10px] uppercase font-bold ${margin < 30 ? "text-red-400" : "text-green-400"}`}
                          >
                            Margen
                          </p>
                          <p
                            className={`font-bold text-lg ${margin < 30 ? "text-red-400" : "text-green-400"}`}
                          >
                            {margin.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0 mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-12 border-white/10 bg-transparent hover:bg-primary hover:border-primary hover:text-black font-bold uppercase tracking-wider transition-all"
                        >
                          <ChefHat className="mr-2 h-4 w-4" /> Gestionar Receta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            Receta Maestra
                          </DialogTitle>
                          <DialogDescription>
                            Configura los ingredientes para {product.name}
                          </DialogDescription>
                        </DialogHeader>
                        <RecipeEditor
                          productId={product.id}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          existingRecipe={product.recipe as any[]}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          availableIngredients={ingredients as any[]}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              </MotionItem>
            );
          })}
          {products?.length === 0 && (
            <div className="col-span-full py-32 text-center flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-zinc-900 mb-6 animate-pulse">
                <Package className="h-10 w-10 text-neutral-600" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                Menú Vacío
              </h3>
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
                <DialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-3xl">
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
        </div>
      </MotionDiv>
    </div>
  );
}
