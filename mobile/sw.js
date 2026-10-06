// Relix Mobile — offline support. App shell cached on install; fonts cached on first use.
const CACHE = 'relix-mobile-v2-1';
const SHELL = ['./', 'index.html', 'app.css', 'data.js', 'app.js', 'manifest.webmanifest', 'relix-logo-white.svg', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'vendor/jsQR.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('relix-mobile') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  const isOwn = url.origin === self.location.origin && url.pathname.includes('/mobile/') && !url.pathname.includes('/mobile/v1/');
  if (!isFont && !isOwn) return;
  if (isFont) { // cache first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
    return;
  }
  // own files: network first (fresh when online), cache when offline
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
