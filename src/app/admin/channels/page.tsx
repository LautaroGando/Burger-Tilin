import { getPlatformConfigs } from "@/app/actions/config-actions";
import { AdminPageHeader } from "@/components/admin-page-header";
import { Percent } from "lucide-react";

export const dynamic = "force-dynamic";

const PLATFORM_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  PEYA: { label: "PedidosYa", color: "text-yellow-400", emoji: "🟡" },
  RAPPI: { label: "Rappi", color: "text-orange-400", emoji: "🟠" },
  MERCADOPAGO: { label: "MercadoPago", color: "text-blue-400", emoji: "🔵" },
};

export default async function ChannelsPage() {
  const { data: configs } = await getPlatformConfigs();

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <AdminPageHeader
        title="Comisiones"
        subtitle="Porcentaje de comisión cobrado por cada plataforma de envío. Se usa para calcular márgenes reales en Analytics."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configs?.map((config) => {
          const meta = PLATFORM_LABELS[config.name] ?? {
            label: config.name,
            color: "text-neutral-400",
            emoji: "📦",
          };
          return (
            <div
              key={config.id}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 text-center hover:border-white/20 transition-all"
            >
              <span className="text-4xl">{meta.emoji}</span>
              <h3 className={`text-lg font-black uppercase tracking-widest ${meta.color}`}>
                {meta.label}
              </h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-black text-white tabular-nums">
                  {Number(config.commission).toFixed(0)}
                </span>
                <Percent className="h-5 w-5 text-neutral-500" />
              </div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                de comisión
              </p>
              <p className="text-[9px] font-bold text-neutral-700 uppercase mt-1">
                Editable desde Productos → Comisiones
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
        <Percent className="h-4 w-4 text-neutral-600 mt-0.5 shrink-0" />
        <p className="text-xs font-bold text-neutral-500 leading-relaxed">
          Las comisiones son datos informativos para el cálculo de márgenes en Analytics.
          Los precios publicados en todas las plataformas son los mismos que el precio base
          del producto. Podés editar los porcentajes desde la sección <strong className="text-neutral-300">Productos → Comisiones</strong>.
        </p>
      </div>
    </div>
  );
}
