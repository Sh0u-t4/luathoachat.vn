// Service Worker for handling chunk load failures
const CACHE_VERSION = 'v1';
const CACHE_NAME = `luathoachat-${CACHE_VERSION}`;

// Files to cache on install
const STATIC_CACHE = [
  '/',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_CACHE);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache when possible, with fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // For JS chunks, use cache-first with network fallback
  if (request.url.includes('/_next/static/chunks/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[ServiceWorker] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache if not a success response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response (can only be used once)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              console.log('[ServiceWorker] Caching new chunk:', request.url);
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch((error) => {
            console.error('[ServiceWorker] Fetch failed for chunk:', request.url, error);
            // Try to serve from cache as last resort
            return caches.match(request);
          });
      })
    );
    return;
  }

  // For other requests, use network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request);
      })
  );
});

// Message event - handle commands from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[ServiceWorker] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});
