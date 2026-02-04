"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciales inválidas");
        setLoading(false);
      } else {
        toast.success("¡Bienvenido, Admin!");

        // Redirect to callbackUrl if it's an admin path, otherwise default to /admin
        const destination =
          callbackUrl && callbackUrl.includes("/admin")
            ? callbackUrl
            : "/admin";

        router.push(destination);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al iniciar sesión");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="username"
          className="text-white font-bold uppercase tracking-wider text-xs ml-1"
        >
          Usuario
        </Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          required
          className="bg-black/20 border-white/10 text-white placeholder:text-neutral-600 focus:border-primary/50 text-base h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-white font-bold uppercase tracking-wider text-xs ml-1"
        >
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-black/20 border-white/10 text-white placeholder:text-neutral-600 focus:border-primary/50 text-base h-12 rounded-xl pr-10"
          />
          <KeyRound className="absolute right-3 top-3 h-6 w-6 text-neutral-600" />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 text-black font-black uppercase tracking-widest text-sm bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_rgba(251,191,36,0.4)] transition-all hover:scale-105 active:scale-95 rounded-xl disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Ingresar al Sistema"
        )}
      </Button>
    </form>
  );
}
