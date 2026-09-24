/* Folhinha de Prazos — service worker
 * - Pré-cache do app shell (index.html + os assets com hash que ele referencia)
 * - Navegação: rede primeiro, cai no cache offline
 * - Assets do mesmo domínio: cache primeiro (nomes com hash são imutáveis)
 * - Google Fonts: stale-while-revalidate
 */
const VERSION = 'v1.0.0';
const SHELL = `shell-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;
const BASE = new URL('./', self.location).href;
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      await cache.addAll(CORE);
      // descobre os bundles gerados pelo Vite a partir do index.html
      try {
        const html = await (await fetch('./index.html', { cache: 'no-cache' })).text();
        const assets = [...html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll([...new Set(assets)]);
      } catch (e) {
        /* segue sem os assets; serão cacheados no primeiro uso */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL);
          cache.put('./index.html', fresh.clone());
          return fresh;
        } catch {
          return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
        }
      })(),
    );
    return;
  }

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })(),
    );
    return;
  }

  if (url.href.startsWith(BASE) && !url.pathname.includes('/api/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) (await caches.open(RUNTIME)).put(request, res.clone());
        return res;
      })(),
    );
  }
});
