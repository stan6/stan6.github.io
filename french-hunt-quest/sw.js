const CACHE="fhq-v1";
const CORE=["./","./index.html","./styles.css","./data.js","./app.js","./manifest.webmanifest",
"./assets/app-icon.png","./assets/intro.png","./assets/find-treasure.png","./assets/learn-french.png","./assets/create-adventure.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
  }).catch(()=>cached)));
});