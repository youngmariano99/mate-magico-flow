import { createFileRoute } from "@tanstack/react-router";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { GuardiaSesion } from "@/auth/GuardiaSesion";
import { PanelKPIs } from "@/components/kpis/PanelKPIs";

export const Route = createFileRoute("/kpis")({
  head: () => ({
    meta: [
      { title: "KPIs personales — MateFlow" },
      {
        name: "description",
        content:
          "Dashboard de Quantified Self: anillos de progreso con objetivos diarios, semanales y mensuales basados en eventos inmutables.",
      },
      { property: "og:title", content: "KPIs personales — MateFlow" },
      {
        property: "og:description",
        content: "Medí volumen y consistencia con KPIs paramétricos y feedback dopamínico.",
      },
    ],
  }),
  component: PaginaKPIs,
});

function PaginaKPIs() {
  return (
    <GuardiaSesion>
      <div className="min-h-screen bg-background text-foreground">
        <NavegacionPrincipal />
        <main className="mx-auto max-w-5xl px-5 py-8 space-y-8 pb-28 md:pb-20">
          <PanelKPIs />
        </main>
        <BarraInferior />
      </div>
    </GuardiaSesion>
  );
}
