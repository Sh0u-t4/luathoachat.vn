'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';

/**
 * Component to register service worker on mount
 * Place this in your root layout to enable chunk caching
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return null;
}
