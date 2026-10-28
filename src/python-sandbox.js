/* Opaque by default; an explicit local preference enables the app's hosted origin. */
(() => {
const PythonSandbox = {
  // Fetched through the service worker, which serves only hash-verified bytes.
  source(fetchText = url => fetch(url).then(response => { if (!response.ok) throw Error('Python runtime download failed. Check your connection and retry.'); return response.text(); })) {
    this.text ||= Promise.all(['src/python-core.js?v=3', 'src/python-home.js?v=1', 'src/python-worker.js?v=3'].map(fetchText)).then(parts => parts.join('\n;\n'));
    this.text.catch(() => { this.text = null; });
    return this.text;
  },
  factory(sdk, { base = new URL('src/', location.href).href, persistent = false,
    clientId = globalThis.document?.querySelector('meta[name="hashbin-client-id"]')?.content,
    runDomain = 'hashbin.app' } = {}) {
    return () => sdk.createSandbox({
      source: this.source().then(source => `const PYTHON_PERSISTENT_HOME = ${persistent === true};\n${source}`),
      origin: persistent ? 'hosted' : 'opaque', clientId, runDomain,
      base, proxy: [PYODIDE_URL, new URL('py/', base).href]
    });
  }
};
if (typeof module !== 'undefined') module.exports = PythonSandbox; else globalThis.PythonSandbox = PythonSandbox;
})();
