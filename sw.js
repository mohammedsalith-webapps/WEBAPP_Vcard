// OmniCard Service Worker for Offline Caching & PWA Support
const CACHE_NAME = "omnicard-cache-v18";
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

  // Dynamic PWA Manifest interception per vendor vCard
  if (url.pathname.endsWith("/manifest.webmanifest") || url.pathname.endsWith("manifest.webmanifest")) {
    const vendorSlug = url.searchParams.get("v");
    const vendorName = url.searchParams.get("name");

    if (vendorSlug) {
      const bizName = vendorName ? decodeURIComponent(vendorName) : "Smart Business vCard";
      const shortName = bizName.length > 14 ? bizName.substring(0, 14) : bizName;

      const dynamicManifest = {
        id: `vcard-app-${vendorSlug}`,
        name: bizName,
        short_name: shortName,
        description: `${bizName} - Smart Business vCard`,
        start_url: `./?v=${encodeURIComponent(vendorSlug)}&pwa=1`,
        scope: "./",
        display: "standalone",
        background_color: "#07090E",
        theme_color: "#07090E",
        icons: [
          {
            src: "./assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "./assets/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "./assets/icons/icon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      };

      event.respondWith(
        new Response(JSON.stringify(dynamicManifest), {
          headers: {
            "Content-Type": "application/manifest+json; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        })
      );
      return;
    }
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
