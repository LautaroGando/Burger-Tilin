"use client";

import { useState, useEffect } from "react";
import { Product, ComboSlot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Plus, Trash2, Save, X, Settings2 } from "lucide-react";
import {
  getComboSlots,
  createComboSlot,
  deleteComboSlot,
  addSlotAlternative,
  removeSlotAlternative,
  updateSlotAlternativePrice,
} from "@/app/actions/combo-actions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ComboSlotEditorProps {
  comboId: string;
  allProducts: Product[];
}

export default function ComboSlotEditor({ comboId, allProducts }: ComboSlotEditorProps) {
  const [slots, setSlots] = useState<ComboSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot state
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState("");
  const [newSlotDefaultId, setNewSlotDefaultId] = useState("");

  // New alternative state
  const [addingAltToSlot, setAddingAltToSlot] = useState<string | null>(null);
  const [newAltProductId, setNewAltProductId] = useState("");
  const [newAltExtraPrice, setNewAltExtraPrice] = useState<number>(0);

  // Edit alternative state
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [editAltExtraPrice, setEditAltExtraPrice] = useState<number>(0);

  // Delete states
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  const loadSlots = async () => {
    setLoading(true);
    const res = await getComboSlots(comboId);
    if (res.success && res.data) {
      setSlots(res.data as unknown as ComboSlot[]);
    } else {
      toast.error(res.error || "Error al cargar componentes del combo");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSlots();
  }, [comboId]);


  const handleCreateSlot = async () => {
    if (!newSlotName || !newSlotDefaultId) {
      toast.error("Nombre y producto por defecto son requeridos");
      return;
    }

    const res = await createComboSlot({
      comboId,
      name: newSlotName,
      defaultProductId: newSlotDefaultId,
      sortOrder: slots.length,
    });

    if (res.success) {
      toast.success("Componente agregado");
      setIsAddingSlot(false);
      setNewSlotName("");
      setNewSlotDefaultId("");
      loadSlots();
    } else {
      toast.error(res.error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    const res = await deleteComboSlot(slotId);
    if (res.success) {
      toast.success("Componente eliminado");
      loadSlots();
    } else {
      toast.error(res.error);
    }
  };

  const handleAddAlternative = async (slotId: string) => {
    if (!newAltProductId) return;

    const res = await addSlotAlternative(slotId, newAltProductId, newAltExtraPrice);
    if (res.success) {
      toast.success("Alternativa agregada");
      setAddingAltToSlot(null);
      setNewAltProductId("");
      setNewAltExtraPrice(0);
      loadSlots();
    } else {
      toast.error(res.error);
    }
  };

  const handleUpdateAltPrice = async (altId: string) => {
    const res = await updateSlotAlternativePrice(altId, editAltExtraPrice);
    if (res.success) {
      toast.success("Costo extra actualizado");
      setEditingAltId(null);
      loadSlots();
    } else {
      toast.error(res.error);
    }
  };

  const handleRemoveAlternative = async (altId: string) => {
    const res = await removeSlotAlternative(altId);
    if (res.success) {
      toast.success("Alternativa eliminada");
      loadSlots();
    } else {
      toast.error(res.error);
    }
  };

  if (loading) {
    return <div className="text-neutral-500 py-10 text-center text-sm font-bold animate-pulse">Cargando componentes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Componentes del Combo
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Definí qué incluye este combo y qué alternativas puede elegir el cliente.
          </p>
        </div>
        {!isAddingSlot && (
          <Button
            onClick={() => setIsAddingSlot(true)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-10 px-4 text-xs font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Componente
          </Button>
        )}
      </div>

      {isAddingSlot && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 space-y-4">
          <h4 className="text-sm font-bold text-primary">Agregar Componente</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Nombre (ej. Bebida, Guarnición)
              </label>
              <input
                type="text"
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
                placeholder="Nombre del slot..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-primary/50 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Producto por Defecto
              </label>
              <select
                value={newSlotDefaultId}
                onChange={(e) => setNewSlotDefaultId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-primary/50 outline-none"
              >
                <option value="">Seleccionar producto...</option>
                {allProducts
                  .filter((p) => p.id !== comboId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.price).toLocaleString("es-AR")})
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsAddingSlot(false)}
              className="text-neutral-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSlot}
              disabled={!newSlotName || !newSlotDefaultId}
              className="bg-primary text-black hover:bg-primary/90 font-bold rounded-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Slot
            </Button>
          </div>
        </div>
      )}

      {slots.length === 0 && !isAddingSlot ? (
        <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
          <Settings2 className="h-10 w-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 font-bold text-sm">Este combo no tiene componentes configurados.</p>
          <p className="text-neutral-600 text-xs mt-1">El cliente no podrá elegir alternativas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 overflow-hidden relative group/slot">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-primary font-bold">
                    {slot.sortOrder + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide">{slot.name}</h4>
                    <p className="text-[10px] text-neutral-500 font-bold">
                      POR DEFECTO: <span className="text-neutral-300">{slot.defaultProduct?.name}</span>
                    </p>
                  </div>
                </div>
                <IconButton
                  icon={<Trash2 className="h-4 w-4" />}
                  tooltip="Eliminar componente entero"
                  onClick={() => setDeletingSlotId(slot.id)}
                  className="text-neutral-600 hover:text-red-400 opacity-0 group-hover/slot:opacity-100 transition-opacity"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-neutral-500 tracking-wider">ALTERNATIVAS PERMITIDAS</p>
                <div className="flex flex-wrap gap-2">
                  {slot.alternatives?.map((alt: any) => (
                    <div key={alt.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
                      <span>{alt.product?.name}</span>
                      
                      {editingAltId === alt.id ? (
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-primary font-bold">+ $</span>
                          <input
                            type="number"
                            min="0"
                            value={editAltExtraPrice}
                            onChange={(e) => setEditAltExtraPrice(Number(e.target.value))}
                            className="bg-black/50 border border-white/20 rounded-md px-1.5 py-0.5 text-xs text-white outline-none w-16"
                          />
                          <button onClick={() => handleUpdateAltPrice(alt.id)} className="text-primary hover:text-white ml-1">
                            <Save className="h-3 w-3" />
                          </button>
                          <button onClick={() => setEditingAltId(null)} className="text-neutral-500 hover:text-white ml-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 ml-2">
                          {alt.extraPrice > 0 ? (
                            <span className="text-primary font-bold text-[10px]">
                              + ${alt.extraPrice.toLocaleString("es-AR")}
                            </span>
                          ) : (
                            <span className="text-neutral-500 font-bold text-[10px]">Sin cargo</span>
                          )}
                          <button onClick={() => {
                            setEditingAltId(alt.id);
                            setEditAltExtraPrice(alt.extraPrice || 0);
                          }} className="text-neutral-500 hover:text-white ml-1 outline-none">
                            <Settings2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleRemoveAlternative(alt.id)}
                        className="text-neutral-500 hover:text-red-400 outline-none ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {addingAltToSlot === slot.id ? (
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-1 py-1">
                      <select
                        value={newAltProductId}
                        onChange={(e) => setNewAltProductId(e.target.value)}
                        className="bg-black/50 border-none rounded-full px-3 py-1 text-xs text-white outline-none w-40"
                      >
                        <option value="">Seleccionar...</option>
                        {allProducts
                          .filter((p) => p.id !== slot.defaultProductId && p.id !== comboId && !slot.alternatives?.some((a: any) => a.productId === p.id))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-primary font-bold">+$</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={newAltExtraPrice || ""}
                          onChange={(e) => setNewAltExtraPrice(Number(e.target.value))}
                          className="bg-black/50 border-none rounded-md px-2 py-1 text-xs text-white outline-none w-16"
                        />
                      </div>

                      <IconButton
                        icon={<Save className="h-3.5 w-3.5" />}
                        tooltip="Guardar alternativa"
                        onClick={() => handleAddAlternative(slot.id)}
                        disabled={!newAltProductId}
                        className="h-7 w-7 text-primary hover:bg-primary/20 bg-primary/10 rounded-full shrink-0"
                      />
                      <IconButton
                        icon={<X className="h-3.5 w-3.5" />}
                        tooltip="Cancelar"
                        onClick={() => {
                          setAddingAltToSlot(null);
                          setNewAltProductId("");
                          setNewAltExtraPrice(0);
                        }}
                        className="h-7 w-7 text-neutral-400 hover:bg-white/10 rounded-full shrink-0"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingAltToSlot(slot.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-white/20 text-xs text-neutral-400 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Agregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingSlotId}
        onOpenChange={(open) => !open && setDeletingSlotId(null)}
        icon={<Trash2 className="h-6 w-6 text-red-500" />}
        title={
          <>
            ¿Eliminar <span className="text-red-500">Componente</span>?
          </>
        }
        description={
          <>
            Se eliminará este componente y todas sus alternativas asociadas. Los clientes ya no podrán elegir estas opciones para el combo.
          </>
        }
        onConfirm={() => deletingSlotId && handleDeleteSlot(deletingSlotId)}
      />
    </div>
  );
}
