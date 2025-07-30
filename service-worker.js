    const CACHE_NAME = 'fazazi-azkar-v1.0.2'; // Increment version on new deployments
    const APP_SHELL_URLS = [
        './', // The root of your app
        './index.html',
        './assets/styles/styles.css',
        './js/app.js',
        './js/prayer-times.js',
        './js/quran-recitation.js',
        './manifest.json',
        './favicon.ico',
        // Add all your core assets (icons, images, fonts) here
        './assets/icons/icon-72x72.png',
        './assets/icons/icon-96x96.png',
        './assets/icons/icon-128x128.png',
        './assets/icons/icon-144x144.png',
        './assets/icons/icon-152x152.png',
        './assets/icons/icon-192x192.png',
        './assets/icons/icon-384x384.png',
        './assets/icons/icon-512x512.png',
        './assets/icons/maskable-icon.png',
        './assets/images/fazazimedia-logo.png', // Your logo
        './assets/images/compass.png', // If you have a compass image, ensure this path is correct
        // External libraries you rely on heavily and want cached
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
        'https://unpkg.com/leaflet/dist/leaflet.css',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        'https://unpkg.com/leaflet/dist/leaflet.js',
        // Google Fonts (The CSS link is sufficient, direct font files can be problematic for addAll)
        'https://fonts.googleapis.com/css2?family=Amiri&family=Noto+Naskh+Arabic&family=Lateefah&family=Scheherazade+New&display=swap'
    ];

    // Install event: caches the app shell
    self.addEventListener('install', (event) => {
        console.log('[Service Worker] Installing...');
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    console.log('[Service Worker] Caching app shell');
                    return cache.addAll(APP_SHELL_URLS);
                })
                .catch(error => {
                    console.error('[Service Worker] Failed to cache app shell:', error);
                })
        );
    });

    // Activate event: cleans up old caches
    self.addEventListener('activate', (event) => {
        console.log('[Service Worker] Activating...');
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        );
        return self.clients.claim(); // Ensures the new service worker takes control immediately
    });

    // Fetch event: serves content from cache or network
    self.addEventListener('fetch', (event) => {
        // Only handle GET requests
        if (event.request.method !== 'GET') {
            return;
        }

        // Strategy: Cache-first for app shell, Network-falling-back-to-cache for others
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response because it's a stream and can only be consumed once
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // If network fails, and it's not in cache, return a fallback or handle offline
                        console.warn(`[Service Worker] Fetch failed for: ${event.request.url}. Returning offline fallback if available.`);
                        // You could return a specific offline page here if you have one
                        // return caches.match('/offline.html');
                        return new Response('<h1>You are offline!</h1>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
            })
        );
    });
