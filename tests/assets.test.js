const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs');
const { toSVG } = require('../src/turtle-player.js');
const { harden } = require('../src/python-core.js');
test('hardening shadows inherited worker storage and script-loading APIs', () => {
  const scope = Object.create({ caches:{},indexedDB:{},importScripts(){} }); harden(scope);
  for (const name of ['caches','indexedDB','importScripts','Worker','SharedWorker']) { assert.equal(Object.getPrototypeOf(scope)[name],undefined); assert.equal(scope[name],undefined); assert.equal(Reflect.set(scope,name,{}),false); }
});
test('turtle SVG escapes text, colors and invalid coordinates', () => {
  const svg=toSVG([{op:'text',text:'<script>alert(1)</script>',x:NaN,y:0,color:'red" onload="evil'},{op:'line',x1:Infinity,y1:0,x2:1,y2:2,color:'red',width:2}]);
  assert.doesNotMatch(svg,/<script>|NaN|Infinity|color="red" onload/); assert.match(svg,/&lt;script&gt;/);
});
test('offline manifest covers HTML references, runtime files, examples and worker imports', () => {
  const assets = require('../offline-assets.js').assets;
  for (const html of ['index.html','gallery.html']) {
    const text=fs.readFileSync(html,'utf8');
    for (const match of text.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)) {
      const path=match[1]; if (/^(https?:|#|\.\/)/.test(path)) continue;
      assert.ok(assets.includes(path),`${html}: missing ${path}`);
    }
  }
  for (const path of ['src/python-core.js','src/python-worker.js','src/py/runtime.py','src/py/turtle.py','src/py/t256.py']) assert.ok(assets.includes(path));
  for (const sample of require('../src/examples.js').catalog) { assert.equal(fs.readFileSync('examples/'+sample.id+'.py','utf8'),sample.src); assert.ok(assets.includes('gallery/previews/'+sample.id+'.svg')); }
});
