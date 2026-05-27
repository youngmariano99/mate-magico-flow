import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, Gauge, Sparkles, Target, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/auth/AuthProvider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { InputMagico } from "@/components/dashboard/InputMagico";
import { ResumenSemanalIA } from "@/components/dashboard/ResumenSemanalIA";
import { MateBotIcon, type EstadoMateBot } from "./MateBotIcon";
import { useManejarConfirmacionMagica } from "@/hooks/useManejarConfirmacionMagica";
import {
  useConsultasAsistente,
  type RespuestaConsulta,
  type TipoConsulta,
} from "@/hooks/useConsultasAsistente";

/**
 * MateBotAvatar — FAB global que concentra TODA la superficie de IA
 * (Input Mágico, voz, informes). Está mounted a nivel `__root` y se
 * auto-oculta para usuarios sin sesión.
 *
 * Decisiones:
 *  - En mobile usamos `Sheet` (bottom) para máximo confort de pulgar.
 *  - En desktop usamos `Popover` anclado al propio FAB para mantener la
 *    sensación de "consola flotando sobre el avatar".
 *  - El estado de animación del avatar lo dicta `procesando` emitido por
 *    `InputMagico`, evitando duplicar la fuente de verdad.
 */

const SALUDOS: ReadonlyArray<string> = [
  "¡Hola! ¿Qué cebamos hoy?",
  "Tirame algo y lo organizo ☕",
  "¿Agendamos? ¿Anotamos? Vos decís.",
  "Estoy listo cuando vos lo estés.",
];

export const MateBotAvatar = () => {
  const { usuario } = useAuth();
  const esMobile = useIsMobile();
  const manejarConfirmacion = useManejarConfirmacionMagica();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<EstadoMateBot>("idle");
  const [mostrarSaludo, setMostrarSaludo] = useState(false);
  const [indiceSaludo, setIndiceSaludo] = useState(0);
  const [respuesta, setRespuesta] = useState<RespuestaConsulta | null>(null);
  const { responder } = useConsultasAsistente();

  const saludo = useMemo(() => SALUDOS[indiceSaludo % SALUDOS.length], [indiceSaludo]);

  const ejecutarConsulta = useCallback(
    (tipo: TipoConsulta) => setRespuesta(responder(tipo)),
    [responder],
  );

  useEffect(() => {
    if (!abierto) setRespuesta(null);
  }, [abierto]);

  // Mostrar el bocadillo de saludo cada ~22 s cuando la consola está cerrada.
  useEffect(() => {
    if (abierto) {
      setMostrarSaludo(false);
      return;
    }
    const aparecer = setTimeout(() => setMostrarSaludo(true), 1800);
    const ciclo = setInterval(() => {
      setIndiceSaludo((i) => i + 1);
      setMostrarSaludo(true);
      setTimeout(() => setMostrarSaludo(false), 5200);
    }, 22000);
    const ocultar = setTimeout(() => setMostrarSaludo(false), 7000);
    return () => {
      clearTimeout(aparecer);
      clearTimeout(ocultar);
      clearInterval(ciclo);
    };
  }, [abierto]);

  const handleProcesando = useCallback((p: boolean) => {
    setEstado(p ? "processing" : "idle");
  }, []);

  if (!usuario) return null;

  const Disparador = (
    <div className="fixed z-40 bottom-[88px] md:bottom-6 right-5 flex flex-col items-end gap-2">
      {mostrarSaludo && !abierto && (
        <div className="animate-fade-in mb-1 max-w-[220px] rounded-2xl rounded-br-sm border border-border bg-card/95 backdrop-blur px-3 py-2 text-xs text-foreground shadow-xl">
          <span aria-hidden className="mr-1">💬</span>
          {saludo}
        </div>
      )}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Abrir asistente MateBot"
        aria-expanded={abierto}
        className="relative h-[60px] w-[60px] grid place-items-center rounded-full bg-card border border-border shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform mate-glow"
      >
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full ${
            estado === "processing"
              ? "animate-ping bg-primary/30"
              : "bg-primary/10"
          }`}
        />
        <MateBotIcon estado={estado} tamano={52} className="relative" />
      </button>
    </div>
  );

  const Consola = (
    <div className="space-y-5">
      <InputMagico
        onTareaConfirmada={manejarConfirmacion}
        onProcesandoChange={handleProcesando}
        onConfirmado={() => setAbierto(false)}
      />

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Consultas rápidas
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-start gap-2 h-auto py-2.5 text-left"
            onClick={() => ejecutarConsulta("AHORA")}
          >
            <Target className="size-4 text-primary shrink-0" />
            <span className="text-xs leading-tight">¿Qué tengo que hacer ahora?</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-start gap-2 h-auto py-2.5 text-left"
            onClick={() => ejecutarConsulta("COLGADO")}
          >
            <AlertTriangle className="size-4 text-primary shrink-0" />
            <span className="text-xs leading-tight">¿Qué me quedó colgado?</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-start gap-2 h-auto py-2.5 text-left"
            onClick={() => ejecutarConsulta("BALANCE")}
          >
            <Gauge className="size-4 text-primary shrink-0" />
            <span className="text-xs leading-tight">¿Cómo viene mi balance hoy?</span>
          </Button>
        </div>
        {respuesta && (
          <div className="relative mt-3 rounded-2xl rounded-tl-sm border border-primary/30 bg-primary/5 px-4 py-3 animate-fade-in">
            <button
              type="button"
              onClick={() => setRespuesta(null)}
              aria-label="Cerrar respuesta"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
            <p className="font-display text-sm mb-1.5 pr-5">{respuesta.titulo}</p>
            <p className="text-xs text-foreground/85 whitespace-pre-line leading-relaxed">
              {respuesta.cuerpo}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Acciones del asistente
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="[&>button]:w-full [&>button]:h-full">
            <ResumenSemanalIA />
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full justify-start gap-2 h-auto py-4 border-dashed hover:border-primary hover:bg-primary/5"
            onClick={() => setAbierto(false)}
          >
            <Link to="/evolucion">
              <BarChart3 className="size-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-display text-base">Analizar Balance</p>
                <p className="text-xs text-muted-foreground font-normal">
                  Distribución de energía por área PARA
                </p>
              </div>
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="size-3 text-primary" />
        Toda la IA de MateFlow vive acá. Cero fricción.
      </p>
    </div>
  );

  // ====== MOBILE: Sheet (bottom) ======
  if (esMobile) {
    return (
      <>
        {Disparador}
        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-3 font-display">
                <MateBotIcon estado={estado} tamano={36} />
                MateBot
              </SheetTitle>
              <SheetDescription>{saludo}</SheetDescription>
            </SheetHeader>
            <div className="mt-4">{Consola}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // ====== DESKTOP: Popover anclado al avatar ======
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverAnchor asChild>{Disparador}</PopoverAnchor>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={16}
        className="w-[min(560px,calc(100vw-2.5rem))] p-0 overflow-hidden"
      >
        {/* Overlay sutil para enfocar la consola */}
        {abierto && (
          <div
            className="fixed inset-0 -z-10 bg-background/40 backdrop-blur-[2px] animate-fade-in pointer-events-none"
            aria-hidden
          />
        )}
        <div className="p-5">
          <header className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <MateBotIcon estado={estado} tamano={44} />
              <div>
                <p className="font-display text-lg leading-tight">MateBot</p>
                <p className="text-xs text-muted-foreground">{saludo}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar consola"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </header>
          {Consola}
        </div>
      </PopoverContent>
    </Popover>
  );
};
