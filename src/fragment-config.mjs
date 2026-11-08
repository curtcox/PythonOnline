import * as kit from '../vendor/fragment-kit-v0.3.5/src/index.js';
import appConfig from '../fragment-kit.config.json' with { type: 'json' };
export const config = kit.createConfig(appConfig);
export const type = { type:'python',settingsKeys:[],fileName:'program.json',contentType:'application/json',
  normalize(value) {
    if(typeof value?.src!=='string'||(value.python?.stdin!=null&&typeof value.python.stdin!=='string'))throw Error('Source and program input must be text.');
    return {src:value.src,python:{stdin:value.python?.stdin??'',autorun:value.python?.autorun!==false}};
  },isDefault:doc=>!doc.python.stdin&&doc.python.autorun
};
export const legacyWriter=(doc,{url,run,view,compress,documents})=>{
  url.searchParams.set(type.isDefault(doc)?'compressed':'doc',compress(type.isDefault(doc)?doc.src:documents.serialize(doc)));
  if(run===false)url.searchParams.set('run','0');if(view)url.searchParams.set('view',view);return url.href;
};
export const urlState=kit.createUrlState({config,type,legacyWriter});
export const HashBinDocuments={...urlState.documents,MAX_BYTES:config.maxBytes,link:urlState.link,
  ...Object.fromEntries(['bytes','encode64','decode64','isCID','cidLength','verify'].map(key=>[key,kit[key]])),cid:value=>kit.cid(value,config.allowedHosts)};
// Read pre-kit Publish returns only for this public client; write every new transaction under the app prefix.
export function publishTransactions(storage,clientId=config.hashbinClientId){
 if(!storage)return undefined;
 const current=kit.createStorage({prefix:config.storagePrefix,storage}),owned=key=>key.startsWith('hashbin:publish:'+clientId+':');
 return {getItem(key){const value=current.getItem(key);if(value!=null||!owned(key))return value;try{return storage.getItem(key);}catch{return null;}},setItem:(key,value)=>current.setItem(key,value),removeItem(key){current.removeItem(key);if(owned(key))try{storage.removeItem(key);}catch{}}};
}
export class HashBinStore extends kit.HashBinStore {constructor(options={}){let storage;try{storage=globalThis.sessionStorage;}catch{}super({config,type,transactionStorage:publishTransactions(storage,options.clientId??config.hashbinClientId),...options});}}
export const ShareLinks={build:({url,run,view,...doc})=>urlState.build(doc,{url,run,view}),parse:href=>{const intent=urlState.parse(href);return intent.kind==='none'?null:{...intent,...intent.doc};}};
export const LZString={compressToEncodedURIComponent:kit.compress,decompressFromEncodedURIComponent:kit.decompress};
export {ShareClient} from '../vendor/fragment-kit-v0.3.5/src/index.js';
// Execution and Publish use the same immutable SDK release; isolation remains app-owned.
export const loadExecutionSDK=()=>import('../vendor/fragment-kit-v0.3.5/vendor/hashbin-sdk-v0.4.0.mjs?execution');
