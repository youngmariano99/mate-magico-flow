import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NavegacionPrincipal } from "@/components/layout/NavegacionPrincipal";
import { PanelGamificacion } from "@/components/dashboard/PanelGamificacion";
import { ListaMITs } from "@/components/dashboard/ListaMITs";
import { InputMagico } from "@/components/dashboard/InputMagico";
import { ToastConfirmacionIA } from "@/components/dashboard/ToastConfirmacionIA";
import { useTareas } from "@/hooks/useTareas";
import type { DTO_RespuestaProcesamientoIA } from "@/types/dominio";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

/**
 * Dashboard Diario — vista principal de MateFlow.
 * Compone gamificación + MITs + Input Mágico siempre accesible.
 */
function Dashboard() {
  const { tareas, cargando, crear, actualizarEstado } = useTareas();
  const [ultimaConfirmacion, setUltimaConfirmacion] =
    useState<DTO_RespuestaProcesamientoIA | null>(null);

  const manejarConfirmacion = async (r: DTO_RespuestaProcesamientoIA) => {
    setUltimaConfirmacion(r);
    await crear(r.tareaExtraida, r.categoriaSugerida, 10);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavegacionPrincipal />
      <main className="mx-auto max-w-5xl px-5 py-8 space-y-8 pb-32">
        <div>
          <p className="text-sm text-muted-foreground">Buen día ☕</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
            Tomate un mate. La IA hace el resto.
          </h1>
        </div>
        <PanelGamificacion />
        <ListaMITs
          tareas={tareas}
          cargando={cargando}
          onCompletar={(id) => void actualizarEstado(id, "Completada")}
        />
      </main>
      <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-5">
        <div className="mx-auto max-w-5xl px-5">
          <InputMagico onTareaConfirmada={manejarConfirmacion} />
        </div>
      </div>
      <ToastConfirmacionIA respuesta={ultimaConfirmacion} />
    </div>
  );
}
