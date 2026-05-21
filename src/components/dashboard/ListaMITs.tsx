import { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { useTareasStore } from "@/stores/tareasStore";
import { useArrastrarYSoltar } from "@/hooks/useArrastrarYSoltar";
import type { DTO_Tarea } from "@/types/dominio";

interface PropsListaMITs {
  tareas: ReadonlyArray<DTO_Tarea>;
  cargando: boolean;
  onCompletar: (id: string) => void;
}

/**
 * Las 3 MITs del día. Orden manual vía drag&drop persistido en el store;
 * fallback automático por XP descendente si el usuario aún no ordenó.
 */
export const ListaMITs = ({ tareas, cargando, onCompletar }: PropsListaMITs) => {
  const ordenMITs = useTareasStore((s) => s.ordenMITs);
  const { construirOnDragEndMITs } = useArrastrarYSoltar();

  const mits = useMemo<DTO_Tarea[]>(() => {
    const activas = tareas.filter((t) => t.estado === "Activa");
    const ordenadasManualmente = ordenMITs
      .map((id) => activas.find((t) => t.id === id))
      .filter((t): t is DTO_Tarea => Boolean(t));
    const idsUsados = new Set(ordenadasManualmente.map((t) => t.id));
    const restantes = activas
      .filter((t) => !idsUsados.has(t.id))
      .sort((a, b) => b.puntosExperiencia - a.puntosExperiencia);
    return [...ordenadasManualmente, ...restantes].slice(0, 3);
  }, [tareas, ordenMITs]);

  const onDragEnd = construirOnDragEndMITs(mits.map((t) => t.id));

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-xl font-semibold">Tus 3 MITs de hoy</h3>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          arrastrá para reordenar
        </span>
      </div>

      {cargando && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface-card h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!cargando && mits.length === 0 && (
        <div className="surface-card p-8 text-center text-muted-foreground">
          No hay MITs definidas. Empezá tirando una al Input Mágico ↓
        </div>
      )}

      {!cargando && mits.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="mits">
            {(provided) => (
              <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {mits.map((tarea, idx) => (
                  <Draggable key={tarea.id} draggableId={tarea.id} index={idx}>
                    {(p, snapshot) => (
                      <li
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={`surface-card p-4 flex items-center gap-3 group transition-colors ${
                          snapshot.isDragging ? "border-primary shadow-lg shadow-primary/20" : "hover:border-primary/50"
                        }`}
                      >
                        <span
                          {...p.dragHandleProps}
                          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          aria-label="Arrastrar para reordenar"
                        >
                          <GripVertical size={16} />
                        </span>
                        <span className="font-display text-3xl text-primary/40 w-6 text-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{tarea.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tarea.categoria}
                            {tarea.areaVinculadaId ? ` · ${tarea.areaVinculadaId}` : ""}
                            {" · "}
                            <span className="text-primary">+{tarea.puntosExperiencia} XP</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCompletar(tarea.id)}
                          className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                        >
                          Completar
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </section>
  );
};
