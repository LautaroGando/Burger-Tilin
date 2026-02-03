"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Sparkles } from "lucide-react";
import { trainBrain } from "@/app/actions/ai-actions";

export default function TrainingDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTrain = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    await trainBrain(content);
    setIsLoading(false);
    setOpen(false);
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all font-bold group"
        >
          <BrainCircuit className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
          ENTRENAR CEREBRO
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border border-white/10 text-white sm:rounded-3xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            Entrenamiento Cognitivo
            <Sparkles className="h-5 w-5 text-primary" />
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Enseña a Tilin AI sobre nuevos productos, reglas de negocio o
            secretos de la cocina.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white">Nuevo Conocimiento</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ej: La hamburguesa Tilin Especial lleva doble queso y salsa secreta..."
              className="bg-black/50 border-white/10 text-white min-h-[100px] resize-none focus:border-primary/50"
            />
          </div>

          <Button
            onClick={handleTrain}
            disabled={isLoading || !content.trim()}
            className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
          >
            {isLoading ? "Aprendiendo..." : "Guardar en Memoria"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
