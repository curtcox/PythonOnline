const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('terminating a Python sandbox cancels only its pending runtime downloads', async () => {
  const requests = [], workers = [];
  const scope = { module: { exports: {} }, URL, AbortController, PYODIDE_URL: 'https://runtime.example/',
    fetch: async (url, options) => { requests.push(options); return new Response('runtime'); }, Response };
  vm.runInNewContext(fs.readFileSync('src/python-sandbox.js', 'utf8'), scope);
  const sandbox = scope.module.exports;
  sandbox.text = Promise.resolve('');
  const sdk = { createSandbox(options) { const worker = { terminate() { this.terminated = true; } }; workers.push({options, worker}); return worker; } };
  const create = sandbox.factory(sdk, { base: 'https://editor.example/src/' });
  const first = create(), second = create();
  await workers[0].options.fetch('https://runtime.example/pyodide.mjs', { credentials: 'omit' });
  await workers[1].options.fetch('https://runtime.example/pyodide.mjs', { credentials: 'omit' });
  first.terminate();
  assert.equal(first.terminated, true);
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(requests[1].signal.aborted, false);
  assert.equal(requests[0].credentials, 'omit');
  second.terminate();
});
