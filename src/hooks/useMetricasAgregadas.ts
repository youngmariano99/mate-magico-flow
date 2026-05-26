import { useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { useKpisStore } from "@/stores/kpisStore";
import type { DTO_KPI, FrecuenciaKPI } from "@/types/dominio";

/**
 * Vistas temporales soportadas por el dashboard de KPIs.
 */
export type VistaTemporal = "DIA" | "SEMANA" | "MES";

export interface MetricaKPI {
  /** Cantidad sumada en el rango activo. */
  acumulado: number;
  /** Meta proyectada al rango activo (escala desde `kpi.frecuencia`). */
  objetivoEscalado: number;
  /** 0..100 capeado para barras/anillos. */
  porcentaje: number;
  /** True cuando `acumulado >= objetivoEscalado` (modo "Récord"). */
  esRecord: boolean;
  /** Cantidad cruda de eventos contribuyentes (no la suma). */
  cantidadEventos: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers puros                                                              */
/* -------------------------------------------------------------------------- */

const FACTOR: Record<VistaTemporal | FrecuenciaKPI, number> = {
  DIA: 1,
  SEMANA: 7,
  MES: 30,
  DIARIO: 1,
  SEMANAL: 7,
  MENSUAL: 30,
};

/** Convierte la meta nativa del KPI a la escala temporal de la vista. */
export const escalarObjetivo = (kpi: DTO_KPI, vista: VistaTemporal): number => {
  const factorVista = FACTOR[vista];
  const factorKpi = FACTOR[kpi.frecuencia];
  return (kpi.objetivo * factorVista) / factorKpi;
};

const rangoDeVista = (vista: VistaTemporal, ref: Date) => {
  if (vista === "DIA") return { desde: startOfDay(ref), hasta: endOfDay(ref) };
  if (vista === "SEMANA")
    return {
      desde: startOfWeek(ref, { weekStartsOn: 1 }),
      hasta: endOfWeek(ref, { weekStartsOn: 1 }),
    };
  return { desde: startOfMonth(ref), hasta: endOfMonth(ref) };
};

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Calcula la métrica agregada de un único KPI en la vista temporal indicada.
 * Memoiza por (kpiId, vista, eventos).
 */
export const useMetricaKPI = (kpi: DTO_KPI, vista: VistaTemporal): MetricaKPI => {
  const eventos = useKpisStore((s) => s.eventos);

  return useMemo(() => {
    const { desde, hasta } = rangoDeVista(vista, new Date());
    let acumulado = 0;
    let cantidadEventos = 0;
    for (const ev of eventos) {
      if (ev.kpiId !== kpi.id) continue;
      const fecha = new Date(ev.fechaHora);
      if (fecha >= desde && fecha <= hasta) {
        acumulado += ev.cantidad;
        cantidadEventos += 1;
      }
    }
    const objetivoEscalado = escalarObjetivo(kpi, vista);
    const porcentaje =
      objetivoEscalado > 0
        ? Math.min(100, (acumulado / objetivoEscalado) * 100)
        : 0;
    const esRecord = objetivoEscalado > 0 && acumulado >= objetivoEscalado;
    return { acumulado, objetivoEscalado, porcentaje, esRecord, cantidadEventos };
  }, [eventos, kpi, vista]);
};

/**
 * Devuelve los KPIs agrupados por `grupo` (o "General" si no hay grupo
 * definido). El orden de los grupos es estable según la primera aparición.
 */
export const useKPIsAgrupados = (): ReadonlyArray<{ grupo: string; kpis: ReadonlyArray<DTO_KPI> }> => {
  const kpis = useKpisStore((s) => s.kpis);
  return useMemo(() => {
    const orden: string[] = [];
    const mapa = new Map<string, DTO_KPI[]>();
    for (const k of kpis) {
      const grupo = k.grupo?.trim() || "General";
      if (!mapa.has(grupo)) {
        mapa.set(grupo, []);
        orden.push(grupo);
      }
      mapa.get(grupo)!.push(k);
    }
    return orden.map((grupo) => ({ grupo, kpis: mapa.get(grupo)! }));
  }, [kpis]);
};
