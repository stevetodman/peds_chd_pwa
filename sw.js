// Offline-first service worker
const BUILD_COMMIT = '15e054f';
const BUILD_STAMP = '2025-10-19T23:12:37.935853Z';
const CACHE_NAME = `peds-chd-cache-${BUILD_COMMIT || 'dev'}-${BUILD_STAMP.replace(/[:.]/g, '')}`;
self.__COMMIT__ = BUILD_COMMIT;
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.webmanifest',
  '/js/app.js',
  '/js/router.js',
  '/js/utils.js',
  '/js/zscore.js',
  '/js/pages/home.js',
  '/js/pages/lecture.js',
  '/js/pages/qbank.js',
  '/js/pages/cxr.js',
  '/js/pages/ekg.js',
  '/data/qbank.json',
  '/data/cxr_tasks.json',
  '/data/ekg_sample.csv',
  '/assets/cxr/cxr_synthetic.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(network => {
          if (network && network.ok) {
            const clone = network.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return network;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
