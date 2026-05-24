import { useCallback, useRef, useState, type FormEvent } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useProcesadorMagico } from "@/hooks/useProcesadorMagico";
import { useDictadoVoz } from "@/hooks/useDictadoVoz";
import { ModalConfirmacionMagica } from "./ModalConfirmacionMagica";
import type { DTO_RespuestaProcesamientoIA } from "@/types/dominio";

interface PropsInputMagico {
  onTareaConfirmada: (respuesta: DTO_RespuestaProcesamientoIA) => void | Promise<void>;
}

interface Pill {
  id: string;
  label: string;
  template: string;
  /** Posición (índice) donde dejar el cursor tras autocompletar. */
  cursor: number;
}

const PILLS: ReadonlyArray<Pill> = [
  { id: "agendar",    label: "📅 Agendar…",          template: "Agendar  a las ",        cursor: 9 },
  { id: "idea",       label: "💡 Nueva idea…",       template: "Idea: ",                  cursor: 6 },
  { id: "completar",  label: "✅ Completar tarea…",  template: "Terminé ",                cursor: 8 },
  { id: "rutina",     label: "🏋️ Registrar rutina…", template: "Entrené ",                cursor: 8 },
  { id: "comprar",    label: "🛒 Comprar…",          template: "Comprar ",                cursor: 8 },
  { id: "recordar",   label: "🔔 Recordarme…",       template: "Recordame ",              cursor: 10 },
];

/**
 * Input Mágico — captura, valida (Escudo Léxico), simula IA y muestra el
 * Modal de Confirmación. Nunca muta stores por sí mismo: delega en el padre.
 */
export const InputMagico = ({ onTareaConfirmada }: PropsInputMagico) => {
  const [texto, setTexto] = useState("");
  const [respuestaPendiente, setRespuestaPendiente] = useState<DTO_RespuestaProcesamientoIA | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { procesando, procesarEntrada } = useProcesadorMagico();

  const aplicarPill = (pill: Pill) => {
    setTexto(pill.template);
    // Esperar al próximo tick para que el input ya tenga el valor seteado.
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pill.cursor, pill.cursor);
    });
  };

  const manejarEnvio = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!texto.trim() || procesando) return;
    try {
      const respuesta = await procesarEntrada(texto);
      setRespuestaPendiente(respuesta);
    } catch {
      // El hook ya disparó el toast (rechazo/ambigüedad). Mantener el texto
      // para que el usuario pueda corregirlo sin reescribir.
    }
  };

  const efectuar = async () => {
    if (!respuestaPendiente) return;
    await onTareaConfirmada(respuestaPendiente);
    setRespuestaPendiente(null);
    setTexto("");
  };

  const rechazar = () => setRespuestaPendiente(null);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {PILLS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => aplicarPill(p)}
            disabled={procesando}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-border bg-card/60 backdrop-blur text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={manejarEnvio} className="surface-card p-2 mate-glow flex items-center gap-2">
        <span className="pl-3 text-xl" aria-hidden>✨</span>
        <input
          ref={inputRef}
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={procesando}
          placeholder={
            procesando
              ? "Procesando con IA…"
              : "Tirá algo: 'agendar dentista mañana 10am', 'entrené 10km 40min'…"
          }
          aria-label="Input Mágico — asistente proactivo"
          className="flex-1 bg-transparent outline-none px-2 py-3 text-base placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={procesando || !texto.trim()}
          className="px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {procesando ? "…" : "Capturar"}
        </button>
      </form>

      <ModalConfirmacionMagica
        abierto={respuestaPendiente !== null}
        respuesta={respuestaPendiente}
        onEfectuar={() => void efectuar()}
        onRechazar={rechazar}
      />
    </div>
  );
};
