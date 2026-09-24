// src/pwa/registerSW.ts
// Registra o service worker (apenas no build de produção).
export function registerSW(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((err) => console.warn('Service worker não registrado:', err));
  });
}
