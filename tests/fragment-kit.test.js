const test=require('node:test'),assert=require('node:assert/strict');
const {urlState,config,type}=require('../src/fragment-config.mjs');
const {createUrlState}=require('../vendor/fragment-kit-v0.3.3/src/index.js');
const corpus=require('./legacy-urls.json'),canonical=createUrlState({config,type});
for(const entry of corpus.cases.filter(entry=>entry.kind==='source'))test('production adapter retains '+entry.id,()=>{
 const intent=urlState.parse(entry.href);assert.equal(intent.kind,'source');
 const expected=entry.raw?urlState.documents.parse(entry.raw):type.normalize({src:entry.src});assert.deepEqual(intent.doc,expected);
 assert.deepEqual(urlState.parse(canonical.build(expected).href).doc,expected);
 assert.deepEqual(urlState.parse(urlState.build(expected).href).doc,expected);
});
test('persistence is never carried by imported documents',()=>{const input={src:'print(1)',python:{stdin:'x',autorun:false,persistent:true},persistent:true};assert.deepEqual(urlState.documents.parse(urlState.documents.serialize(input)),{src:'print(1)',python:{stdin:'x',autorun:false}});});

test('pre-kit Publish returns stay readable, new writes are prefixed and other client state is excluded',()=>{const {publishTransactions}=require('../src/fragment-config.mjs'),data=new Map(),raw={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)},tx=publishTransactions(raw,'own');data.set('hashbin:publish:own:state','old');data.set('hashbin:publish:other:state','other');assert.equal(tx.getItem('hashbin:publish:own:state'),'old');assert.equal(tx.getItem('hashbin:publish:other:state'),null);tx.setItem('hashbin:publish:own:new','new');assert.equal(data.get('pythononline:hashbin:publish:own:new'),'new');tx.removeItem('hashbin:publish:own:state');assert.equal(data.has('hashbin:publish:own:state'),false);assert.equal(data.get('hashbin:publish:other:state'),'other');});
