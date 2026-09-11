// OmniCard Service Worker for Offline Caching & PWA Support
const CACHE_NAME = "omnicard-cache-v26";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./css/themes.css",
  "./js/app.js",
  "./js/home.js",
  "./js/db.js",
  "./js/seedData.js",
  "./js/vcard.js",
  "./js/vendor.js",
  "./js/admin.js",
  "./js/whatsapp.js",
  "./js/pwa.js",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => {
      console.warn("Pre-cache incomplete:", err);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  const url = new URL(event.request.url);

  // Handle manifest.webmanifest with correct MIME type
  if (url.pathname.endsWith("manifest.webmanifest")) {
    event.respondWith(
      caches.match("./manifest.webmanifest").then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return resp;
        });
      }).catch(() => fetch(event.request))
    );
    return;
  }

  // Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
