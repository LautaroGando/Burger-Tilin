"use client";

import { useState, useRef, useEffect } from "react";
import { BrainContext, chatWithBrain } from "@/app/actions/brain-actions";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, Cpu, Send, User } from "lucide-react";
import { MotionItem } from "@/components/ui/motion";

interface BrainChatProps {
  context: BrainContext;
}

type Message = {
  role: "system" | "user";
  content: React.ReactNode;
};

export default function BrainChat({ context }: BrainChatProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: (
        <div className="space-y-3">
          <p>¡Hola equipo! Aquí está el reporte en tiempo real.</p>
          <p>
            Hoy llevamos{" "}
            <span className="text-white font-bold">
              ${context.dailyMetrics.sales.toFixed(0)}
            </span>{" "}
            en ventas con un total de{" "}
            <span className="text-white font-bold">
              {context.dailyMetrics.orders} pedidos
            </span>
            .
          </p>
          {context.dailyMetrics.margin > 40 ? (
            <p className="mt-2 text-green-400 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> El margen es saludable (
              {context.dailyMetrics.margin.toFixed(0)}%).
            </p>
          ) : (
            <p className="mt-2 text-yellow-400 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> El margen requiere atención
              ({context.dailyMetrics.margin.toFixed(0)}%).
            </p>
          )}
        </div>
      ),
    },
    // Adding initial insights as separate messages for staggered effect
    {
      role: "system",
      content:
        context.topProducts.length > 0 ? (
          <p>
            El producto{" "}
            <span className="text-white font-bold">
              {context.topProducts[0].name}
            </span>{" "}
            está liderando las ventas. Sugiero mantener el stock alto.
          </p>
        ) : (
          <p>Analizando patrones de venta...</p>
        ),
    },
    ...context.alerts.map((alert) => ({
      role: "system" as const,
      content: <span className="text-red-300">{alert}</span>,
    })),
  ]);

  useEffect(() => {
    // Small timeout to ensure DOM is updated before scrolling
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMsg = query;
    setQuery("");

    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    setIsLoading(true);

    try {
      const response = await chatWithBrain(userMsg);
      setMessages((prev) => [...prev, { role: "system", content: response }]);
    } catch (error) {
      console.error("Brain Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content:
            "⚠️ Lo siento, ocurrió un error de conexión. Intenta nuevamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 max-h-full bg-zinc-900/30 glass-card rounded-3xl overflow-hidden border border-white/5 relative">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto max-h-full p-6 space-y-6 scroll-smooth min-h-0">
        {messages.map((msg, i) => (
          <MotionItem
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${
                msg.role === "system"
                  ? "bg-primary/10 border-primary/20"
                  : "bg-white/10 border-white/20"
              }`}
            >
              {msg.role === "system" ? (
                <Cpu className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>

            <div
              className={`space-y-2 max-w-[85%] ${msg.role === "user" ? "items-end flex flex-col" : ""}`}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-sm font-bold ${
                    msg.role === "system" ? "text-primary" : "text-white"
                  }`}
                >
                  {msg.role === "system" ? "Tilin AI" : "Tú"}
                </span>
                <span className="text-[10px] text-neutral-500">
                  Justo ahora
                </span>
              </div>
              <div
                className={`p-4 rounded-xl text-sm leading-relaxed shadow-sm border ${
                  msg.role === "system"
                    ? "rounded-tl-none bg-zinc-800/50 border-white/5 text-zinc-200"
                    : "rounded-tr-none bg-primary/10 border-primary/20 text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </MotionItem>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 animate-pulse">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div className="p-4 rounded-xl rounded-tl-none bg-zinc-800/50 border border-white/5 text-sm text-zinc-400">
              Pensando...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregúntale algo a tu negocio..."
            className="w-full bg-zinc-900/80 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-neutral-600"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-2 rounded-full h-8 w-8 bg-primary text-black hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center mt-3 gap-2 overflow-x-auto pb-2">
          {["Resumen Finanzas", "Producto Estrella", "Alertas"].map(
            (tag, i) => (
              <button
                key={i}
                onClick={() => setQuery(tag)}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-neutral-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
              >
                {tag}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
