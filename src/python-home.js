/* Persistent filesystem belongs only to the hosted sandbox, never the editor. */
(() => {
class PythonHome {
  constructor(pyodide) { this.fs = pyodide.FS; }
  sync(populate) {
    return new Promise((resolve, reject) => this.fs.syncfs(populate, error => error ? reject(error) : resolve()));
  }
  async restore() {
    const fs = this.fs;
    if (!fs.filesystems?.IDBFS) throw new Error('This Python runtime does not provide persistent storage.');
    fs.mkdirTree('/home/pyodide');
    fs.mount(fs.filesystems.IDBFS, {}, '/home/pyodide');
    await this.sync(true);
  }
  async save() { await this.sync(false); }
}
if (typeof module !== 'undefined') module.exports = PythonHome; else globalThis.PythonHome = PythonHome;
})();
