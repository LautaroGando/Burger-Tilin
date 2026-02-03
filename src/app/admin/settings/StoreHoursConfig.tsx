"use client";

import { useState, useEffect } from "react";
import {
  getStoreHours,
  updateStoreHours,
} from "@/app/actions/store-hours-actions";
import { StoreHoursFormValues, storeHoursSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Save, Loader2, Calendar, Plus, Trash2 } from "lucide-react";

const MAPPED_DAYS = [
  { name: "Lunes", value: 1 },
  { name: "Martes", value: 2 },
  { name: "Miércoles", value: 3 },
  { name: "Jueves", value: 4 },
  { name: "Viernes", value: 5 },
  { name: "Sábado", value: 6 },
  { name: "Domingo", value: 0 },
];

export function StoreHoursConfig() {
  const [hours, setHours] = useState<StoreHoursFormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getStoreHours();
      setHours(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleDayChange = (
    dayIndex: number,
    field: keyof StoreHoursFormValues,
    value: any,
  ) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayIndex ? { ...h, [field]: value } : h,
      ),
    );
  };

  const handleShiftChange = (
    dayIndex: number,
    shiftIndex: number,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    setHours((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek !== dayIndex) return h;
        const newShifts = [...h.shifts];
        newShifts[shiftIndex] = { ...newShifts[shiftIndex], [field]: value };
        return { ...h, shifts: newShifts };
      }),
    );
  };

  const addShift = (dayIndex: number) => {
    setHours((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek !== dayIndex) return h;
        return {
          ...h,
          shifts: [...h.shifts, { openTime: "00:00", closeTime: "00:00" }],
        };
      }),
    );
  };

  const removeShift = (dayIndex: number, shiftIndex: number) => {
    setHours((prev) =>
      prev.map((h) => {
        if (h.dayOfWeek !== dayIndex) return h;
        const newShifts = h.shifts.filter((_, idx) => idx !== shiftIndex);
        return { ...h, shifts: newShifts };
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // Basic validation check before sending
    try {
      for (const h of hours) {
        storeHoursSchema.parse(h);
      }
      const result = await updateStoreHours(hours);
      if (result.success) {
        toast.success("Horarios actualizados correctamente");
      } else {
        toast.error(result.error || "Error al guardar");
      }
    } catch (e) {
      toast.error("Error de validación: Revise los horarios ingresados");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              Horarios de Atención
            </h2>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">
              Configura cuándo está abierto el local
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-black font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(252,169,13,0.3)] hover:scale-105 transition-all"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Horarios
        </Button>
      </div>

      <div className="grid gap-4">
        {MAPPED_DAYS.map((day) => {
          const dayHours = hours.find((h) => h.dayOfWeek === day.value) || {
            dayOfWeek: day.value,
            isOpen: true,
            shifts: [],
          };

          return (
            <div
              key={day.value}
              className={`p-6 rounded-2xl border transition-all ${
                dayHours.isOpen
                  ? "bg-white/5 border-white/10"
                  : "bg-black/40 border-dashed border-white/5 opacity-60"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex items-center justify-between lg:justify-start gap-4 min-w-[150px]">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        dayHours.isOpen
                          ? "bg-primary/20 text-primary"
                          : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span className="font-black uppercase italic tracking-tight text-lg">
                      {day.name}
                    </span>
                  </div>

                  {/* Toggle Mobile */}
                  <div className="lg:hidden">
                    <button
                      onClick={() =>
                        handleDayChange(day.value, "isOpen", !dayHours.isOpen)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        dayHours.isOpen ? "bg-primary" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                          dayHours.isOpen ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {dayHours.shifts.map((shift, shiftIndex) => (
                    <div
                      key={shiftIndex}
                      className="flex flex-wrap items-center gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 w-16">
                          Apertura
                        </span>
                        <input
                          type="time"
                          value={shift.openTime}
                          onChange={(e) =>
                            handleShiftChange(
                              day.value,
                              shiftIndex,
                              "openTime",
                              e.target.value,
                            )
                          }
                          disabled={!dayHours.isOpen}
                          className="bg-black border border-white/10 rounded-lg p-2 text-sm font-bold outline-none focus:border-primary/50 transition-colors disabled:opacity-30"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 w-12">
                          Cierre
                        </span>
                        <input
                          type="time"
                          value={shift.closeTime}
                          onChange={(e) =>
                            handleShiftChange(
                              day.value,
                              shiftIndex,
                              "closeTime",
                              e.target.value,
                            )
                          }
                          disabled={!dayHours.isOpen}
                          className="bg-black border border-white/10 rounded-lg p-2 text-sm font-bold outline-none focus:border-primary/50 transition-colors disabled:opacity-30"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShift(day.value, shiftIndex)}
                        disabled={!dayHours.isOpen}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addShift(day.value)}
                      disabled={!dayHours.isOpen}
                      className="text-xs font-bold border-white/10 hover:bg-white/5"
                    >
                      <Plus className="h-3 w-3 mr-2" /> AGREGAR TURNO
                    </Button>
                  </div>
                </div>

                {/* Status Toggle Desktop */}
                <div className="hidden lg:flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    {dayHours.isOpen ? "Abierto" : "Cerrado"}
                  </span>
                  <button
                    onClick={() =>
                      handleDayChange(day.value, "isOpen", !dayHours.isOpen)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      dayHours.isOpen ? "bg-primary" : "bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                        dayHours.isOpen ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
