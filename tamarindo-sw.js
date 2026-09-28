const CACHE="tamarindo-escaner-v85";

const CORE=[
 "./",
 "./index.html",
 "./tamarindo-catalogo.json",
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
       mode:url.startsWith("http")?"no-cors":"same-origin"
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
 if(event.request.method!=="GET")return;

 const req=event.request;
 const url=new URL(req.url);

 // Página principal y catálogo:
 // primero Internet y caché como respaldo offline.
 if(
  req.mode==="navigate" ||
  url.pathname.endsWith("/tamarindo-catalogo.json")
 ){
  event.respondWith(
   fetch(req)
    .then(resp=>{
     const copy=resp.clone();

     caches.open(CACHE).then(cache=>{
      const key=
       req.mode==="navigate"
        ? "./index.html"
        : "./tamarindo-catalogo.json";

      cache.put(key,copy);
     }).catch(()=>{});

     return resp;
    })
    .catch(()=>
     req.mode==="navigate"
      ? caches.match("./index.html")
         .then(cached=>cached||caches.match("./"))
      : caches.match("./tamarindo-catalogo.json")
    )
  );

  return;
 }

 // Librerías y demás recursos:
 // primero caché para conservar funcionamiento offline.
 event.respondWith(
  caches.match(req).then(cached=>{
   if(cached)return cached;

   return fetch(req).then(resp=>{
    const copy=resp.clone();

    caches.open(CACHE)
     .then(cache=>cache.put(req,copy))
     .catch(()=>{});

    return resp;
   });
  })
 );
});
