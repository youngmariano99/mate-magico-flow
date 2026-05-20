import { useGamificacion } from "@/hooks/useGamificacion";

/**
 * Panel superior del dashboard: nivel actual y progreso de XP.
 * Componente puramente presentacional alimentado por useGamificacion.
 */
export const PanelGamificacion = () => {
  const { perfil, cargando } = useGamificacion();

  if (cargando || !perfil) {
    return (
      <div className="surface-card p-6 animate-pulse h-32" aria-busy="true" />
    );
  }

  const porcentaje = Math.min(
    100,
    Math.round((perfil.xpActual / perfil.xpParaSiguienteNivel) * 100),
  );

  return (
    <section className="surface-card p-6 mate-glow">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Nivel actual
          </p>
          <h2 className="font-display text-4xl font-semibold mt-1">
            Nivel {perfil.nivel}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Experiencia
          </p>
          <p className="font-display text-2xl mt-1">
            <span className="text-primary">{perfil.xpActual}</span>
            <span className="text-muted-foreground text-base">
              {" "}/ {perfil.xpParaSiguienteNivel} XP
            </span>
          </p>
        </div>
      </div>
      <div
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-[width] duration-700"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Te faltan{" "}
        <span className="text-foreground font-medium">
          {perfil.xpParaSiguienteNivel - perfil.xpActual} XP
        </span>{" "}
        para el siguiente nivel. Tomate un mate y seguí.
      </p>
    </section>
  );
};
