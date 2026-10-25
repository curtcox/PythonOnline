/* Real browser integration. Local mirror serves the exact pinned runtime during tests. */
const { chromium, firefox, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const http = require('node:http');
const root = path.resolve(__dirname, '../..');
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.png':'image/png'};
let base;
const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  let file;
  if (url.pathname === '/__hashbin_sdk__.js') { res.writeHead(200,{'Content-Type':'text/javascript'}); res.end(fs.readFileSync(path.join(root,'tests/browser/fixtures/hashbin-sdk.mjs'))); return; }
  if (url.pathname.startsWith('/__pyodide__/')) {
    const name = path.basename(url.pathname); file = [path.join(root,'node_modules/pyodide',name),path.join(root,'.pyodide-cache',name)].find(file=>fs.existsSync(file));
  } else file = path.join(root, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file || !file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
  let data = fs.readFileSync(file);
  if (/\.(?:js|mjs)$/.test(file) && !file.includes('node_modules')) data = Buffer.from(data.toString().replaceAll('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',base+'/__pyodide__/'));
  if (path.basename(file) === 'index.html' && url.searchParams.has('hashbin-test')) data = Buffer.from(data.toString().replace(/name="hashbin-client-id" content="[^"]*"/,'name="hashbin-client-id" content="test-client"'));
  if (path.basename(file) === 'hashbin.js') data = Buffer.from(data.toString().replace('https://hashbin.org/sdk/hashbin.js',base+'/__hashbin_sdk__.js'));
  res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'}); res.end(data);
});
const engine = process.env.BROWSER || 'chromium';
const timeout = 120000;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); base = 'http://127.0.0.1:'+server.address().port;
  const browser = await ({chromium,firefox,webkit}[engine]).launch({ headless:true });
  const context = await browser.newContext({ acceptDownloads:true });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror',error=>errors.push(String(error)));
  async function ready() { await page.waitForFunction(()=>!!globalThis.PythonOnline); }
  async function finished() { await page.waitForFunction(()=>['done','error'].includes(document.body.dataset.state),null,{timeout}); }
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
    await page.locator('#more-toggle').click(); await page.locator('#hashbin-save').click(); await page.waitForFunction(()=>document.getElementById('hashbin-confirm').textContent==='Connect to HashBin' && !document.getElementById('hashbin-confirm').disabled); assert.match(await page.locator('#hashbin-message').innerText(),/Connect your HashBin account/); await page.locator('#hashbin-close').click();
    const cidSource = Buffer.from('print("CID load")'); const inline = Buffer.from([0,0,0,0,0,cidSource.length]).toString('base64url')+cidSource.toString('base64url'); await page.goto(base+'/#'+inline); await ready(); await page.waitForFunction(()=>document.getElementById('output').textContent.includes('CID load'));
    console.log('Checking matplotlib and pandas');
    // Rich figure capture, downloads, and DataFrame sandbox.
    await run('import matplotlib.pyplot as plt\nplt.plot([1,2,3])\nplt.show()'); assert.equal(await page.locator('body').getAttribute('data-state'),'done'); await page.locator('#output .figure-canvas svg').waitFor();
    await page.locator('#download-open').click(); const png = page.waitForEvent('download'); await page.locator('#download-png').click(); assert.equal((await png).suggestedFilename(),'image.png'); await page.locator('[data-close="download-dialog"]').click();
    await run('import pandas as pd\ndisplay(pd.DataFrame({"value":[1,2]}))'); await page.locator('#output iframe').waitFor();
    console.log('Checking gallery');
    await page.goto(base+'/gallery.html'); assert.equal(await page.locator('#gallery article').count(),21); await page.locator('#search').fill('snowflake'); assert.equal(await page.locator('#gallery article').count(),1);
    if (process.env.FULL_GALLERY) {
      for (const sample of require('../../src/examples.js').catalog) { await page.goto(base+'/?example='+sample.id); await ready(); await finished(); assert.equal(await page.locator('body').getAttribute('data-state'),'done',sample.id+': '+await page.locator('#output').innerText()); }
    }
    console.log('Checking HashBin OAuth, quote, save and stale-load protection');
    const authContext = await browser.newContext({serviceWorkers:'block'});
    const auth = await authContext.newPage(); auth.setDefaultTimeout(15000);
    const savedCID = Buffer.from([0,0,0,0,0,2]).toString('base64url') + Buffer.from('hi').toString('base64url');
    await auth.route('https://hashbin.org/api/**', route => {
      const pathname = new URL(route.request().url()).pathname;
      return route.fulfill({json:pathname.endsWith('/settings') ? {default_retention_months:2} : pathname.endsWith('/balance') ? {balance_cents:100} : pathname.endsWith('/calculate') ? {cost_cents:2} : {cid:savedCID}});
    });
    await auth.goto(base+'/?hashbin-test=1&run=0'); await auth.waitForFunction(()=>!!globalThis.PythonOnline);
    await auth.evaluate(()=>{PythonOnline.editor.setValue('print("OAuth restored")',-1);document.getElementById('stdin').value='saved input\n';document.getElementById('autorun').checked=false;});
    await auth.locator('#more-toggle').click(); await auth.locator('#hashbin-save').click();
    await auth.waitForFunction(()=>document.getElementById('hashbin-confirm').textContent==='Connect to HashBin' && !document.getElementById('hashbin-confirm').disabled);
    await Promise.all([auth.waitForNavigation(),auth.locator('#hashbin-confirm').click()]);
    await auth.waitForFunction(()=>document.getElementById('hashbin-status').textContent.startsWith('Connected to HashBin'));
    assert.equal(await auth.evaluate(()=>PythonOnline.snapshot().src),'print("OAuth restored")'); assert.equal(await auth.evaluate(()=>PythonOnline.snapshot().python.stdin),'saved input\n');
    await auth.locator('#more-toggle').click(); await auth.locator('#hashbin-save').click();
    await auth.waitForFunction(()=>document.getElementById('hashbin-message').textContent.includes('Cost: $0.02'));
    await auth.locator('#hashbin-confirm').click(); await auth.waitForFunction(()=>document.getElementById('hashbin-status').textContent==='Saved to HashBin.');
    assert.equal(new URL(auth.url()).hash,'#'+savedCID); await auth.locator('#hashbin-close').click();
    await auth.evaluate(()=>PythonOnline.editor.setValue('print("latest edit")',-1)); assert.ok(!new URL(auth.url()).hash);
    const largeCID = Buffer.from([0,0,0,0,0,100]).toString('base64url')+Buffer.alloc(64,1).toString('base64url');
    let resolveRoute; const intercepted = new Promise(resolve=>{resolveRoute=resolve;});
    await auth.route('https://256t.us/**',route=>resolveRoute(route));
    await auth.locator('#hashbin-cid').fill(largeCID); await auth.locator('#hashbin-load').click(); const delayedRoute=await intercepted;
    await auth.evaluate(()=>PythonOnline.editor.setValue('print("keep this edit")',-1));
    await delayedRoute.fulfill({body:'print("stale load")'});
    assert.equal(await auth.evaluate(()=>PythonOnline.editor.getValue()),'print("keep this edit")');
    await authContext.close();
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
    await context.setOffline(true); await page.reload(); await ready(); await run('print("offline success")'); assert.match(await page.locator('#output').innerText(),/offline success/); await context.setOffline(false);
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
