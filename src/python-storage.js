/* A local choice, deliberately absent from shared program documents. */
(() => {
class PythonStoragePreference {
  constructor(storage, url) {
    this.storage = storage;
    this.enabled = false;
    try { this.enabled = storage?.getItem('pythononline:persistent-home') === 'true'; } catch (_) { /* Storage can be unavailable. */ }
    if (PythonStoragePreference.isProgramLink(url)) this.guardLink();
  }
  static isProgramLink(value) {
    const url = new URL(value);
    return Boolean(url.hash) || ['doc', 'compressed', 'example', 'raw', 'url', 'code'].some(key => url.searchParams.has(key));
  }
  set(enabled) {
    this.enabled = enabled === true;
    try { this.storage?.setItem('pythononline:persistent-home', String(this.enabled)); } catch (_) { /* Keep this tab's explicit choice. */ }
  }
  // The linked source is also kept by editor restore. Remember off so visiting
  // the bare URL later cannot silently run that source with saved files.
  guardLink() { this.set(false); }
}
if (typeof module !== 'undefined') module.exports = PythonStoragePreference; else globalThis.PythonStoragePreference = PythonStoragePreference;
})();
