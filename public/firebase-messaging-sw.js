// Firebase messaging service worker - DISABLED
// This stub replaces the old Firebase push notification service worker.
// Firebase has been removed from this project.
// This file exists only to prevent 404 errors from cached browser registrations.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
