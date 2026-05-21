import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DTO_Sesion, DTO_Usuario } from "@/types/dominio";

/**
 * AuthProvider mockeado. La forma del contexto está pensada para ser un
 * drop-in de Supabase Auth: `sesion` mapea a `Session`, `usuario` a `User`,
 * y los métodos imitan las firmas de `supabase.auth.*`.
 *
 * Cuando se conecte el backend real, reemplazar el cuerpo de cada método por
 * la llamada equivalente de `@supabase/supabase-js` sin tocar consumidores.
 */

const STORAGE_KEY = "mateflow.sesion.v1";

interface ContextoAutenticacion {
  sesion: DTO_Sesion | null;
  usuario: DTO_Usuario | null;
  cargando: boolean;
  /** Precondición: email válido y password no vacío. */
  iniciarSesion: (email: string, password: string) => Promise<DTO_Sesion>;
  registrarse: (email: string, password: string, nombreCompleto: string) => Promise<DTO_Sesion>;
  cerrarSesion: () => Promise<void>;
  /** Actualiza el perfil parcialmente. Mockeado: persiste en localStorage. */
  actualizarPerfil: (cambios: Partial<Omit<DTO_Usuario, "id" | "email" | "fechaRegistro">>) => Promise<DTO_Usuario>;
}

const Contexto = createContext<ContextoAutenticacion | null>(null);

const construirSesionMock = (email: string, nombreCompleto: string): DTO_Sesion => ({
  accessToken: `mock-access-${Math.random().toString(36).slice(2)}`,
  refreshToken: `mock-refresh-${Math.random().toString(36).slice(2)}`,
  expiraEn: Date.now() + 1000 * 60 * 60 * 24,
  usuario: {
    id: `u-${Math.random().toString(36).slice(2, 10)}`,
    email,
    nombreCompleto,
    avatarUrl: null,
    zonaHoraria: "America/Argentina/Buenos_Aires",
    fechaRegistro: new Date().toISOString(),
  },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [sesion, setSesion] = useState<DTO_Sesion | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Hidrata sesión desde localStorage. Equivalente futuro: supabase.auth.getSession().
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as DTO_Sesion;
        if (parsed.expiraEn > Date.now()) setSesion(parsed);
        else localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* corrupto: ignorar */
    } finally {
      setCargando(false);
    }
  }, []);

  const persistir = useCallback((s: DTO_Sesion | null) => {
    if (typeof window === "undefined") return;
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const iniciarSesion = useCallback(
    async (email: string, password: string): Promise<DTO_Sesion> => {
      if (!email.includes("@") || password.length < 3) throw new Error("Credenciales inválidas");
      await new Promise((r) => setTimeout(r, 600));
      const nueva = construirSesionMock(email, email.split("@")[0]);
      persistir(nueva);
      setSesion(nueva);
      return nueva;
    },
    [persistir],
  );

  const registrarse = useCallback(
    async (email: string, _password: string, nombreCompleto: string): Promise<DTO_Sesion> => {
      await new Promise((r) => setTimeout(r, 700));
      const nueva = construirSesionMock(email, nombreCompleto);
      persistir(nueva);
      setSesion(nueva);
      return nueva;
    },
    [persistir],
  );

  const cerrarSesion = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 200));
    persistir(null);
    setSesion(null);
  }, [persistir]);

  const actualizarPerfil = useCallback(
    async (cambios: Partial<Omit<DTO_Usuario, "id" | "email" | "fechaRegistro">>): Promise<DTO_Usuario> => {
      if (!sesion) throw new Error("No hay sesión activa");
      await new Promise((r) => setTimeout(r, 400));
      const usuario: DTO_Usuario = { ...sesion.usuario, ...cambios };
      const nueva: DTO_Sesion = { ...sesion, usuario };
      persistir(nueva);
      setSesion(nueva);
      return usuario;
    },
    [sesion, persistir],
  );

  const valor = useMemo<ContextoAutenticacion>(
    () => ({
      sesion,
      usuario: sesion?.usuario ?? null,
      cargando,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      actualizarPerfil,
    }),
    [sesion, cargando, iniciarSesion, registrarse, cerrarSesion, actualizarPerfil],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const useAuth = (): ContextoAutenticacion => {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
