/* Python executes only here. The main thread receives inert output data. */
// Pyodide 314 requires module workers. The shared core still exposes CommonJS for tests.
import './python-core.js';
const send = self.postMessage.bind(self);
let core;
const ready = (async () => {
  const start = performance.now();
  send({ type: 'status', text: 'Loading Python… (~12 MB on first visit)' });
  const { loadPyodide } = await import(PYODIDE_URL + 'pyodide.mjs');
  const [pyodide, runtime, turtle] = await Promise.all([
    loadPyodide({ indexURL: PYODIDE_URL }),
    fetch('py/runtime.py').then(response => { if (!response.ok) throw Error('Runtime download failed'); return response.text(); }),
    fetch('py/turtle.py').then(response => { if (!response.ok) throw Error('Turtle download failed'); return response.text(); })
  ]);
  core = new PythonCore(pyodide, send);
  core.install({ runtime, turtle });
  harden(self);
  send({ type: 'ready', ms: performance.now() - start });
})().catch(error => { send({ type: 'fatal', error: String(error) }); throw error; });
self.onmessage = async ({ data }) => {
  try { await ready; await core.run(data); }
  catch (error) { send({ type: 'fatal', error: String(error), id: data.id }); }
};
