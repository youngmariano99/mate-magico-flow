import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingresar — MateFlow" },
      { name: "description", content: "Iniciá sesión en MateFlow." },
    ],
  }),
  component: PaginaLogin,
});

function PaginaLogin() {
  const { iniciarSesion, sesion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ejemplo@mateflow.app");
  const [password, setPassword] = useState("matecocido");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (sesion) void navigate({ to: "/" });
  }, [sesion, navigate]);

  const manejarEnvio = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await iniciarSesion(email, password);
      toast.success("¡Bienvenido de vuelta!", { description: "Tomate un mate ☕" });
      void navigate({ to: "/" });
    } catch (err) {
      toast.error("No pudimos iniciarte sesión", {
        description: err instanceof Error ? err.message : "Probá de nuevo.",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧉</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Mate<span className="text-primary">Flow</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tomate un mate y que la IA trabaje por vos.
          </p>
        </div>
        <form onSubmit={manejarEnvio} className="surface-card p-6 space-y-4 mate-glow">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full bg-input border border-border rounded-md px-3 py-2.5 outline-none focus:border-primary transition-colors"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Contraseña</span>
            <input
              type="password"
              required
              minLength={3}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full bg-input border border-border rounded-md px-3 py-2.5 outline-none focus:border-primary transition-colors"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-opacity"
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Modo demo · Cualquier email/contraseña entra.
          </p>
        </form>
      </div>
    </div>
  );
}
