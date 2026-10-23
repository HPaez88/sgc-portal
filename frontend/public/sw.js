// Service worker mínimo: hace instalable el portal. No guarda datos ni API en caché;
// todo va siempre a la red para que nadie trabaje con información vieja.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
