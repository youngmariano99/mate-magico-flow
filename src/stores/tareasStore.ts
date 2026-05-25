import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CategoriaPARA, DTO_ArchivoAdjunto, DTO_Tarea, EstadoTarea } from "@/types/dominio";


/**
 * Store Zustand de tareas con persistencia en localStorage.
 * Mantiene latencia simulada para emular llamadas de red reales,
 * de modo que migrar al backend C# + PostgreSQL no cambie consumidores.
 */

const LATENCIA_MS = 350;
const wait = <T,>(v: T): Promise<T> =>
  new Promise((r) => setTimeout(() => r(v), LATENCIA_MS));

const tareasSeed: DTO_Tarea[] = [
  {
    id: "t-001",
    titulo: "Terminar TP de Algoritmos UTN",
    categoria: "Proyecto",
    areaVinculadaId: "facultad",
    estado: "Activa",
    fechaCreacion: "2026-05-19T09:30:00Z",
    puntosExperiencia: 40,
    etiquetas: ["#UTN", "#Algoritmos", "#TP3"],
    notasMarkdown:
      "## Objetivo\nEntregar el TP de grafos antes del viernes.\n\n### Pendientes\n- [ ] Implementar Dijkstra\n- [ ] Generar caso de prueba grande\n- [ ] Redactar el informe en LaTeX",
  },
  {
    id: "t-002",
    titulo: "Ticket 001 Taller Mecánico",
    categoria: "Proyecto",
    areaVinculadaId: "desarrollo-profesional",
    estado: "Activa",
    fechaCreacion: "2026-05-19T08:00:00Z",
    puntosExperiencia: 35,
    etiquetas: ["#TallerMecánico", "#BackendCSharp", "#Tickets"],
    notasMarkdown:
      "## Contexto\nPrimer ticket del MVP del taller.\n\n### Criterios\n- El cliente puede dar de alta un vehículo.\n- Validar patente con regex AR.",
  },
  {
    id: "t-003",
    titulo: "Comprar creatina",
    categoria: "Area",
    areaVinculadaId: "salud",
    estado: "Activa",
    fechaCreacion: "2026-05-19T10:15:00Z",
    puntosExperiencia: 5,
  },
  {
    id: "t-004",
    titulo: "Apuntes de PostgreSQL",
    categoria: "Recurso",
    areaVinculadaId: "desarrollo-profesional",
    estado: "Activa",
    fechaCreacion: "2026-05-18T20:00:00Z",
    puntosExperiencia: 10,
    etiquetas: ["#PostgreSQL", "#Backend", "#Notas"],
    notasMarkdown:
      "# PostgreSQL — apuntes vivos\n\n- **EXPLAIN ANALYZE** primero, optimizar después.\n- Índices BRIN para columnas de tiempo en tablas enormes.\n- `pg_stat_statements` es tu amigo.\n\n## Para revisar\n- VACUUM vs ANALYZE: diferencias prácticas.\n- Particionado declarativo en tablas de logs.",
  },
  {
    id: "t-005",
    titulo: "Ideas geolocalización App Mascotas",
    categoria: "Recurso",
    areaVinculadaId: "mateflow",
    estado: "Activa",
    fechaCreacion: "2026-05-18T11:45:00Z",
    puntosExperiencia: 10,
    etiquetas: ["#AppMascotas", "#Arquitectura", "#Geolocalización"],
    notasMarkdown:
      "# Ideas — geolocalización\n\n- Usar **PostGIS** sobre la misma DB.\n- Alertas push cuando un perro perdido entra a un radio de 500m.\n- Heatmap de pérdidas por zona para autoridades.\n\n## Riesgos\n- Privacidad de ubicaciones en tiempo real.",
  },
  {
    id: "t-006",
    titulo: "Lanzar landing de MateFlow v0",
    categoria: "Proyecto",
    areaVinculadaId: "mateflow",
    estado: "Activa",
    fechaCreacion: "2026-05-18T11:45:00Z",
    puntosExperiencia: 50,
    etiquetas: ["#MateFlow", "#Lanzamiento"],
  },
  {
    id: "t-007",
    titulo: "Revisar gastos del mes",
    categoria: "Area",
    areaVinculadaId: "finanzas",
    estado: "Activa",
    fechaCreacion: "2026-05-19T10:00:00Z",
    puntosExperiencia: 10,
  },
  {
    id: "t-008",
    titulo: "Pomodoro de inglés",
    categoria: "Area",
    areaVinculadaId: "idiomas",
    estado: "Completada",
    fechaCreacion: "2026-05-17T19:00:00Z",
    puntosExperiencia: 15,
  },
  {
    id: "t-009",
    titulo: "Archivar notas de materia rendida",
    categoria: "Archivo",
    areaVinculadaId: "facultad",
    estado: "Archivada",
    fechaCreacion: "2026-05-15T18:00:00Z",
    puntosExperiencia: 0,
  },
];

