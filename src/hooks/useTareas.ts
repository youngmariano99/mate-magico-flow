import { useCallback, useEffect, useState } from "react";
import { useTareasStore } from "@/stores/tareasStore";
import type { CategoriaPARA, EstadoTarea } from "@/types/dominio";

/**
 * Hook de orquestación. Encapsula latencia mockeada del store de Zustand
 * para que los componentes de UI permanezcan puramente presentacionales.
 */
export const useTareas = () => {
  const tareas = useTareasStore((s) => s.tareas);
  const hidratado = useTareasStore((s) => s.hidratado);
  const agregar = useTareasStore((s) => s.agregar);
  const cambiarEstado = useTareasStore((s) => s.cambiarEstado);
  const [cargando, setCargando] = useState<boolean>(!hidratado);

  useEffect(() => {
    if (hidratado) {
      const t = setTimeout(() => setCargando(false), 200);
      return () => clearTimeout(t);
    }
  }, [hidratado]);

  const crear = useCallback(
    async (titulo: string, categoria: CategoriaPARA, puntosExperiencia = 10) => {
      await agregar({ titulo, categoria, puntosExperiencia });
    },
    [agregar],
  );

  const actualizarEstado = useCallback(
    async (id: string, estado: EstadoTarea) => {
      await cambiarEstado(id, estado);
    },
    [cambiarEstado],
  );

  return { tareas, cargando, crear, actualizarEstado };
};
