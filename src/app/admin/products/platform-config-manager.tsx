"use client";

import { useState } from "react";
import { Settings, Percent, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePlatformConfig } from "@/app/actions/config-actions";
import { toast } from "sonner";

interface PlatformConfig {
  id: string;
  name: string;
  commission: number;
}

interface PlatformConfigManagerProps {
  configs: PlatformConfig[];
}

export default function PlatformConfigManager({
  configs,
}: PlatformConfigManagerProps) {
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, commission: number) => {
    setSavingId(id);
    const res = await updatePlatformConfig(id, commission);
    setSavingId(null);
    if (res.success) {
      toast.success("Comisión actualizada correctamente");
    } else {
      toast.error("Error al actualizar la comisión");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {localConfigs.map((config) => (
          <div
            key={config.id}
            className="glass-card bg-zinc-900/30 border border-white/5 p-4 rounded-3xl flex flex-col gap-3 group hover:bg-zinc-900/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Percent className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {config.name}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                Comisión (%)
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={
                    localConfigs.find((c) => c.id === config.id)?.commission ??
                    0
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setLocalConfigs((prev) =>
                      prev.map((c) =>
                        c.id === config.id ? { ...c, commission: val } : c,
                      ),
                    );
                  }}
                  className="bg-black/40 border-white/5 rounded-xl h-10 pl-3 pr-8 text-white font-bold focus:ring-primary focus:border-primary transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs pointer-events-none">
                  %
                </div>
              </div>
              <Button
                onClick={() =>
                  handleUpdate(
                    config.id,
                    localConfigs.find((c) => c.id === config.id)?.commission ??
                      0,
                  )
                }
                disabled={savingId === config.id}
                className={`h-10 rounded-xl px-4 font-black transition-all ${
                  savingId === config.id
                    ? "bg-zinc-800"
                    : "bg-white text-black hover:bg-primary hover:text-black"
                }`}
              >
                {savingId === config.id ? (
                  <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
