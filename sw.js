// NAAWS Study — minimal service worker.
// Caches the app shell on install; serves from cache when offline.
// Bump CACHE_VERSION whenever the HTML changes to force users to refresh.

const CACHE_VERSION = 'naaws-v7';
const APP_SHELL = [
  './',
  './index.html',
  './cards.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first for same-origin GETs; falls back to network.
// Google Fonts and other cross-origin requests just go to network.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let browser handle
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      // Opportunistically cache successful responses
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
