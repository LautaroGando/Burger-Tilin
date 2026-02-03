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
    <div className="space-y-6 py-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nueva categoría (ej: Burgers)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="bg-white/5 border-white/10"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          onClick={handleAdd}
          disabled={loading}
          className="bg-primary text-black font-bold"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest pl-1">
          Categorías Existentes
        </p>
        <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
          {fetching ? (
            <div className="py-8 text-center text-neutral-600">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-neutral-600 italic py-4 text-center">
              No hay categorías aun.
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-neutral-500 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-white">
                    {cat.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cat.id)}
                  className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-red-400/10"
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
