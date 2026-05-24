import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tipos mínimos de la Web Speech API — no incluidos en lib.dom por defecto
 * en todos los entornos. Sólo modelamos lo que consumimos acá.
 */
interface ResultadoReconocimiento {
  isFinal: boolean;
  0: { transcript: string };
}
interface EventoResultado {
  resultIndex: number;
  results: ArrayLike<ResultadoReconocimiento>;
}
interface EventoError {
  error: string;
  message?: string;
}
interface ReconocedorVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: EventoResultado) => void) | null;
  onerror: ((e: EventoError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type ConstructorReconocedor = new () => ReconocedorVoz;

const obtenerConstructor = (): ConstructorReconocedor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor;
    webkitSpeechRecognition?: ConstructorReconocedor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

interface Opciones {
  /** Callback cuando el texto cambia (parcial o final). */
  onTranscripcion: (texto: string, esFinal: boolean) => void;
  /** Idioma BCP-47. Por defecto español rioplatense. */
  idioma?: string;
}

export interface ControladorDictado {
  soportado: boolean;
  grabando: boolean;
  error: string | null;
  iniciar: () => void;
  detener: () => void;
  alternar: () => void;
}

/**
 * Hook de dictado por voz sobre Web Speech API.
 *
 * Notas:
 * - `interimResults: true` para feedback en vivo.
 * - El hook NO acumula texto: delega a `onTranscripcion`, que recibe el
 *   contenido en cada evento (final o parcial) para que el padre decida
 *   cómo combinarlo con lo ya tipeado.
 * - En navegadores sin soporte, `soportado=false` y los controles son no-op.
 */
export const useDictadoVoz = ({
  onTranscripcion,
  idioma = "es-AR",
}: Opciones): ControladorDictado => {
  const Constructor = obtenerConstructor();
  const soportado = Constructor !== null;
  const ref = useRef<ReconocedorVoz | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Estable: evita reinicializar el reconocedor en cada render del padre.
  const cbRef = useRef(onTranscripcion);
  useEffect(() => {
    cbRef.current = onTranscripcion;
  }, [onTranscripcion]);

  useEffect(() => {
    if (!Constructor) return;
    const rec = new Constructor();
    rec.lang = idioma;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let texto = "";
      let esFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        texto += r[0].transcript;
        if (r.isFinal) esFinal = true;
      }
      cbRef.current(texto, esFinal);
    };
    rec.onerror = (e) => {
      setError(e.error || "Error de reconocimiento");
      setGrabando(false);
    };
    rec.onend = () => setGrabando(false);
    ref.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      ref.current = null;
    };
  }, [Constructor, idioma]);

  const iniciar = useCallback(() => {
    const rec = ref.current;
    if (!rec || grabando) return;
    try {
      setError(null);
      rec.start();
      setGrabando(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar el micrófono");
    }
  }, [grabando]);

  const detener = useCallback(() => {
    const rec = ref.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* noop */
    }
    setGrabando(false);
  }, []);

  const alternar = useCallback(() => {
    if (grabando) detener();
    else iniciar();
  }, [grabando, iniciar, detener]);

  return { soportado, grabando, error, iniciar, detener, alternar };
};
