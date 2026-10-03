const VERSION='sibate-v1';
const STATIC=['/offline.html','/habitacion.png','/almuerzo.png','/icon-192.png','/icon-512.png','/manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sibate-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{
 if(event.data?.type==='CATALOG')event.waitUntil(caches.open(VERSION).then(cache=>cache.put('/offline-catalog.json',new Response(JSON.stringify({listings:event.data.listings,feeBps:event.data.feeBps,savedAt:new Date().toISOString()}),{headers:{'Content-Type':'application/json'}}))));
 if(event.data?.type==='CLEAR_CATALOG')event.waitUntil(caches.open(VERSION).then(cache=>cache.delete('/offline-catalog.json')));
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(url.origin!==self.location.origin||req.method!=='GET')return;
 if(url.pathname==='/offline-catalog.json'){event.respondWith(caches.open(VERSION).then(cache=>cache.match(req)).then(r=>r||new Response('{}',{headers:{'Content-Type':'application/json'}})));return;}
 if(url.pathname.startsWith('/api/')||/sign(in|out)-with-chatgpt|callback/.test(url.pathname))return;
 if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match('/offline.html')));return;}
 if(STATIC.includes(url.pathname)){event.respondWith(caches.match(req).then(r=>r||fetch(req)));}
});
