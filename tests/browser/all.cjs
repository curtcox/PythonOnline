/* Real browser integration. Local mirror serves the exact pinned runtime during tests. */
const { chromium, firefox, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const http = require('node:http');
const root = path.resolve(__dirname, '../..');
let base;const fixture=require('./server.cjs').createServer({mockPublish:true}),server=fixture.server;
const engine = process.env.BROWSER || 'chromium';
const timeout = 120000;
(async()=>{
  base=await fixture.start();
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
  // Observe the app policy. Rich-output documents intentionally forbid scripts,
  // including data-URL test instrumentation in Firefox. Their empty sandbox and
  // refusal to execute user scripts are asserted separately below.
  await context.addInitScript(()=>{ if (self === top) addEventListener('securitypolicyviolation',event=>globalThis.__cspViolation?.(event.violatedDirective+' '+event.blockedURI+' '+location.pathname)); });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  // Opening a program URL must never require a replacement confirmation.
  await context.addInitScript(() => { window.confirm = () => { throw Error('Unexpected replacement confirmation'); }; });
  let phase = 'startup'; const checkpoint = text => { phase = text; console.log(text); };
  const errors = []; page.on('pageerror',error=>{ errors.push(String(error)); if (process.env.DEBUG) console.log('pageerror at', phase, String(error)); }); if (process.env.DEBUG) { page.on('console',m=>console.log('console:',m.text())); context.on('weberror',e=>console.log('weberror:',String(e.error()))); }
  async function ready() { await page.waitForFunction(()=>!!globalThis.PythonOnline); }
  async function preloadsReady() {
    // Going offline in the middle of an earlier preload cancels its in-flight
    // network requests in WebKit. Exercise an installed, settled app first;
    // the offline reload below still has to initialize a completely new worker.
    await page.waitForFunction(() => PythonOnline.client.active.ready &&
      (!PythonOnline.client.spare || PythonOnline.client.spare.ready), null, { timeout });
  }
  async function finished() { await page.waitForFunction(()=>['done','error','idle'].includes(document.body.dataset.state),null,{timeout}); }
  async function run(source,stdin='') {
    await page.evaluate(({source,stdin})=>{ document.getElementById('autorun').checked=false; PythonOnline.editor.setValue(source,-1); document.getElementById('stdin').value=stdin; PythonOnline.run(); },{source,stdin});
    await finished();
  }
  try {
    checkpoint('Checking default program');
    await page.goto(base); await ready(); await finished();
    assert.equal(await page.locator('body').getAttribute('data-state'),'done'); assert.match(await page.locator('#output').innerText(),/Hello, Ada/);
    await page.locator('#output .turtle-canvas svg').waitFor(); await page.getByRole('button',{name:'Skip animation',exact:true}).click();
    await page.locator('#download-open').click(); const drawing = page.waitForEvent('download'); await page.locator('#download-svg').click(); assert.equal((await drawing).suggestedFilename(),'drawing.svg'); await page.locator('[data-close="download-dialog"]').click();
    checkpoint('Checking live edits, input and security');
    // Live edits rerun after the debounce, and annotations point to the last user frame.
    await page.evaluate(()=>{ PythonOnline.editor.setValue('print("automatic edit")',-1); }); await page.waitForFunction(()=>document.getElementById('output').textContent.includes('automatic edit'));
    await run('print("before error")\n1 / 0'); assert.match(await page.locator('#status').innerText(),/line 2/); assert.equal(await page.evaluate(()=>PythonOnline.editor.session.getAnnotations()[0].row),1); assert.match(await page.locator('#output').innerText(),/before error/);
    await run('name=input("Name: ")\nprint("Hello",name)','Test\n'); assert.match(await page.locator('#output').innerText(),/Name: Test/);
    await run('import js\nprint(js.caches is None if hasattr(js,"caches") else True)\nprint(hasattr(js,"localStorage"))\nprint(js.indexedDB, js.importScripts, js.Worker)'); assert.match(await page.locator('#output').innerText(),/False/); assert.doesNotMatch(await page.locator('#output').innerText(),/CacheStorage|IDBFactory/);
    // Regression check for SN-2026-001: programs run in an opaque origin, apart from this app's storage.
    await run('import js\nprint("origin", js.self.origin)'); assert.match(await page.locator('#output').innerText(),/origin null/);
    assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('iframe[title="Code sandbox"]')].map(frame=>frame.getAttribute('sandbox')).filter(value=>value!=='allow-scripts')),[]);
    checkpoint('Checking hosted Python filesystem persistence and incoming-link isolation');
    await page.locator('#more-toggle').click();
    await page.locator('#persistent-home').check(); await page.locator('#fk-more-drawer .fk-close').click();
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
    // A locally enabled preference survives the bare homepage; every explicit document URL resets it.
    await page.evaluate(()=>history.replaceState(null,'','/?run=0')); await page.reload(); await ready();
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
    await page.locator('#more-toggle').click(); await page.locator('#persistent-home').check(); await page.locator('#fk-more-drawer .fk-close').click();
    await run('print("explicitly enabled again")');
    await page.evaluate(()=>{location.hash=encodeURIComponent(PythonOnline.snapshot().src);});
    await page.waitForFunction(()=>!document.getElementById('persistent-home').checked);
    await run('import js\nprint("fragment origin", js.self.origin)');
    assert.match(await page.locator('#output').innerText(),/fragment origin null/);
    await page.evaluate(()=>localStorage.removeItem('pythononline:persistent-home'));
    if (await page.locator('#fk-more-drawer').isVisible()) await page.locator('#fk-more-drawer .fk-close').click();
    checkpoint('Checking timeouts and Stop');
    // Auto-run timeout starts only once dependencies are ready; spare must recover.
    await page.evaluate(()=>{ PythonOnline.editor.setValue('while True: pass',-1); PythonOnline.run('auto'); }); await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Stopped after 5 s'));
    await run('print("recovered")'); assert.match(await page.locator('#output').innerText(),/recovered/);
    await page.evaluate(()=>{ PythonOnline.editor.setValue('while True: pass',-1); PythonOnline.run(); }); await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Running')); await page.locator('#stop').click(); assert.equal(await page.locator('#status').innerText(),'Stopped');
    checkpoint('Checking rich output');
    await run('display(HTML("<script>parent.hacked=true</script><b>safe table</b>"))\ndisplay(Markdown("# Heading\\n[bad](javascript:alert(1))"))');
    assert.equal(await page.locator('#output iframe').first().getAttribute('sandbox'),''); assert.equal(await page.evaluate(()=>globalThis.hacked),undefined); assert.equal(await page.locator('#output iframe').count(),2);
    checkpoint('Checking share links');
    await run('print(input())','shared input\n'); await page.locator('#share-open').click(); const shared = await page.locator('#share-link').inputValue();
    const other = await context.newPage(); await other.goto(shared); await other.waitForFunction(()=>!!globalThis.PythonOnline); assert.equal(await other.evaluate(()=>PythonOnline.snapshot().python.stdin),'shared input\n'); await other.close();
    await page.evaluate(()=>{ const original = globalThis.fetch; globalThis.fetch = (url, options) => String(url).startsWith('https://api.allorigins.win/') ? Promise.resolve(new Response(JSON.stringify({contents:'https://is.gd/test123'}),{headers:{'Content-Type':'application/json'}})) : original(url, options); }); await page.getByRole('button',{name:'Shorten link',exact:true}).click(); await page.waitForFunction(()=>document.getElementById('share-link').value==='https://is.gd/test123'); await page.locator('#share-dialog .fk-close').click();
    await page.locator('#qr-open').click(); assert.equal(await page.locator('#qr-code svg').count(),1); await page.locator('#qr-dialog .fk-close').click();
    assert.equal(await page.locator('meta[name="hashbin-client-id"]').getAttribute('content'),'app_2eabd9ad-8b90-4635-accd-7583e5241f96');
    await page.locator('#more-toggle').click(); await page.locator('#hashbin-save').click(); await page.waitForFunction(()=>document.getElementById('hashbin-confirm').textContent==='Review on HashBin' && !document.getElementById('hashbin-confirm').disabled); assert.match(await page.locator('#hashbin-message').innerText(),/approve the save on hashbin\.org/); await page.locator('#hashbin-dialog .fk-close').click(); await page.locator('#fk-more-drawer .fk-close').click();
    // A saved draft cannot veto a program URL, and remains available for recovery.
    const previousWork = await page.evaluate(()=>localStorage.getItem('pythononline:work'));
    const cidSource = Buffer.from('print("CID load")'); const inline = Buffer.from([0,0,0,0,0,cidSource.length]).toString('base64url')+cidSource.toString('base64url');
    await page.goto(base+'/#'+inline); await ready(); await page.waitForFunction(()=>document.getElementById('output').textContent.includes('CID load'));
    assert.equal(new URL(page.url()).hash,'#'+inline);
    assert.equal(await page.evaluate(()=>localStorage.getItem('pythononline:work')),previousWork);
    await page.reload(); await ready(); await page.waitForFunction(()=>document.getElementById('output').textContent.includes('CID load'));
    checkpoint('Checking matplotlib and pandas');
    // Rich figure capture, downloads, and DataFrame sandbox.
    await run('import matplotlib.pyplot as plt\nplt.plot([1,2,3])\nplt.show()'); assert.equal(await page.locator('body').getAttribute('data-state'),'done'); await page.locator('#output .figure-canvas svg').waitFor();
    await page.locator('#download-open').click(); const png = page.waitForEvent('download'); await page.locator('#download-png').click(); assert.equal((await png).suggestedFilename(),'image.png'); await page.locator('[data-close="download-dialog"]').click();
    await run('import pandas as pd\ndisplay(pd.DataFrame({"value":[1,2]}))'); await page.locator('#output iframe').waitFor();
    checkpoint('Checking gallery');
    await preloadsReady(); await page.goto(base+'/gallery.html'); assert.equal(await page.locator('#gallery article').count(),require('../../src/examples.js').catalog.length); await page.locator('#search').fill('snowflake'); assert.equal(await page.locator('#gallery article').count(),1);
    for (const id of ['shiny','gradio','microgpt','nanochat']) {
      await page.locator('#search').fill(id);
      assert.equal(await page.locator('#gallery article').count(),1);
      assert.equal(new URL(await page.locator('#gallery article a').getAttribute('href')).pathname,'/');assert.equal(require('../../src/fragment-config.mjs').urlState.parse(await page.locator('#gallery article a').getAttribute('href')).doc.src,require('../../src/examples.js').catalog.find(x=>x.id===id).src);
      await page.locator('#search').fill(''); await page.locator('#tag').selectOption(id === 'microgpt' ? 'transformer' : id === 'nanochat' ? 'language-model' : id);
      assert.equal(await page.locator('#gallery article').count(),1);
      await page.locator('#tag').selectOption('');
    }
    await page.goto(base+'/?example=microgpt'); await ready(); await finished();
    // Slow CI hosts may hit the documented auto-run cap; manual Run must still complete.
    if((await page.locator('#status').innerText()).startsWith('Stopped after 5 s')){await page.evaluate(()=>PythonOnline.run());await finished();}
    assert.equal(await page.locator('#autorun').isChecked(),true);
    assert.equal(await page.locator('body').getAttribute('data-state'),'done');
    assert.match(await page.locator('#output').innerText(),/Step  60: mean loss[\s\S]*Generated names/);
    await page.goto(base+'/?example=nanochat'); await ready(); await finished();
    // Slow CI hosts may hit the documented auto-run cap; manual Run must still complete.
    if((await page.locator('#status').innerText()).startsWith('Stopped after 5 s')){await page.evaluate(()=>PythonOnline.run());await finished();}
    assert.equal(await page.locator('#autorun').isChecked(),true);
    assert.equal(await page.locator('body').getAttribute('data-state'),'done');
    assert.match(await page.locator('#output').innerText(),/Pretraining loss:[\s\S]*Assistant loss:[\s\S]*Assistant: python is a programming language\./);
    await page.locator('#output .figure-canvas svg').waitFor();
    await page.goto(base+'/?example=256t-function&run=0'); await ready(); await page.evaluate(()=>PythonOnline.run()); await finished();
    assert.match(await page.locator('#output').innerText(),/roman\(2026\) = MMXXVI[\s\S]*Hello, Ada!/);
    {
      // Validate sample execution independently of the auto-run limit on slower CI hosts.
      // The default auto-run and its five-second timeout are exercised above.
      for (const sample of require('../../src/examples.js').catalog.filter(sample => process.env.FULL_GALLERY || ['shiny','gradio'].includes(sample.id))) {
        checkpoint('Checking gallery sample: '+sample.id);
        await preloadsReady();
        await page.goto(base+'/?example='+sample.id+'&run=0'); await ready();
        await page.evaluate(()=>PythonOnline.run()); await finished();
        assert.equal(await page.locator('body').getAttribute('data-state'),'done',sample.id+': '+await page.locator('#status').innerText()+'\n'+await page.locator('#output').innerText());
        if (sample.id === 'shiny') {
          assert.match(await page.locator('#output').innerText(),/Total: \$36[\s\S]*Total: \$60/);
          assert.equal(await page.locator('#output iframe').getAttribute('sandbox'),'');
          assert.match(await page.locator('#output iframe').getAttribute('srcdoc'),/<table>[\s\S]*\$36[\s\S]*\$60/);
        }
        if (sample.id === 'gradio') assert.match(await page.locator('#output').innerText(),/Hello, Ada![\s\S]*Hello, Grace!/);
      }
    }
    checkpoint('Checking HashBin Publish saves, legacy token revocation and stale-load protection');
    const authContext = await browser.newContext({serviceWorkers:'block'});
    const auth = await authContext.newPage(); auth.setDefaultTimeout(15000);
    const fullCID = text => { const data = Buffer.from(text), size = Buffer.alloc(6); size.writeUIntBE(data.length,0,6); return size.toString('base64url') + (data.length <= 64 ? data : require('node:crypto').createHash('sha512').update(data).digest()).toString('base64url'); };
    const docs = require('../../src/fragment-config.mjs').HashBinDocuments;
    await auth.goto(base+'/?hashbin-test=1&run=0'); await auth.waitForFunction(()=>!!globalThis.PythonOnline);
    await auth.evaluate(()=>sessionStorage.setItem('hashbin:tokens:test-client','{"refreshToken":"old"}')); await auth.reload(); await auth.waitForFunction(()=>!!globalThis.PythonOnline);
    await auth.waitForFunction(()=>localStorage.getItem('pythononline:test:revoked')==='yes' && !sessionStorage.getItem('hashbin:tokens:test-client'));
    const save = async () => { if (!await auth.locator('#hashbin-save').isVisible()) await auth.locator('#more-toggle').click(); await auth.locator('#hashbin-save').click(); await auth.waitForFunction(()=>document.getElementById('hashbin-confirm').textContent==='Review on HashBin' && !document.getElementById('hashbin-confirm').disabled); };
    await auth.evaluate(()=>{PythonOnline.editor.setValue('print("popup save")',-1);document.getElementById('stdin').value='saved input\n';document.getElementById('autorun').checked=false;});
    const popupCID = fullCID(docs.serialize(await auth.evaluate(()=>PythonOnline.snapshot())));
    await save(); await auth.locator('#hashbin-confirm').click(); await auth.waitForFunction(()=>document.getElementById('hashbin-status').textContent==='Saved to HashBin.');
    assert.equal(new URL(auth.url()).hash,'#'+popupCID); await auth.locator('#hashbin-dialog .fk-close').click();
    await auth.evaluate(()=>{localStorage.setItem('pythononline:test:publish','cancel');PythonOnline.editor.setValue('print("cancelled")',-1);}); await save(); await auth.locator('#hashbin-confirm').click();
    await auth.waitForFunction(()=>/cancelled on HashBin/.test(document.getElementById('hashbin-message').textContent)); await auth.locator('#hashbin-dialog .fk-close').click();
    await auth.evaluate(()=>{localStorage.setItem('pythononline:test:publish','redirect');PythonOnline.editor.setValue('print("redirect restored")',-1);});
    const before = await auth.evaluate(()=>PythonOnline.snapshot()), redirectCID = fullCID(docs.serialize(before));
    await save(); await Promise.all([auth.waitForURL('**#hashbin_publish=*'),auth.locator('#hashbin-confirm').click()]);
    await auth.waitForFunction(()=>!!globalThis.PythonOnline && document.getElementById('hashbin-status').textContent==='Saved to HashBin.');
    assert.deepEqual(await auth.evaluate(()=>PythonOnline.snapshot()),before); assert.equal(new URL(auth.url()).hash,'#'+redirectCID); await auth.evaluate(()=>localStorage.removeItem('pythononline:test:publish'));
    await auth.evaluate(()=>PythonOnline.editor.setValue('print("latest edit")',-1)); await auth.waitForFunction(()=>!location.hash);
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
    checkpoint('Checking mobile');
    // Mobile tabs, touch target sizes, no horizontal overflow.
    await page.setViewportSize({width:375,height:812}); await page.goto(base+'/?run=0'); await ready();
    await page.getByRole('tab',{name:'Code',exact:true}).click(); await page.locator('#editor').waitFor({state:'visible'}); await page.getByRole('tab',{name:/^Input/}).click(); await page.locator('#stdin').waitFor({state:'visible'});assert.ok((await page.locator('#stdin').boundingBox()).height>200);
    await page.locator('#more-toggle').click(); assert.ok(await page.locator('#fk-more-drawer').isVisible());await page.locator('#fk-more-drawer .fk-close').click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); assert.ok((await page.locator('#run').boundingBox()).height>=44);
    checkpoint('Checking offline');
    // Wait for atomic offline install, then disable all network and reload.
    await page.setViewportSize({width:1280,height:800}); await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout});
    await page.waitForFunction(()=>document.getElementById('offline-status').textContent==='Available offline',null,{timeout});
    // A sibling app on the same origin can write this app's Cache Storage; altered entries are never served.
    await page.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(name=>name.startsWith('pythononline-')&&!name.startsWith('pythononline-packages-')));await cache.put(new URL('src/traceback.js',location.href).href,new Response('globalThis.poisonedCache=true;',{headers:{'Content-Type':'text/javascript'}}));});
    checkpoint('Checking poisoned cache reload'); await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=resolve;registration.active.postMessage({type:'offline-status'},[channel.port2]);});}); await page.reload(); await ready(); assert.equal(await page.evaluate(()=>globalThis.poisonedCache),undefined);
    await page.locator('#more-toggle').click(); await page.locator('#offline-repair').click(); await page.locator('#fk-more-drawer .fk-close').click(); await page.waitForFunction(()=>document.getElementById('offline-status').textContent==='Available offline',null,{timeout});
    checkpoint('Checking offline worker reload'); await preloadsReady(); await context.setOffline(true); await page.reload(); await ready(); await run('print("offline success")'); assert.match(await page.locator('#output').innerText(),/offline success/); await context.setOffline(false);
    // The gallery reads a new deploy from the network while the editor keeps its cached version.
    const gallery = await context.newPage(); fixture.freshLabel = 'Hello, deployed Python';
    await gallery.goto(base+'/gallery.html'); assert.equal(await gallery.locator('.fk-gallery-card h2').first().textContent(),'Hello, deployed Python');
    // Offline it falls back to the cache. Firefox may answer from its HTTP cache first instead.
    await preloadsReady(); await context.setOffline(true); await gallery.reload(); assert.match(await gallery.locator('.fk-gallery-card h2').first().textContent(),engine === 'firefox' ? /^Hello, (?:deployed )?Python$/ : /^Hello, Python$/);
    await context.setOffline(false); await gallery.close(); fixture.freshLabel = '';
    await page.evaluate(()=>{const sample=PythonExamples.catalog[0];PythonOnline.editor.setValue(sample.src,-1);document.getElementById('stdin').value=sample.stdin;document.getElementById('stdin').dispatchEvent(new Event('input'));PythonOnline.run();}); await finished();
    await page.getByRole('button',{name:'Skip animation',exact:true}).click();
    await page.screenshot({path:path.join(root,'test-results',engine+'-desktop.png'),fullPage:true});
    await page.setViewportSize({width:375,height:812}); await page.getByRole('tab',{name:'Output',exact:true}).click();
    await page.screenshot({path:path.join(root,'test-results',engine+'-mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]); console.log(engine+': browser suite passed');
  } catch(error) {
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true}); await page.screenshot({path:path.join(root,'test-results',engine+'-failure.png'),fullPage:true}).catch(()=>{}); console.error('Status:',await page.locator('#status').textContent({timeout:1000}).catch(()=>'')); console.error('Output:',await page.locator('#output').innerText({timeout:1000}).catch(()=>'')); throw error;
  } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
