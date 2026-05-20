/**
 * Contratos de dominio estrictos para MateFlow.
 * Estos tipos actúan como "corralito" probabilístico para la IA y como
 * espejo del modelo que vivirá en PostgreSQL cuando el backend en C# exista.
 */

export type CategoriaPARA = "Proyecto" | "Area" | "Recurso" | "Archivo";

export type EstadoTarea = "Activa" | "Completada" | "Archivada";

/**
 * DTO de tarea. Refleja una fila futura en la tabla `tareas`.
 * Precondición: `puntosExperiencia` debe ser >= 0.
 */
export interface DTO_Tarea {
  id: string;
  titulo: string;
  categoria: CategoriaPARA;
  areaVinculadaId?: string;
  estado: EstadoTarea;
  fechaCreacion: string;
  puntosExperiencia: number;
}

/**
 * Respuesta estricta que el procesador mágico (Groq) debe devolver.
 * Cualquier desviación de esta forma se considera alucinación y debe rechazarse.
 */
export interface DTO_RespuestaProcesamientoIA {
  exito: boolean;
  tareaExtraida: string;
  categoriaSugerida: CategoriaPARA;
  tagsDetectados: string[];
  confianza: number;
}

/**
 * Resumen de gamificación visible en el dashboard.
 */
export interface DTO_PerfilGamificacion {
  nivel: number;
  xpActual: number;
  xpParaSiguienteNivel: number;
  xpPorArea: ReadonlyArray<{ area: string; xp: number }>;
  logrosRecientes: ReadonlyArray<{ id: string; descripcion: string; xp: number; fecha: string }>;
}
