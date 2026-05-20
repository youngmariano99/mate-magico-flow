import { useGamificacion } from "@/hooks/useGamificacion";

/**
 * Log de Evolución: barras CSS puras (sin libs) por área + lista de logros.
 */
export const LogEvolucion = () => {
  const { perfil, cargando } = useGamificacion();

  if (cargando || !perfil) {
    return <div className="surface-card h-64 animate-pulse" />;
  }

  const maximo = Math.max(...perfil.xpPorArea.map((a) => a.xp), 1);

  return (
    <div className="space-y-8">
      <section className="surface-card p-6">
        <h3 className="font-display text-lg mb-5">XP por área</h3>
        <ul className="space-y-4">
          {perfil.xpPorArea.map((a) => {
            const pct = Math.round((a.xp / maximo) * 100);
            return (
              <li key={a.area}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{a.area}</span>
                  <span className="text-muted-foreground">{a.xp} XP</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-mate to-primary transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="surface-card p-6">
        <h3 className="font-display text-lg mb-4">Logros recientes</h3>
        <ul className="divide-y divide-border">
          {perfil.logrosRecientes.map((l) => (
            <li key={l.id} className="py-3 flex items-center justify-between gap-3">
              <span className="text-sm">{l.descripcion}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{l.fecha}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
