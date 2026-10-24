(() => {
function parseTraceback(text) {
  const frames = [...String(text).matchAll(/File ["']main\.py["'], line (\d+)/g)];
  if (!frames.length) return null;
  const line = Number(frames.at(-1)[1]);
  const lines = String(text).trim().split('\n');
  const message = [...lines].reverse().find(value => /^[\w.]+(?:Error|Exception|Interrupt|Exit)\b.*:|^SyntaxError:/.test(value)) || lines.at(-1);
  const caret = lines.find(value => /^\s*\^/.test(value));
  return { line, column: caret ? Math.max(0, caret.indexOf('^') - 4) : 0, message };
}
if (typeof module !== 'undefined') module.exports = parseTraceback; else globalThis.parseTraceback = parseTraceback;
})();
