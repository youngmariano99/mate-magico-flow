import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DTO_Habito } from "@/types/dominio";

/**
 * Store de hábitos atómicos. Persiste racha y estado diario.
 * El "día siguiente" se simula con `resetearDia()` (botón de testing en el Dashboard).
 */

const habitosSeed: DTO_Habito[] = [
  { id: "h-neat", titulo: "Actividad NEAT", area: "salud", rachaActual: 12, completadoHoy: false, xpPorCompletar: 8 },
  { id: "h-frutas", titulo: "Comer 3 frutas", area: "salud", rachaActual: 5, completadoHoy: false, xpPorCompletar: 5 },
  { id: "h-utn", titulo: "Avanzar UTN", area: "facultad", rachaActual: 3, completadoHoy: false, xpPorCompletar: 12 },
];

interface EstadoHabitos {
  habitos: DTO_Habito[];
  hidratado: boolean;
  marcarHidratado: () => void;
  /**
   * Alterna el estado del hábito de hoy. Devuelve el hábito actualizado
   * para que la UI pueda disparar el toast/XP con datos frescos.
   */
  alternarEstadoHabito: (id: string) => DTO_Habito | null;
  /** Simulación de "día siguiente": desmarca el flag de hoy sin tocar la racha. */
  resetearDia: () => void;
  /** Crea un hábito manualmente (CRUD desde el FAB). */
  agregar: (entrada: Omit<DTO_Habito, "id" | "rachaActual" | "completadoHoy">) => DTO_Habito;
}

export const useHabitosStore = create<EstadoHabitos>()(
  persist(
    (set, get) => ({
      habitos: habitosSeed,
      hidratado: false,
      marcarHidratado: () => set({ hidratado: true }),

      alternarEstadoHabito: (id) => {
        const actual = get().habitos.find((h) => h.id === id);
        if (!actual) return null;
        const completadoHoy = !actual.completadoHoy;
        const rachaActual = completadoHoy
          ? actual.rachaActual + 1
          : Math.max(0, actual.rachaActual - 1);
        const actualizado: DTO_Habito = { ...actual, completadoHoy, rachaActual };
        set({
          habitos: get().habitos.map((h) => (h.id === id ? actualizado : h)),
        });
        return actualizado;
      },

      resetearDia: () => {
        set({
          habitos: get().habitos.map((h) => ({ ...h, completadoHoy: false })),
        });
      },
    }),
    {
      name: "mateflow.habitos.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ habitos: s.habitos }),
      onRehydrateStorage: () => (state) => state?.marcarHidratado(),
    },
  ),
);
