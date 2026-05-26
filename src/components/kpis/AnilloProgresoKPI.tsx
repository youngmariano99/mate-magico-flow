import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { DTO_KPI } from "@/types/dominio";
import { useKpisStore } from "@/stores/kpisStore";
import { useMetricaKPI, type VistaTemporal } from "@/hooks/useMetricasAgregadas";

interface Props {
  kpi: DTO_KPI;
  vista: VistaTemporal;
}

const RADIO = 46;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

const formatear = (n: number): string => {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
};

const ETIQUETA_VISTA: Record<VistaTemporal, string> = {
  DIA: "hoy",
  SEMANA: "esta semana",
  MES: "este mes",
};

/**
 * Anillo de progreso SVG dopamínico. Animación de 700ms al llenarse.
 * En modo "Récord" (acumulado >= objetivo) el anillo cambia a color de éxito
 * y emite un halo brillante.
 */
export const AnilloProgresoKPI = ({ kpi, vista }: Props) => {
  const metrica = useMetricaKPI(kpi, vista);
  const incrementar = useKpisStore((s) => s.incrementar);

  const color = kpi.colorAcento ?? "oklch(0.72 0.18 145)";
  const colorRecord = "oklch(0.78 0.18 80)";
  const trazo = metrica.esRecord ? colorRecord : color;

  const offset = CIRCUNFERENCIA - (metrica.porcentaje / 100) * CIRCUNFERENCIA;

  const handleIncremento = (delta: number) => {
    const ev = incrementar(kpi.id, delta, "INCREMENTO_RAPIDO");
    if (!ev) return;
    toast.success(`+${formatear(delta)} ${kpi.unidad}`, {
      description: `${kpi.titulo} · ${formatear(metrica.acumulado + delta)}/${formatear(
        metrica.objetivoEscalado,
      )}`,
    });
  };

  return (
    <article
      className={`surface-card p-4 flex flex-col items-center gap-3 transition-all duration-500 ${
        metrica.esRecord
          ? "border-amber-400/50 shadow-[0_0_24px_-6px_oklch(0.78_0.18_80_/_0.55)]"
          : ""
      }`}
      aria-label={`${kpi.titulo}: ${formatear(metrica.acumulado)} de ${formatear(
        metrica.objetivoEscalado,
      )} ${kpi.unidad}`}
    >
      <header className="w-full flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold truncate">{kpi.titulo}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {kpi.area} · {ETIQUETA_VISTA[vista]}
          </p>
        </div>
        {metrica.esRecord && (
          <span className="text-amber-400 animate-pulse" aria-label="Récord alcanzado" title="Récord">
            <Sparkles size={14} />
          </span>
        )}
      </header>

      <div className="relative w-[120px] h-[120px]">
        <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90" role="img" aria-hidden>
          <circle
            cx="55"
            cy="55"
            r={RADIO}
            fill="none"
            stroke="color-mix(in oklab, var(--border) 80%, transparent)"
            strokeWidth="9"
          />
          <circle
            cx="55"
            cy="55"
            r={RADIO}
            fill="none"
            stroke={trazo}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={offset}
            style={{
              transition:
                "stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1), stroke 400ms ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-semibold tabular-nums">
            {formatear(metrica.acumulado)}
            <span className="text-muted-foreground text-xs">
              /{formatear(metrica.objetivoEscalado)}
            </span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {kpi.unidad}
          </span>
        </div>
      </div>

      {vista === "DIA" ? (
        <div className="w-full grid grid-cols-3 gap-1.5">
          {[1, 2, 5].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => handleIncremento(delta)}
              className="flex items-center justify-center gap-1 h-8 rounded-md border border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5 transition-colors active:scale-95"
              aria-label={`Sumar ${delta} ${kpi.unidad} a ${kpi.titulo}`}
            >
              <Plus size={12} strokeWidth={2.4} />
              {delta}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {metrica.cantidadEventos} evento{metrica.cantidadEventos === 1 ? "" : "s"} en el período
        </p>
      )}
    </article>
  );
};
