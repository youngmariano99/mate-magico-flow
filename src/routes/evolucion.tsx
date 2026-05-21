import { createFileRoute } from "@tanstack/react-router";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { LogEvolucion } from "@/components/evolucion/LogEvolucion";
import { GuardiaSesion } from "@/auth/GuardiaSesion";

export const Route = createFileRoute("/evolucion")({
  head: () => ({
    meta: [
      { title: "Evolución — MateFlow" },
      { name: "description", content: "Tu progreso gamificado: XP por área y logros recientes." },
    ],
  }),
  component: () => (
    <GuardiaSesion>
      <PaginaEvolucion />
    </GuardiaSesion>
  ),
});

function PaginaEvolucion() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavegacionPrincipal />
      <main className="mx-auto max-w-5xl px-5 py-8 space-y-6 pb-24 md:pb-12">
        <div>
          <p className="text-sm text-muted-foreground">Gamificación</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">Log de Evolución</h1>
        </div>
        <LogEvolucion />
      </main>
      <BarraInferior />
    </div>
  );
}
