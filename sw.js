// Offline-first service worker
const CACHE_NAME = 'peds-chd-pwa-v1-2025-10-19';
const BASE_URL = new URL('./', self.location);
const urlFor = (path) => new URL(path, BASE_URL).toString();
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'js/app.js',
  'js/router.js',
  'js/utils.js',
  'js/zscore.js',
  'js/pages/home.js',
  'js/pages/lecture.js',
  'js/pages/qbank.js',
  'js/pages/cxr.js',
  'js/pages/ekg.js',
  'data/qbank.json',
  'data/cxr_tasks.json',
  'data/ekg_sample.csv',
  'assets/cxr/cxr_synthetic.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'offline.html'
].map(urlFor);
const ASSET_URLS = new Set(ASSETS);
const INDEX_URL = urlFor('index.html');
const OFFLINE_URL = urlFor('offline.html');

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
      fetch(req).catch(async () =>
        (await caches.match(req)) || (await caches.match(INDEX_URL)) || caches.match(OFFLINE_URL)
      )
    );
    return;
  }

  if (ASSET_URLS.has(url.href)) {
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
