const test = require('node:test'); const assert = require('node:assert/strict');
const PythonDrafts = require('../src/editor-drafts.mjs').default;
const work = src => ({ src, python: { stdin: 'input\n', autorun: false } });
test('new editing sessions preserve previous drafts, including their input and settings', () => {
  const data = new Map(), storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const drafts = new PythonDrafts(storage);
  drafts.save(work('original'), true); drafts.opened(); drafts.save(work('linked edit'), true);
  drafts.save(work('continued edit'), false);
  assert.deepEqual(new PythonDrafts(storage).list(), [work('continued edit'), work('original')]);
  drafts.opened(); drafts.save(work('another link'), true);
  assert.deepEqual(drafts.list(), [work('another link'), work('continued edit'), work('original')]);
});
test('failed recovery writes cannot overwrite the previous work', () => {
  const original = JSON.stringify(work('original'));
  let current = original;
  const drafts = new PythonDrafts({ getItem: key => key === 'pythononline:work' ? current : null,
    setItem(key, value) { if (key === 'pythononline:work:history') throw Error('Quota exceeded'); current = value; } });
  assert.throws(() => drafts.save(work('new'), true), /Quota/);
  assert.equal(current, original);
  assert.throws(() => new PythonDrafts().save(work('new'), true), /unavailable/);
});

test('pre-migration previous-work stays readable without rewriting it',()=>{const old=JSON.stringify([work('old history')]),data=new Map([['pythononline:previous-work',old]]);const drafts=new PythonDrafts({getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)});assert.deepEqual(drafts.list(),[work('old history')]);drafts.save(work('new'),true);assert.deepEqual(drafts.list(),[work('new'),work('old history')]);assert.equal(data.get('pythononline:previous-work'),old);});
