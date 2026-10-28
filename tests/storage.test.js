const test = require('node:test');
const assert = require('node:assert/strict');
const Home = require('../src/python-home.js');
const Preference = require('../src/python-storage.js');
const { harden } = require('../src/python-core.js');
const Client = require('../src/python-client.js');

test('persistence is local opt-in and incoming program URLs cannot enable it', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
  assert.equal(new Preference(storage, 'https://app.example/').enabled, false);
  const choice = new Preference(storage, 'https://app.example/'); choice.set(true);
  assert.equal(new Preference(storage, 'https://app.example/').enabled, true);
  for (const suffix of ['#code', '#hashbin_publish=callback', '?example=hello', '?compressed=x', '?doc=x', '?url=https://example.com']) {
    choice.set(true);
    const incoming = new Preference(storage, 'https://app.example/' + suffix);
    assert.equal(incoming.enabled, false, suffix);
    assert.equal(new Preference(storage, 'https://app.example/').enabled, false, 'Restoring linked source at the bare URL stays opaque');
    incoming.set(true); assert.equal(incoming.enabled, true);
    incoming.guardLink(); assert.equal(incoming.enabled, false);
    assert.equal(storage.getItem('pythononline:persistent-home'), 'false');
  }
  assert.equal(new Preference({ getItem() { throw Error('blocked'); } }, 'https://app.example/').enabled, false);
});

test('IDBFS restores before use and reports failed saves', async () => {
  const calls = [], FS = {
    filesystems: { IDBFS: 'idbfs' }, mkdirTree: directory => calls.push(['mkdir', directory]),
    mount: (type, options, directory) => calls.push(['mount', type, directory]),
    syncfs: (populate, callback) => { calls.push(['sync', populate]); callback(); }
  };
  const home = new Home({ FS }); await home.restore(); await home.save();
  assert.deepEqual(calls, [['mkdir', '/home/pyodide'], ['mount', 'idbfs', '/home/pyodide'], ['sync', true], ['sync', false]]);
  FS.syncfs = (_, callback) => callback(new Error('Quota exceeded'));
  await assert.rejects(home.save(), /Quota/);
  await assert.rejects(home.restore(), /Quota/);
});

test('hosted hardening retains only the required IndexedDB capability', () => {
  const indexedDB = {}, scope = Object.create({ indexedDB, caches: {}, Worker() {}, SharedWorker() {}, importScripts() {} });
  harden(scope, { persistent: true });
  assert.equal(scope.indexedDB, indexedDB);
  for (const name of ['caches', 'Worker', 'SharedWorker', 'importScripts']) assert.equal(scope[name], undefined);
});

test('persistent clients never preload stale filesystem snapshots and ignore disposed errors', () => {
  const workers = [], messages = [];
  const client = new Client({ persistent: true, lowMemory: false, createWorker() {
    const worker = { terminate() {}, postMessage() {} }; workers.push(worker); return worker;
  }, onMessage: item => messages.push(item) });
  workers[0].onmessage({ data: { type: 'ready' } });
  assert.equal(workers.length, 1); assert.equal(client.spare, undefined);
  client.stop(); assert.equal(workers.length, 2);
  client.dispose(); const count = messages.length;
  workers[1].onerror({ message: 'stale' }); assert.equal(messages.length, count);
});
