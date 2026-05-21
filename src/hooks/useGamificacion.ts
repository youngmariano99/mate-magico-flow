import { useGamificacionStore } from "@/stores/gamificacionStore";

/**
 * Acceso al perfil gamificado. `cargando` es false una vez que Zustand
 * rehidrató el store desde localStorage.
 */
export const useGamificacion = () => {
  const perfil = useGamificacionStore((s) => s.perfil);
  const hidratado = useGamificacionStore((s) => s.hidratado);
  return { perfil, cargando: !hidratado };
};
