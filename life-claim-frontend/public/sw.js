// Life Claims service worker (roadmap 4.7).
//
// Deliberately MINIMAL and SAFE: it makes the app installable (a registered SW +
// manifest are required for "Add to Home Screen") without caching responses — so
// there is ZERO risk of serving stale assets or stale API data. It takes control
// immediately and simply passes every request through to the network.
//
// If offline support is required later, replace this with a Workbox / vite-plugin-pwa
// precache that versions the app shell with the build hash (see docs/PWA_RESPONSIVE.md).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// No-op fetch handler: network passthrough (browser default), no caching.
self.addEventListener('fetch', () => { /* passthrough */ });
