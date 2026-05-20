import { useEffect, useState } from "react";
import type { DTO_RespuestaProcesamientoIA } from "@/types/dominio";

interface PropsToastConfirmacion {
  respuesta: DTO_RespuestaProcesamientoIA | null;
}

/**
 * Toast efímero que confirma cómo la IA clasificó la entrada del usuario.
 * Cumple con el flujo "Vista de Procesamiento".
 */
export const ToastConfirmacionIA = ({ respuesta }: PropsToastConfirmacion) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!respuesta) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [respuesta]);

  if (!respuesta || !visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 surface-card p-4 max-w-sm mate-glow animate-in slide-in-from-bottom-4"
    >
      <p className="text-xs uppercase tracking-widest text-primary">
        Clasificado por IA · {(respuesta.confianza * 100).toFixed(0)}%
      </p>
      <p className="font-medium mt-1 truncate">{respuesta.tareaExtraida}</p>
      <p className="text-sm text-muted-foreground mt-1">
        Añadido a <span className="text-foreground">{respuesta.categoriaSugerida}</span>
        {respuesta.tagsDetectados.length > 0 && (
          <> · {respuesta.tagsDetectados.map((t) => `#${t}`).join(" ")}</>
        )}
      </p>
    </div>
  );
};
