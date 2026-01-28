const CACHE_NAME = 'partner-v2';
const urlsToCache = [
  './',
  './index.html',
  './auth.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Only cache static assets, don't cache HTML pages to avoid stale data
  const isStaticAsset = event.request.url.match(/\.(css|js|json|png|jpg|jpeg|svg|woff2)$/);
  
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});