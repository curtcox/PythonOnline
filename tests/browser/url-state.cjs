/* Real editor/URL/storage integration; Python execution is stubbed in this focused suite. */
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');
const { HashBinDocuments: D } = require('../../src/fragment-config.mjs');
const { ShareLinks: S } = require('../../src/fragment-config.mjs');
const LZ = require('../../src/fragment-config.mjs').LZString;
const examples = require('../../src/examples.js').catalog;
const root = path.resolve(__dirname, '../..'), base = 'http://localhost';
const work = (src, autorun = false) => ({ src, python: { stdin: 'shared input\n', autorun } });
const cid = text => { const data = Buffer.from(text), size = Buffer.alloc(6); size.writeUIntBE(data.length, 0, 6);
  return size.toString('base64url') + (data.length <= 64 ? data : require('node:crypto').createHash('sha512').update(data).digest()).toString('base64url'); };
const engine = process.env.BROWSER || 'chromium';
(async () => {
  const browser = await ({ chromium, firefox, webkit }[engine]).launch({ headless: true });
  try {
    const incoming = work('print(input())'), payload = D.serialize(incoming), remoteCID = cid(payload);
    const sample = examples.find(value => value.id === 'star');
    const cases = [
      [base + '/?run=0#' + encodeURIComponent(payload), incoming],
      [S.build({ url: base, ...incoming, compress: LZ.compressToEncodedURIComponent }).long, incoming],
      [S.build({ url: base, src: 'print("compressed")', compress: LZ.compressToEncodedURIComponent }).long,
        { src: 'print("compressed")', python: { stdin: '', autorun: true } }],
      [base + '/?run=0#' + cid('print("inline CID")'), { src: 'print("inline CID")', python: { stdin: '', autorun: true } }],
      [base + '/?run=0#' + remoteCID, incoming],
      [base + '/?example=star&run=0', { src: sample.src, python: { stdin: sample.stdin, autorun: true } }],
      [base + '/?run=0', { src: examples[0].src, python: { stdin: examples[0].stdin, autorun: true } }]
    ];
    for (const previous of [null, work('print("local user A")'), work('print("local user B")', true)]) {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url()), name = url.pathname;
        if (url.origin === 'https://256t.us') return route.fulfill({ status: name === '/' + remoteCID ? 200 : 404,
          body: payload, headers: { 'Access-Control-Allow-Origin': '*' } });
        if (url.origin !== base) return route.abort();
        let body;
        if (name === '/src/python-sandbox.js') body = 'globalThis.PythonSandbox={factory:()=>()=>({postMessage(){},terminate(){}})};';
        else if (name === '/src/offline-ui.mjs') body = '';
        else {
          const file = path.join(root, name === '/' ? 'index.html' : name);
          if (!file.startsWith(root + '/') || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
          body = fs.readFileSync(file);
        }
        return route.fulfill({ body, contentType: name === '/' ? 'text/html' : name.endsWith('.css') ? 'text/css' : name.endsWith('.json') ? 'application/json' : 'text/javascript' });
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('dialog', async dialog => { errors.push('Unexpected dialog: ' + dialog.message()); await dialog.dismiss(); });
      await page.goto(base + '/?run=0'); await page.waitForFunction(() => !!globalThis.PythonOnline);
      if (previous) await page.evaluate(value => localStorage.setItem('pythononline:work', JSON.stringify(value)), previous);
      const stored = await page.evaluate(() => localStorage.getItem('pythononline:work'));
      for (const [url, expected] of cases) {
        for (const reload of [false, true]) {
          if (reload) await page.reload(); else await page.goto(url);
          await page.waitForFunction(() => !!globalThis.PythonOnline);
          // goto() may be a fragment navigation; its remote CID fetch is asynchronous.
          await page.waitForFunction(value => JSON.stringify(PythonOnline.snapshot()) === JSON.stringify(value), expected);
          assert.deepEqual(await page.evaluate(() => PythonOnline.snapshot()), expected);
          if(new URL(url).searchParams.has('example'))assert.equal(new URL(page.url()).searchParams.has('example'),false);else assert.equal(page.url(),url);
          assert.equal(await page.evaluate(() => localStorage.getItem('pythononline:work')), stored);
          assert.equal(await page.locator('#persistent-home').isChecked(), false);
        }
      }
      // A failed URL remains visible, with an empty editor and an explicit error.
      for (const failed of [base + '/?doc=invalid', base + '/?example=missing', base + '/?run=0#' + cid('missing remote'.repeat(10))]) {
        await page.goto(failed); await page.waitForFunction(() => !!globalThis.PythonOnline);
        await page.waitForFunction(() => document.body.dataset.state === 'error');
        assert.equal(await page.evaluate(() => PythonOnline.snapshot().src), '');
        assert.notEqual(await page.locator('#status').innerText(), ''); assert.equal(page.url(), failed);
        assert.equal(await page.evaluate(() => localStorage.getItem('pythononline:work')), stored);
      }
      await page.goto(base + '/?run=0'); await page.waitForFunction(() => !!globalThis.PythonOnline);
      // Fragment navigation also replaces the document and clears an in-flight run.
      await page.evaluate(payload => { location.hash = encodeURIComponent(payload); }, payload);
      await page.waitForFunction(src => PythonOnline.snapshot().src === src, incoming.src);
      assert.deepEqual(await page.evaluate(() => PythonOnline.snapshot()), incoming);
      assert.equal(await page.evaluate(() => localStorage.getItem('pythononline:work')), stored);
      if (previous) {
        // Editing a linked program saves it, while preserving the prior local draft.
        await page.evaluate(() => PythonOnline.editor.setValue('print("edited link")', -1));
        await page.reload(); await page.waitForFunction(() => !!globalThis.PythonOnline);
        assert.deepEqual(await page.evaluate(() => PythonOnline.snapshot()), incoming);
        await page.locator('#more-toggle').click(); await page.locator('#resume-work').click();
        assert.equal(await page.locator('#saved-work option').count(), 2);
        await page.locator('#saved-work').selectOption('1'); await page.locator('#restore-work').click(); await page.locator('#fk-more-drawer .fk-close').click();
        assert.deepEqual(await page.evaluate(() => PythonOnline.snapshot()), previous);
        assert.equal(await page.locator('body').getAttribute('data-state'), 'idle');
        const restoredURL = page.url(); await page.reload(); await page.waitForFunction(() => !!globalThis.PythonOnline);
        assert.deepEqual(await page.evaluate(() => PythonOnline.snapshot()), previous);
        assert.equal(page.url(), restoredURL);
        await page.setViewportSize({ width: 375, height: 812 });
        await page.locator('#more-toggle').click(); await page.locator('#resume-work').click();
        assert.ok((await page.locator('#restore-work').boundingBox()).height >= 40);
        assert.equal(await page.locator('#saved-work').evaluate(element => getComputedStyle(element).fontSize), '16px');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
        await page.screenshot({ path: path.join(root, 'test-results', engine + '-draft-recovery.png') });
      }
      assert.deepEqual(errors, []); await context.close();
    }
    console.log(engine + ': program URLs are independent of saved drafts; recovery passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
