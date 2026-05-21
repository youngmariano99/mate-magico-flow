import { Flame, Plus, RefreshCw } from "lucide-react";
import { useHabitos } from "@/hooks/useHabitos";
import type { DTO_Habito } from "@/types/dominio";

/**
 * Tracker de hábitos atómicos. Visualmente separado de las MITs.
 * Cada check dispara toast + XP al área correspondiente.
 */
export const PanelHabitosDiarios = () => {
  const { habitos, cargando, alternar, simularDiaSiguiente } = useHabitos();

  return (
    <section aria-labelledby="titulo-habitos">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <div>
          <h3 id="titulo-habitos" className="font-display text-xl font-semibold">
            Hábitos atómicos
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pequeñas acciones que componen tu identidad.
          </p>
        </div>
        <button
          type="button"
          onClick={simularDiaSiguiente}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          title="Testing: resetear los checks de hoy sin perder las rachas"
        >
          <RefreshCw size={12} />
          Simular día siguiente
        </button>
      </div>

      {cargando ? (
        <div className="surface-card h-24 animate-pulse" />
      ) : (
        <ul className="grid sm:grid-cols-3 gap-3">
          {habitos.map((h) => (
            <TarjetaHabito key={h.id} habito={h} onToggle={() => alternar(h.id)} />
          ))}
        </ul>
      )}
    </section>
  );
};

interface PropsTarjetaHabito {
  habito: DTO_Habito;
  onToggle: () => void;
}

const TarjetaHabito = ({ habito, onToggle }: PropsTarjetaHabito) => {
  const activo = habito.completadoHoy;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={activo}
        className={`w-full surface-card p-4 text-left transition-all flex flex-col gap-2 ${
          activo
            ? "border-primary/60 bg-primary/5 mate-glow"
            : "hover:border-primary/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {habito.area}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              activo ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Flame size={12} />
            {habito.rachaActual}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium leading-snug">{habito.titulo}</span>
          <span
            className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors shrink-0 ${
              activo
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border text-muted-foreground"
            }`}
            aria-hidden
          >
            {activo ? "✓" : <Plus size={14} />}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          +{habito.xpPorCompletar} XP al completar
        </span>
      </button>
    </li>
  );
};
