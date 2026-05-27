import { useCallback } from "react";
import { isToday, isPast, parseISO, differenceInCalendarDays } from "date-fns";
import { useTareasStore } from "@/stores/tareasStore";
import { useHabitosStore } from "@/stores/habitosStore";
import { useFitnessStore } from "@/stores/fitnessStore";
import { useGamificacionStore } from "@/stores/gamificacionStore";

/**
 * Consultas Rápidas — selectors puros sobre los stores de Zustand
 * comparando contra `new Date()`. Devuelven texto plano para mostrar
 * en el globo de diálogo del MateBot. Cero `any`, cero side-effects.
 */

export type TipoConsulta = "AHORA" | "COLGADO" | "BALANCE";

export interface RespuestaConsulta {
  readonly titulo: string;
  readonly cuerpo: string;
}

const formateoFecha = (iso: string): string => {
  try {
    return parseISO(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
};

export const useConsultasAsistente = () => {
  const responder = useCallback((tipo: TipoConsulta): RespuestaConsulta => {
    const hoy = new Date();
    const { tareas } = useTareasStore.getState();
    const { habitos } = useHabitosStore.getState();
    const { historialEventos } = useFitnessStore.getState();
    const { perfil } = useGamificacionStore.getState();

    switch (tipo) {
      case "AHORA": {
        const planificadasHoy = tareas.filter(
          (t) =>
            t.estado === "Activa" &&
            t.fechaProgramada &&
            isToday(parseISO(t.fechaProgramada)),
        );
        const habitosPendientes = habitos.filter((h) => !h.completadoHoy);

        if (planificadasHoy.length === 0 && habitosPendientes.length === 0) {
          return {
            titulo: "🎯 Tu foco ahora",
            cuerpo:
              "Tenés la agenda limpia. Si querés sumar XP, dictame una tarea o cerrá un hábito pendiente.",
          };
        }
        const top = planificadasHoy
          .sort((a, b) => b.puntosExperiencia - a.puntosExperiencia)
          .slice(0, 3)
          .map((t) => `• ${t.titulo} (+${t.puntosExperiencia} XP)`)
          .join("\n");
        const habs = habitosPendientes
          .slice(0, 3)
          .map((h) => `• ${h.titulo} — racha ${h.rachaActual}🔥`)
          .join("\n");

        return {
          titulo: "🎯 Tu foco ahora",
          cuerpo: [
            planificadasHoy.length ? `Hoy:\n${top}` : null,
            habitosPendientes.length ? `Hábitos abiertos:\n${habs}` : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
        };
      }

      case "COLGADO": {
        const vencidas = tareas.filter(
          (t) =>
            t.estado === "Activa" &&
            t.fechaProgramada &&
            isPast(parseISO(t.fechaProgramada)) &&
            !isToday(parseISO(t.fechaProgramada)),
        );
        const backlogViejo = tareas.filter((t) => {
          if (t.estado !== "Activa" || t.fechaProgramada) return false;
          return differenceInCalendarDays(hoy, parseISO(t.fechaCreacion)) >= 7;
        });

        if (vencidas.length === 0 && backlogViejo.length === 0) {
          return {
            titulo: "⚠️ Nada colgado",
            cuerpo: "Todo está en órbita. Aprovechá para capturar ideas nuevas.",
          };
        }
        const partes: string[] = [];
        if (vencidas.length > 0) {
          partes.push(
            `Vencidas (${vencidas.length}):\n` +
              vencidas
                .slice(0, 4)
                .map((t) => `• ${t.titulo} — agendada ${formateoFecha(t.fechaProgramada!)}`)
                .join("\n"),
          );
        }
        if (backlogViejo.length > 0) {
          partes.push(
            `En el backlog hace +7 días (${backlogViejo.length}):\n` +
              backlogViejo
                .slice(0, 4)
                .map((t) => `• ${t.titulo}`)
                .join("\n"),
          );
        }
        return {
          titulo: "⚠️ Lo que te quedó colgado",
          cuerpo: partes.join("\n\n"),
        };
      }

      case "BALANCE": {
        const tareasCompletadasHoy = tareas.filter(
          (t) =>
            t.estado === "Completada" &&
            isToday(parseISO(t.fechaCreacion)),
        ).length;
        const eventosHoy = historialEventos.filter((e) => isToday(parseISO(e.fechaHora)));
        const habitosCerrados = habitos.filter((h) => h.completadoHoy).length;
        const xpHoy = eventosHoy.reduce((s, e) => s + e.xpOtorgado, 0);

        const areasTop = [...perfil.xpPorArea]
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 3)
          .map((a) => `• ${a.area}: ${a.xp} XP`)
          .join("\n");

        return {
          titulo: "📊 Balance del día",
          cuerpo:
            `Nivel ${perfil.nivel} · ${perfil.xpActual}/${perfil.xpParaSiguienteNivel} XP\n\n` +
            `Hoy:\n• ${tareasCompletadasHoy} tareas cerradas\n• ${habitosCerrados}/${habitos.length} hábitos\n• ${eventosHoy.length} eventos físicos (+${xpHoy} XP)\n\n` +
            (areasTop ? `Áreas con más energía:\n${areasTop}` : ""),
        };
      }
    }
  }, []);

  return { responder };
};
