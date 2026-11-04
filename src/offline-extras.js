/* Pyodide lockfile/package policy belongs to this consumer, outside app readiness. */
(() => {
const packageCache='pythononline-packages-v1',absolute=name=>new URL(name,self.registration.scope).href;
const verified=HashBinCache.verify,assetHash=HashBinCache.lookup(OfflineAssets.hashes,self.registration.scope);
let lockPromise;
function pinnedLock(){
  if(!lockPromise)lockPromise=(async()=>{
    const url=OfflineAssets.pyodide+'pyodide-lock.json',cache=await caches.open(OfflineAssets.version);
    const response=await verified(await cache.match(url),assetHash(url),url)||await verified(await fetch(url),assetHash(url),url);
    if(!response)throw Error('Package lockfile did not match its pinned hash.');
    return {lock:await response.clone().json(),hashes:await HashBinCache.lockfileHashes(response,OfflineAssets.pyodide)};
  })().catch(error=>{lockPromise=null;throw error;});
  return lockPromise;
}
// Retain only verified package bytes from pre-migration all-in-one caches.
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const names=(await caches.keys()).filter(name=>name.startsWith('pythononline-')&&name!==packageCache);
  // The new main cache may not yet exist: find a verified lock in an old cache first.
  const lockURL=OfflineAssets.pyodide+'pyodide-lock.json';let lock;
  for(const name of names){lock=await verified(await(await caches.open(name)).match(lockURL),assetHash(lockURL),lockURL);if(lock)break;}
  if(!lock)return;
  const hashes=await HashBinCache.lockfileHashes(lock,OfflineAssets.pyodide),destination=await caches.open(packageCache);
  for(const[url,hash]of hashes){
    if(await verified(await destination.match(url),hash,url))continue;
    for(const name of names){const response=await verified(await(await caches.open(name)).match(url),hash,url);if(response){await destination.put(url,response);break;}}
  }
})()));
const isEditor=url=>[new URL(self.registration.scope).pathname,new URL(self.registration.scope).pathname+'index.html'].includes(url.pathname);
function readOnly(request,url){
  if(request.mode==='navigate')return !isEditor(url);
  if(!request.referrer.startsWith(self.location.origin+'/'))return false;
  const page=new URL(request.referrer);return page.pathname.endsWith('.html')&&!isEditor(page);
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),key=url.origin===self.location.origin?url.origin+url.pathname:url.href;
  if(key===absolute('offline-assets.js')){
    event.respondWith(new Response('globalThis.OfflineAssets='+JSON.stringify(OfflineAssets)+';',{headers:{'Content-Type':'text/javascript'}}));return;
  }
  // Read-only pages may follow a new deploy without replacing an open editor.
  if(url.origin===self.location.origin&&assetHash(key)&&readOnly(event.request,url)){
    event.stopImmediatePropagation();
    event.respondWith((async()=>{
      try{return await fetch(event.request);}catch(error){
        const cache=await caches.open(OfflineAssets.version),response=await verified(await cache.match(key),assetHash(key),key);
        if(response)return response;throw error;
      }
    })());return;
  }
  if(!url.href.startsWith(OfflineAssets.pyodide)||assetHash(key))return;
  event.respondWith((async()=>{
    const {hashes}=await pinnedLock(),hash=hashes.get(key);if(!hash)return fetch(event.request);
    const cache=await caches.open(packageCache),cached=await verified(await cache.match(key),hash,key);
    if(cached)return cached;await cache.delete(key);
    const response=await fetch(event.request),checked=await verified(response.clone(),hash,key);
    if(checked){await cache.put(key,checked.clone());return checked;}
    return response; // Mismatched rebuilt packages may execute online, never enter a pinned cache.
  })());
});
self.FragmentKitOfflineConfig={extraCaches:[packageCache],onMessage(event){
  if(event.data?.type!=='cache-packages')return;
  return(async()=>{
    const port=event.ports[0];
    try{
      const {lock}=await pinnedLock(),cache=await caches.open(packageCache),selected=new Set();
      function add(name){if(selected.has(name))return;const pkg=lock.packages[name];if(!pkg)throw Error('Package not found: '+name);selected.add(name);for(const dep of pkg.depends||[])add(dep);}
      for(const name of ['numpy','matplotlib','pandas','pillow','micropip'])add(name);
      let count=0;
      for(const name of selected){const pkg=lock.packages[name],url=new URL(pkg.file_name,OfflineAssets.pyodide).href;
        if(!await verified(await cache.match(url),pkg.sha256,url)){
          const response=await verified(await fetch(url),pkg.sha256,url);if(!response)throw Error('Could not download a verified copy of '+name);await cache.put(url,response);
        }
        port?.postMessage({text:`Saving packages: ${++count}/${selected.size} · ${name}`});
      }
      port?.postMessage({done:true,text:'Gallery packages available offline. PyPI installs require internet.'});
    }catch(error){port?.postMessage({done:true,text:'Offline package setup failed: '+error.message+'. Reconnect and retry.'});}
  })();
}};
})();
