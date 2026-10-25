/** Shared by the browser worker, Node integration tests and gallery renderer. */
(() => {
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
class OutputBuffer {
  constructor(emit, { maxBytes = 1024 * 1024, maxLines = 20000, now = () => Date.now() } = {}) {
    Object.assign(this, { emit, maxBytes, maxLines, now });
    this.bytes = this.lines = 0; this.pending = ''; this.last = now();
  }
  push(item) {
    if (item.type === 'flush') { this.flush(); return; }
    if (item.type !== 'text') { this.flush(); this.emit(item); return; }
    if (this.truncated) return;
    const remainingLines = this.maxLines - this.lines;
    let text = String(item.text).split('\n').slice(0, remainingLines + 1).join('\n');
    const bytes = new TextEncoder().encode(text);
    if (bytes.length > this.maxBytes - this.bytes) text = new TextDecoder().decode(bytes.slice(0, Math.max(0, this.maxBytes - this.bytes)));
    if (this.stream !== item.stream) this.flush();
    this.stream = item.stream; this.pending += text;
    this.bytes += new TextEncoder().encode(text).length; this.lines += (text.match(/\n/g) || []).length;
    if (text.length !== String(item.text).length || this.bytes >= this.maxBytes || this.lines >= this.maxLines) {
      this.truncated = true; this.pending += '\n… output truncated\n';
    }
    if (this.pending.length >= 8192 || this.now() - this.last >= 50 || this.truncated || (!this.sentText && this.pending.includes('\n'))) this.flush();
  }
  flush() {
    if (this.pending) this.emit({ type: 'text', text: this.pending, stream: this.stream || 'stdout' });
    if (this.pending) this.sentText = true;
    this.pending = ''; this.last = this.now();
  }
}
function harden(scope = globalThis) {
  // Remove inherited getters too; shadowing alone leaves prototype getter bypasses.
  // Nested workers would create a fresh realm with the storage APIs restored.
  for (const key of ['caches', 'indexedDB', 'importScripts', 'Worker', 'SharedWorker']) {
    for (let prototype = Object.getPrototypeOf(scope); prototype; prototype = Object.getPrototypeOf(prototype)) {
      if (Object.getOwnPropertyDescriptor(prototype, key)?.configurable) delete prototype[key];
    }
    Object.defineProperty(scope, key, { value: undefined, configurable: false, writable: false });
  }
}
class PythonCore {
  constructor(pyodide, emit) { this.pyodide = pyodide; this.emit = emit; }
  install(modules) {
    const py = this.pyodide, directory = '/home/pyodide/_pythononline';
    py.FS.mkdirTree(directory);
    for (const [name, source] of Object.entries(modules)) py.FS.writeFile(`${directory}/${name}.py`, source);
    py.runPython(`import sys, os\nsys.path.insert(0, '${directory}')\nos.environ['MPLBACKEND'] = 'agg'\nimport runtime`);
  }
  async run({ id, source, stdin = '' }) {
    const py = this.pyodide;
    const send = item => this.emit({ ...item, id });
    const buffer = new OutputBuffer(send);
    const bridge = value => buffer.push(JSON.parse(value));
    py.registerJsModule('_online_bridge', { emit: bridge });
    let namespace, error, start;
    try {
      py.globals.set('_online_stdin', stdin);
      namespace = py.runPython("runtime.prepare(_online_stdin, lambda item: __import__('_online_bridge').emit(__import__('json').dumps(item)))");
      send({ type: 'status', text: 'Loading packages…' });
      // Our turtle and display shim must never trigger external package lookup.
      const imports = source.replace(/^\s*(?:from\s+(?:turtle|IPython\.display)\s+import\b.*|import\s+turtle\s*(?:#.*)?)$/gm, '');
      await py.loadPackagesFromImports(imports, { messageCallback: text => send({ type: 'status', text }), errorCallback: text => send({ type: 'status', text }) });
      py.globals.set('_online_source', source);
      const specification = JSON.parse(py.runPython('runtime.dependency_spec(_online_source)'));
      if (specification.error) throw new Error(specification.error);
      const deps = specification.dependencies;
      if (deps.length) {
        await py.loadPackage('micropip');
        await py.runPythonAsync('import micropip\nawait micropip.install(runtime.dependencies(_online_source))');
      }
      py.runPython('runtime.patch_matplotlib()');
      send({ type: 'running' }); start = performance.now();
      py.globals.set('_online_namespace', namespace);
      error = await py.runPythonAsync('await runtime.execute(_online_source, _online_namespace)');
    } catch (caught) {
      error = String(caught.message || caught);
      if (caught.name === 'PythonError') {
        try { error = py.runPython('runtime.format_error(sys.last_exc)'); } catch (_) { /* Keep the JS error if Python cannot recover. */ }
      }
      // Pyodide prepends its evaluation internals. Keep the useful user frames.
      const user = error.indexOf('  File "main.py"');
      if (user >= 0) error = 'Traceback (most recent call last):\n' + error.slice(user);
    } finally {
      try { py.runPython('runtime.finish()'); } catch (caught) { error ||= String(caught.message || caught); }
      buffer.flush();
      if (error) send({ type: 'text', stream: 'stderr', text: error + '\n' });
      try { py.runPython('runtime.restore()'); } finally { namespace?.destroy(); py.unregisterJsModule('_online_bridge'); }
    }
    const result = { type: 'done', id, ok: !error, ms: start === undefined ? 0 : performance.now() - start, error };
    this.emit(result); return result;
  }
}
const api = { PYODIDE_URL, PythonCore, OutputBuffer, harden };
if (typeof module !== 'undefined') module.exports = api; else Object.assign(globalThis, api);
})();
