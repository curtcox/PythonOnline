/* Opt-in production acceptance; isolated browser storage, no uploads or account credentials. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const origin = 'https://a2eabd9ad8b904635accd7583e5241f96.hashbin.app';
const url = process.env.LIVE_BASE_URL || 'https://python.hashbin.page/?run=0';
(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    args: ['--disable-features=', ...(process.env.HOSTED_DNS_ADDRESS ?
      [`--host-resolver-rules=MAP *.hashbin.app ${process.env.HOSTED_DNS_ADDRESS}, MAP hashbin.app ${process.env.HOSTED_DNS_ADDRESS}`] : [])] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  const diagnostics = [];
  page.on('console', message => { if (message.type() === 'error') diagnostics.push(message.text()); });
  page.on('requestfailed', request => diagnostics.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) diagnostics.push(`${response.status()} ${response.url()}`); });
  const proof = path.resolve(__dirname, '../../test-results/live-hosted.png');
  fs.mkdirSync(path.dirname(proof), { recursive: true });
  const ready = () => page.waitForFunction(() => !!globalThis.PythonOnline);
  async function run(source) {
    await page.evaluate(source => {
      document.getElementById('autorun').checked = false;
      PythonOnline.editor.setValue(source, -1); PythonOnline.run();
    }, source);
    await page.waitForFunction(() => ['done', 'error'].includes(document.body.dataset.state), null, { timeout: 120000 });
    assert.equal(await page.locator('body').getAttribute('data-state'), 'done', await page.locator('#status').innerText());
    return page.locator('#output').innerText();
  }
  try {
    await page.goto(url); await ready();
    assert.equal(await page.locator('#persistent-home').isChecked(), false);
    assert.match(await run('import js\nprint("opaque", js.self.origin)'), /opaque null/);
    await page.locator('#more-toggle').click(); await page.locator('#persistent-home').check();
    await run('from pathlib import Path\nPath("live-pilot.txt").write_text("Live files survived")\nprint("Written on hashbin.app")');
    assert.match(await page.locator('#home-status').innerText(), /Files saved/);
    await page.evaluate(() => PythonOnline.client.stop());
    assert.match(await run('print(open("live-pilot.txt").read())'), /Live files survived/);
    await page.evaluate(()=>history.replaceState(null,'',location.pathname+'?run=0')); await page.reload(); await ready();
    assert.equal(await page.locator('#persistent-home').isChecked(), true);
    const output = await run('import js\nprint("origin", js.self.origin)\nprint(open("live-pilot.txt").read())\nprint("Editor DOM:", hasattr(js, "document"))\nprint("Editor storage:", hasattr(js, "localStorage"))');
    assert.ok(output.includes(origin), output);
    assert.match(output, /Live files survived/);
    assert.match(output, /Editor DOM: False/); assert.match(output, /Editor storage: False/);
    await page.locator('#more-toggle').click();
    await page.screenshot({ path: proof, fullPage: true });
    await page.goto(url + '#'+encodeURIComponent('print("linked code")')); await ready();
    assert.equal(await page.locator('#persistent-home').isChecked(), false);
    assert.match(await run('import js\nprint("linked", js.self.origin)'), /linked null/);
    assert.deepEqual(errors, []);
    // Cloudflare injects this beacon outside the checked-in application. Keep
    // the application policy strict and report its refusal separately.
    const beacon=diagnostics.filter(text=>text.includes('https://static.cloudflareinsights.com/beacon.min.js/'));
    assert.deepEqual(diagnostics.filter(text=>!beacon.includes(text)), [], 'Unexpected network or CSP failures');
    if(beacon.length)console.log('Host-injected Cloudflare analytics was blocked by the application CSP.');
    console.log('Live hosted persistence, reload, isolation and incoming-link guard passed. Proof:', proof);
  } catch (error) {
    console.error('Diagnostics:', diagnostics);
    console.error('Status:', await page.locator('#status').innerText().catch(() => ''));
    console.error('Output:', await page.locator('#output').innerText().catch(() => ''));
    await page.screenshot({ path: proof, fullPage: true }); throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
