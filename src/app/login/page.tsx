import LoginForm from "./login-form";
import { UtensilsCrossed } from "lucide-react";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-20" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="glass-card bg-zinc-950/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-white/5 relative overflow-hidden">
          {/* Decorative Header Gradient */}
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-transparent via-primary to-transparent opacity-50" />

          <div className="flex flex-col items-center mb-8 space-y-4">
            <div className="h-20 w-20 bg-primary rounded-3xl flex items-center justify-center shadow-[0_0_40px_-5px_rgba(251,191,36,0.3)] border border-primary/50 rotate-3 transform hover:rotate-6 transition-all duration-500">
              <UtensilsCrossed className="h-10 w-10 text-black fill-black" />
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                Burger <span className="text-primary">Tilín</span>
              </h1>
              <p className="text-neutral-500 font-medium text-xs tracking-widest uppercase mt-2">
                Sistema de Gestión & POS
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="h-64 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
              Acceso Restringido • Solo Personal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
