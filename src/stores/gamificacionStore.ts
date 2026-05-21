import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DTO_PerfilGamificacion } from "@/types/dominio";

/**
 * Store de gamificación con persistencia. Permite que el XP acumulado
 * sobreviva al refresh del navegador.
 */

const perfilInicial: DTO_PerfilGamificacion = {
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

interface EstadoGamificacion {
  perfil: DTO_PerfilGamificacion;
  hidratado: boolean;
  marcarHidratado: () => void;
  /**
   * Suma XP al perfil global y a un área concreta, subiendo de nivel si corresponde.
   * Precondición: xp > 0.
   */
  registrarLogro: (descripcion: string, xp: number, area: string) => void;
}

export const useGamificacionStore = create<EstadoGamificacion>()(
  persist(
    (set, get) => ({
      perfil: perfilInicial,
      hidratado: false,
      marcarHidratado: () => set({ hidratado: true }),

      registrarLogro: (descripcion, xp, area) => {
        if (xp <= 0) return;
        const { perfil } = get();
        let { xpActual, nivel, xpParaSiguienteNivel } = perfil;
        xpActual += xp;
        while (xpActual >= xpParaSiguienteNivel) {
          xpActual -= xpParaSiguienteNivel;
          nivel += 1;
          xpParaSiguienteNivel = Math.round(xpParaSiguienteNivel * 1.15);
        }
        const idx = perfil.xpPorArea.findIndex((a) => a.area === area);
        const xpPorArea = idx >= 0
          ? perfil.xpPorArea.map((a, i) => (i === idx ? { ...a, xp: a.xp + xp } : a))
          : [...perfil.xpPorArea, { area, xp }];
        const nuevoLogro = {
          id: `l-${Date.now()}`,
          descripcion: `+${xp} XP — ${descripcion}`,
          xp,
          fecha: new Date().toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }),
        };
        set({
          perfil: {
            nivel,
            xpActual,
            xpParaSiguienteNivel,
            xpPorArea,
            logrosRecientes: [nuevoLogro, ...perfil.logrosRecientes].slice(0, 12),
          },
        });
      },
    }),
    {
      name: "mateflow.gamificacion.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ perfil: s.perfil }),
      onRehydrateStorage: () => (state) => state?.marcarHidratado(),
    },
  ),
);
