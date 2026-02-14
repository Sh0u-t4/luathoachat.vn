/**
 * Register Service Worker for chunk caching and offline support
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, but old one still controlling
              console.log('[SW] New version available, will refresh on next visit');

              // Optionally notify user
              if (window.confirm('Có phiên bản mới. Tải lại trang để cập nhật?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });

    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] New service worker activated');
      window.location.reload();
    });
  });
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
    console.log('[SW] Unregistered');
  }
}

/**
 * Clear service worker cache
 */
export async function clearServiceWorkerCache() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.active) {
    registration.active.postMessage({ type: 'CLEAR_CACHE' });
    console.log('[SW] Cache clear requested');
  }
}
