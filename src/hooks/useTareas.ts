import { useCallback, useEffect, useState } from "react";
import type { DTO_Tarea, CategoriaPARA, EstadoTarea } from "@/types/dominio";
import {
  agregarTarea,
  cambiarEstadoTarea,
  obtenerTodasLasTareas,
} from "@/services/mocks/tareasRepository";

/**
 * Hook de orquestación de tareas. Encapsula el ciclo carga → mutación → recarga
 * para que los componentes de UI permanezcan puramente presentacionales.
 */
export const useTareas = () => {
  const [tareas, setTareas] = useState<DTO_Tarea[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    const datos = await obtenerTodasLasTareas();
    setTareas(datos);
    setCargando(false);
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const crear = useCallback(
    async (titulo: string, categoria: CategoriaPARA, puntosExperiencia = 10) => {
      await agregarTarea({ titulo, categoria, puntosExperiencia });
      await recargar();
    },
    [recargar],
  );

  const actualizarEstado = useCallback(
    async (id: string, estado: EstadoTarea) => {
      await cambiarEstadoTarea(id, estado);
      await recargar();
    },
    [recargar],
  );

  return { tareas, cargando, crear, actualizarEstado, recargar };
};
