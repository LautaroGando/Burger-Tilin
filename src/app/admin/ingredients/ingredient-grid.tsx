"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Ingredient } from "@/lib/types";
import { MotionItem } from "@/components/ui/motion";
import IngredientCard from "./ingredient-card";

interface IngredientGridProps {
  ingredients: Ingredient[];
}

export default function IngredientGrid({ ingredients }: IngredientGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-8">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-500" />
        </div>
        <input
          type="text"
          placeholder="Buscar insumos por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-white/5 text-white text-sm rounded-2xl focus:ring-primary focus:border-primary block pl-12 p-4 placeholder:text-neutral-600 font-medium transition-all focus:bg-zinc-900/80 outline-none"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredIngredients.length > 0 ? (
          filteredIngredients.map((ing) => (
            <MotionItem key={ing.id} variants={item}>
              <IngredientCard ingredient={ing} />
            </MotionItem>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-neutral-500 flex flex-col items-center">
            <Search className="h-10 w-10 mb-4 opacity-20" />
            <p className="text-lg font-medium">No se encontraron insumos</p>
            <p className="text-sm">Prueba con otro término de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