interface EstadoTareas {
  tareas: DTO_Tarea[];
  /** Orden manual de las MITs en el Dashboard. Si está vacío, se ordena por XP. */
  ordenMITs: string[];
  hidratado: boolean;
  marcarHidratado: () => void;

  obtenerTodas: () => Promise<DTO_Tarea[]>;
  obtenerActivas: () => Promise<DTO_Tarea[]>;
  obtenerPorCategoria: (c: CategoriaPARA) => Promise<DTO_Tarea[]>;

  agregar: (entrada: Omit<DTO_Tarea, "id" | "fechaCreacion" | "estado">) => Promise<DTO_Tarea>;
  cambiarEstado: (id: string, estado: EstadoTarea) => Promise<DTO_Tarea | null>;
  /** Mueve una tarea a un día programado (YYYY-MM-DD) o la devuelve al backlog (null). */
  moverTarea: (id: string, fechaProgramada: string | null) => Promise<void>;
  /** Persiste el orden manual de MITs en el Dashboard. */
  reordenarMITs: (idsOrdenados: ReadonlyArray<string>) => void;
  /** Edita las notas markdown y etiquetas de una tarea/recurso. */
  actualizarNotas: (id: string, notasMarkdown: string, etiquetas: ReadonlyArray<string>) => Promise<void>;
  /** Adjunta un archivo (mock Google Drive) a una tarea/recurso. */
  adjuntarArchivo: (id: string, archivo: Omit<DTO_ArchivoAdjunto, "id" | "fechaAdjuntado">) => Promise<DTO_ArchivoAdjunto>;
}


export const useTareasStore = create<EstadoTareas>()(
  persist(
    (set, get) => ({
      tareas: tareasSeed,
      ordenMITs: [],
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

      moverTarea: async (id, fechaProgramada) => {
        const tareas = get().tareas.map((t) =>
          t.id === id ? { ...t, fechaProgramada } : t,
        );
        set({ tareas });
        await wait(null);
      },

      reordenarMITs: (idsOrdenados) => {
        set({ ordenMITs: [...idsOrdenados] });
      },

      actualizarNotas: async (id, notasMarkdown, etiquetas) => {
        const tareas = get().tareas.map((t) =>
          t.id === id ? { ...t, notasMarkdown, etiquetas: [...etiquetas] } : t,
        );
        set({ tareas });
        await wait(null);
      },

      adjuntarArchivo: async (id, archivo) => {
        const nuevo: DTO_ArchivoAdjunto = {
          ...archivo,
          id: `adj-${Math.random().toString(36).slice(2, 9)}`,
          fechaAdjuntado: new Date().toISOString(),
        };
        const tareas = get().tareas.map((t) =>
          t.id === id ? { ...t, adjuntos: [...(t.adjuntos ?? []), nuevo] } : t,
        );
        set({ tareas });
        return wait(nuevo);
      },
    }),

    {
      name: "mateflow.tareas.v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tareas: s.tareas, ordenMITs: s.ordenMITs }),
      onRehydrateStorage: () => (state) => state?.marcarHidratado(),
    },
  ),
);
