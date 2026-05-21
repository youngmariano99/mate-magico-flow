import { useCallback } from "react";
import { toast } from "sonner";
import { useHabitosStore } from "@/stores/habitosStore";
import { useGamificacionStore } from "@/stores/gamificacionStore";

/**
 * Orquesta los efectos colaterales al alternar un hábito:
 * toast de racha + suma de XP al área correspondiente.
 */
export const useHabitos = () => {
  const habitos = useHabitosStore((s) => s.habitos);
  const hidratado = useHabitosStore((s) => s.hidratado);
  const alternarEstadoHabito = useHabitosStore((s) => s.alternarEstadoHabito);
  const resetearDia = useHabitosStore((s) => s.resetearDia);
  const registrarLogro = useGamificacionStore((s) => s.registrarLogro);

  const alternar = useCallback(
    (id: string) => {
      const actualizado = alternarEstadoHabito(id);
      if (!actualizado) return;
      if (actualizado.completadoHoy) {
        registrarLogro(actualizado.titulo, actualizado.xpPorCompletar, actualizado.area);
        toast.success(`🔥 Racha aumentada — ${actualizado.rachaActual} días`, {
          description: `${actualizado.titulo} · +${actualizado.xpPorCompletar} XP en ${actualizado.area}`,
        });
      } else {
        toast(`Hábito desmarcado`, { description: actualizado.titulo });
      }
    },
    [alternarEstadoHabito, registrarLogro],
  );

  const simularDiaSiguiente = useCallback(() => {
    resetearDia();
    toast("☀️ Nuevo día simulado", { description: "Hábitos listos para ser completados otra vez." });
  }, [resetearDia]);

  return { habitos, cargando: !hidratado, alternar, simularDiaSiguiente };
};
