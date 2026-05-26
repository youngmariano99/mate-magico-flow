import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DTO_EventoKPI, DTO_KPI, FrecuenciaKPI } from "@/types/dominio";

/**
 * Store de KPIs Personales (Quantified Self paramétrico).
 *
 * Invariantes:
 *  - `eventos` es APPEND-ONLY. Cada incremento (manual, botón +1 o IA) se
 *    materializa como un `DTO_EventoKPI` inmutable con su timestamp.
 *  - NUNCA se guardan totales preagregados. El cálculo del progreso vive
 *    en `useMetricasAgregadas` y se memoiza por rango temporal.
 *  - Las definiciones (`kpis`) sí son configuración y soportan CRUD libre.
 */

const generarId = (prefijo: string): string =>
  `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const kpisSeed: DTO_KPI[] = [
  {
    id: "kpi-frutas",
    titulo: "Frutas",
    area: "Salud",
    objetivo: 4,
    unidad: "frutas",
    frecuencia: "DIARIO",
    grupo: "Nutrición",
    colorAcento: "oklch(0.72 0.18 145)",
    fechaCreacion: "2026-05-20T00:00:00Z",
  },
  {
    id: "kpi-agua",
    titulo: "Vasos de agua",
    area: "Salud",
    objetivo: 8,
    unidad: "vasos",
    frecuencia: "DIARIO",
    grupo: "Nutrición",
    colorAcento: "oklch(0.72 0.14 200)",
    fechaCreacion: "2026-05-20T00:00:00Z",
  },
  {
    id: "kpi-pausas",
    titulo: "Pausas activas",
    area: "Salud",
    objetivo: 4,
    unidad: "veces",
    frecuencia: "DIARIO",
    grupo: "Actividad Física",
    colorAcento: "oklch(0.78 0.16 80)",
    fechaCreacion: "2026-05-20T00:00:00Z",
  },
  {
    id: "kpi-horas-mov",
    titulo: "Movimiento total",
    area: "Salud",
    objetivo: 4,
    unidad: "hrs",
    frecuencia: "SEMANAL",
    grupo: "Actividad Física",
    colorAcento: "oklch(0.7 0.18 30)",
    fechaCreacion: "2026-05-20T00:00:00Z",
  },
  {
    id: "kpi-fuerza",
    titulo: "Entreno de fuerza",
    area: "Salud",
    objetivo: 2,
    unidad: "hrs",
    frecuencia: "SEMANAL",
    grupo: "Actividad Física",
    colorAcento: "oklch(0.65 0.2 320)",
    fechaCreacion: "2026-05-20T00:00:00Z",
  },
  {
    id: "kpi-lectura",
    titulo: "Lectura",
    area: "Facultad",
    objetivo: 600,
    unidad: "min",
    frecuencia: "MENSUAL",
    grupo: "Mente",
    colorAcento: "oklch(0.7 0.18 260)",
    fechaCreacion: "2026-05-20T00:00:00Z",
  },
];

const hace = (ms: number) => new Date(Date.now() - ms).toISOString();

const eventosSeed: DTO_EventoKPI[] = [
  { id: "ek-1", kpiId: "kpi-frutas", fechaHora: hace(1000 * 60 * 60 * 3), cantidad: 1, fuente: "INCREMENTO_RAPIDO" },
  { id: "ek-2", kpiId: "kpi-frutas", fechaHora: hace(1000 * 60 * 60 * 7), cantidad: 1, fuente: "INCREMENTO_RAPIDO" },
  { id: "ek-3", kpiId: "kpi-frutas", fechaHora: hace(1000 * 60 * 60 * 26), cantidad: 2, fuente: "MANUAL" },
  { id: "ek-4", kpiId: "kpi-agua", fechaHora: hace(1000 * 60 * 60 * 2), cantidad: 3, fuente: "INCREMENTO_RAPIDO" },
  { id: "ek-5", kpiId: "kpi-agua", fechaHora: hace(1000 * 60 * 60 * 30), cantidad: 6, fuente: "MANUAL" },
  { id: "ek-6", kpiId: "kpi-pausas", fechaHora: hace(1000 * 60 * 60 * 5), cantidad: 2, fuente: "INCREMENTO_RAPIDO" },
  { id: "ek-7", kpiId: "kpi-horas-mov", fechaHora: hace(1000 * 60 * 60 * 48), cantidad: 1.2, fuente: "MANUAL" },
  { id: "ek-8", kpiId: "kpi-fuerza", fechaHora: hace(1000 * 60 * 60 * 72), cantidad: 1, fuente: "MANUAL" },
  { id: "ek-9", kpiId: "kpi-lectura", fechaHora: hace(1000 * 60 * 60 * 24 * 10), cantidad: 180, fuente: "MANUAL" },
  { id: "ek-10", kpiId: "kpi-lectura", fechaHora: hace(1000 * 60 * 60 * 24 * 4), cantidad: 90, fuente: "MANUAL" },
];

interface EntradaNuevoKPI {
  titulo: string;
  area: string;
  objetivo: number;
  unidad: string;
  frecuencia: FrecuenciaKPI;
  grupo?: string;
  colorAcento?: string;
}

interface EstadoKPIs {
  kpis: ReadonlyArray<DTO_KPI>;
  eventos: ReadonlyArray<DTO_EventoKPI>;
  hidratado: boolean;
  marcarHidratado: () => void;

  crearKPI: (entrada: EntradaNuevoKPI) => DTO_KPI;
  eliminarKPI: (id: string) => void;

  /** Suma una cantidad al KPI registrando un evento puntual. */
  incrementar: (
    kpiId: string,
    cantidad: number,
    fuente?: DTO_EventoKPI["fuente"],
    nota?: string,
  ) => DTO_EventoKPI | null;
}

export const useKpisStore = create<EstadoKPIs>()(
  persist(
    (set, get) => ({
      kpis: kpisSeed,
      eventos: eventosSeed,
      hidratado: false,
      marcarHidratado: () => set({ hidratado: true }),

      crearKPI: (entrada) => {
        const nuevo: DTO_KPI = {
          ...entrada,
          id: generarId("kpi"),
          titulo: entrada.titulo.trim(),
          fechaCreacion: new Date().toISOString(),
        };
        set({ kpis: [...get().kpis, nuevo] });
        return nuevo;
      },

      eliminarKPI: (id) => {
        // Conservamos eventos pasados por trazabilidad histórica.
        set({ kpis: get().kpis.filter((k) => k.id !== id) });
      },

      incrementar: (kpiId, cantidad, fuente = "MANUAL", nota) => {
        const kpi = get().kpis.find((k) => k.id === kpiId);
        if (!kpi || cantidad <= 0 || !Number.isFinite(cantidad)) return null;
        const ev: DTO_EventoKPI = {
          id: generarId("ek"),
          kpiId,
          fechaHora: new Date().toISOString(),
          cantidad,
          fuente,
          nota,
        };
        set({ eventos: [ev, ...get().eventos] });
        return ev;
      },
    }),
    {
      name: "mateflow.kpis.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ kpis: s.kpis, eventos: s.eventos }),
      onRehydrateStorage: () => (state) => state?.marcarHidratado(),
    },
  ),
);
