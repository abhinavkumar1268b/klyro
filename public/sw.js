/*
 * KLYRO offline app shell.
 *
 * Financial data lives ONLY in IndexedDB (Dexie). This cache stores static
 * documents and assets so the app can boot offline; it never caches API,
 * RSC or data responses.
 */
const CACHE_NAME = "klyro-shell-v3";

const ROUTES = [
  "/",
  "/insights",
  "/add",
  "/transactions",
  "/budget",
  "/goals",
  "/settings",
];

const SHELL_ASSETS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const STATIC_PREFIX = "/_next/static/";

async function store(cache, request, response) {
  if (response && response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
  }
}

async function precacheShell() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.allSettled([
    ...SHELL_ASSETS.map(async (path) => {
      const response = await fetch(path, { cache: "reload" });
      await store(cache, path, response);
    }),
    ...ROUTES.map(async (path) => {
      const response = await fetch(path, { cache: "reload" });
      if (!response.ok) return;
      await store(cache, path, response);

      // Next.js exposes the JS/CSS chunks a route needs in its HTML. Caching
      // those here means every screen works offline after the first load.
      const html = await response.text();
      const matches = html.match(/(?:src|href)="(\/_next\/[^"]+)"/g) || [];
      const assets = [...new Set(matches.map((match) => match.match(/="([^"]+)"/)[1]))];
      await Promise.allSettled(
        assets.map(async (asset) => {
          const assetResponse = await fetch(asset, { cache: "reload" });
          await store(cache, asset, assetResponse);
        }),
      );
    }),
  ]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;

  // Navigations fall back to the cached document, never to a data response.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(url.pathname, { ignoreSearch: true })) ||
          (await cache.match("/")) ||
          new Response("KLYRO is unavailable offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith(STATIC_PREFIX) ||
    url.pathname.startsWith("/icons/") ||
    SHELL_ASSETS.includes(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => store(cache, request, copy));
            }
            return response;
          }),
      ),
    );
  }
  // Everything else (including RSC/data requests) is network-only and uncached.
});
