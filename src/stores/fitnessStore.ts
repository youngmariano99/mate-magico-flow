import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DTO_EventoFisico,
  DTO_PlantillaRutina,
  TipoEventoFisico,
} from "@/types/dominio";

/**
 * Store de Fitness — Event Sourcing.
 *
 * Invariantes:
 *  - `historialEventos` es APPEND-ONLY. No exponemos `editar` ni `eliminar`.
 *  - Cada evento es inmutable una vez registrado.
 *  - Las plantillas (`plantillas`) sí soportan CRUD libre porque son
 *    "configuración" y no eventos. Un evento conserva su `plantillaId`
 *    aunque la plantilla original sea editada o borrada.
 */

const XP_POR_TIPO: Record<TipoEventoFisico, number> = {
  NEAT: 4,
  PAUSA_ACTIVA: 3,
  ENTRENAMIENTO: 20,
};

const plantillasSeed: DTO_PlantillaRutina[] = [
  {
    id: "pl-piernas",
    titulo: "Día de Piernas",
    ejercicios: ["Sentadilla", "Peso Muerto Rumano", "Prensa", "Gemelos"],
    fechaCreacion: "2026-05-10T00:00:00Z",
  },
  {
    id: "pl-push",
    titulo: "Push (Pecho + Hombro + Tríceps)",
    ejercicios: ["Press Banca", "Press Militar", "Fondos", "Extensión Tríceps"],
    fechaCreacion: "2026-05-10T00:00:00Z",
  },
];

const eventosSeed: DTO_EventoFisico[] = [
  {
    id: "ev-001",
    fechaHora: "2026-05-23T08:15:00Z",
    tipoEvento: "NEAT",
    metricas: "Caminata 20min al kiosco",
    xpOtorgado: 4,
  },
  {
    id: "ev-002",
    fechaHora: "2026-05-23T15:40:00Z",
    tipoEvento: "PAUSA_ACTIVA",
    metricas: "5min movilidad cervical",
    xpOtorgado: 3,
  },
];

interface EntradaEntrenamiento {
  plantillaId: string;
  /** Detalle libre por ejercicio (ej: "3x10 60kg"). */
  detalles: ReadonlyArray<{ ejercicio: string; serie: string }>;
}

interface EstadoFitness {
  historialEventos: ReadonlyArray<DTO_EventoFisico>;
  plantillas: ReadonlyArray<DTO_PlantillaRutina>;
  hidratado: boolean;
  marcarHidratado: () => void;

  /** Registra una caminata/movimiento corto. */
  registrarNEAT: (metricas?: string) => DTO_EventoFisico;
  /** Registra una pausa activa breve. */
  registrarPausaActiva: (metricas?: string) => DTO_EventoFisico;
  /** Registra un entrenamiento completo a partir de una plantilla. */
  registrarEntrenamiento: (entrada: EntradaEntrenamiento) => DTO_EventoFisico;
  /** Append directo (usado por el Procesador Mágico / Input Mágico). */
  registrarEventoCrudo: (
    entrada: Omit<DTO_EventoFisico, "id" | "fechaHora" | "xpOtorgado"> & {
      xpOtorgado?: number;
    },
  ) => DTO_EventoFisico;

  /* CRUD de plantillas — NO son eventos, se permite edición/borrado. */
  crearPlantilla: (titulo: string, ejercicios: ReadonlyArray<string>) => DTO_PlantillaRutina;
  actualizarPlantilla: (id: string, cambios: Partial<Pick<DTO_PlantillaRutina, "titulo" | "ejercicios">>) => void;
  eliminarPlantilla: (id: string) => void;

  obtenerPlantilla: (id: string) => DTO_PlantillaRutina | undefined;
}

const generarId = (prefijo: string): string =>
  `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const construirEvento = (
  entrada: Omit<DTO_EventoFisico, "id" | "fechaHora">,
): DTO_EventoFisico => ({
  ...entrada,
  id: generarId("ev"),
  fechaHora: new Date().toISOString(),
});

export const useFitnessStore = create<EstadoFitness>()(
  persist(
    (set, get) => ({
      historialEventos: eventosSeed,
      plantillas: plantillasSeed,
      hidratado: false,
      marcarHidratado: () => set({ hidratado: true }),

      registrarNEAT: (metricas = "Caminata corta") => {
        const ev = construirEvento({
          tipoEvento: "NEAT",
          metricas,
          xpOtorgado: XP_POR_TIPO.NEAT,
        });
        set({ historialEventos: [ev, ...get().historialEventos] });
        return ev;
      },

      registrarPausaActiva: (metricas = "Pausa activa") => {
        const ev = construirEvento({
          tipoEvento: "PAUSA_ACTIVA",
          metricas,
          xpOtorgado: XP_POR_TIPO.PAUSA_ACTIVA,
        });
        set({ historialEventos: [ev, ...get().historialEventos] });
        return ev;
      },

      registrarEntrenamiento: ({ plantillaId, detalles }) => {
        const plantilla = get().plantillas.find((p) => p.id === plantillaId);
        const titulo = plantilla?.titulo ?? "Entrenamiento libre";
        const cuerpo = detalles
          .filter((d) => d.serie.trim().length > 0)
          .map((d) => `${d.ejercicio}: ${d.serie.trim()}`)
          .join(" · ");
        const ev = construirEvento({
          tipoEvento: "ENTRENAMIENTO",
          metricas: cuerpo ? `${titulo} — ${cuerpo}` : titulo,
          plantillaId,
          xpOtorgado: XP_POR_TIPO.ENTRENAMIENTO,
        });
        set({ historialEventos: [ev, ...get().historialEventos] });
        return ev;
      },

      registrarEventoCrudo: ({ tipoEvento, metricas, plantillaId, xpOtorgado }) => {
        const ev = construirEvento({
          tipoEvento,
          metricas,
          plantillaId,
          xpOtorgado: xpOtorgado ?? XP_POR_TIPO[tipoEvento],
        });
        set({ historialEventos: [ev, ...get().historialEventos] });
        return ev;
      },

      crearPlantilla: (titulo, ejercicios) => {
        const nueva: DTO_PlantillaRutina = {
          id: generarId("pl"),
          titulo: titulo.trim(),
          ejercicios: ejercicios.map((e) => e.trim()).filter((e) => e.length > 0),
          fechaCreacion: new Date().toISOString(),
        };
        set({ plantillas: [...get().plantillas, nueva] });
        return nueva;
      },

      actualizarPlantilla: (id, cambios) => {
        set({
          plantillas: get().plantillas.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...(cambios.titulo !== undefined ? { titulo: cambios.titulo.trim() } : null),
                  ...(cambios.ejercicios
                    ? { ejercicios: cambios.ejercicios.map((e) => e.trim()).filter(Boolean) }
                    : null),
                }
              : p,
          ),
        });
      },

      eliminarPlantilla: (id) => {
        set({ plantillas: get().plantillas.filter((p) => p.id !== id) });
      },

      obtenerPlantilla: (id) => get().plantillas.find((p) => p.id === id),
    }),
    {
      name: "mateflow.fitness.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        historialEventos: s.historialEventos,
        plantillas: s.plantillas,
      }),
      onRehydrateStorage: () => (state) => state?.marcarHidratado(),
    },
  ),
);
