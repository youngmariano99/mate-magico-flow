/**
 * Contratos de dominio estrictos para MateFlow.
 * Espejo del modelo futuro en PostgreSQL + Supabase Auth.
 */

export type CategoriaPARA = "Proyecto" | "Area" | "Recurso" | "Archivo";
export type EstadoTarea = "Activa" | "Completada" | "Archivada";

export interface DTO_Tarea {
  id: string;
  titulo: string;
  categoria: CategoriaPARA;
  areaVinculadaId?: string;
  estado: EstadoTarea;
  fechaCreacion: string;
  puntosExperiencia: number;
  /** Fecha ISO (YYYY-MM-DD) en la que la tarea fue planificada. Si es null/undefined, vive en el Backlog. */
  fechaProgramada?: string | null;
  /** Etiquetas libres usadas por el Segundo Cerebro. */
  etiquetas?: ReadonlyArray<string>;
  /** Contenido extendido (markdown) editable desde el Visor del Segundo Cerebro. */
  notasMarkdown?: string;
}

export interface DTO_RespuestaProcesamientoIA {
  exito: boolean;
  tareaExtraida: string;
  categoriaSugerida: CategoriaPARA;
  tagsDetectados: string[];
  confianza: number;
}

export interface DTO_PerfilGamificacion {
  nivel: number;
  xpActual: number;
  xpParaSiguienteNivel: number;
  xpPorArea: ReadonlyArray<{ area: string; xp: number }>;
  logrosRecientes: ReadonlyArray<{ id: string; descripcion: string; xp: number; fecha: string }>;
}

/**
 * Perfil de usuario. Espejo de la futura tabla `profiles` enlazada a `auth.users`.
 */
export interface DTO_Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  avatarUrl: string | null;
  zonaHoraria: string;
  fechaRegistro: string;
}

/**
 * Sesión activa. Forma compatible con `Session` de Supabase Auth.
 */
export interface DTO_Sesion {
  accessToken: string;
  refreshToken: string;
  expiraEn: number;
  usuario: DTO_Usuario;
}

/**
 * Hábito atómico. Distinto a una tarea: se repite a diario y acumula racha.
 * Espejo futuro de la tabla `habitos` + `habitos_registros`.
 */
export interface DTO_Habito {
  id: string;
  titulo: string;
  area: string;
  rachaActual: number;
  completadoHoy: boolean;
  /** XP otorgado cada vez que se completa. */
  xpPorCompletar: number;
}
