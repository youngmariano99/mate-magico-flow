import type { DTO_Tarea, CategoriaPARA, EstadoTarea } from "@/types/dominio";

/**
 * Adapter mockeado del repositorio de tareas.
 * Cuando exista la API en C# + PostgreSQL, solo este archivo cambia: las
 * firmas (obtenerTareasActivas, agregarTarea, ...) se mantienen idénticas.
 */

const LATENCIA_SIMULADA_MS = 500;

const simularLatencia = <T,>(valor: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), LATENCIA_SIMULADA_MS));

const tareasSeed: DTO_Tarea[] = [
  {
    id: "t-001",
    titulo: "Entrenamiento de fuerza — pierna",
    categoria: "Area",
    areaVinculadaId: "salud",
    estado: "Activa",
    fechaCreacion: "2026-05-19T08:00:00Z",
    puntosExperiencia: 15,
  },
  {
    id: "t-002",
    titulo: "Resolver TP de Algoritmos II",
    categoria: "Proyecto",
    areaVinculadaId: "facultad",
    estado: "Activa",
    fechaCreacion: "2026-05-19T09:30:00Z",
    puntosExperiencia: 30,
  },
  {
    id: "t-003",
    titulo: "Revisar gastos del mes en planilla",
    categoria: "Area",
    areaVinculadaId: "finanzas",
    estado: "Activa",
    fechaCreacion: "2026-05-19T10:15:00Z",
    puntosExperiencia: 10,
  },
  {
    id: "t-004",
    titulo: "Leer capítulo 4 de Clean Architecture",
    categoria: "Recurso",
    areaVinculadaId: "desarrollo-profesional",
    estado: "Activa",
    fechaCreacion: "2026-05-18T20:00:00Z",
    puntosExperiencia: 20,
  },
  {
    id: "t-005",
    titulo: "Lanzar landing de MateFlow v0",
    categoria: "Proyecto",
    areaVinculadaId: "mateflow",
    estado: "Activa",
    fechaCreacion: "2026-05-18T11:45:00Z",
    puntosExperiencia: 50,
  },
  {
    id: "t-006",
    titulo: "Comprar yerba y bizcochitos",
    categoria: "Area",
    areaVinculadaId: "finanzas",
    estado: "Completada",
    fechaCreacion: "2026-05-17T13:00:00Z",
    puntosExperiencia: 5,
  },
  {
    id: "t-007",
    titulo: "Pomodoro de práctica de inglés",
    categoria: "Area",
    areaVinculadaId: "idiomas",
    estado: "Completada",
    fechaCreacion: "2026-05-17T19:00:00Z",
    puntosExperiencia: 15,
  },
  {
    id: "t-008",
    titulo: "Guardar artículo sobre PostgreSQL tuning",
    categoria: "Recurso",
    areaVinculadaId: "desarrollo-profesional",
    estado: "Activa",
    fechaCreacion: "2026-05-16T22:10:00Z",
    puntosExperiencia: 5,
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
  {
    id: "t-010",
    titulo: "Diseñar esquema de tabla `tareas` en PostgreSQL",
    categoria: "Proyecto",
    areaVinculadaId: "mateflow",
    estado: "Activa",
    fechaCreacion: "2026-05-19T07:00:00Z",
    puntosExperiencia: 25,
  },
];

let almacenInterno: DTO_Tarea[] = [...tareasSeed];

export const obtenerTareasActivas = (): Promise<DTO_Tarea[]> =>
  simularLatencia(almacenInterno.filter((t) => t.estado === "Activa"));

export const obtenerTodasLasTareas = (): Promise<DTO_Tarea[]> =>
  simularLatencia([...almacenInterno]);

export const obtenerTareasPorCategoria = (
  categoria: CategoriaPARA,
): Promise<DTO_Tarea[]> =>
  simularLatencia(almacenInterno.filter((t) => t.categoria === categoria));

export const agregarTarea = (
  entrada: Omit<DTO_Tarea, "id" | "fechaCreacion" | "estado">,
): Promise<DTO_Tarea> => {
  const nueva: DTO_Tarea = {
    ...entrada,
    id: `t-${Math.random().toString(36).slice(2, 9)}`,
    fechaCreacion: new Date().toISOString(),
    estado: "Activa",
  };
  almacenInterno = [nueva, ...almacenInterno];
  return simularLatencia(nueva);
};

export const cambiarEstadoTarea = (
  id: string,
  nuevoEstado: EstadoTarea,
): Promise<DTO_Tarea | null> => {
  almacenInterno = almacenInterno.map((t) =>
    t.id === id ? { ...t, estado: nuevoEstado } : t,
  );
  const actualizada = almacenInterno.find((t) => t.id === id) ?? null;
  return simularLatencia(actualizada);
};
