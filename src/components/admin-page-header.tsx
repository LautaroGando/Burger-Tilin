import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  backUrl?: string;
  children?: ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  backUrl = "/admin",
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-white/5 w-full">
      <div className="flex items-center gap-3">
        <Link href={backUrl}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white flex items-baseline gap-1.5 uppercase">
            {title}
            <span className="text-primary text-2xl leading-none">.</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-neutral-500 font-medium tracking-wide">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 shrink-0">
        {children}
      </div>
    </div>
  );
}
