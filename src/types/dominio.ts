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
 * Sesión activa. Forma compatible con `Session` de Supabase Auth para que
 * el día de mañana se reemplace el adapter sin tocar consumidores.
 */
export interface DTO_Sesion {
  accessToken: string;
  refreshToken: string;
  expiraEn: number; // epoch ms
  usuario: DTO_Usuario;
}
