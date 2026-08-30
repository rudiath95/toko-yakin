const CACHE = 'toko-yakin-v4';
const ASSETS = [
  './',
  'index.html',
  'dist/output.css',
  'favicon.ico',
  'manifest.json',
  'vendor/xlsx.full.min.js',
  'vendor/vue.global.prod.js',
  'src/db.js',
  'src/pricing.js',
  'src/store.js',
  'src/app.js',
  'src/components/QuantitySuggest.js',
  'src/components/ProductBrowser.js',
  'src/components/CartPanel.js',
  'src/components/SavedCartsModal.js',
  'src/components/CustomProductModal.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.url.startsWith(self.location.origin) || url.pathname.endsWith('.xlsx')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
