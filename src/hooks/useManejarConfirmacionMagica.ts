import { useCallback } from "react";
import { toast } from "sonner";
import { useTareasStore } from "@/stores/tareasStore";
import { useHabitosStore } from "@/stores/habitosStore";
import { useGamificacionStore } from "@/stores/gamificacionStore";
import { useFitnessStore } from "@/stores/fitnessStore";
import { useKpisStore } from "@/stores/kpisStore";
import type { DTO_RespuestaProcesamientoIA } from "@/types/dominio";

/**
 * Hook que centraliza el despacho de la respuesta de IA hacia los stores.
 *
 * Pre-condición: `r.intencion` debe ser una de las uniones definidas en
 * `DTO_RespuestaProcesamientoIA`. El `default` cubre fallback seguro
 * (creación de tarea genérica) para garantizar exhaustividad blanda.
 */
export const useManejarConfirmacionMagica = () => {
  const moverTarea = useTareasStore((s) => s.moverTarea);
  const cambiarEstado = useTareasStore((s) => s.cambiarEstado);
  const alternarHabito = useHabitosStore((s) => s.alternarEstadoHabito);
  const registrarLogro = useGamificacionStore((s) => s.registrarLogro);
  const registrarEventoFitness = useFitnessStore((s) => s.registrarEventoCrudo);
  const incrementarKPI = useKpisStore((s) => s.incrementar);

  return useCallback(
    async (r: DTO_RespuestaProcesamientoIA) => {
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
          const metricas = r.metricasExtraidas?.trim() || r.tareaExtraida;
          const ev = registrarEventoFitness({
            tipoEvento: "ENTRENAMIENTO",
            metricas,
          });
          registrarLogro(`Rutina — ${metricas}`, ev.xpOtorgado, "Salud");
          toast.success("🏋️ Entrenamiento registrado", {
            description: `+${ev.xpOtorgado} XP en Salud`,
          });
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
            toast("No identifiqué el hábito exacto", {
              description: "Marcalo desde el panel diario.",
            });
          }
          break;
        }
        case "COMPLETAR_TAREA": {
          const tareas = useTareasStore.getState().tareas;
          const objetivo = tareas.find((t) =>
            r.tareaExtraida.toLowerCase().includes(t.titulo.toLowerCase().slice(0, 12)),
          );
          if (objetivo) {
            await cambiarEstado(objetivo.id, "Completada");
            registrarLogro(
              objetivo.titulo,
              objetivo.puntosExperiencia,
              objetivo.areaVinculadaId ?? "General",
            );
            toast.success(`🎯 +${objetivo.puntosExperiencia} XP`);
          } else {
            toast("No encontré la tarea", { description: "Probá ser más específico." });
          }
          break;
        }
        case "AGREGAR_TAREA":
        default: {
          await useTareasStore.getState().agregar({
            titulo: r.tareaExtraida,
            categoria: r.categoriaSugerida,
            puntosExperiencia: 10,
          });
          toast.success(`✅ Agregado a ${r.categoriaSugerida}`);
          break;
        }
      }
    },
    [moverTarea, cambiarEstado, alternarHabito, registrarLogro, registrarEventoFitness],
  );
};
