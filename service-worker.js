/* Atomic install: an incomplete cache never replaces a working offline version. */
importScripts('offline-assets.js');
const CACHE = OfflineAssets.version;
const absolute = asset => new URL(asset, self.registration.scope).href;
const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
const types = { html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', wasm: 'application/wasm', zip: 'application/zip', whl: 'application/zip', webmanifest: 'application/manifest+json' };
const type = url => types[/\.([a-z]+)$/.exec(new URL(url).pathname)?.[1]] || 'text/plain';
// Cache Storage is shared by every app on this origin, so bytes are checked against pinned hashes before they are stored or served.
async function verified(response, expected, url) {
  if (!response?.ok || !expected) return null;
  const body = await response.arrayBuffer();
  if (hex(await crypto.subtle.digest('SHA-256', body)) !== expected) return null;
  return new Response(body, { status: 200, headers: { 'Content-Type': type(url) } });
}
const assetHash = url => OfflineAssets.hashes[url] || (url.startsWith(self.registration.scope) ? OfflineAssets.hashes[url.slice(self.registration.scope.length)] : undefined);
// Package files are checked against the pinned lockfile, itself checked against the manifest.
let lockHashes;
async function packageHash(url) {
  if (!lockHashes) lockHashes = (async () => {
    const lockURL = OfflineAssets.pyodide + 'pyodide-lock.json', cache = await caches.open(CACHE);
    const lock = await verified(await cache.match(lockURL), assetHash(lockURL), lockURL) || await verified(await fetch(lockURL), assetHash(lockURL), lockURL);
    if (!lock) throw Error('Package lockfile did not match its pinned hash.');
    return new Map(Object.values((await lock.json()).packages).map(pkg => [new URL(pkg.file_name, OfflineAssets.pyodide).href, pkg.sha256]));
  })().catch(error => { lockHashes = null; throw error; });
  return (await lockHashes).get(url);
}
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
      const checked = await verified(response, assetHash(url), url);
      if (!checked) throw new Error('Offline download did not match its manifest: ' + asset);
      await cache.put(url, checked);
    }));
  } catch (error) { if (!existed) await caches.delete(CACHE); throw error; }
}
const editorPaths = () => { const scope = new URL(self.registration.scope).pathname; return [scope, scope + 'index.html']; };
const isEditor = url => editorPaths().includes(url.pathname);
self.addEventListener('install', event => event.waitUntil((async () => {
  await populate();
  // Only an open editor holds work to protect; without one the update can take over at once.
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (!windows.some(client => isEditor(new URL(client.url)))) await self.skipWaiting();
})()));
// The gallery and docs hold no editor work, so they read the network first and show each deploy.
// Their requests name the page as referrer; the editor and its Python worker never match.
function readOnlyPage(request, url) {
  if (request.mode === 'navigate') return !isEditor(url);
  if (!request.referrer.startsWith(self.location.origin + '/')) return false;
  const page = new URL(request.referrer);
  return page.pathname.endsWith('.html') && !isEditor(page);
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
    const indexPage = navigation && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
    const expected = assetHash(indexPage && !assetHash(key) ? absolute('index.html') : key) || (packageURL ? await packageHash(key).catch(() => null) : null);
    const cachedCopy = async () => {
      const entry = indexPage && !assetHash(key) ? absolute('index.html') : key;
      const checked = await verified(await cache.match(entry), expected, entry);
      // A missing or altered entry is never served; offline status reports it until repaired.
      if (!checked) await cache.delete(entry);
      return checked;
    };
    if (inScope && readOnlyPage(event.request, url)) {
      try { return await fetch(event.request); }
      catch (error) { const cached = await cachedCopy(); if (cached) return cached; throw error; }
    }
    const cached = await cachedCopy();
    if (cached) return cached;
    const response = await fetch(event.request);
    if (packageURL && expected && response.ok && !assetHash(key)) {
      const checked = await verified(response.clone(), expected, key);
      if (checked) await cache.put(key, checked);
    }
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
      const entries = await Promise.all(OfflineAssets.assets.map(async asset => verified(await cache.match(absolute(asset)), assetHash(absolute(asset)), absolute(asset))));
      event.ports[0]?.postMessage({ ready: entries.every(Boolean), version: CACHE });
    } catch (_) { event.ports[0]?.postMessage({ ready: false }); }
  })());
});

// Resolve package dependencies from the pinned lockfile, including the version-specific ABI paths.
async function cachePackages(port) {
  try {
    const cache = await caches.open(CACHE);
    const lockURL = OfflineAssets.pyodide + 'pyodide-lock.json';
    const response = await verified(await cache.match(lockURL), assetHash(lockURL), lockURL) || await verified(await fetch(lockURL), assetHash(lockURL), lockURL);
    if (!response) throw Error('Package lockfile did not match its pinned hash');
    const lock = await response.json();
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
      if (!await verified(await cache.match(url), lock.packages[name].sha256, url)) {
        const result = await verified(await fetch(url), lock.packages[name].sha256, url);
        if (!result) throw Error('Could not download a verified copy of ' + name);
        await cache.put(url, result);
      }
      port?.postMessage({ text: `Saving packages: ${++count}/${selected.size} · ${name}` });
    }
    port?.postMessage({ done: true, text: 'Gallery packages available offline. PyPI installs require internet.' });
  } catch (error) { port?.postMessage({ done: true, text: 'Offline package setup failed: ' + error.message + '. Reconnect and retry.' }); }
}
