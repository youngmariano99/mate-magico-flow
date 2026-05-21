import { createFileRoute } from "@tanstack/react-router";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { VistaBaul } from "@/components/baul/VistaBaul";
import { GuardiaSesion } from "@/auth/GuardiaSesion";
import { useTareas } from "@/hooks/useTareas";

export const Route = createFileRoute("/baul")({
  head: () => ({
    meta: [
      { title: "El Baúl — MateFlow" },
      { name: "description", content: "Gestor PARA: Proyectos, Áreas, Recursos y Archivo." },
    ],
  }),
  component: () => (
    <GuardiaSesion>
      <PaginaBaul />
    </GuardiaSesion>
  ),
});

function PaginaBaul() {
  const { tareas, cargando } = useTareas();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavegacionPrincipal />
      <main className="mx-auto max-w-5xl px-5 py-8 space-y-6 pb-24 md:pb-12">
        <div>
          <p className="text-sm text-muted-foreground">Método PARA</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">El Baúl</h1>
        </div>
        <VistaBaul tareas={tareas} cargando={cargando} />
      </main>
      <BarraInferior />
    </div>
  );
}
