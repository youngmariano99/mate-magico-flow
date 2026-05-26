import { useCallback, useState } from "react";
import { toast } from "sonner";
import { validarIntencionUsuario } from "@/services/mocks/escudoLexico";
import type { DTO_RespuestaProcesamientoIA } from "@/types/dominio";

/**
 * Hook orquestador del Procesador Mágico.
 *
 * Flujo:
 *  1) Delegar la validación al Escudo Léxico (puro, 0 ms).
 *  2) Si es rechazo/ambigüedad: toast inmediato y NO llamamos al "mock Groq".
 *  3) Si es aprobado: simulamos latencia de red (1 s) y devolvemos el DTO
 *     estructurado para que la UI abra el Modal de Confirmación.
 *
 * Precondición: `texto` no vacío.
 */

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

      // 1) Escudo Léxico — síncrono, sin latencia.
      const veredicto = validarIntencionUsuario(limpio);

      if (veredicto.tipo === "rechazado") {
        toast.error("❌ Solicitud no reconocida", { description: veredicto.razon });
        setEstado({ procesando: false, ultimaRespuesta: null, error: veredicto.razon });
        return Promise.reject(new Error(veredicto.razon));
      }

      if (veredicto.tipo === "ambiguo") {
        toast("🤔 Entrada ambigua", { description: veredicto.sugerencia });
        setEstado({ procesando: false, ultimaRespuesta: null, error: veredicto.sugerencia });
        return Promise.reject(new Error(veredicto.sugerencia));
      }

      // 2) Aprobado → simular latencia del LLM (mock de Groq).
      setEstado({ procesando: true, ultimaRespuesta: null, error: null });
      const idToast = toast.loading("Procesando con IA…", {
        description: `"${limpio.slice(0, 60)}${limpio.length > 60 ? "…" : ""}"`,
      });

      const { analisis } = veredicto;
      return new Promise((resolve) => {
        setTimeout(() => {
          const respuesta: DTO_RespuestaProcesamientoIA = {
            exito: true,
            intencion: analisis.intencion,
            tareaExtraida: limpio,
            categoriaSugerida: analisis.categoria,
            tagsDetectados: analisis.tags,
            confianza: analisis.confianza,
            requiereAgendamiento: analisis.requiereAgendamiento,
            fechaSugerida: analisis.fechaSugerida,
            horaSugerida: analisis.horaSugerida,
            metricasExtraidas: analisis.metricasExtraidas,
            cantidadDetectada: analisis.cantidadDetectada,
            kpiObjetivoTexto: analisis.kpiObjetivoTexto,
          };
          setEstado({ procesando: false, ultimaRespuesta: respuesta, error: null });
          toast.success("✨ Listo para confirmar", {
            id: idToast,
            description: `${analisis.intencion.replace(/_/g, " ").toLowerCase()} · ${limpio}`,
          });
          resolve(respuesta);
        }, 1000);
      });
    },
    [],
  );

  return { ...estado, procesarEntrada };
};
