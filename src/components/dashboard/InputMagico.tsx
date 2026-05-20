import { useState, type FormEvent } from "react";
import { useProcesadorMagico } from "@/hooks/useProcesadorMagico";
import type { DTO_RespuestaProcesamientoIA } from "@/types/dominio";

interface PropsInputMagico {
  onTareaConfirmada: (respuesta: DTO_RespuestaProcesamientoIA) => void;
}

/**
 * Input siempre accesible para carga rápida. Delega el parseo al
 * useProcesadorMagico (mock de Groq) y entrega una respuesta tipada.
 */
export const InputMagico = ({ onTareaConfirmada }: PropsInputMagico) => {
  const [texto, setTexto] = useState("");
  const { procesando, procesarEntrada } = useProcesadorMagico();

  const manejarEnvio = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!texto.trim() || procesando) return;
    try {
      const respuesta = await procesarEntrada(texto);
      onTareaConfirmada(respuesta);
      setTexto("");
    } catch {
      /* el hook ya guarda el error en estado */
    }
  };

  return (
    <form onSubmit={manejarEnvio} className="surface-card p-2 mate-glow flex items-center gap-2">
      <span className="pl-3 text-xl" aria-hidden>✨</span>
      <input
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={procesando}
        placeholder={
          procesando
            ? "Procesando con IA..."
            : "Tirá algo: 'comprar yerba', 'leer libro de arquitectura'…"
        }
        aria-label="Input Mágico — agregar tarea rápida"
        className="flex-1 bg-transparent outline-none px-2 py-3 text-base placeholder:text-muted-foreground disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={procesando || !texto.trim()}
        className="px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {procesando ? "..." : "Capturar"}
      </button>
    </form>
  );
};
