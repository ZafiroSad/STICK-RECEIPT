/* Service worker: deja la herramienta funcionando sin conexión.
   Estrategia: red primero para el propio sitio (siempre la versión nueva si hay señal) y caché
   de respaldo. Subir VERSION al publicar cambios para renovar la caché. */
const VERSION = 'stickreceipt-v1.0.0';
const ARCHIVOS = [
  './', './index.html', './estilos.css', './manifest.json',
  './js/app.js', './js/almacen.js', './js/ajustes.js', './js/editor.js', './js/pdf.js', './js/ui.js', './js/util.js',
  './lib/jspdf.umd.min.js', './icon-192.png', './icon-512.png', './favicon.png', './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))),
  );
});
