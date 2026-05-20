import { useMemo } from "react";
import type { DTO_Tarea } from "@/types/dominio";

interface PropsListaMITs {
  tareas: ReadonlyArray<DTO_Tarea>;
  cargando: boolean;
  onCompletar: (id: string) => void;
}

/**
 * Muestra las 3 MITs (Most Important Tasks) del día.
 * Selecciona las 3 tareas Activas con mayor puntaje de experiencia.
 */
export const ListaMITs = ({ tareas, cargando, onCompletar }: PropsListaMITs) => {
  const mits = useMemo(
    () =>
      [...tareas]
        .filter((t) => t.estado === "Activa")
        .sort((a, b) => b.puntosExperiencia - a.puntosExperiencia)
        .slice(0, 3),
    [tareas],
  );

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-xl font-semibold">Tus 3 MITs de hoy</h3>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Most Important Tasks
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
        <ul className="space-y-3">
          {mits.map((tarea, idx) => (
            <li
              key={tarea.id}
              className="surface-card p-4 flex items-center gap-4 group hover:border-primary/50 transition-colors"
            >
              <span className="font-display text-3xl text-primary/40 w-8 text-center">
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
          ))}
        </ul>
      )}
    </section>
  );
};
