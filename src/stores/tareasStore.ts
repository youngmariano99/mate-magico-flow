import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CategoriaPARA, DTO_Tarea, EstadoTarea } from "@/types/dominio";

/**
 * Store Zustand de tareas con persistencia en localStorage.
 * Mantiene latencia simulada (500ms) para emular llamadas de red reales,
 * de modo que migrar al backend C# + PostgreSQL no cambie consumidores.
 */

const LATENCIA_MS = 500;
const wait = <T,>(v: T): Promise<T> =>
  new Promise((r) => setTimeout(() => r(v), LATENCIA_MS));

const tareasSeed: DTO_Tarea[] = [
  { id: "t-001", titulo: "Entrenamiento de fuerza — pierna", categoria: "Area", areaVinculadaId: "salud", estado: "Activa", fechaCreacion: "2026-05-19T08:00:00Z", puntosExperiencia: 15 },
  { id: "t-002", titulo: "Resolver TP de Algoritmos II", categoria: "Proyecto", areaVinculadaId: "facultad", estado: "Activa", fechaCreacion: "2026-05-19T09:30:00Z", puntosExperiencia: 30 },
  { id: "t-003", titulo: "Revisar gastos del mes en planilla", categoria: "Area", areaVinculadaId: "finanzas", estado: "Activa", fechaCreacion: "2026-05-19T10:15:00Z", puntosExperiencia: 10 },
  { id: "t-004", titulo: "Leer capítulo 4 de Clean Architecture", categoria: "Recurso", areaVinculadaId: "desarrollo-profesional", estado: "Activa", fechaCreacion: "2026-05-18T20:00:00Z", puntosExperiencia: 20 },
  { id: "t-005", titulo: "Lanzar landing de MateFlow v0", categoria: "Proyecto", areaVinculadaId: "mateflow", estado: "Activa", fechaCreacion: "2026-05-18T11:45:00Z", puntosExperiencia: 50 },
  { id: "t-006", titulo: "Comprar yerba y bizcochitos", categoria: "Area", areaVinculadaId: "finanzas", estado: "Completada", fechaCreacion: "2026-05-17T13:00:00Z", puntosExperiencia: 5 },
  { id: "t-007", titulo: "Pomodoro de práctica de inglés", categoria: "Area", areaVinculadaId: "idiomas", estado: "Completada", fechaCreacion: "2026-05-17T19:00:00Z", puntosExperiencia: 15 },
  { id: "t-008", titulo: "Guardar artículo sobre PostgreSQL tuning", categoria: "Recurso", areaVinculadaId: "desarrollo-profesional", estado: "Activa", fechaCreacion: "2026-05-16T22:10:00Z", puntosExperiencia: 5 },
  { id: "t-009", titulo: "Archivar notas de materia rendida", categoria: "Archivo", areaVinculadaId: "facultad", estado: "Archivada", fechaCreacion: "2026-05-15T18:00:00Z", puntosExperiencia: 0 },
  { id: "t-010", titulo: "Diseñar esquema de tabla `tareas` en PostgreSQL", categoria: "Proyecto", areaVinculadaId: "mateflow", estado: "Activa", fechaCreacion: "2026-05-19T07:00:00Z", puntosExperiencia: 25 },
];

interface EstadoTareas {
  tareas: DTO_Tarea[];
  hidratado: boolean;
  /** Marca el store como hidratado tras leer de localStorage. */
  marcarHidratado: () => void;
  obtenerTodas: () => Promise<DTO_Tarea[]>;
  obtenerActivas: () => Promise<DTO_Tarea[]>;
  obtenerPorCategoria: (c: CategoriaPARA) => Promise<DTO_Tarea[]>;
  /** Precondición: titulo no vacío, puntos >= 0. */
  agregar: (entrada: Omit<DTO_Tarea, "id" | "fechaCreacion" | "estado">) => Promise<DTO_Tarea>;
  cambiarEstado: (id: string, estado: EstadoTarea) => Promise<DTO_Tarea | null>;
}

export const useTareasStore = create<EstadoTareas>()(
  persist(
    (set, get) => ({
      tareas: tareasSeed,
      hidratado: false,
      marcarHidratado: () => set({ hidratado: true }),

      obtenerTodas: () => wait([...get().tareas]),
      obtenerActivas: () => wait(get().tareas.filter((t) => t.estado === "Activa")),
      obtenerPorCategoria: (c) => wait(get().tareas.filter((t) => t.categoria === c)),

      agregar: async (entrada) => {
        const nueva: DTO_Tarea = {
          ...entrada,
          id: `t-${Math.random().toString(36).slice(2, 9)}`,
          fechaCreacion: new Date().toISOString(),
          estado: "Activa",
        };
        set({ tareas: [nueva, ...get().tareas] });
        return wait(nueva);
      },

      cambiarEstado: async (id, estado) => {
        const tareas = get().tareas.map((t) => (t.id === id ? { ...t, estado } : t));
        set({ tareas });
        return wait(tareas.find((t) => t.id === id) ?? null);
      },
    }),
    {
      name: "mateflow.tareas.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tareas: s.tareas }),
      onRehydrateStorage: () => (state) => state?.marcarHidratado(),
    },
  ),
);
