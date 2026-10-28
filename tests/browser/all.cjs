/* Real browser integration. Local mirror serves the exact pinned runtime during tests. */
const { chromium, firefox, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const http = require('node:http');
const root = path.resolve(__dirname, '../..');
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.png':'image/png'};
let base, freshLabel = '';
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
  if (path.basename(file) === 'hashbin.js') data = Buffer.from(data.toString().replace('../vendor/hashbin-sdk-v0.4.0.mjs',base+'/__hashbin_sdk__.js'));
  return data;
}
function testManifest() {
  const manifest = require('../../offline-assets.js'), sha = data => require('node:crypto').createHash('sha256').update(data).digest('hex'), pyodide = base+'/__pyodide__/';
  const local = name => [path.join(root,'node_modules/pyodide',name),path.join(root,'.pyodide-cache',name)].find(file=>fs.existsSync(file));
  const assets = manifest.assets.map(asset => asset.startsWith(manifest.pyodide) ? pyodide + asset.slice(manifest.pyodide.length) : asset), hashes = {};
  // The test SDK replaces the vendored one, so it must be available offline too.
  assets.push('__hashbin_sdk__.js');
  for (const asset of assets) hashes[asset] = asset === '__hashbin_sdk__.js' ? sha(fs.readFileSync(path.join(root,'tests/browser/fixtures/hashbin-sdk.mjs'))) : asset.startsWith(pyodide) ? sha(fs.readFileSync(local(asset.slice(pyodide.length)))) : /^https:/.test(asset) ? manifest.hashes[asset] : sha(served(path.join(root,asset)));
  return 'const OfflineAssets = '+JSON.stringify({...manifest,pyodide,assets,hashes})+';\nif (typeof module !== "undefined") module.exports = OfflineAssets;\nelse globalThis.OfflineAssets = OfflineAssets;\n';
}
const engine = process.env.BROWSER || 'chromium';
const timeout = 120000;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); base = 'http://127.0.0.1:'+server.address().port;
  const browser = await ({chromium,firefox,webkit}[engine]).launch({ headless:true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH} : {}) });
  const context = await browser.newContext({ acceptDownloads:true });
  if (engine === 'webkit') {
    await context.route(`http://a2eabd9ad8b904635accd7583e5241f96.localhost:${new URL(base).port}/**`, async route => {
      const url = new URL(route.request().url());
      const response = await context.request.get(base + url.pathname + url.search, {headers:{...route.request().headers(),host:url.host}});
      await route.fulfill({response});
    });
  }
  // The Content-Security-Policy must not block anything the app itself does.
  const violations = []; await context.exposeBinding('__cspViolation',(_,text)=>violations.push(text));
  await context.addInitScript(()=>addEventListener('securitypolicyviolation',event=>globalThis.__cspViolation?.(event.violatedDirective+' '+event.blockedURI+' '+location.pathname)));
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  // Make the app's synchronous replacement choice deterministic across page
  // navigations. Headless Chromium can dismiss a native dialog while changing
  // documents before Playwright can answer it. This is test-only; production
  // still uses the browser's native confirm and the warning text is asserted.
  await context.addInitScript(() => {
    window.confirm = message => {
      window.__replacementWarning = String(message);
      return localStorage.getItem('pythononline:test:replace') !== 'cancel';
    };
  });
  const errors = []; page.on('pageerror',error=>errors.push(String(error))); if (process.env.DEBUG) { page.on('console',m=>console.log('console:',m.text())); context.on('weberror',e=>console.log('weberror:',String(e.error()))); }
  async function ready() { await page.waitForFunction(()=>!!globalThis.PythonOnline); }
  async function finished() { await page.waitForFunction(()=>['done','error','idle'].includes(document.body.dataset.state),null,{timeout}); }
  async function run(source,stdin='') {
    await page.evaluate(({source,stdin})=>{ document.getElementById('autorun').checked=false; PythonOnline.editor.setValue(source,-1); document.getElementById('stdin').value=stdin; PythonOnline.run(); },{source,stdin});
    await finished();
  }
  try {
    console.log('Checking default program');
    await page.goto(base); await ready(); await finished();
    assert.equal(await page.locator('body').getAttribute('data-state'),'done'); assert.match(await page.locator('#output').innerText(),/Hello, Ada/);
    await page.locator('#output .turtle-canvas svg').waitFor(); await page.getByRole('button',{name:'Skip animation',exact:true}).click();
    await page.locator('#download-open').click(); const drawing = page.waitForEvent('download'); await page.locator('#download-svg').click(); assert.equal((await drawing).suggestedFilename(),'drawing.svg'); await page.locator('[data-close="download-dialog"]').click();
    console.log('Checking live edits, input and security');
    // Live edits rerun after the debounce, and annotations point to the last user frame.
    await page.evaluate(()=>{ PythonOnline.editor.setValue('print("automatic edit")',-1); }); await page.waitForFunction(()=>document.getElementById('output').textContent.includes('automatic edit'));
    await run('print("before error")\n1 / 0'); assert.match(await page.locator('#status').innerText(),/line 2/); assert.equal(await page.evaluate(()=>PythonOnline.editor.session.getAnnotations()[0].row),1); assert.match(await page.locator('#output').innerText(),/before error/);
    await run('name=input("Name: ")\nprint("Hello",name)','Test\n'); assert.match(await page.locator('#output').innerText(),/Name: Test/);
    await run('import js\nprint(js.caches is None if hasattr(js,"caches") else True)\nprint(hasattr(js,"localStorage"))\nprint(js.indexedDB, js.importScripts, js.Worker)'); assert.match(await page.locator('#output').innerText(),/False/); assert.doesNotMatch(await page.locator('#output').innerText(),/CacheStorage|IDBFactory/);
    // Regression check for SN-2026-001: programs run in an opaque origin, apart from this app's storage.
    await run('import js\nprint("origin", js.self.origin)'); assert.match(await page.locator('#output').innerText(),/origin null/);
    assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('iframe[title="Code sandbox"]')].map(frame=>frame.getAttribute('sandbox')).filter(value=>value!=='allow-scripts')),[]);
    console.log('Checking hosted Python filesystem persistence and incoming-link isolation');
    await page.locator('#more-toggle').click();
    await page.locator('#persistent-home').check();
    await run('from pathlib import Path\nPath("persistent-test.txt").write_text("files survive")\nprint("written")');
    assert.equal(await page.locator('body').getAttribute('data-state'),'done');
    assert.match(await page.locator('#home-status').innerText(),/Files saved/);
    await run('import js\nprint("hosted", js.self.origin)\nprint("editor DOM", hasattr(js, "document"), hasattr(js, "localStorage"))');
    assert.match(await page.locator('#output').innerText(),/hosted http:\/\/a2eabd9ad8b904635accd7583e5241f96\.localhost/);
    assert.match(await page.locator('#output').innerText(),/editor DOM False False/);
    assert.equal(await page.evaluate(()=>Boolean(PythonOnline.client.spare)),false);
    await page.evaluate(()=>PythonOnline.client.stop());
    await run('print(open("persistent-test.txt").read())');
    assert.match(await page.locator('#output').innerText(),/files survive/);
    await page.reload(); await ready();
    assert.equal(await page.locator('#persistent-home').isChecked(),true);
    await run('print(open("persistent-test.txt").read())');
    assert.match(await page.locator('#output').innerText(),/files survive/);
    const linkedSource = await page.evaluate(()=>PythonOnline.snapshot().src);
    await page.goto(base+'/?run=0#'+encodeURIComponent(linkedSource)); await ready();
    assert.equal(await page.locator('#persistent-home').isChecked(),false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('pythononline:persistent-home')),'false');
    await page.goto(base+'/?run=0'); await ready();
    assert.equal(await page.locator('#persistent-home').isChecked(),false);
    await run('import js\nprint("link origin", js.self.origin)');
    assert.match(await page.locator('#output').innerText(),/link origin null/);
    await page.locator('#more-toggle').click(); await page.locator('#persistent-home').check();
    await run('print("explicitly enabled again")');
    await page.evaluate(()=>{location.hash=encodeURIComponent(PythonOnline.snapshot().src);});
    await page.waitForFunction(()=>!document.getElementById('persistent-home').checked);
    await run('import js\nprint("fragment origin", js.self.origin)');
    assert.match(await page.locator('#output').innerText(),/fragment origin null/);
    await page.evaluate(()=>localStorage.removeItem('pythononline:persistent-home'));
    if (await page.locator('#persistent-home').isVisible()) await page.locator('#more-toggle').click();
    console.log('Checking timeouts and Stop');
    // Auto-run timeout starts only once dependencies are ready; spare must recover.
    await page.evaluate(()=>{ PythonOnline.editor.setValue('while True: pass',-1); PythonOnline.run('auto'); }); await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Stopped after 5 s'));
    await run('print("recovered")'); assert.match(await page.locator('#output').innerText(),/recovered/);
    await page.evaluate(()=>{ PythonOnline.editor.setValue('while True: pass',-1); PythonOnline.run(); }); await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Running')); await page.locator('#stop').click(); assert.equal(await page.locator('#status').innerText(),'Stopped');
    console.log('Checking rich output');
    await run('display(HTML("<script>parent.hacked=true</script><b>safe table</b>"))\ndisplay(Markdown("# Heading\\n[bad](javascript:alert(1))"))');
    assert.equal(await page.locator('#output iframe').first().getAttribute('sandbox'),''); assert.equal(await page.evaluate(()=>globalThis.hacked),undefined); assert.equal(await page.locator('#output iframe').count(),2);
    console.log('Checking share links');
    await run('print(input())','shared input\n'); await page.locator('#share-open').click(); const shared = await page.locator('#share-url').inputValue();
    const other = await context.newPage(); await other.goto(shared); await other.waitForFunction(()=>!!globalThis.PythonOnline); assert.equal(await other.evaluate(()=>PythonOnline.snapshot().python.stdin),'shared input\n'); await other.close();
    await page.evaluate(()=>{ const original = globalThis.fetch; globalThis.fetch = (url, options) => String(url).startsWith('https://api.allorigins.win/') ? Promise.resolve(new Response(JSON.stringify({contents:'https://is.gd/test123'}),{headers:{'Content-Type':'application/json'}})) : original(url, options); }); await page.locator('#shorten').click(); await page.waitForFunction(()=>document.getElementById('share-url').value==='https://is.gd/test123'); await page.locator('[data-close="share-dialog"]').click();
    await page.locator('#qr-open').click(); assert.equal(await page.locator('#qr-image svg').count(),1); await page.locator('[data-close="qr-dialog"]').click();
    assert.equal(await page.locator('meta[name="hashbin-client-id"]').getAttribute('content'),'app_2eabd9ad-8b90-4635-accd-7583e5241f96');
    await page.locator('#more-toggle').click(); await page.locator('#hashbin-save').click(); await page.waitForFunction(()=>document.getElementById('hashbin-confirm').textContent==='Review on HashBin' && !document.getElementById('hashbin-confirm').disabled); assert.match(await page.locator('#hashbin-message').innerText(),/approve the save on hashbin\.org/); await page.locator('#hashbin-close').click();
    // A link that would replace work kept in this browser asks first.
    const cidSource = Buffer.from('print("CID load")'); const inline = Buffer.from([0,0,0,0,0,cidSource.length]).toString('base64url')+cidSource.toString('base64url');
    await page.evaluate(()=>localStorage.setItem('pythononline:test:replace','cancel')); await page.goto(base+'/#'+inline); await page.waitForFunction(()=>!!globalThis.PythonOnline); await page.waitForTimeout(300); assert.equal(await page.evaluate(()=>PythonOnline.snapshot().src),'print(input())'); assert.ok(!page.url().includes(inline)); assert.match(await page.evaluate(()=>window.__replacementWarning),/Replace the program saved in this browser/);
    await page.evaluate(()=>localStorage.removeItem('pythononline:test:replace')); await page.goto(base+'/#'+inline); await ready(); await page.waitForFunction(()=>document.getElementById('output').textContent.includes('CID load'));
    console.log('Checking matplotlib and pandas');
    // Rich figure capture, downloads, and DataFrame sandbox.
    await run('import matplotlib.pyplot as plt\nplt.plot([1,2,3])\nplt.show()'); assert.equal(await page.locator('body').getAttribute('data-state'),'done'); await page.locator('#output .figure-canvas svg').waitFor();
    await page.locator('#download-open').click(); const png = page.waitForEvent('download'); await page.locator('#download-png').click(); assert.equal((await png).suggestedFilename(),'image.png'); await page.locator('[data-close="download-dialog"]').click();
    await run('import pandas as pd\ndisplay(pd.DataFrame({"value":[1,2]}))'); await page.locator('#output iframe').waitFor();
    console.log('Checking gallery');
    await page.goto(base+'/gallery.html'); assert.equal(await page.locator('#gallery article').count(),25); await page.locator('#search').fill('snowflake'); assert.equal(await page.locator('#gallery article').count(),1);
    await page.evaluate(()=>localStorage.removeItem('pythononline:test:replace')); await page.goto(base+'/?example=256t-function&run=0'); await ready(); await page.evaluate(()=>PythonOnline.run()); await finished();
    assert.match(await page.locator('#output').innerText(),/roman\(2026\) = MMXXVI[\s\S]*Hello, Ada!/);
    if (process.env.FULL_GALLERY) {
      // Validate sample execution independently of the auto-run limit on slower CI hosts.
      // The default auto-run and its five-second timeout are exercised above.
      for (const sample of require('../../src/examples.js').catalog) {
        console.log('Checking gallery sample: '+sample.id);
        await page.goto(base+'/?example='+sample.id+'&run=0'); await ready();
        await page.evaluate(()=>PythonOnline.run()); await finished();
        assert.equal(await page.locator('body').getAttribute('data-state'),'done',sample.id+': '+await page.locator('#status').innerText()+'\n'+await page.locator('#output').innerText());
      }
    }
    console.log('Checking HashBin Publish saves, legacy token revocation and stale-load protection');
    const authContext = await browser.newContext({serviceWorkers:'block'});
    const auth = await authContext.newPage(); auth.setDefaultTimeout(15000);
    const fullCID = text => { const data = Buffer.from(text), size = Buffer.alloc(6); size.writeUIntBE(data.length,0,6); return size.toString('base64url') + (data.length <= 64 ? data : require('node:crypto').createHash('sha512').update(data).digest()).toString('base64url'); };
    const docs = require('../../src/hashbin.js').HashBinDocuments;
    await auth.goto(base+'/?hashbin-test=1&run=0'); await auth.waitForFunction(()=>!!globalThis.PythonOnline);
    await auth.evaluate(()=>sessionStorage.setItem('hashbin:tokens:test-client','{"refreshToken":"old"}')); await auth.reload(); await auth.waitForFunction(()=>!!globalThis.PythonOnline);
    await auth.waitForFunction(()=>localStorage.getItem('pythononline:test:revoked')==='yes' && !sessionStorage.getItem('hashbin:tokens:test-client'));
    const save = async () => { if (!await auth.locator('#hashbin-save').isVisible()) await auth.locator('#more-toggle').click(); await auth.locator('#hashbin-save').click(); await auth.waitForFunction(()=>document.getElementById('hashbin-confirm').textContent==='Review on HashBin' && !document.getElementById('hashbin-confirm').disabled); };
    await auth.evaluate(()=>{PythonOnline.editor.setValue('print("popup save")',-1);document.getElementById('stdin').value='saved input\n';document.getElementById('autorun').checked=false;});
    const popupCID = fullCID(docs.serialize(await auth.evaluate(()=>PythonOnline.snapshot())));
    await save(); await auth.locator('#hashbin-confirm').click(); await auth.waitForFunction(()=>document.getElementById('hashbin-status').textContent==='Saved to HashBin.');
    assert.equal(new URL(auth.url()).hash,'#'+popupCID); await auth.locator('#hashbin-close').click();
    await auth.evaluate(()=>{localStorage.setItem('pythononline:test:publish','cancel');PythonOnline.editor.setValue('print("cancelled")',-1);}); await save(); await auth.locator('#hashbin-confirm').click();
    await auth.waitForFunction(()=>/cancelled on HashBin/.test(document.getElementById('hashbin-message').textContent)); await auth.locator('#hashbin-close').click();
    await auth.evaluate(()=>{localStorage.setItem('pythononline:test:publish','redirect');PythonOnline.editor.setValue('print("redirect restored")',-1);});
    const before = await auth.evaluate(()=>PythonOnline.snapshot()), redirectCID = fullCID(docs.serialize(before));
    await save(); await Promise.all([auth.waitForURL('**#hashbin_publish=*'),auth.locator('#hashbin-confirm').click()]);
    await auth.waitForFunction(()=>!!globalThis.PythonOnline && document.getElementById('hashbin-status').textContent==='Saved to HashBin.');
    assert.deepEqual(await auth.evaluate(()=>PythonOnline.snapshot()),before); assert.equal(new URL(auth.url()).hash,'#'+redirectCID); await auth.evaluate(()=>localStorage.removeItem('pythononline:test:publish'));
    await auth.evaluate(()=>PythonOnline.editor.setValue('print("latest edit")',-1)); assert.ok(!new URL(auth.url()).hash);
    const largeCID = Buffer.from([0,0,0,0,0,100]).toString('base64url')+Buffer.alloc(64,1).toString('base64url');
    let resolveRoute; const intercepted = new Promise(resolve=>{resolveRoute=resolve;});
    await auth.route('https://256t.us/**',route=>resolveRoute(route));
    if (!await auth.locator('#hashbin-cid').isVisible()) await auth.locator('#more-toggle').click();
    await auth.locator('#hashbin-cid').fill(largeCID); await auth.locator('#hashbin-load').click(); const delayedRoute=await intercepted;
    await auth.evaluate(()=>PythonOnline.editor.setValue('print("keep this edit")',-1));
    await delayedRoute.fulfill({body:'print("stale load")'});
    assert.equal(await auth.evaluate(()=>PythonOnline.editor.getValue()),'print("keep this edit")');
    await authContext.close();
    await page.evaluate(()=>{const script=document.createElement('script');script.src='https://example.invalid/injected.js';document.head.append(script);});
    await new Promise(resolve=>{const wait=()=>violations.some(v=>v.includes('example.invalid'))?resolve():setTimeout(wait,50);wait();});
    assert.deepEqual(violations.filter(v=>!v.includes('example.invalid')),[],'Content-Security-Policy violations');
    console.log('Checking mobile');
    // Mobile tabs, touch target sizes, no horizontal overflow.
    await page.setViewportSize({width:375,height:812}); await page.goto(base+'/?run=0'); await ready();
    await page.getByRole('button',{name:'Code',exact:true}).click(); await page.locator('#editor').waitFor({state:'visible'}); await page.getByRole('button',{name:/^Input/}).click(); await page.locator('#stdin').waitFor({state:'visible'});
    await page.locator('#more-toggle').click(); assert.ok(await page.locator('.mobile-actions').isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); assert.ok((await page.locator('#run').boundingBox()).height>=40);
    console.log('Checking offline');
    // Wait for atomic offline install, then disable all network and reload.
    await page.setViewportSize({width:1280,height:800}); await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout});
    await page.waitForFunction(()=>document.getElementById('offline-status').textContent==='Available offline',null,{timeout});
    // A sibling app on the same origin can write this app's Cache Storage; altered entries are never served.
    await page.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(name=>name.startsWith('pythononline-')));await cache.put(new URL('src/qr.js',location.href).href,new Response('globalThis.poisonedCache=true;',{headers:{'Content-Type':'text/javascript'}}));});
    await page.reload(); await ready(); assert.equal(await page.evaluate(()=>globalThis.poisonedCache),undefined);
    await page.waitForFunction(()=>document.getElementById('offline-status').textContent==='Offline setup incomplete',null,{timeout}); await page.locator('#offline-action').click(); await page.waitForFunction(()=>document.getElementById('offline-status').textContent==='Available offline',null,{timeout});
    await context.setOffline(true); await page.reload(); await ready(); await run('print("offline success")'); assert.match(await page.locator('#output').innerText(),/offline success/); await context.setOffline(false);
    // The gallery reads a new deploy from the network while the editor keeps its cached version.
    const gallery = await context.newPage(); freshLabel = 'Hello, deployed Python';
    await gallery.goto(base+'/gallery.html'); assert.equal(await gallery.locator('.card h2').first().textContent(),freshLabel);
    // Offline it falls back to the cache. Firefox may answer from its HTTP cache first instead.
    await context.setOffline(true); await gallery.reload(); assert.match(await gallery.locator('.card h2').first().textContent(),engine === 'firefox' ? /^Hello, (?:deployed )?Python$/ : /^Hello, Python$/);
    await context.setOffline(false); await gallery.close(); freshLabel = '';
    await page.evaluate(()=>{const sample=PythonExamples.catalog[0];PythonOnline.editor.setValue(sample.src,-1);document.getElementById('stdin').value=sample.stdin;document.getElementById('stdin').dispatchEvent(new Event('input'));PythonOnline.run();}); await finished();
    await page.getByRole('button',{name:'Skip animation',exact:true}).click();
    await page.screenshot({path:path.join(root,'test-results',engine+'-desktop.png'),fullPage:true});
    await page.setViewportSize({width:375,height:812}); await page.getByRole('button',{name:'Output',exact:true}).click();
    await page.screenshot({path:path.join(root,'test-results',engine+'-mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]); console.log(engine+': browser suite passed');
  } catch(error) {
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true}); await page.screenshot({path:path.join(root,'test-results',engine+'-failure.png'),fullPage:true}).catch(()=>{}); console.error('Status:',await page.locator('#status').textContent({timeout:1000}).catch(()=>'')); console.error('Output:',await page.locator('#output').innerText({timeout:1000}).catch(()=>'')); throw error;
  } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
