/* Python runs in a worker inside an opaque-origin iframe (HashBin SDK createSandbox), so programs
   from links cannot reach this origin's storage, cookies, service worker or pages. */
(() => {
const PythonSandbox = {
  // Fetched through the service worker, which serves only hash-verified bytes.
  source(fetchText = url => fetch(url).then(response => { if (!response.ok) throw Error('Python runtime download failed. Check your connection and retry.'); return response.text(); })) {
    this.text ||= Promise.all(['src/python-core.js?v=2', 'src/python-worker.js?v=2'].map(fetchText)).then(parts => parts.join('\n;\n'));
    this.text.catch(() => { this.text = null; });
    return this.text;
  },
  factory(sdk, { base = new URL('src/', location.href).href } = {}) {
    return () => sdk.createSandbox({ source: this.source(), base, proxy: [PYODIDE_URL, new URL('py/', base).href] });
  }
};
if (typeof module !== 'undefined') module.exports = PythonSandbox; else globalThis.PythonSandbox = PythonSandbox;
})();
