/**
 * Registro defensivo del Service Worker.
 *
 * REGLAS (críticas para Lovable preview):
 * 1. NUNCA registrar dentro de un iframe (rompe el preview del editor).
 * 2. NUNCA registrar en hosts de preview de Lovable.
 * 3. En esos casos, desregistrar SWs previos para limpiar caché viejo.
 *
 * El SW solo se activa en la versión publicada / dominio productivo,
 * dejando el terreno listo para FCM (Firebase Cloud Messaging) y otras
 * notificaciones push.
 */
export const registrarServiceWorker = (): void => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const estaEnIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const host = window.location.hostname;
  const esHostPreview =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") || // todos los previews y dominios de prueba
    host === "localhost" ||
    host === "127.0.0.1";

  if (estaEnIframe || esHostPreview) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  // Producción real: registrar el SW generado por vite-plugin-pwa.
  void navigator.serviceWorker.register("/sw.js", { scope: "/" });
};
