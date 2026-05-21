import { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTareasStore } from "@/stores/tareasStore";
import { useArrastrarYSoltar } from "@/hooks/useArrastrarYSoltar";
import type { DTO_Tarea } from "@/types/dominio";

/**
 * Vista de Planificación Asíncrona. Panel izquierdo "Backlog Activo"
 * con Proyectos/Tareas sin fecha, panel derecho con grilla semanal Lun→Dom.
 * El movimiento entre paneles persiste en `tareasStore.moverTarea`.
 */

const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

const obtenerSemanaActual = (): { isoDate: string; nombre: string; numero: number; esHoy: boolean }[] => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diaSemana = (hoy.getDay() + 6) % 7; // 0 = Lunes
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diaSemana);
  return NOMBRES_DIAS.map((nombre, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return {
      isoDate: iso,
      nombre,
      numero: d.getDate(),
      esHoy: iso === hoy.toISOString().slice(0, 10),
    };
  });
};

export const VistaPlanificacion = () => {
  const tareas = useTareasStore((s) => s.tareas);
  const { onDragEndPlanificacion } = useArrastrarYSoltar();
  const semana = useMemo(obtenerSemanaActual, []);

  const activas = useMemo(() => tareas.filter((t) => t.estado === "Activa"), [tareas]);
  const backlog = useMemo(() => activas.filter((t) => !t.fechaProgramada), [activas]);

  const tareasPorDia = useMemo(() => {
    const mapa = new Map<string, DTO_Tarea[]>();
    for (const d of semana) mapa.set(d.isoDate, []);
    for (const t of activas) {
      if (t.fechaProgramada && mapa.has(t.fechaProgramada)) {
        mapa.get(t.fechaProgramada)!.push(t);
      }
    }
    return mapa;
  }, [activas, semana]);

  return (
    <DragDropContext onDragEnd={onDragEndPlanificacion}>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <PanelBacklog tareas={backlog} />
        <GrillaSemanal semana={semana} tareasPorDia={tareasPorDia} />
      </div>
    </DragDropContext>
  );
};

const PanelBacklog = ({ tareas }: { tareas: ReadonlyArray<DTO_Tarea> }) => (
  <aside className="surface-card p-4 lg:max-h-[70vh] lg:overflow-y-auto">
    <header className="flex items-baseline justify-between mb-3">
      <h2 className="font-display text-lg font-semibold">Backlog Activo</h2>
      <span className="text-xs text-muted-foreground">{tareas.length}</span>
    </header>
    <Droppable droppableId="backlog">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`space-y-2 min-h-[200px] rounded-md p-1 transition-colors ${
            snapshot.isDraggingOver ? "bg-primary/5" : ""
          }`}
        >
          {tareas.length === 0 && (
            <p className="text-xs text-muted-foreground p-3 text-center">
              Sin tareas en el backlog. Arrastrá una desde la grilla para sacarla de la semana.
            </p>
          )}
          {tareas.map((t, i) => (
            <TarjetaArrastrable key={t.id} tarea={t} index={i} compacta={false} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </aside>
);

interface PropsGrilla {
  semana: ReadonlyArray<{ isoDate: string; nombre: string; numero: number; esHoy: boolean }>;
  tareasPorDia: ReadonlyMap<string, DTO_Tarea[]>;
}

const GrillaSemanal = ({ semana, tareasPorDia }: PropsGrilla) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
    {semana.map((d) => {
      const items = tareasPorDia.get(d.isoDate) ?? [];
      return (
        <div
          key={d.isoDate}
          className={`surface-card p-3 flex flex-col min-h-[260px] ${
            d.esHoy ? "border-primary/60" : ""
          }`}
        >
          <header className="mb-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {d.nombre}
              </span>
              <span
                className={`font-display text-lg ${
                  d.esHoy ? "text-primary font-semibold" : ""
                }`}
              >
                {d.numero}
              </span>
            </div>
            {d.esHoy && (
              <span className="text-[10px] uppercase tracking-widest text-primary">Hoy</span>
            )}
          </header>
          <Droppable droppableId={`dia::${d.isoDate}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 space-y-2 rounded-md p-1 transition-colors ${
                  snapshot.isDraggingOver ? "bg-primary/10" : ""
                }`}
              >
                {items.map((t, i) => (
                  <TarjetaArrastrable key={t.id} tarea={t} index={i} compacta />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      );
    })}
  </div>
);

const TarjetaArrastrable = ({
  tarea,
  index,
  compacta,
}: {
  tarea: DTO_Tarea;
  index: number;
  compacta: boolean;
}) => (
  <Draggable draggableId={tarea.id} index={index}>
    {(provided, snapshot) => (
      <article
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`rounded-md border bg-surface-elevated p-2.5 text-sm select-none transition-shadow ${
          snapshot.isDragging
            ? "border-primary shadow-lg shadow-primary/20"
            : "border-border"
        }`}
      >
        <p className={`font-medium leading-snug ${compacta ? "text-[13px]" : ""}`}>
          {tarea.titulo}
        </p>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{tarea.categoria}</span>
          <span className="text-primary">+{tarea.puntosExperiencia} XP</span>
        </div>
      </article>
    )}
  </Draggable>
);
