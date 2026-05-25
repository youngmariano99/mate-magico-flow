import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useResumenSemanal } from "@/hooks/useInsightsSemanales";

/**
 * Asistente Ejecutivo. Simula la respuesta de Groq/Llama generando un
 * informe compasivo basado en datos reales del Zustand.
 *
 * IMPORTANTE: el tono es siempre constructivo. Cero culpa, cero "fallaste".
 */

interface Informe {
  titulo: string;
  parrafos: ReadonlyArray<string>;
  sugerencia: string;
}

const construirInforme = (
  r: ReturnType<typeof useResumenSemanal>,
): Informe => {
  const { tareasCompletadas, conteoPorTipo, diasActivos, totalXpSemana, areaTop } = r;
  const totalEventos = conteoPorTipo.NEAT + conteoPorTipo.PAUSA_ACTIVA + conteoPorTipo.ENTRENAMIENTO;

  const parrafos: string[] = [];

  if (tareasCompletadas.length === 0 && totalEventos === 0) {
    return {
      titulo: "Una semana de pausa 🌱",
      parrafos: [
        "Esta semana no registramos actividad en tareas ni en fitness. Eso también está bien: los ritmos personales se mueven en olas.",
        "Cuando estés con energía, una sola micro-acción alcanza para reactivar el momentum.",
      ],
      sugerencia: "Probá agendar una tarea pequeña para mañana. El primer paso destraba el resto.",
    };
  }

  parrafos.push(
    `Completaste ${tareasCompletadas.length} tarea${tareasCompletadas.length === 1 ? "" : "s"} y sumaste **${totalXpSemana} XP** esta semana. Cada paso cuenta.`,
  );

  if (areaTop) {
    parrafos.push(
      `Tu área con mayor enfoque fue **${areaTop}** — ahí pusiste el cerebro y la disciplina. Lindo trabajo.`,
    );
  }

  if (totalEventos > 0) {
    const detalles: string[] = [];
    if (conteoPorTipo.ENTRENAMIENTO > 0) detalles.push(`${conteoPorTipo.ENTRENAMIENTO} entrenamiento(s)`);
    if (conteoPorTipo.NEAT > 0) detalles.push(`${conteoPorTipo.NEAT} caminata(s) NEAT`);
    if (conteoPorTipo.PAUSA_ACTIVA > 0) detalles.push(`${conteoPorTipo.PAUSA_ACTIVA} pausa(s) activa(s)`);
    parrafos.push(
      `En lo físico registraste ${detalles.join(" · ")} a lo largo de ${diasActivos} día${diasActivos === 1 ? "" : "s"}. Tu cuerpo está conversando con tus metas.`,
    );
  } else {
    parrafos.push(
      "No quedó registro de actividad física esta semana. Sin presión: una caminata corta mañana reabre el canal.",
    );
  }

  let sugerencia: string;
  if (conteoPorTipo.NEAT < 2) {
    sugerencia = "Mañana, una caminata de 15 minutos antes del primer bloque de trabajo. NEAT consistente > cardio heroico.";
  } else if (conteoPorTipo.ENTRENAMIENTO === 0) {
    sugerencia = "Reservá un bloque corto (30-40 min) para un entrenamiento liviano. Movilidad cuenta.";
  } else if (tareasCompletadas.length === 0) {
    sugerencia = "Elegí 1 MIT mañana — la victoria temprana ordena el resto del día.";
  } else {
    sugerencia = "Mantené el ritmo y agendá una pausa activa a media tarde para sostener la energía.";
  }

  return {
    titulo: areaTop ? `Foco en ${areaTop} esta semana` : "Tu semana en números",
    parrafos,
    sugerencia,
  };
};

const renderMD = (texto: string): React.ReactNode => {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-foreground font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
};

export const ResumenSemanalIA = () => {
  const resumen = useResumenSemanal();
  const [abierto, setAbierto] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [informe, setInforme] = useState<Informe | null>(null);

  const generar = () => {
    setAbierto(true);
    setGenerando(true);
    setInforme(null);
    setTimeout(() => {
      setInforme(construirInforme(resumen));
      setGenerando(false);
    }, 1400);
  };

  return (
    <>
      <Button
        onClick={generar}
        variant="outline"
        className="w-full justify-start gap-2 h-auto py-4 border-dashed hover:border-primary hover:bg-primary/5"
      >
        <Sparkles className="size-5 text-primary shrink-0" />
        <div className="text-left">
          <p className="font-display text-base">Generar Resumen Semanal</p>
          <p className="text-xs text-muted-foreground font-normal">
            El Asistente analiza tu semana y propone un siguiente paso
          </p>
        </div>
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              🤖 Informe Ejecutivo
            </DialogTitle>
            <DialogDescription>Análisis compasivo basado en tu actividad real.</DialogDescription>
          </DialogHeader>

          {generando ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm">Sintetizando tu semana…</p>
            </div>
          ) : informe ? (
            <article className="space-y-4">
              <h3 className="font-display text-lg">{informe.titulo}</h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                {informe.parrafos.map((p, i) => (
                  <p key={i}>{renderMD(p)}</p>
                ))}
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs uppercase tracking-widest text-primary mb-1.5">
                  Sugerencia
                </p>
                <p className="text-sm text-foreground">{informe.sugerencia}</p>
              </div>
            </article>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setAbierto(false)} disabled={generando}>
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
