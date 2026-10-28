/* Python executes only here: a worker inside HashBin's opaque-origin sandbox (src/python-sandbox.js).
   It runs after src/python-core.js and the SDK prelude, which provides hashbinSandbox. */
const send = self.postMessage.bind(self);
let core;
const ready = (async () => {
  const start = performance.now();
  send({ type: 'status', text: 'Loading Python… (~12 MB on first visit)' });
  // Runtime bytes come through the editor's verified offline cache, not this sandbox's own fetches.
  const [{ loadPyodide }, asm] = await Promise.all(['pyodide.mjs', 'pyodide.asm.mjs'].map(file => hashbinSandbox.import(PYODIDE_URL + file)));
  const modules = ['runtime', 'turtle', 't256'];
  const [pyodide, ...sources] = await Promise.all([
    loadPyodide({ indexURL: PYODIDE_URL, createPyodideModule: asm.default }),
    ...modules.map(name => fetch(`py/${name}.py`).then(response => { if (!response.ok) throw Error(`${name}.py download failed`); return response.text(); }))
  ]);
  core = new PythonCore(pyodide, send);
  core.install(Object.fromEntries(modules.map((name, index) => [name, sources[index]])));
  harden(self);
  send({ type: 'ready', ms: performance.now() - start });
})().catch(error => { send({ type: 'fatal', error: String(error) }); throw error; });
self.onmessage = async ({ data }) => {
  try { await ready; await core.run(data); }
  catch (error) { send({ type: 'fatal', error: String(error), id: data.id }); }
};
