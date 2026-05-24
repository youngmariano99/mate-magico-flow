import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { NavegacionPrincipal, BarraInferior } from "@/components/layout/NavegacionPrincipal";
import { PanelGamificacion } from "@/components/dashboard/PanelGamificacion";
import { ListaMITs } from "@/components/dashboard/ListaMITs";
import { PanelHabitosDiarios } from "@/components/dashboard/PanelHabitosDiarios";
import { InputMagico } from "@/components/dashboard/InputMagico";
import { GuardiaSesion } from "@/auth/GuardiaSesion";
import { useTareas } from "@/hooks/useTareas";
import { useTareasStore } from "@/stores/tareasStore";
import { useHabitosStore } from "@/stores/habitosStore";
import { useGamificacionStore } from "@/stores/gamificacionStore";
import { useFitnessStore } from "@/stores/fitnessStore";
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
  const moverTarea = useTareasStore((s) => s.moverTarea);
  const alternarHabito = useHabitosStore((s) => s.alternarEstadoHabito);
  const registrarLogro = useGamificacionStore((s) => s.registrarLogro);
  const registrarEventoFitness = useFitnessStore((s) => s.registrarEventoCrudo);
  const { usuario } = useAuth();

  /**
   * Despacha la respuesta confirmada al store apropiado según la intención.
   * Cada rama es deliberadamente angosta: si más adelante se agregan
   * intenciones, TypeScript exigirá tratarlas (exhaustividad explícita).
   */
  const manejarConfirmacion = async (r: DTO_RespuestaProcesamientoIA) => {
    switch (r.intencion) {
      case "AGENDAR_EVENTO": {
        const nueva = await useTareasStore.getState().agregar({
          titulo: r.tareaExtraida,
          categoria: r.categoriaSugerida,
          puntosExperiencia: 10,
          etiquetas: r.tagsDetectados,
        });
        if (r.fechaSugerida) await moverTarea(nueva.id, r.fechaSugerida);
        toast.success("📅 Agendado", {
          description: r.fechaSugerida ?? "Sin fecha — quedó en el backlog",
        });
        break;
      }
      case "AGREGAR_NOTA": {
        await useTareasStore.getState().agregar({
          titulo: r.tareaExtraida,
          categoria: "Recurso",
          puntosExperiencia: 5,
          etiquetas: r.tagsDetectados,
          notasMarkdown: r.tareaExtraida,
        });
        toast.success("💡 Nota guardada en el Segundo Cerebro");
        break;
      }
      case "REGISTRAR_RUTINA": {
        await useTareasStore.getState().agregar({
          titulo: r.metricasExtraidas ? `Rutina: ${r.metricasExtraidas}` : r.tareaExtraida,
          categoria: "Area",
          areaVinculadaId: "salud",
          puntosExperiencia: 20,
          etiquetas: ["Salud", ...r.tagsDetectados],
        });
        registrarLogro(`Rutina registrada — ${r.tareaExtraida}`, 20, "Salud");
        toast.success("🏋️ +20 XP en Salud");
        break;
      }
      case "COMPLETAR_HABITO": {
        const habito = useHabitosStore.getState().habitos.find((h) =>
          r.tareaExtraida.toLowerCase().includes(h.titulo.toLowerCase()),
        );
        if (habito && !habito.completadoHoy) {
          const act = alternarHabito(habito.id);
          if (act) registrarLogro(`Hábito: ${act.titulo}`, act.xpPorCompletar, act.area);
          toast.success(`🔥 ${habito.titulo} marcado`);
        } else {
          toast("No identifiqué el hábito exacto", { description: "Marcalo desde el panel diario." });
        }
        break;
      }
      case "COMPLETAR_TAREA": {
        const objetivo = tareas.find((t) =>
          r.tareaExtraida.toLowerCase().includes(t.titulo.toLowerCase().slice(0, 12)),
        );
        if (objetivo) {
          await actualizarEstado(objetivo.id, "Completada");
          registrarLogro(objetivo.titulo, objetivo.puntosExperiencia, objetivo.areaVinculadaId ?? "General");
          toast.success(`🎯 +${objetivo.puntosExperiencia} XP`);
        } else {
          toast("No encontré la tarea", { description: "Probá ser más específico." });
        }
        break;
      }
      case "AGREGAR_TAREA":
      default: {
        await crear(r.tareaExtraida, r.categoriaSugerida, 10);
        toast.success(`✅ Agregado a ${r.categoriaSugerida}`);
        break;
      }
    }
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
        <PanelHabitosDiarios />
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
