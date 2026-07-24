// =======================================================
// SERVICE WORKER CON AUTO-LIMPIEZA DE CACHÉ
// =======================================================
const CACHE_NAME = 'vchat-cache-v1.0.0'; // <--- CAMBIA ESTE NÚMERO EN CADA ACTUALIZACIÓN

// Archivos principales a guardar en memoria
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js'
];

// 1. INSTALACIÓN: Guarda los archivos en el nuevo caché
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Obliga al Service Worker nuevo a activarse sin esperar
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. ACTIVACIÓN: Elimina automáticamente todos los cachés viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Eliminando caché antiguo:', cache);
                        return caches.delete(cache); // Borra las versiones anteriores del teléfono
                    }
                })
            );
        }).then(() => self.clients.claim()) // Toma control de todas las ventanas abiertas
    );
});

// 3. INTERCEPCIÓN: Sirve los archivos desde la red o caché
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});