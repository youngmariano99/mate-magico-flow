import { createFileRoute } from "@tanstack/react-router";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { PanelGamificacion } from "@/components/dashboard/PanelGamificacion";
import { ListaMITs } from "@/components/dashboard/ListaMITs";
import { PanelHabitosDiarios } from "@/components/dashboard/PanelHabitosDiarios";
import { ResumenSemanalIA } from "@/components/dashboard/ResumenSemanalIA";
import { GuardiaSesion } from "@/auth/GuardiaSesion";
import { useTareas } from "@/hooks/useTareas";
import { useGamificacionStore } from "@/stores/gamificacionStore";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

/**
 * Dashboard Diario — vista principal de MateFlow.
 *
 * Nota: toda la superficie de IA (Input Mágico, voz, resúmenes) vive ahora
 * dentro del `MateBotAvatar` global montado en `__root.tsx`. Acá sólo
 * renderizamos paneles de datos.
 */
function Dashboard() {
  return (
    <GuardiaSesion>
      <DashboardContenido />
    </GuardiaSesion>
  );
}

function DashboardContenido() {
  const { tareas, cargando, actualizarEstado } = useTareas();
  const registrarLogro = useGamificacionStore((s) => s.registrarLogro);
  const { usuario } = useAuth();

  const completar = async (id: string) => {
    const tarea = tareas.find((t) => t.id === id);
    await actualizarEstado(id, "Completada");
    if (tarea) registrarLogro(tarea.titulo, tarea.puntosExperiencia, tarea.areaVinculadaId ?? "General");
  };

  const nombre = usuario?.nombreCompleto?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavegacionPrincipal />
      <main className="mx-auto max-w-5xl px-5 py-8 space-y-8 pb-32 md:pb-24">
        <div>
          <p className="text-sm text-muted-foreground">Buen día{nombre ? `, ${nombre}` : ""} ☕</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
            Tomate un mate. La IA hace el resto.
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tocá al <strong className="text-foreground">MateBot</strong> en la esquina para capturar, dictar o pedir un resumen.
          </p>
        </div>
        <PanelGamificacion />
        <ResumenSemanalIA />
        <ListaMITs tareas={tareas} cargando={cargando} onCompletar={(id) => void completar(id)} />
        <PanelHabitosDiarios />
      </main>
      <BarraInferior />
    </div>
  );
}
