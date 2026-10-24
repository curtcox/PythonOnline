import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
async function walk(directory) {
  const result = [];
  for (const entry of await fs.readdir(new URL(directory, root), { withFileTypes: true })) {
    if (['node_modules','.git','__pycache__','test-results','.pyodide-cache'].includes(entry.name)) continue;
    const path = directory + entry.name;
    if (entry.isDirectory()) result.push(...await walk(path + '/'));
    else result.push(path);
  }
  return result;
}
const files = await walk('');
for (const file of files.filter(name => /\.(?:js|mjs|cjs)$/.test(name))) execFileSync(process.execPath, ['--check', new URL(file, root).pathname]);
execFileSync(process.execPath, [new URL('scripts/render-gallery.mjs', root).pathname, '--check'], { stdio: 'inherit' });
execFileSync(process.execPath, [new URL('scripts/update-offline.mjs', root).pathname, '--check'], { stdio: 'inherit' });
console.log('Syntax, gallery and offline consistency checks passed.');
