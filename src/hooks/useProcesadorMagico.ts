import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  CategoriaPARA,
  DTO_RespuestaProcesamientoIA,
} from "@/types/dominio";

/**
 * Hook que simula el procesamiento de IA (Groq) y dispara feedback toast.
 * La salida está estrictamente tipada como DTO_RespuestaProcesamientoIA
 * para impedir alucinaciones estructurales.
 *
 * Precondición: `texto` no vacío.
 */

interface ReglaClasificacion {
  patron: RegExp;
  categoria: CategoriaPARA;
  tags: string[];
}

const REGLAS: ReadonlyArray<ReglaClasificacion> = [
  { patron: /\b(comprar|pagar|gasto|factura|plata|sueldo)\b/i, categoria: "Area", tags: ["Finanzas"] },
  { patron: /\b(entren|gym|correr|nutrici[oó]n|m[eé]dico)\b/i, categoria: "Area", tags: ["Salud"] },
  { patron: /\b(leer|art[ií]culo|video|curso|libro)\b/i, categoria: "Recurso", tags: ["Aprendizaje"] },
  { patron: /\b(lanzar|construir|implementar|dise[ñn]ar|proyecto)\b/i, categoria: "Proyecto", tags: ["Build"] },
  { patron: /\b(facu|tp|parcial|materia|estudiar)\b/i, categoria: "Proyecto", tags: ["Facultad"] },
  { patron: /\b(archivar|guardar|viejo)\b/i, categoria: "Archivo", tags: ["Histórico"] },
];

const clasificar = (texto: string): { categoria: CategoriaPARA; tags: string[]; confianza: number } => {
  for (const regla of REGLAS) {
    if (regla.patron.test(texto)) {
      return { categoria: regla.categoria, tags: regla.tags, confianza: 0.88 };
    }
  }
  return { categoria: "Area", tags: ["General"], confianza: 0.55 };
};

interface EstadoProcesador {
  procesando: boolean;
  ultimaRespuesta: DTO_RespuestaProcesamientoIA | null;
  error: string | null;
}

export const useProcesadorMagico = () => {
  const [estado, setEstado] = useState<EstadoProcesador>({
    procesando: false,
    ultimaRespuesta: null,
    error: null,
  });

  const procesarEntrada = useCallback(
    (texto: string): Promise<DTO_RespuestaProcesamientoIA> => {
      const limpio = texto.trim();
      if (limpio.length === 0) {
        const err = "El texto a procesar no puede estar vacío.";
        setEstado({ procesando: false, ultimaRespuesta: null, error: err });
        return Promise.reject(new Error(err));
      }

      setEstado({ procesando: true, ultimaRespuesta: null, error: null });
      const idToast = toast.loading("Procesando con IA...", {
        description: `"${limpio.slice(0, 60)}${limpio.length > 60 ? "…" : ""}"`,
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          const { categoria, tags, confianza } = clasificar(limpio);
          const respuesta: DTO_RespuestaProcesamientoIA = {
            exito: true,
            tareaExtraida: limpio,
            categoriaSugerida: categoria,
            tagsDetectados: tags,
            confianza,
          };
          setEstado({ procesando: false, ultimaRespuesta: respuesta, error: null });
          toast.success(`✨ Agregado a ${categoria}`, {
            id: idToast,
            description: `${limpio}${tags.length ? ` · ${tags.map((t) => `#${t}`).join(" ")}` : ""}`,
          });
          resolve(respuesta);
        }, 1000);
      });
    },
    [],
  );

  return { ...estado, procesarEntrada };
};
