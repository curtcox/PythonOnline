const test = require('node:test'); const assert = require('node:assert/strict');
const { HashBinDocuments: D, HashBinStore } = require('../src/hashbin.js');
const { ShareLinks: S, ShareClient } = require('../src/share-links.js');
const LZ = require('../vendor/lz-string.min.js');
const compress = LZ.compressToEncodedURIComponent, decompress = LZ.decompressFromEncodedURIComponent;
function cid(text) { const data = Buffer.from(text); return Buffer.from([0,0,0,0,0,data.length]).toString('base64url') + data.toString('base64url'); }
test('compressed source and stdin documents round trip; run=0 is preserved', () => {
  for (const python of [{stdin:''}, {stdin:'3\n4\n',autorun:false}]) {
    const link = S.build({url:'https://curtcox.github.io/PythonOnline/?old=x#old',src:'print("你好")', python, run:false, compress});
    const parsed = S.parse(link.fallback, decompress); assert.equal(parsed.src,'print("你好")'); assert.equal(parsed.python.stdin,python.stdin); assert.equal(parsed.run,false);
  }
});
test('plain fallback preserves stdin without compression', () => {
  const link = S.build({url:'https://example.com/',src:'print(1)',python:{stdin:'a\nb'},compress:()=>{throw Error();}});
  assert.equal(S.parse(link.fallback, decompress).python.stdin,'a\nb');
});
test('CID detection and plain Python load', async () => {
  const value = cid('print(1)'); assert.ok(D.isCID(value)); assert.equal(S.parse('https://example.com/#'+value).kind,'cid');
  assert.equal((await new HashBinStore().load(value)).src,'print(1)'); assert.equal(D.isCID('print1234'),false);
  assert.deepEqual(S.parse('https://example.com/?example=star'),{kind:'example',id:'star',run:true});
});
test('documents validate versions, input and byte limits; unknown types remain text', () => {
  const doc = D.serialize({src:'print(1)',python:{stdin:'x',autorun:false}}); assert.equal(D.parse(doc).python.autorun,false);
  assert.throws(()=>D.parse(doc.replace('"version":1','"version":2')),/version/);
  assert.throws(()=>D.serialize({src:'a'.repeat(D.MAX_BYTES)}),/5 MiB/);
  assert.throws(()=>D.parse(doc.replace('"stdin":"x"','"stdin":1')),/text/);
  const unknown = doc.replace('"type":"python"','"type":"other"'); assert.equal(D.parse(unknown).src,unknown);
});
test('HashBin placeholder provides clear registration guidance', async () => {
  await assert.rejects(()=>new HashBinStore().connected(),/registered client ID/);
});
test('mock OAuth return restores source and consumes the transaction', async () => {
  const data = new Map(); const transactionStorage = {setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k),removeItem:k=>data.delete(k)};
  const store = new HashBinStore({clientId:'public-id',transactionStorage,loadSDK:async()=>({HashBinClient:class {async authorize(){return {state:'abc',url:'https://hashbin.org/oauth'};} async handleCallback(){} }})});
  const snapshot = {src:'print(1)',python:{stdin:'x'}}; await store.connect(snapshot);
  assert.ok(data.has('pythononline:hashbin:return:abc'));
  assert.deepEqual((await store.callback('?code=ok&state=abc')).snapshot,snapshot); assert.equal(data.size,0);
});
test('mocked quote and save use authenticated balance and validate CID', async () => {
  const store = new HashBinStore({clientId:'id',fetchSource:async()=>({ok:true,json:async()=>({cost_cents:2})})});
  store.oauth={getTokens:()=>({refreshToken:'token',expiresAt:Date.now()+1e8}),authorizedFetch:async(path)=>({ok:true,json:async()=>path.includes('settings')?{default_retention_months:2}:path.includes('balance')?{balance_cents:100}:{cid:cid('hi')}})};
  assert.equal((await store.quote('x'.repeat(70))).cost,2); assert.equal((await store.save('hello')).cid,cid('hi'));
});
test('shortener accepts only is.gd links and preserves source on provider failure', async () => {
  const links={long:'https://example.com/',fallback:'https://example.com/'};
  let result = await new ShareClient({fetchLink:async()=>({ok:true,json:async()=>({contents:'https://is.gd/abc'})})}).shorten(links); assert.equal(result.shortened,true);
  result = await new ShareClient({fetchLink:async()=>({ok:true,json:async()=>({contents:'Error: URL too long'})})}).shorten(links); assert.equal(result.shortened,false); assert.match(result.error.message,/HashBin/);
});
