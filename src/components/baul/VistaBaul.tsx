import { useMemo, useState } from "react";
import type { CategoriaPARA, DTO_Tarea } from "@/types/dominio";
import { VisorRecursoSheet } from "@/components/baul/VisorRecursoSheet";

interface PropsVistaBaul {
  tareas: ReadonlyArray<DTO_Tarea>;
  cargando: boolean;
}

const CATEGORIAS_VISIBLES: ReadonlyArray<{ key: CategoriaPARA | "Todas"; label: string }> = [
  { key: "Todas", label: "Todas" },
  { key: "Proyecto", label: "Proyectos" },
  { key: "Area", label: "Áreas" },
  { key: "Recurso", label: "Recursos" },
  { key: "Archivo", label: "Archivo" },
];

const ES_VISUALIZABLE = (c: CategoriaPARA): boolean => c === "Recurso" || c === "Proyecto";

/**
 * El Baúl — Gestor PARA. Click en Proyecto/Recurso abre el Visor del Segundo Cerebro.
 */
export const VistaBaul = ({ tareas, cargando }: PropsVistaBaul) => {
  const [filtro, setFiltro] = useState<CategoriaPARA | "Todas">("Todas");
  const [seleccionada, setSeleccionada] = useState<DTO_Tarea | null>(null);

  const filtradas = useMemo(
    () => (filtro === "Todas" ? tareas : tareas.filter((t) => t.categoria === filtro)),
    [tareas, filtro],
  );

  const agrupadas = useMemo(() => {
    const mapa = new Map<CategoriaPARA, DTO_Tarea[]>();
    for (const t of filtradas) {
      const arr = mapa.get(t.categoria) ?? [];
      arr.push(t);
      mapa.set(t.categoria, arr);
    }
    return Array.from(mapa.entries());
  }, [filtradas]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS_VISIBLES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFiltro(c.key)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              filtro === c.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {cargando && <div className="surface-card h-40 animate-pulse" />}

      {!cargando && agrupadas.length === 0 && (
        <div className="surface-card p-10 text-center text-muted-foreground">
          El baúl está vacío para este filtro.
        </div>
      )}

      {!cargando &&
        agrupadas.map(([categoria, items]) => (
          <div key={categoria}>
            <h3 className="font-display text-lg mb-3 flex items-baseline gap-3">
              {categoria}
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((t) => {
                const visualizable = ES_VISUALIZABLE(t.categoria);
                const contenido = (
                  <>
                    <p className="font-medium">{t.titulo}</p>
                    {t.etiquetas && t.etiquetas.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {t.etiquetas.slice(0, 3).map((e) => (
                          <span key={e} className="text-[10px] text-primary/80">
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t.areaVinculadaId ?? "sin área"}</span>
                      <span className="flex items-center gap-2">
                        <EstadoChip estado={t.estado} />
                        <span className="text-primary">+{t.puntosExperiencia} XP</span>
                      </span>
                    </div>
                  </>
                );
                return visualizable ? (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSeleccionada(t)}
                    className="surface-card p-4 text-left w-full transition-colors hover:border-primary/60 cursor-pointer"
                  >
                    {contenido}
                  </button>
                ) : (
                  <div key={t.id} className="surface-card p-4 text-left w-full">
                    {contenido}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      <VisorRecursoSheet
        tarea={seleccionada}
        abierto={seleccionada !== null}
        onCerrar={() => setSeleccionada(null)}
      />
    </section>
  );
};

const EstadoChip = ({ estado }: { estado: DTO_Tarea["estado"] }) => {
  const map: Record<DTO_Tarea["estado"], string> = {
    Activa: "bg-mate/20 text-mate",
    Completada: "bg-success/20 text-success",
    Archivada: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${map[estado]}`}>
      {estado}
    </span>
  );
};
