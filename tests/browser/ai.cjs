const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {chromium,webkit,firefox}=require('playwright');
const fixture=require('./server.cjs').createServer({mockPublish:true});
(async()=>{const base=await fixture.start();const browser=await ({chromium,webkit,firefox}[process.env.BROWSER||'chromium']).launch();try{
 const page=await browser.newPage();await page.goto(base+'?run=0');await page.waitForFunction(()=>Boolean(PythonOnline.ai));
 const suite=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../ai-suite.json'),'utf8'));
 await page.exposeFunction('caseProgress',id=>console.log('References passed:',id));
 const result=await page.evaluate(async suite=>{const {parseSuite,validateReferences}=await import('./vendor/fragment-kit-v0.4.0/src/ai/index.js');for(const c of suite.cases){await validateReferences(parseSuite({...suite,cases:[c]},PythonOnline.ai.type),PythonOnline.ai.type);await window.caseProgress(c.id);}return suite.cases.length;},suite);assert.equal(result,25);console.log('25 sandbox-backed reference pairs passed');
 await page.evaluate(()=>{PythonOnline.editor.setValue('print("Hello")',-1);document.querySelector('#autorun').checked=true;window.aiRunCalls=[];const original=PythonOnline.client.run.bind(PythonOnline.client);PythonOnline.client.run=(...args)=>{window.aiRunCalls.push(args[0]);return original(...args);};});
 await page.locator('#ask-open').click();await page.getByLabel('Describe a change').fill('Change greeting');await page.getByRole('button',{name:'Copy prompt',exact:true}).click();await page.getByLabel('Paste model reply').fill(JSON.stringify({summary:'Greet',edits:[{find:'Hello',replace:'Hi'}]}));await page.getByRole('button',{name:'Review pasted reply'}).click();await page.getByRole('button',{name:'Accept change'}).click();
 assert.equal(await page.evaluate(()=>PythonOnline.editor.getValue()),'print("Hi")');await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>window.aiRunCalls.filter(src=>src==='print("Hi")').length),0);assert.equal(new URL(page.url()).searchParams.get('run'),'0');
 console.log('AI acceptance saved the edit and suppressed auto-run');
 await page.goto(new URL('/gallery.html',base).href);await page.getByLabel('What do you want to make?',{exact:true}).fill('sum');await page.getByRole('button',{name:'Find a starting point'}).click();await page.locator('.fk-ai-panel a').first().waitFor();assert.equal(await page.locator('#search').count(),1);assert.equal(await page.locator('#tag').count(),1);
 await page.goto(base+'?code=untrusted&state=untrusted');await page.waitForFunction(()=>document.getElementById('status').textContent.includes('original popup'));assert.equal(new URL(page.url()).searchParams.has('code'),false);
 console.log('Gallery chooser fallback and invalid callback handling passed');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}})();
