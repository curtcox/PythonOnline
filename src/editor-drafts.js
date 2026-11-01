/* Local recovery never decides which program a URL opens. */
(() => {
class PythonDrafts {
  constructor(storage) { this.storage = storage; }
  read(key) {
    const value = JSON.parse(this.storage?.getItem(key) || 'null');
    return key === 'pythononline:work' ? (value ? [value] : []) : (value || []);
  }
  list() {
    const values = [...this.read('pythononline:work'), ...this.read('pythononline:previous-work')]
      .filter(value => value && typeof value.src === 'string' &&
        (value.python?.stdin == null || typeof value.python.stdin === 'string'));
    return [...new Map(values.map(value => [JSON.stringify(value), value])).values()];
  }
  save(value, archive) {
    if (!this.storage) throw new Error('Browser storage is unavailable. Download your work to keep it.');
    const text = JSON.stringify(value);
    if (archive) {
      const previous = this.list().filter(item => JSON.stringify(item) !== text);
      // Commit recovery first. If storage is full, leave the previous draft intact.
      this.storage.setItem('pythononline:previous-work', JSON.stringify(previous));
    }
    this.storage.setItem('pythononline:work', text);
  }
}
if (typeof module !== 'undefined') module.exports = PythonDrafts; else globalThis.PythonDrafts = PythonDrafts;
})();
