// Service worker for offline-bruk. Bump CACHE-versjonen ved ny app-versjon.
const CACHE = "jp-kjokken-v3";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Appen (HTML): nett først, ALLTID ferskt (forbi HTTP-cache) → nyeste versjon
  // når online, cache når offline. `no-store` hindrer at GitHub Pages sin
  // HTTP-cache serverer en gammel index.html etter deploy.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then((r) => {
          const cp = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", cp));
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Alt annet (ikoner, fonter, …): cache først, ellers nett (og cache det).
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((r) => {
            const cp = r.clone();
            caches.open(CACHE).then((c) => c.put(req, cp));
            return r;
          })
          .catch(() => cached)
    )
  );
});
