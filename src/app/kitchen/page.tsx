import {
  getKitchenOverview,
  advanceOrderStatus,
} from "@/app/actions/kitchen-actions";
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { ArrowLeft, CheckCircle, ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function KitchenPage() {
  const { data } = await getKitchenOverview();

  if (!data) return <div className="p-10 text-white">Cargando cocina...</div>;

  const { orders, inProgressCount, pendingCount, estimatedWaitTime } = data;

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const cookingOrders = orders.filter((o) => o.status === "IN_PROGRESS");
  const readyOrders = orders.filter((o) => o.status === "READY");

  return (
    <div className="min-h-screen bg-black p-4 md:p-12 text-white selection:bg-primary selection:text-black">
      <MotionDiv className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <MotionItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white flex items-end gap-2 uppercase">
                COCINA{" "}
                <span className="text-primary text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Sistema de Pantalla de Cocina (KDS)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-black text-white leading-none">
                {pendingCount + inProgressCount}
              </p>
              <p className="text-[8px] sm:text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                Pedidos Activos
              </p>
            </div>
            <div className="h-10 sm:h-12 w-px bg-white/10" />
            <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/50 border border-white/5 rounded-full pl-3 pr-4 sm:pl-4 sm:pr-6 py-2">
              <div
                className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${estimatedWaitTime > 20 ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
              />
              <div>
                <p className="text-[8px] sm:text-[10px] uppercase font-bold text-neutral-500">
                  Demora Est.
                </p>
                <p className="text-base sm:text-lg font-bold text-white leading-none">
                  {estimatedWaitTime} min
                </p>
              </div>
            </div>
          </div>
        </MotionItem>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
          {/* Column 1: PENDING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white" /> Pendientes
              </h2>
              <Badge
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20"
              >
                {pendingOrders.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <MotionItem
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all group">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-2xl text-white tracking-tight group-hover:text-primary transition-colors">
                            #{order.id.slice(0, 4)}
                          </p>
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            {order.clientName}
                          </p>
                        </div>
                        <span className="text-xs font-bold font-mono text-neutral-300 bg-white/5 px-2 py-1 rounded">
                          {order.minutesWaiting}m
                        </span>
                      </div>

                      <div className="space-y-2 py-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm group-hover:text-white transition-colors text-neutral-400 font-medium"
                          >
                            <span>
                              <span className="text-white font-bold">
                                {item.quantity}x
                              </span>{" "}
                              {item.productName}
                            </span>
                          </div>
                        ))}
                      </div>

                      <form
                        action={async () => {
                          "use server";
                          await advanceOrderStatus(order.id, "PENDING");
                        }}
                      >
                        <Button className="w-full rounded-xl bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider h-12 shadow-lg shadow-white/5">
                          Cocinar <Flame className="h-4 w-4 ml-2" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </MotionItem>
              ))}
              {pendingOrders.length === 0 && (
                <div className="border-2 border-dashed border-white/5 rounded-3xl p-8 text-center">
                  <p className="text-neutral-600 font-bold text-sm uppercase">
                    Sin pendientes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" /> En Cocina
              </h2>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              >
                {cookingOrders.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {cookingOrders.map((order) => (
                <MotionItem
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Flame className="h-12 w-12 text-primary" />
                    </div>
                    <CardContent className="p-5 space-y-4 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-2xl text-white tracking-tight">
                            #{order.id.slice(0, 4)}
                          </p>
                          <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">
                            {order.clientName}
                          </p>
                        </div>
                        <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                          {order.minutesWaiting}m
                        </span>
                      </div>

                      <div className="space-y-2 py-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm text-white font-medium"
                          >
                            <span>
                              <span className="text-primary font-bold">
                                {item.quantity}x
                              </span>{" "}
                              {item.productName}
                            </span>
                          </div>
                        ))}
                      </div>

                      <form
                        action={async () => {
                          "use server";
                          await advanceOrderStatus(order.id, "IN_PROGRESS");
                        }}
                      >
                        <Button className="w-full rounded-xl bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider h-12 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                          Terminar <CheckCircle className="h-4 w-4 ml-2" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </MotionItem>
              ))}
            </div>
          </div>

          {/* Column 3: READY */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" /> Listos
              </h2>
              <Badge
                variant="secondary"
                className="bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
              >
                {readyOrders.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {readyOrders.map((order) => (
                <MotionItem
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card border-green-500/20 bg-zinc-900/20 opacity-60 hover:opacity-100 transition-all group grayscale hover:grayscale-0">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-2xl text-white tracking-tight">
                            #{order.id.slice(0, 4)}
                          </p>
                          <p className="text-xs font-bold text-neutral-500 group-hover:text-green-500 uppercase tracking-wider transition-colors">
                            {order.clientName}
                          </p>
                        </div>
                        <span className="text-xs font-bold font-mono text-neutral-500 group-hover:text-green-500 transition-colors">
                          {order.minutesWaiting}m
                        </span>
                      </div>

                      <div className="space-y-2 py-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm text-neutral-500 group-hover:text-white transition-colors font-medium"
                          >
                            <span>
                              {item.quantity}x {item.productName}
                            </span>
                          </div>
                        ))}
                      </div>

                      <form
                        action={async () => {
                          "use server";
                          await advanceOrderStatus(order.id, "READY");
                        }}
                      >
                        <Button
                          variant="outline"
                          className="w-full rounded-xl border-white/10 text-neutral-400 hover:text-green-500 hover:border-green-500 hover:bg-green-500/10 font-bold uppercase tracking-wider h-12"
                        >
                          Entregar <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </MotionItem>
              ))}
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}
