self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('envios-app-cache').then(function (cache) {
      return cache.addAll([
        '/index.html',
        '/styles.css',
        '/script.js',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        '/somos_de_aqui.pgn',
        '/logo_exprecar.svg'
      ]);
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

