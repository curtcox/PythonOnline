import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { catalog } = require('../src/examples.js');
const { toSVG, escape } = require('../src/turtle-player.js');
const { PythonCore } = require('../src/python-core.js');
const root = new URL('../', import.meta.url);
const fingerprint = sample => createHash('sha256').update(JSON.stringify(sample)).digest('hex');
if (process.argv.includes('--check')) {
  for (const sample of catalog) {
    if (await fs.readFile(new URL('examples/' + sample.id + '.py', root), 'utf8') !== sample.src) throw Error('Example out of sync: ' + sample.id);
    const preview = await fs.readFile(new URL('gallery/previews/' + sample.id + '.svg', root), 'utf8');
    if (!preview.includes('source-sha256:' + fingerprint(sample))) throw Error('Preview stale: ' + sample.id);
  }
  console.log(`${catalog.length} gallery sources and previews verified.`);
} else {
  const { loadPyodide } = require('pyodide');
  await fs.mkdir(new URL('.pyodide-cache/', root), { recursive: true });
  const py = await loadPyodide({ packageCacheDir: new URL('.pyodide-cache/', root).pathname });
  let items = [];
  const core = new PythonCore(py, item => items.push(item));
  core.install({ runtime: await fs.readFile(new URL('src/py/runtime.py', root), 'utf8'), turtle: await fs.readFile(new URL('src/py/turtle.py', root), 'utf8') });
  for (const sample of catalog) {
    items = [];
    const result = await core.run({ id: sample.id, source: sample.src, stdin: sample.stdin });
    if (!result.ok) throw Error(sample.id + ': ' + result.error);
    const visual = items.find(item => ['figure','turtle','svg','png'].includes(item.type));
    let svg;
    if (visual?.type === 'figure') svg = visual.svg;
    else if (visual?.type === 'svg') svg = visual.data;
    else if (visual?.type === 'turtle') svg = toSVG(visual.commands, visual.width, visual.height);
    else if (visual?.type === 'png') svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><image width="640" height="480" href="data:image/png;base64,${visual.data}"/></svg>`;
    else {
      const text = items.filter(item => item.type === 'text').map(item => item.text).join('').trim().split('\n').slice(0,15);
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#f2f7f5"/><text x="32" y="38" font-family="monospace" font-size="13" fill="#167c80">PYTHON ONLINE · ${escape(sample.title)}</text>${text.map((line,i) => `<text x="32" y="${78+i*24}" font-family="monospace" font-size="15" fill="#34515a">${escape(line.slice(0,65))}</text>`).join('')}</svg>`;
    }
    svg += '\n<!-- source-sha256:' + fingerprint(sample) + ' -->\n';
    await fs.writeFile(new URL('gallery/previews/' + sample.id + '.svg', root), svg);
    console.log('Rendered ' + sample.id);
  }
}
