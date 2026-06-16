const CACHE_NAME = 'restaurant-pos';

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js'
];

// التثبيت
self.addEventListener('install', event => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

// التفعيل
self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

// استراتيجية: Network First
self.addEventListener('fetch', event => {

    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {

                const responseClone = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseClone);
                    });

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});