const CACHE_NAME = "qpr-assistant-v3";

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/app.js",
  "js/db.js",
  "js/data/questions.js",
  "js/data/wiki.js",
  "js/components/dom.js",
  "js/components/ui.js",
  "js/components/question-renderer.js",
  "js/components/profile-model.js",
  "js/components/export-image.js",
  "js/components/pin.js",
  "js/components/relationship-form.js",
  "js/components/spectrum-track.js",
  "js/components/export-spectrum-image.js",
  "js/data/spectrum.js",
  "js/pages/home.js",
  "js/pages/explore-list.js",
  "js/pages/explore-question.js",
  "js/pages/profile.js",
  "js/pages/wiki-list.js",
  "js/pages/wiki-detail.js",
  "js/pages/settings.js",
  "js/pages/lock.js",
  "js/pages/relationship-list.js",
  "js/pages/relationship-detail.js",
  "js/pages/negotiation.js",
  "js/pages/review.js",
  "js/pages/spectrum.js",
  "js/pages/spectrum-snapshots.js",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached || caches.match("index.html"));
      return cached || network;
    })
  );
});
