const CACHE="tamarindo-escaner-v84";

const CORE=[
  "./",
  "./index.html",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
  "https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE).then(async cache=>{
      for(const url of CORE){
        try{
          await cache.add(
            new Request(url,{
              mode:url.startsWith("http") ? "no-cors" : "same-origin"
            })
          );
        }catch(e){}
      }
    }).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const req = event.request;

  // Para la página principal: primero Internet, después caché.
  // Así siempre toma la versión nueva cuando hay conexión.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(cache => {
            cache.put("./index.html", copy);
          });
          return resp;
        })
        .catch(() =>
          caches.match("./index.html").then(cached => cached || caches.match("./"))
        )
    );
    return;
  }

  // Librerías y demás recursos: primero caché para conservar modo offline.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        return resp;
      });
    })
  );
});
