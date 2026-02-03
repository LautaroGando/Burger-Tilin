"use client";

import { useState, useEffect } from "react";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "@/app/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function CategoryManager() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function load() {
    setFetching(true);
    const res = await getCategories();
    if (res.success && res.data) {
      setCategories(res.data);
    }
    setFetching(false);
  }

  useEffect(() => {
    // eslint-disable-next-line
    load();
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    const res = await createCategory(newName.trim());
    if (res.success) {
      toast.success("Categoría creada");
      setNewName("");
      load();
    } else {
      toast.error(res.error || "Error al crear");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que quieres eliminar esta categoría?")) return;
    const res = await deleteCategory(id);
    if (res.success) {
      toast.success("Categoría eliminada");
      load();
    } else {
      toast.error(res.error || "Error al eliminar");
    }
  }

  return (
    <div className="space-y-8 py-2">
      <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 shadow-inner">
        <p className="text-[10px] uppercase font-black text-primary tracking-[0.2em] mb-4 pl-1">
          Nueva Categoría
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Ej: Burgers, Bebidas..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-black/40 border-white/5 pl-10 h-12 rounded-2xl focus:border-primary/50 transition-all font-medium"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={loading}
            className="h-12 w-12 rounded-2xl bg-primary text-black font-black hover:bg-primary/90 shadow-[0_0_20px_rgba(252,169,13,0.3)] transition-all shrink-0"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em]">
            Categorías Existentes
          </p>
          <span className="text-[9px] font-black text-neutral-600 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            {categories.length} Total
          </span>
        </div>

        <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {fetching ? (
            <div className="py-12 text-center text-neutral-600">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
              <p className="text-[10px] uppercase font-bold mt-4 tracking-widest">
                Cargando categorías...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
              <Tag className="h-8 w-8 text-neutral-800 mx-auto mb-3" />
              <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest">
                No hay categorías aún
              </p>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cat.id)}
                  className="h-10 w-10 rounded-xl text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
