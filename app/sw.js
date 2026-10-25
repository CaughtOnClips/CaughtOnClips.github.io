// Service worker: offline app shell + runtime cache for fonts.
const VERSION = "hg-v31";
const SHELL = ["./", "index.html", "hardgrain-theme.css", "theme.css", "app.css", "app.js", "config.js", "plans.js", "game.js", "manifest.webmanifest",
  "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/favicon-32.png", "icons/mark.svg", "sounds/skill-unlock.mp3",
  "battle/hero.jpg", "battle/hero-pixel.jpg", "battle/chars/twist-log.jpg", "battle/chars/twist-pixel.jpg", "battle/chars/pink-log.jpg", "battle/chars/pink-pixel.jpg", "battle/chars/blue-log.jpg", "battle/chars/blue-pixel.jpg", "battle/chars/green-log.jpg", "battle/chars/green-pixel.jpg", "battle/bosses/ember-whelp.jpg", "battle/bosses/scrap-hound.jpg", "battle/bosses/cinder-boar.jpg", "battle/bosses/anvil-beetle.jpg", "battle/bosses/rust-serpent.jpg", "battle/bosses/coal-golem.jpg", "battle/bosses/brass-lynx.jpg", "battle/bosses/forge-drake.jpg", "battle/bosses/ironback.jpg", "battle/bosses/slag-wyrm.jpg", "battle/bosses/temper-sphinx.jpg", "battle/bosses/quench-leviathan.jpg", "battle/bosses/iron-warden.jpg", "battle/bosses/slag-pugilist.jpg",
  "/", "/index.html", "/privacy.html", "/terms.html", "/support.html", "/styles.css", "/icon.png", "/hardgrain-theme.css", "/hardgrain-mark.svg"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Network-first for navigations so updates show up; fall back to cache offline.
    if (req.mode === "navigate") {
      e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match(url.pathname.startsWith("/app") ? "/app/index.html" : "/index.html"))));
      return;
    }
    // Stale-while-revalidate for other same-origin files.
    e.respondWith(caches.match(req).then(cached => {
      const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; }).catch(() => cached);
      return cached || net;
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; }).catch(() => cached)));
  }
});
