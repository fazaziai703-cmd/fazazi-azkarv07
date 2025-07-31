const CACHE_NAME = 'azkar-fazazi-cache-v1.0.8';
const urlsToCache = [
  './', // Cache the root path
  'index.html',
  'manifest.json',
  'assets/styles/styles.css',
  'assets/icons/icon-192x192.png',
  'assets/icons/icon-512x512.png',
  'js/app.js',
  'js/prayer-times.js',
  'js/quran-recitation.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://fonts.gstatic.com/s/amiri/v26/J7afnFjKkToqWk3Pj8iHj5j_tL2F.woff2',
  'https://fonts.gstatic.com/s/notonaskharabic/v2/gok-H7xG_D2a_yv-15Qd-vj7d.woff2'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache app shell:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and can only be consumed once.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
