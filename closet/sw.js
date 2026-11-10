/* Closet PWA service worker.
   Scope: /closet/ only. Cache name is closet-* so we never touch Hardgrain caches.
   We also never delete non-closet caches (Hardgrain uses hg-v*). */
const CACHE = "closet-v1";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./db.js",
  "./bg.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./assets/demo/person.png",
  "./assets/demo/top-pink-tee.png",
  "./assets/demo/top-cream-knit.png",
  "./assets/demo/top-yellow-blouse.png",
  "./assets/demo/top-plaid.png",
  "./assets/demo/top-white-tank.png",
  "./assets/demo/bottom-jeans.png",
  "./assets/demo/bottom-black-pants.png",
  "./assets/demo/bottom-plaid-skirt.png",
  "./assets/demo/bottom-khaki-skirt.png",
  "./assets/demo/bottom-denim-shorts.png",
  "./assets/demo/shoes-sneakers.png",
  "./assets/demo/shoes-boots.png",
  "./assets/demo/shoes-maryjane.png",
  "./assets/demo/dress-pink.png",
  "./assets/demo/outer-denim.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("closet-") && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const net = fetch(e.request).then((r) => {
          if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
          return r;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;
  if (!url.pathname.startsWith("/closet")) return;

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const net = fetch(e.request)
        .then((r) => {
          if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
