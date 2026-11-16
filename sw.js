// Daily Reps offline cache: show the saved copy right away, refresh it in the background.
const CACHE = 'dailyreps-v1';
const ASSETS = ['./', './index.html', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const net = fetch(req).then(async res => {
    if (res && res.ok) { const c = await caches.open(CACHE); await c.put(req, res.clone()); }
    return res;
  }).catch(() => null);
  e.waitUntil(net);
  e.respondWith((async () => {
    const cached = await caches.match(req, {ignoreSearch: true});
    if (cached) return cached;
    const res = await net;
    if (res) return res;
    return (await caches.match('./index.html')) || Response.error();
  })());
});
