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

/**
 * Intenciones reconocidas por el Procesador Mágico.
 * El Escudo Léxico se asegura de que toda entrada se mapee a una de estas
 * intenciones o sea rechazada con 0 ms de latencia.
 */
export type IntencionIA =
  | "AGREGAR_TAREA"
  | "AGREGAR_NOTA"
  | "AGENDAR_EVENTO"
  | "COMPLETAR_TAREA"
  | "COMPLETAR_HABITO"
  | "REGISTRAR_RUTINA";

export interface DTO_RespuestaProcesamientoIA {
  exito: boolean;
  intencion: IntencionIA;
  tareaExtraida: string;
  categoriaSugerida: CategoriaPARA;
  tagsDetectados: string[];
  confianza: number;
  /** True si la intención requiere agendar en el calendario semanal. */
  requiereAgendamiento: boolean;
  /** Fecha sugerida en ISO YYYY-MM-DD. */
  fechaSugerida?: string;
  /** Hora sugerida en HH:mm 24h. */
  horaSugerida?: string;
  /** Métricas crudas extraídas (ej: "2x5 sentadillas 10kg" o "10km 40min"). */
  metricasExtraidas?: string;
  /** Referencia opcional a la tarea/hábito objetivo (para COMPLETAR_*). */
  objetivoId?: string;
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
