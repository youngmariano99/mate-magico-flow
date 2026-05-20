import { useEffect, useState } from "react";
import type { DTO_PerfilGamificacion } from "@/types/dominio";
import { obtenerPerfilGamificacion } from "@/services/mocks/gamificacionRepository";

export const useGamificacion = () => {
  const [perfil, setPerfil] = useState<DTO_PerfilGamificacion | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    let activo = true;
    void obtenerPerfilGamificacion().then((p) => {
      if (activo) {
        setPerfil(p);
        setCargando(false);
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  return { perfil, cargando };
};
