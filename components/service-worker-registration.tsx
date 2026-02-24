'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';

/**
 * Component to register service worker on mount
 * Place this in your root layout to enable chunk caching
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Disabled for Bolt.new hosting compatibility
    // Service Worker can cause issues with Bolt's auto-deployment
    // Re-enable only if deploying to traditional hosting (Vercel, Netlify)

    // Only register in production and NOT on Bolt.new
    const isBoltHosting = typeof window !== 'undefined' &&
      (window.location.hostname.includes('.bolt.new') ||
       window.location.hostname.includes('stackblitz.io'));

    if (process.env.NODE_ENV === 'production' && !isBoltHosting) {
      registerServiceWorker();
    }
  }, []);

  return null;
}
