const CACHE_NAME = 'gymtracker-v8';
const ASSETS_TO_CACHE = [
 './',
 './index.html',
 './anamnese.html',
 './styles.css',
 './app.js',
 './anamnese.js',
 './manifest.json',
 './icon-192.png',
 './icon-512.png',
 './exemplo-treino-abcd.json'
];

self.addEventListener('install', (event) => {
 event.waitUntil(
 caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
 );
 self.skipWaiting();
});

self.addEventListener('activate', (event) => {
 event.waitUntil(
 caches.keys().then((keys) =>
 Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
 )
 );
 self.clients.claim();
});

self.addEventListener('fetch', (event) => {
 event.respondWith(
 caches.match(event.request).then((cached) => cached || fetch(event.request))
 );
});






