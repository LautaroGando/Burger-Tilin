import { getBrainContext } from "@/app/actions/brain-actions";
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { ArrowLeft, BrainCircuit, Receipt, Zap } from "lucide-react";
import Link from "next/link";
import BrainChat from "@/components/brain/BrainChat";

export default async function BrainPage() {
  const context = await getBrainContext();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="bg-black p-4 md:p-12 text-white selection:bg-primary selection:text-black relative min-h-screen">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <MotionDiv
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-6 relative z-10 h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <BrainCircuit className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                CEREBRO{" "}
                <span className="text-neutral-500 font-medium">DIGITAL</span>
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 rounded-full border border-white/5 self-start sm:self-auto">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-2">
              Online
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 flex-1 h-full min-h-0">
          {/* Main Chat Interface */}
          <MotionItem
            variants={item}
            className="lg:col-span-8 flex flex-col h-[600px] sm:h-[calc(100vh-200px)]"
          >
            <BrainChat context={context} />
          </MotionItem>

          {/* Sidebar Modules */}
          <div className="lg:col-span-4 space-y-6">
            <MotionItem variants={item} className="h-full">
              <div className="glass-card border-white/5 bg-zinc-900/20 p-6 h-full flex flex-col gap-6 rounded-3xl">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-primary pl-3">
                    Métricas Clave
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">
                          Ticket Promedio
                        </p>
                        <p className="text-xl font-bold text-white">
                          $
                          {context.dailyMetrics.orders > 0
                            ? (
                                context.dailyMetrics.sales /
                                context.dailyMetrics.orders
                              ).toFixed(0)
                            : "0"}
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-neutral-400" />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">
                          Eficiencia
                        </p>
                        <p className="text-xl font-bold text-green-400">94%</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-purple-500 pl-3">
                    Tendencia
                  </h3>
                  <div className="space-y-2">
                    {context.topProducts.slice(0, 4).map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] font-bold text-neutral-600 group-hover:text-primary">
                            0{i + 1}
                          </div>
                          <p className="text-xs font-medium text-neutral-300 group-hover:text-white">
                            {p.name}
                          </p>
                        </div>
                        <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(100, Math.max(20, p.quantity * 10))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {context.topProducts.length === 0 && (
                      <p className="text-xs text-neutral-600 italic">
                        Sin datos suficientes aún.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </MotionItem>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}
