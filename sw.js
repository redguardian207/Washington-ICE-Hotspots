/* sw.js: lets the site install as an app and open without a connection.
   Site files: always try the network first (so updates show right away), fall back to the saved copy offline.
   Libraries and fonts from CDNs: use the saved copy, refresh it in the background.
   Anything else (Wikipedia, form posts): network only. */
const CACHE = 'wa-ice-v1', META = 'wa-ice-meta';
const SHELL = ['./', 'index.html', 'data.json', 'news.json', 'social.json', 'stories.json', 'school-board.json',
  'stories-widget.js', 'schools-widget.js', 'site-nav.js', 'motion.js', 'map3d.js', 'visuals.js', 'expand.js', 'app.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== META).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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

/* Alerts. The page turns them on (app.js) and stores the choice here, since a service worker can't read localStorage.
   checkNew() looks at data.json and shows a notification for any report it hasn't seen before.
   It runs when the app opens, and on Android/Chrome also in the background through periodic sync.
   Real push (OneSignal) is handled by OneSignal's own worker code once it is added. */
const metaGet = async (k) => { const r = await (await caches.open(META)).match('meta/' + k); return r ? r.json() : null; };
const metaSet = async (k, v) => (await caches.open(META)).put('meta/' + k, new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json' } }));

async function checkNew() {
  if (!(await metaGet('enabled')) || Notification.permission !== 'granted') return;
  let rows;
  try { rows = await (await fetch('data.json', { cache: 'no-cache' })).json(); } catch (e) { return; }
  if (!Array.isArray(rows)) return;
  const ids = rows.map((r) => r.id).filter(Boolean);
  const seen = await metaGet('seen');
  await metaSet('seen', ids);
  if (!seen) return; // first run: remember what's there, don't alert on old reports
  const old = new Set(seen), fresh = rows.filter((r) => r.id && !old.has(r.id));
  if (!fresh.length) return;
  const towns = [...new Set(fresh.map((r) => r.town).filter(Boolean))];
  const title = fresh.length === 1 ? 'New ICE report: ' + (fresh[0].town || 'Washington') : fresh.length + ' new ICE reports';
  const body = fresh.length === 1 ? [fresh[0].title, fresh[0].date, fresh[0].source_kind].filter(Boolean).join(' · ') : towns.slice(0, 6).join(', ');
  await self.registration.showNotification(title, { body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'wa-ice-new', renotify: true, data: { url: './#list' } });
}

self.addEventListener('message', (e) => {
  const m = e.data || {};
  if (m.type === 'alerts') e.waitUntil(metaSet('enabled', !!m.on).then(() => (m.on ? checkNew() : null)));
  else if (m.type === 'check') e.waitUntil(checkNew());
});
self.addEventListener('periodicsync', (e) => { if (e.tag === 'check-reports') e.waitUntil(checkNew()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url.startsWith(self.registration.scope));
    if (c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
