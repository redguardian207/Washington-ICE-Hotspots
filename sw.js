/* sw.js: lets the site install as an app and open without a connection.
   Site files: always try the network first (so updates show right away), fall back to the saved copy offline.
   Libraries and fonts from CDNs: use the saved copy, refresh it in the background.
   Anything else (Wikipedia, form posts): network only. */
const CACHE = 'wa-ice-v1';
const SHELL = ['./', 'index.html', 'data.json', 'news.json', 'social.json', 'stories.json', 'school-board.json',
  'stories-widget.js', 'schools-widget.js', 'site-nav.js', 'motion.js', 'map3d.js', 'visuals.js', 'expand.js', 'app.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
  } else if (CDN.test(req.url)) {
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
