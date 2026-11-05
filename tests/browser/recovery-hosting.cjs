/* The registered hosted sandbox permits canonical, not the recovery parent. */
const assert=require('node:assert/strict'),{chromium,firefox,webkit}=require('playwright');
(async()=>{const fixture=require('./server.cjs').createServer(),base=await fixture.start(),engine=process.env.BROWSER||'chromium',browser=await({chromium,firefox,webkit}[engine]).launch();try{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),hosted=[];
 context.on('request',request=>{if(new URL(request.url()).hostname.endsWith('.hashbin.app'))hosted.push(request.url());});
 await context.route('https://curtcox.github.io/PythonOnline/**',async route=>{const url=new URL(route.request().url()),response=await context.request.get(base+'/'+url.pathname.slice('/PythonOnline/'.length)+url.search);await route.fulfill({response});});
 await context.addInitScript(()=>{if(window===window.top)try{localStorage.setItem('pythononline:persistent-home','true');}catch{}});
 await page.goto('https://curtcox.github.io/PythonOnline/?run=0');await page.waitForFunction(()=>!!globalThis.PythonOnline);
 await page.click('#more-toggle');assert.equal(await page.locator('#persistent-home').isDisabled(),true);assert.equal(await page.locator('#persistent-home').isChecked(),false);assert.match(await page.locator('#home-status').innerText(),/python.hashbin.page/);
 await page.evaluate(()=>{document.getElementById('autorun').checked=false;PythonOnline.editor.setValue('print("recovery handoff")',-1);document.getElementById('stdin').value='kept input\n';});
 const href=await page.locator('#persistent-home-site').evaluate(link=>{link.onclick();return link.href;});assert.equal(new URL(href).origin,'https://python.hashbin.page');const intent=require('../../src/fragment-config.mjs').urlState.parse(href);assert.equal(intent.doc.src,'print("recovery handoff")');assert.equal(intent.doc.python.stdin,'kept input\n');assert.equal(intent.run,false);assert.deepEqual(hosted,[]);
 console.log(engine+': recovery keeps opaque execution and carries source/input to canonical without enabling persistence');await context.close();
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}})().catch(error=>{console.error(error);process.exitCode=1;});
