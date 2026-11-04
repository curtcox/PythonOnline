const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{createHash}=require('node:crypto');
test('package upgrade trusts the pinned lockfile and copies only verified legacy bytes without network',async()=>{
 const base='https://packages.example/',url=base+'valid.whl',bad=base+'bad.whl',stores=new Map(),events={};
 const hash=text=>createHash('sha256').update(text).digest('hex');
 const lock=JSON.stringify({packages:{valid:{file_name:'valid.whl',sha256:hash('valid')},bad:{file_name:'bad.whl',sha256:hash('expected')}}});
 const caches={async keys(){return [...stores.keys()]},async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return{async match(key){return data.get(key)?.clone()},async put(key,value){data.set(key,value.clone())},async delete(key){data.delete(key)}}}};
 const legacy=await caches.open('pythononline-legacy');await legacy.put(base+'pyodide-lock.json',new Response(lock));await legacy.put(url,new Response('valid'));await legacy.put(bad,new Response('poison'));
 const self={registration:{scope:'https://app.example/PythonOnline/'},location:{origin:'https://app.example'},addEventListener(name,callback){events[name]=callback}};
 const sandbox={self,OfflineAssets:{pyodide:base,version:'pythononline-new',hashes:{[base+'pyodide-lock.json']:hash(lock)}},caches,crypto,Response,URL,Headers,fetch(){throw Error('Upgrade must work without network')}};
 vm.runInNewContext(fs.readFileSync('vendor/hashbin-cache-v0.4.0.js','utf8'),sandbox);vm.runInNewContext(fs.readFileSync('src/offline-extras.js','utf8'),sandbox);
 let pending;events.install({waitUntil(value){pending=value}});await pending;
 const saved=await caches.open('pythononline-packages-v1');assert.equal(await(await saved.match(url)).text(),'valid');assert.equal(await saved.match(bad),undefined);
 assert.equal(self.FragmentKitOfflineConfig.extraCaches[0],'pythononline-packages-v1');assert.equal(sandbox.OfflineAssets.assets,undefined,'packages never enter app readiness');
 // A forged old lock cannot authorize a package, even if the forged bytes match it.
 stores.delete('pythononline-packages-v1');await legacy.put(base+'pyodide-lock.json',new Response(lock.replace(hash('expected'),hash('poison'))));events.install({waitUntil(value){pending=value}});await pending;assert.equal(stores.has('pythononline-packages-v1'),false);
});
