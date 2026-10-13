// Service worker de AL BARRIL: deja la app disponible sin conexión.
// Si cambias el menú o el diseño y no se ve el cambio, sube el número de VERSION.
const VERSION = 'al-barril-v2';
const BASE = [
  './', 'index.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // La página: primero la red (así los cambios se ven al instante); sin red, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copia)); }
          return r;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Archivos propios (iconos, fotos) y tipografías de Google: primero la copia guardada.
  const esFuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin === location.origin || esFuente) {
    e.respondWith(
      caches.match(req).then(guardado => guardado || fetch(req).then(r => {
        if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
        return r;
      }))
    );
  }
});
