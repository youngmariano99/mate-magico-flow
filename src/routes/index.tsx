import { createFileRoute } from "@tanstack/react-router";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { PanelGamificacion } from "@/components/dashboard/PanelGamificacion";
import { ListaMITs } from "@/components/dashboard/ListaMITs";
import { InputMagico } from "@/components/dashboard/InputMagico";
import { GuardiaSesion } from "@/auth/GuardiaSesion";
import { useTareas } from "@/hooks/useTareas";
import { useGamificacionStore } from "@/stores/gamificacionStore";
import { useAuth } from "@/auth/AuthProvider";
import type { DTO_RespuestaProcesamientoIA } from "@/types/dominio";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

/**
 * Dashboard Diario — vista principal de MateFlow.
 */
function Dashboard() {
  return (
    <GuardiaSesion>
      <DashboardContenido />
    </GuardiaSesion>
  );
}

function DashboardContenido() {
  const { tareas, cargando, crear, actualizarEstado } = useTareas();
  const registrarLogro = useGamificacionStore((s) => s.registrarLogro);
  const { usuario } = useAuth();

  const manejarConfirmacion = async (r: DTO_RespuestaProcesamientoIA) => {
    await crear(r.tareaExtraida, r.categoriaSugerida, 10);
  };

  const completar = async (id: string) => {
    const tarea = tareas.find((t) => t.id === id);
    await actualizarEstado(id, "Completada");
    if (tarea) registrarLogro(tarea.titulo, tarea.puntosExperiencia, tarea.areaVinculadaId ?? "General");
  };

  const nombre = usuario?.nombreCompleto?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavegacionPrincipal />
      <main className="mx-auto max-w-5xl px-5 py-8 space-y-8 pb-40 md:pb-32">
        <div>
          <p className="text-sm text-muted-foreground">Buen día{nombre ? `, ${nombre}` : ""} ☕</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
            Tomate un mate. La IA hace el resto.
          </h1>
        </div>
        <PanelGamificacion />
        <ListaMITs tareas={tareas} cargando={cargando} onCompletar={(id) => void completar(id)} />
      </main>
      <div className="fixed inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-5 bottom-[72px] md:bottom-0">
        <div className="mx-auto max-w-5xl px-5">
          <InputMagico onTareaConfirmada={manejarConfirmacion} />
        </div>
      </div>
      <BarraInferior />
    </div>
  );
}
