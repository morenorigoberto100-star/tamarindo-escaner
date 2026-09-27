const CACHE="tamarindo-escaner-v83";

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

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached) return cached;

      return fetch(event.request)
        .then(resp=>{
          const copy=resp.clone();
          caches.open(CACHE)
            .then(cache=>cache.put(event.request,copy))
            .catch(()=>{});
          return resp;
        })
        .catch(()=>caches.match("./index.html"));
    })
  );
});
