import { useMemo } from "react";
import { useFitnessStore } from "@/stores/fitnessStore";
import { useTareasStore } from "@/stores/tareasStore";
import { useGamificacionStore } from "@/stores/gamificacionStore";
import type { DTO_EventoFisico, DTO_Tarea, TipoEventoFisico } from "@/types/dominio";

/**
 * Selectores memoizados para analítica semanal.
 * Toda la agregación vive aquí (pura, sin side-effects) para no recalcular
 * en cada render de los componentes consumidores.
 */

export interface SegmentoXP {
  area: string;
  xp: number;
  /** Color OKLCH listo para recharts. */
  color: string;
}

export interface ResumenSemanal {
  tareasCompletadas: ReadonlyArray<DTO_Tarea>;
  eventosFitness: ReadonlyArray<DTO_EventoFisico>;
  conteoPorTipo: Record<TipoEventoFisico, number>;
  diasActivos: number;
  totalXpSemana: number;
  areaTop: string | null;
}

const PALETA: ReadonlyArray<string> = [
  "oklch(0.72 0.18 145)",
  "oklch(0.7 0.18 30)",
  "oklch(0.7 0.18 260)",
  "oklch(0.78 0.16 80)",
  "oklch(0.65 0.2 320)",
  "oklch(0.72 0.14 200)",
  "oklch(0.6 0.18 0)",
];

const inicioSemana = (ref: Date): Date => {
  const d = new Date(ref);
  const dia = d.getDay(); // 0 dom .. 6 sáb
  const diff = (dia + 6) % 7; // lunes como inicio
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
};

/** Distribución de XP por área para el gráfico de torta. */
export const useDistribucionXP = (): ReadonlyArray<SegmentoXP> => {
  const perfil = useGamificacionStore((s) => s.perfil);
  return useMemo(() => {
    return perfil.xpPorArea
      .filter((a) => a.xp > 0)
      .map((a, i) => ({ area: a.area, xp: a.xp, color: PALETA[i % PALETA.length] }));
  }, [perfil.xpPorArea]);
};

/** Cuenta los días distintos con al menos un evento en los últimos 7 días. */
export const useNivelActividad = (): { diasActivos: number; total: number } => {
  const eventos = useFitnessStore((s) => s.historialEventos);
  return useMemo(() => {
    const desde = inicioSemana(new Date());
    const dias = new Set<string>();
    for (const ev of eventos) {
      const fecha = new Date(ev.fechaHora);
      if (fecha >= desde) dias.add(fecha.toISOString().slice(0, 10));
    }
    return { diasActivos: dias.size, total: 7 };
  }, [eventos]);
};

/** Snapshot completo de la semana para el Asistente Ejecutivo. */
export const useResumenSemanal = (): ResumenSemanal => {
  const tareas = useTareasStore((s) => s.tareas);
  const eventos = useFitnessStore((s) => s.historialEventos);

  return useMemo(() => {
    const desde = inicioSemana(new Date());
    const tareasSemana = tareas.filter(
      (t) => t.estado === "Completada" && new Date(t.fechaCreacion) >= desde,
    );
    const eventosSemana = eventos.filter((e) => new Date(e.fechaHora) >= desde);

    const conteoPorTipo: Record<TipoEventoFisico, number> = {
      NEAT: 0,
      PAUSA_ACTIVA: 0,
      ENTRENAMIENTO: 0,
    };
    const dias = new Set<string>();
    for (const ev of eventosSemana) {
      conteoPorTipo[ev.tipoEvento] += 1;
      dias.add(new Date(ev.fechaHora).toISOString().slice(0, 10));
    }

    const xpTareas = tareasSemana.reduce((acc, t) => acc + t.puntosExperiencia, 0);
    const xpEventos = eventosSemana.reduce((acc, e) => acc + e.xpOtorgado, 0);

    const xpPorArea = new Map<string, number>();
    for (const t of tareasSemana) {
      const area = t.areaVinculadaId ?? "General";
      xpPorArea.set(area, (xpPorArea.get(area) ?? 0) + t.puntosExperiencia);
    }
    let areaTop: string | null = null;
    let max = 0;
    xpPorArea.forEach((v, k) => {
      if (v > max) {
        max = v;
        areaTop = k;
      }
    });

    return {
      tareasCompletadas: tareasSemana,
      eventosFitness: eventosSemana,
      conteoPorTipo,
      diasActivos: dias.size,
      totalXpSemana: xpTareas + xpEventos,
      areaTop,
    };
  }, [tareas, eventos]);
};
