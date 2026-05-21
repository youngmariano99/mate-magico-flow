import { useCallback } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { useTareasStore } from "@/stores/tareasStore";

/**
 * Custom Hook que encapsula la lógica de Drag & Drop de la app.
 * Devuelve handlers tipados específicos por contexto (planificación, MITs)
 * para que los componentes de UI se mantengan declarativos.
 */

/** Reordena inmutablemente un array por índice. */
export const reordenarLista = <T,>(lista: ReadonlyArray<T>, desde: number, hasta: number): T[] => {
  const copia = [...lista];
  const [item] = copia.splice(desde, 1);
  copia.splice(hasta, 0, item);
  return copia;
};

export const useArrastrarYSoltar = () => {
  const moverTarea = useTareasStore((s) => s.moverTarea);
  const reordenarMITs = useTareasStore((s) => s.reordenarMITs);

  /**
   * Maneja el drop en la vista de Planificación Semanal.
   * Convención de droppableId:
   *   - "backlog"            → tarea sin fecha
   *   - "dia::YYYY-MM-DD"    → tarea programada para ese día
   */
  const onDragEndPlanificacion = useCallback(
    (result: DropResult) => {
      const { destination, draggableId } = result;
      if (!destination) return;
      const destinoFecha = destination.droppableId.startsWith("dia::")
        ? destination.droppableId.slice("dia::".length)
        : null;
      void moverTarea(draggableId, destinoFecha);
    },
    [moverTarea],
  );

  /**
   * Maneja el drop en la lista de MITs del Dashboard.
   * Recibe los IDs actuales (en el orden visible) para no depender del store.
   */
  const construirOnDragEndMITs = useCallback(
    (idsActuales: ReadonlyArray<string>) => (result: DropResult) => {
      const { destination, source } = result;
      if (!destination || destination.index === source.index) return;
      const nuevoOrden = reordenarLista(idsActuales, source.index, destination.index);
      reordenarMITs(nuevoOrden);
    },
    [reordenarMITs],
  );

  return { onDragEndPlanificacion, construirOnDragEndMITs };
};
