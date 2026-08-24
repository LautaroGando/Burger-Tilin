import React from "react";

type Variant = "ok" | "warning" | "critical" | "promo" | "inactive" | "info";

interface StatusBadgeProps {
  variant: Variant;
  label: string;
  dot?: boolean;
  className?: string;
}

const variants: Record<Variant, string> = {
  ok: "bg-green-500/10 text-green-400 border border-green-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  promo: "bg-primary/10 text-primary border border-primary/20",
  inactive: "bg-neutral-800 text-neutral-500 border border-white/5",
  info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

const dotColors: Record<Variant, string> = {
  ok: "bg-green-500",
  warning: "bg-amber-400",
  critical: "bg-red-500",
  promo: "bg-primary",
  inactive: "bg-neutral-600",
  info: "bg-blue-400",
};

export function StatusBadge({
  variant,
  label,
  dot = true,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {label}
    </span>
  );
}
