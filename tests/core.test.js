const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PythonCore, OutputBuffer } = require('../src/python-core.js');
const parse = require('../src/traceback.js');
let core, items;
test.before(async () => {
  const { loadPyodide } = require('pyodide');
  const py = await loadPyodide({ packageCacheDir: '.pyodide-cache' });
  core = new PythonCore(py, item => items.push(item));
  core.install(Object.fromEntries(['runtime', 'turtle', 't256'].map(name => [name, fs.readFileSync(`src/py/${name}.py`, 'utf8')])));
});
async function run(source, stdin = '') { items = []; const result = await core.run({ id: 1, source, stdin }); return { ...result, text: items.filter(i => i.type === 'text').map(i => i.text).join(''), items }; }
test('real CPython prints, echoes input, handles EOF and keeps ordered rich output', async () => {
  let result = await run('name = input("Name: ")\nprint(f"Hi {name}")\ndisplay(HTML("<b>hi</b>"))\nprint("after")', 'Ada\n');
  assert.equal(result.ok, true, result.error); assert.equal(result.text, 'Name: Ada\nHi Ada\nafter\n');
  const html = result.items.findIndex(i => i.type === 'html');
  assert.equal(result.items.slice(0, html).filter(i => i.type === 'text').map(i => i.text).join(''), 'Name: Ada\nHi Ada\n');
  assert.equal(result.items.slice(html + 1).filter(i => i.type === 'text').map(i => i.text).join(''), 'after\n');
  result = await run('input()'); assert.equal(result.ok, false); assert.match(result.text, /Input box/);
});
test('runtime and syntax errors report the correct editor line', async () => {
  const runtime = await run('print("before")\n1 / 0'); assert.equal(parse(runtime.error).line, 2); assert.match(runtime.text, /^before/);
  const syntax = await run('x = 1\nif True print(1)'); assert.equal(parse(syntax.error).line, 2);
});
test('namespaces and user modules reset; 30 subsequent runs remain usable', async () => {
  await run('secret = 42\nopen("user_module.py", "w").write("value=42")\nimport user_module');
  const reset = await run('import sys\nprint("secret" in globals(), "user_module" in sys.modules)'); assert.match(reset.text, /False False/);
  for (let i = 0; i < 30; i++) { const result = await run(`print(${i})`); assert.equal(result.text, i + '\n'); }
});
test('turtle and top-level await execute', async () => {
  const result = await run('import turtle as t\nimport asyncio\nawait asyncio.sleep(0)\nt.forward(20)\nt.left(90)\nt.forward(30)');
  assert.equal(result.ok, true, result.error); const turtle = result.items.find(i => i.type === 'turtle'); assert.equal(turtle.commands.length, 2);
});
test('text streaming respects chunk, byte and line caps', () => {
  const messages = [], buffer = new OutputBuffer(item => messages.push(item), { maxBytes: 30, maxLines: 4 });
  buffer.push({ type: 'text', text: 'one\ntwo\n', stream: 'stdout' }); buffer.push({ type: 'html', data: '<b>hi</b>' });
  buffer.push({ type: 'text', text: 'x'.repeat(100), stream: 'stderr' }); buffer.push({ type: 'text', text: 'discarded' }); buffer.flush();
  assert.equal(messages[0].text, 'one\ntwo\n'); assert.equal(messages[1].type, 'html'); assert.match(messages[2].text, /truncated/); assert.doesNotMatch(messages[2].text, /discarded/);
});
test('matplotlib captures vector and raster figures', { skip: !process.env.TEST_PACKAGES }, async () => {
  const result = await run('import matplotlib.pyplot as plt\nplt.plot([1,2,3])\nplt.show()'); assert.equal(result.ok, true, result.error);
  const figure = result.items.find(i => i.type === 'figure'); assert.match(figure.svg, /<svg/); assert.ok(figure.png.length > 100);
});

test('Shiny and Gradio gallery samples execute with real packages and updated input', { skip: !process.env.TEST_PACKAGES }, async () => {
  const { catalog } = require('../src/examples.js');
  const shiny = catalog.find(sample => sample.id === 'shiny');
  let result = await run(shiny.src, shiny.stdin);
  assert.equal(result.ok, true, result.error);
  assert.match(result.text, /Total: \$36[\s\S]*Total: \$60/);
  assert.match(result.items.find(item => item.type === 'html').data, /<table>[\s\S]*\$36[\s\S]*\$60/);
  result = await run(shiny.src, '2\n7\n');
  assert.equal(result.ok, true, result.error);
  assert.match(result.text, /Total: \$24[\s\S]*Total: \$84/);

  const gradio = catalog.find(sample => sample.id === 'gradio');
  result = await run(gradio.src, gradio.stdin);
  assert.equal(result.ok, true, result.error);
  assert.match(result.text, /Hello, Ada![\s\S]*Hello, Grace!/);
  result = await run(gradio.src, '  Lin  \n\n');
  assert.equal(result.ok, true, result.error);
  assert.match(result.text, /Hello, Lin![\s\S]*Hello, Python learner!/);
});

test('malformed package metadata reports a useful error and the next run recovers', async () => {
  const malformed = await run('# /// script\n# dependencies = "wrong"\n# ///\nprint(1)');
  assert.equal(malformed.ok, false); assert.match(malformed.error, /list of strings/);
  assert.equal((await run('print("recovered", flush=True)')).text, 'recovered\n');
});

test('filesystem flush completes before done and failed saves do not report success', async () => {
  let release;
  core.home = { save: () => new Promise(resolve => { release = resolve; }) };
  items = [];
  const pending = core.run({ id: 100, source: 'print("saved")' });
  while (!release) await new Promise(resolve => setTimeout(resolve, 1));
  assert.ok(!items.some(item => item.type === 'done'));
  release();
  const saved = await pending; assert.equal(saved.ok, true); assert.equal(saved.filesSaved, true);
  core.home = { save: async () => { throw new Error('Storage unavailable'); } };
  const failed = await run('print("not persisted")');
  assert.equal(failed.ok, false); assert.equal(failed.filesSaved, false);
  assert.match(failed.text, /Files were not saved: Storage unavailable/);
  core.home = null;
});
