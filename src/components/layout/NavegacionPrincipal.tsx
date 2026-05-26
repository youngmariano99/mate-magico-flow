import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Archive, TrendingUp, LogOut, CalendarDays, Dumbbell, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";

const ITEMS = [
  { to: "/", label: "Hoy", Icon: Home },
  { to: "/planificacion", label: "Semana", Icon: CalendarDays },
  { to: "/kpis", label: "KPIs", Icon: Target },
  { to: "/fitness", label: "Fitness", Icon: Dumbbell },
  { to: "/baul", label: "Baúl", Icon: Archive },
  { to: "/evolucion", label: "Evolución", Icon: TrendingUp },
] as const;

/**
 * Barra superior (md+). Oculta en mobile, donde manda la BarraInferior.
 */
export const NavegacionPrincipal = () => {
  const { pathname } = useLocation();
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await cerrarSesion();
    toast("Hasta la próxima 👋");
    void navigate({ to: "/login" });
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🧉</span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Mate<span className="text-primary">Flow</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-surface border border-border p-1">
          {ITEMS.map(({ to, label }) => {
            const activo = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  activo
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {usuario && (
            <span className="text-sm text-muted-foreground truncate max-w-[160px]">
              {usuario.nombreCompleto}
            </span>
          )}
          <button
            onClick={salir}
            className="p-2 rounded-full border border-border hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Bottom Tab Bar (mobile). Optimizada para uso a una mano: tap targets
 * grandes, ícono + label, fixed bottom con safe-area inset.
 */
export const BarraInferior = () => {
  const { pathname } = useLocation();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <ul className="grid grid-cols-6">
        {ITEMS.map(({ to, label, Icon }) => {
          const activo = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors ${
                  activo ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} strokeWidth={activo ? 2.4 : 1.8} />
                <span className={activo ? "font-medium" : ""}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
