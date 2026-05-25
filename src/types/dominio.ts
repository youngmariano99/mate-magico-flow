/**
 * Contratos de dominio estrictos para MateFlow.
 * Espejo del modelo futuro en PostgreSQL + Supabase Auth.
 */

export type CategoriaPARA = "Proyecto" | "Area" | "Recurso" | "Archivo";
export type EstadoTarea = "Activa" | "Completada" | "Archivada";

export interface DTO_ArchivoAdjunto {
  id: string;
  nombre: string;
  /** URL mockeada que simula un enlace público de Google Drive. */
  urlMockeada: string;
  /** Extensión normalizada para elegir ícono (pdf, doc, sheet, img, link). */
  tipoIcono: "pdf" | "doc" | "sheet" | "slide" | "img" | "link" | "otro";
  fechaAdjuntado: string;
}

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
  /** Archivos adjuntos (mock de Google Drive). */
  adjuntos?: ReadonlyArray<DTO_ArchivoAdjunto>;
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

/**
 * Proyecto PARA. En el mock se persiste como una `DTO_Tarea` con
 * `categoria: "Proyecto"` dentro de `tareasStore`, pero la UI manipula
 * este contrato estructurado para el CRUD manual.
 */
export interface DTO_Proyecto {
  id: string;
  titulo: string;
  area: string;
  descripcion?: string;
  fechaObjetivo?: string;
  fechaCreacion: string;
}

/* -------------------------------------------------------------------------- */
/* Fitness & Cuantificación Personal (Event Sourcing)                         */
/* -------------------------------------------------------------------------- */

/** Tipos de eventos físicos. Unión cerrada — el escudo léxico y la UI se
 *  apoyan en exhaustividad explícita. */
export type TipoEventoFisico = "NEAT" | "PAUSA_ACTIVA" | "ENTRENAMIENTO";

/**
 * Evento físico inmutable. El `fitnessStore` es append-only: no se editan
 * ni borran eventos, para preservar el historial analítico.
 */
export interface DTO_EventoFisico {
  id: string;
  fechaHora: string; // ISO 8601
  tipoEvento: TipoEventoFisico;
  /** Métricas crudas, ej: "20min caminata", "3x10 sentadilla 60kg". */
  metricas: string;
  /** Referencia opcional a la plantilla origen (para entrenamientos). */
  plantillaId?: string;
  /** XP otorgado en el momento del registro (para auditoría). */
  xpOtorgado: number;
}

/**
 * Plantilla de rutina reutilizable. CRUD libre — NO es parte del historial
 * inmutable: las plantillas pueden editarse y borrarse sin afectar eventos
 * pasados (que ya quedaron congelados con su `plantillaId`).
 */
export interface DTO_PlantillaRutina {
  id: string;
  titulo: string;
  ejercicios: ReadonlyArray<string>;
  fechaCreacion: string;
}
