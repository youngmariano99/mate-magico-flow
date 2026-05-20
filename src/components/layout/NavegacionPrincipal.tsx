import { Link, useLocation } from "@tanstack/react-router";

/**
 * Navegación principal de la PWA. Tres destinos: Dashboard, Baúl y Evolución.
 */
const ITEMS = [
  { to: "/", label: "Hoy" },
  { to: "/baul", label: "Baúl" },
  { to: "/evolucion", label: "Evolución" },
] as const;

export const NavegacionPrincipal = () => {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🧉</span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Mate<span className="text-primary">Flow</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-surface border border-border p-1">
          {ITEMS.map((item) => {
            const activo = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  activo
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
