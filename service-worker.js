/* Atomic install: an incomplete cache never replaces a working offline version. */
importScripts('offline-assets.js');
const CACHE = OfflineAssets.version;
const absolute = asset => new URL(asset, self.registration.scope).href;
async function populate() {
  const existed = await caches.has(CACHE);
  const cache = await caches.open(CACHE);
  try {
    await Promise.all(OfflineAssets.assets.map(async asset => {
      const url = absolute(asset);
      let response;
      try { response = await fetch(url, { cache: 'reload' }); if (!response.ok) throw new Error('HTTP ' + response.status); }
      catch (error) {
        // The identical vendored copy keeps offline setup working when a CDN is blocked.
        if (!asset.startsWith('https://cdnjs.cloudflare.com/')) throw error;
        response = await fetch(absolute('vendor/lz-string.min.js'), { cache: 'reload' });
        if (!response.ok) throw new Error('Compression library unavailable.');
      }
      await cache.put(url, response);
    }));
  } catch (error) { if (!existed) await caches.delete(CACHE); throw error; }
}
const editorPaths = () => { const scope = new URL(self.registration.scope).pathname; return [scope, scope + 'index.html']; };
const isEditor = page => editorPaths().includes(new URL(page.url ?? page).pathname);
self.addEventListener('install', event => event.waitUntil((async () => {
  await populate();
  // Only an open editor holds work to protect; without one the update can take over at once.
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (!windows.some(isEditor)) await self.skipWaiting();
})()));
// The gallery and docs hold no editor work, so they read the network first and show each deploy.
async function readOnlyPage(event, url) {
  if (event.request.mode === 'navigate') return url.origin === self.location.origin && !isEditor(url);
  const client = event.clientId && await self.clients.get(event.clientId);
  return client?.type === 'window' && !isEditor(client);
}
self.addEventListener('activate', event => event.waitUntil((async () => {
  await self.clients.claim();
  // Older page clients can continue using their matching assets until they reload.
  const names = await caches.keys();
  for (const name of names) if (name.startsWith('pythononline-') && name !== CACHE) await caches.delete(name);
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const inScope = url.origin === self.location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname);
  const packageURL = url.href.startsWith(OfflineAssets.pyodide);
  if (!inScope && !packageURL && !OfflineAssets.assets.includes(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Query strings carry documents or version tags, never change the static bytes.
    const key = url.origin === self.location.origin ? url.origin + url.pathname : url.href;
    const navigation = event.request.mode === 'navigate';
    if (inScope && await readOnlyPage(event, url)) {
      try { return await fetch(event.request); }
      catch (error) { const cached = await cache.match(key); if (cached) return cached; throw error; }
    }
    let cached = await cache.match(key);
    if (!cached && navigation && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'))) cached = await cache.match(absolute('index.html'));
    if (cached) return cached;
    const response = await fetch(event.request);
    if (packageURL && response.ok) await cache.put(key, response.clone());
    return response;
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'cache-packages') { event.waitUntil(cachePackages(event.ports[0])); return; }
  if (event.data?.type === 'activate-update') { self.skipWaiting(); return; }
  if (!['offline-status', 'repair-offline'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'repair-offline') await populate();
      const cache = await caches.open(CACHE);
      const entries = await Promise.all(OfflineAssets.assets.map(asset => cache.match(absolute(asset))));
      event.ports[0]?.postMessage({ ready: entries.every(Boolean), version: CACHE });
    } catch (_) { event.ports[0]?.postMessage({ ready: false }); }
  })());
});

// Resolve package dependencies from the pinned lockfile, including the version-specific ABI paths.
async function cachePackages(port) {
  try {
    const cache = await caches.open(CACHE);
    const response = await cache.match(OfflineAssets.pyodide + 'pyodide-lock.json');
    const lock = await (response || await fetch(OfflineAssets.pyodide + 'pyodide-lock.json')).json();
    const selected = new Set();
    function add(name) {
      if (selected.has(name)) return;
      const pkg = lock.packages[name];
      if (!pkg) throw Error('Package not found: ' + name);
      selected.add(name); for (const dep of pkg.depends || []) add(dep);
    }
    for (const name of ['numpy', 'matplotlib', 'pandas', 'pillow', 'micropip']) add(name);
    let count = 0;
    for (const name of selected) {
      const url = new URL(lock.packages[name].file_name, OfflineAssets.pyodide).href;
      if (!await cache.match(url)) {
        const result = await fetch(url); if (!result.ok) throw Error('Could not download ' + name);
        await cache.put(url, result);
      }
      port?.postMessage({ text: `Saving packages: ${++count}/${selected.size} · ${name}` });
    }
    port?.postMessage({ done: true, text: 'Gallery packages available offline. PyPI installs require internet.' });
  } catch (error) { port?.postMessage({ done: true, text: 'Offline package setup failed: ' + error.message + '. Reconnect and retry.' }); }
}
