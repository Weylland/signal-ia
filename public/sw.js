// Service worker « sûr » : ne met JAMAIS en cache le HTML ni les payloads RSC
// (sinon Next.js sert du périmé → mismatch → rechargement en boucle).
// On ne cache que les assets immuables hashés (/_next/static) et les images.
const CACHE = "signal-ia-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add("/offline.html").catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg|gif|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  // Navigations (HTML) : réseau d'abord, repli hors-ligne. JAMAIS de cache HTML.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Payloads RSC de Next : toujours réseau, jamais de cache.
  if (url.searchParams.has("_rsc")) return;

  // Assets immuables hashés : cache-first.
  if (isImmutableAsset(url)) {
    e.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(req, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Le reste : réseau direct, sans cache.
});
