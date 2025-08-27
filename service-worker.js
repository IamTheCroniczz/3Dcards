const CACHE_NAME = "3d-galeria-cache-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/script.js",
  "/templatemo-3d-coverflow-scripts.js",
  "/templatemo-3d-coverflow.css",
  "/images/icon-192.png",
  "/images/icon-512.png"
];

// Instala e adiciona arquivos no cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Ativa e limpa caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Intercepta requisições
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
