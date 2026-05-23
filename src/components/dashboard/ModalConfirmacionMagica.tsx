import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { DTO_RespuestaProcesamientoIA, IntencionIA } from "@/types/dominio";

interface PropsModal {
  abierto: boolean;
  respuesta: DTO_RespuestaProcesamientoIA | null;
  onEfectuar: () => void;
  onRechazar: () => void;
}

const ETIQUETA_INTENCION: Record<IntencionIA, { titulo: string; emoji: string }> = {
  AGREGAR_TAREA: { titulo: "Agregar tarea", emoji: "✅" },
  AGREGAR_NOTA: { titulo: "Agregar nota", emoji: "💡" },
  AGENDAR_EVENTO: { titulo: "Agendar evento", emoji: "📅" },
  COMPLETAR_TAREA: { titulo: "Completar tarea", emoji: "🎯" },
  COMPLETAR_HABITO: { titulo: "Completar hábito", emoji: "🔥" },
  REGISTRAR_RUTINA: { titulo: "Registrar rutina", emoji: "🏋️" },
};

/**
 * Modal Human-in-the-loop. Confirma con el usuario antes de mutar Zustand.
 * Minimalista: una frase de resumen y dos botones.
 */
export const ModalConfirmacionMagica = ({ abierto, respuesta, onEfectuar, onRechazar }: PropsModal) => {
  if (!respuesta) return null;
  const etiqueta = ETIQUETA_INTENCION[respuesta.intencion];

  const detalles: string[] = [];
  if (respuesta.fechaSugerida) detalles.push(`📅 ${respuesta.fechaSugerida}`);
  if (respuesta.horaSugerida) detalles.push(`⏰ ${respuesta.horaSugerida}`);
  if (respuesta.metricasExtraidas) detalles.push(`📊 ${respuesta.metricasExtraidas}`);

  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) onRechazar(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            🤖 Voy a hacer esto
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirmá la operación detectada por la IA antes de aplicarla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-base">{etiqueta.emoji}</span>
            <span className="font-medium text-muted-foreground uppercase tracking-wide text-xs">
              {etiqueta.titulo}
            </span>
          </div>
          <p className="text-base leading-snug">{respuesta.tareaExtraida}</p>
          {detalles.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {detalles.map((d) => (
                <span key={d} className="px-2 py-1 rounded-md bg-muted">{d}</span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs px-2 py-0.5 rounded-md bg-primary/15 text-primary">
              {respuesta.categoriaSugerida}
            </span>
            {respuesta.tagsDetectados.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={onRechazar}
            className="px-4 py-2 rounded-md text-sm border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={onEfectuar}
            className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Efectuar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
