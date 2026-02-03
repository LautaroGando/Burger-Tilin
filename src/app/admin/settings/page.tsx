import { StoreHoursConfig } from "./StoreHoursConfig";
import { MotionDiv } from "@/components/ui/motion";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-4 md:p-12 text-foreground bg-black overflow-x-hidden">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-10"
      >
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button
                variant="ghost"
                className="h-10 w-10 p-0 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                  Configuración
                </h1>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                  Ajustes generales del sistema
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <StoreHoursConfig />
        </section>
      </MotionDiv>
    </div>
  );
}
