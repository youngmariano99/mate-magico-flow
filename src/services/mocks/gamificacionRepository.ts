import type { DTO_PerfilGamificacion } from "@/types/dominio";

/**
 * Adapter mockeado de gamificación. Misma intención que tareasRepository:
 * aislar el origen de datos para que el día de mañana solo cambie la URL.
 */

const LATENCIA_SIMULADA_MS = 400;

const perfilMock: DTO_PerfilGamificacion = {
  nivel: 7,
  xpActual: 1240,
  xpParaSiguienteNivel: 1500,
  xpPorArea: [
    { area: "Desarrollo Profesional", xp: 480 },
    { area: "Facultad", xp: 320 },
    { area: "Salud", xp: 210 },
    { area: "Finanzas", xp: 130 },
    { area: "Idiomas", xp: 100 },
  ],
  logrosRecientes: [
    { id: "l-1", descripcion: "+15 XP en Desarrollo Profesional", xp: 15, fecha: "Hoy 09:12" },
    { id: "l-2", descripcion: "+30 XP en Facultad — TP entregado", xp: 30, fecha: "Ayer 22:40" },
    { id: "l-3", descripcion: "+15 XP en Salud — entrenamiento completo", xp: 15, fecha: "Ayer 07:30" },
    { id: "l-4", descripcion: "+10 XP en Finanzas — revisión semanal", xp: 10, fecha: "Lun 19:05" },
    { id: "l-5", descripcion: "+5 XP en Idiomas — pomodoro de inglés", xp: 5, fecha: "Dom 20:00" },
  ],
};

export const obtenerPerfilGamificacion = (): Promise<DTO_PerfilGamificacion> =>
  new Promise((resolve) => setTimeout(() => resolve(perfilMock), LATENCIA_SIMULADA_MS));
