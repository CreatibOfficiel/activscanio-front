#!/usr/bin/env node

/**
 * Post-build script to append custom push notification handlers
 * to the generated service worker file.
 *
 * This script runs after `npm run build` to add our custom event listeners
 * for push notifications, notificationclick, and notificationclose events.
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw-custom.js');

const CUSTOM_HANDLERS = `
// Custom push notification handlers
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const title = data.title || 'Activscanio';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    silent: false,
    renotify: true,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée', event.notification.tag);
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;

try {
  // Check if service worker file exists
  if (!fs.existsSync(SW_PATH)) {
    console.log('⚠️  Service worker file not found at:', SW_PATH);
    process.exit(0);
  }

  // Read current service worker content
  let swContent = fs.readFileSync(SW_PATH, 'utf8');

  // Check if custom handlers are already present
  if (swContent.includes('Custom push notification handlers')) {
    console.log('✅ Custom push notification handlers already present in service worker');
    process.exit(0);
  }

  // Remove auto skipWaiting — we handle it manually via SKIP_WAITING message
  swContent = swContent.replace(/self\.skipWaiting\(\),?/g, '');

  // Append custom handlers
  swContent += CUSTOM_HANDLERS;
  fs.writeFileSync(SW_PATH, swContent, 'utf8');

  console.log('✅ Custom push notification handlers added to service worker');
} catch (error) {
  console.error('❌ Error adding custom handlers to service worker:', error.message);
  process.exit(1);
}
