import { createFileRoute } from "@tanstack/react-router";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { VistaPlanificacion } from "@/components/planificacion/VistaPlanificacion";
import { GuardiaSesion } from "@/auth/GuardiaSesion";

export const Route = createFileRoute("/planificacion")({
  head: () => ({
    meta: [
      { title: "Planificación Semanal — MateFlow" },
      { name: "description", content: "Arrastrá tareas del backlog a los días de la semana." },
    ],
  }),
  component: () => (
    <GuardiaSesion>
      <PaginaPlanificacion />
    </GuardiaSesion>
  ),
});

function PaginaPlanificacion() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavegacionPrincipal />
      <main className="mx-auto max-w-7xl px-5 py-8 space-y-6 pb-24 md:pb-12">
        <div>
          <p className="text-sm text-muted-foreground">Planificación asíncrona</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
            Tu semana, sin fricción.
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Arrastrá del Backlog Activo a cualquier día. Devolvélas al backlog soltándolas a la izquierda.
          </p>
        </div>
        <VistaPlanificacion />
      </main>
      <BarraInferior />
    </div>
  );
}
