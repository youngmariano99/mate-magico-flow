import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";

/**
 * Wrapper que redirige al /login si no hay sesión activa.
 * Pensado para envolver las vistas autenticadas del shell.
 */
export const GuardiaSesion = ({ children }: { children: ReactNode }) => {
  const { sesion, cargando } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!cargando && !sesion && pathname !== "/login") {
      void navigate({ to: "/login" });
    }
  }, [cargando, sesion, pathname, navigate]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando...</div>
      </div>
    );
  }
  if (!sesion) return null;
  return <>{children}</>;
};
