"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function MarginCell({ margin }: { margin: number }) {
  const isCritical = margin < 0;

  const color =
    margin >= 50
      ? "text-green-400"
      : margin >= 35
        ? "text-primary"
        : margin >= 20
          ? "text-amber-500"
          : "text-red-400";

  if (isCritical) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
              {margin.toFixed(0)}%
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-red-950 border-red-500/30 text-red-200">
            <p className="font-bold">Margen Negativo ⚠️</p>
            <p className="text-[10px] opacity-80">El costo supera el precio de venta.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className={`text-xs font-bold tabular-nums ${color}`}>
      {margin.toFixed(0)}%
    </span>
  );
}
