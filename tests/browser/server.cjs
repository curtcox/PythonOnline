const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../..');
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.png':'image/png'};
function createServer({mockPublish=false}={}){
let base,freshLabel='';
const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  let file;
  if (url.pathname === '/frame/v0.4.0') {
    const embedders = JSON.stringify([base]).replaceAll('"','&quot;');
    res.writeHead(200, {'Content-Type':'text/html', 'Content-Security-Policy':`default-src 'none'; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' https:; frame-ancestors ${base}`});
    res.end(`<!doctype html><meta charset="utf-8"><meta name="hashbin-embedders" content="${embedders}"><script src="/frame/v0.4.0.js"></script>`); return;
  }
  if (url.pathname === '/frame/v0.4.0.js') { res.writeHead(200,{'Content-Type':'text/javascript'}); res.end(fs.readFileSync(path.join(root,'tests/browser/fixtures/hosted-bootstrap.js'))); return; }
  if (url.pathname === '/__hashbin_sdk__.js') { res.writeHead(200,{'Content-Type':'text/javascript'}); res.end(fs.readFileSync(path.join(root,'tests/browser/fixtures/hashbin-sdk.mjs'))); return; }
  if (url.pathname.startsWith('/__256t__/')) file = path.join(root,'tests/fixtures/256t',path.basename(url.pathname));
  else if (url.pathname.startsWith('/__pyodide__/')) {
    const name = path.basename(url.pathname); file = [path.join(root,'node_modules/pyodide',name),path.join(root,'.pyodide-cache',name)].find(file=>fs.existsSync(file));
  } else file = path.join(root, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file || !file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
  let data = served(file, url);
  // The service worker only caches bytes matching the manifest, so it describes the rewritten files actually served.
  if (path.basename(file) === 'offline-assets.js' && path.dirname(file) === root) data = Buffer.from(testManifest());
  // GitHub Pages, jsDelivr and 256t.us all allow cross-origin reads; the opaque-origin sandbox depends on it.
  res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*'}); res.end(data);
});
function served(file, url = null) {
  let data = fs.readFileSync(file);
  if (/\.(?:js|mjs)$/.test(file) && !file.includes('node_modules')) data = Buffer.from(data.toString().replaceAll('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',base+'/__pyodide__/'));
  if (path.basename(file) === 'index.html' && url?.searchParams.has('hashbin-test')) data = Buffer.from(data.toString().replace(/name="hashbin-client-id" content="[^"]*"/,'name="hashbin-client-id" content="test-client"'));
  // WebKit does not match 'self' in the sandbox's inherited policy; production mirrors are https:, which it allows.
  if (path.basename(file) === 'index.html') data = Buffer.from(data.toString().replace("connect-src 'self' https:","connect-src 'self' https: "+base));
  if (path.basename(file) === 'python-sandbox.js') data = Buffer.from(data.toString().replace("runDomain = 'hashbin.app'", `runDomain = 'localhost:${new URL(base).port}'`));
  if (path.basename(file) === 'index.html') data = Buffer.from(data.toString().replace('https://a2eabd9ad8b904635accd7583e5241f96.hashbin.app', `http://a2eabd9ad8b904635accd7583e5241f96.localhost:${new URL(base).port}`));
  // Saved programs come from checked-in copies, as 256t.us serves them.
  if (path.basename(file) === 't256.py') data = Buffer.from(data.toString().replace("SERVERS = ['https://256t.us/', 'https://256t.org/']",`SERVERS = ['${base}/__256t__/']`));
  if (path.basename(file) === 'examples.js' && freshLabel) data = Buffer.from(data.toString().replace('"label": "Hello, Python"',`"label": "${freshLabel}"`));
  if (mockPublish&&file.endsWith('/src/hashbin/store.js')) data=Buffer.from(data.toString().replace('../../vendor/hashbin-sdk-v0.4.0.mjs',base+'/__hashbin_sdk__.js'));
  return data;
}
function testManifest() {
  delete require.cache[require.resolve('../../offline-assets.js')]; const manifest = require('../../offline-assets.js'), sha = data => require('node:crypto').createHash('sha256').update(data).digest('hex'), pyodide = base+'/__pyodide__/';
  const local = name => [path.join(root,'node_modules/pyodide',name),path.join(root,'.pyodide-cache',name)].find(file=>fs.existsSync(file));
  const assets = manifest.assets.map(asset => asset.startsWith(manifest.pyodide) ? pyodide + asset.slice(manifest.pyodide.length) : asset), hashes = {};
  // The test SDK replaces the vendored one, so it must be available offline too.
  if(mockPublish)assets.push('__hashbin_sdk__.js');
  for (const asset of assets) hashes[asset] = asset === '__hashbin_sdk__.js' ? sha(fs.readFileSync(path.join(root,'tests/browser/fixtures/hashbin-sdk.mjs'))) : asset.startsWith(pyodide) ? sha(fs.readFileSync(local(asset.slice(pyodide.length)))) : /^https:/.test(asset) ? manifest.hashes[asset] : sha(served(path.join(root,asset)));
  // A simulated deploy must get a different cache, just as update-offline does
  // in production. Reusing its version with changed hashes lets a waiting worker
  // overwrite the open editor's verified cache during the gallery update check.
  const version = manifest.version+'-fixture-'+sha(JSON.stringify(hashes)).slice(0,12);
  return 'const OfflineAssets = '+JSON.stringify({...manifest,version,pyodide,assets,hashes})+';\nif (typeof module !== "undefined") module.exports = OfflineAssets;\nelse globalThis.OfflineAssets = OfflineAssets;\n';
}
return {server,set freshLabel(value){freshLabel=value;},async start(port=process.env.PORT||0){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port;return base;}};
}
module.exports={createServer};
if(require.main===module)createServer().start().then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
