import { createAi, createAskPanel, createAiSettings, createCompareModels } from '../vendor/fragment-kit-v0.4.3/src/ai/index.js';
import { createDialog, createStorage, element } from '../vendor/fragment-kit-v0.4.3/src/index.js';
/** Every probe is a fresh opaque sandbox, never the editor or persistent home. */
export function createPythonAiCheck(sdk) {
  return ({ document, expected, signal }) => new Promise((resolve, reject) => {
    let text = '', settled = false, probe;
    const timer = setTimeout(() => finish(new Error('Python AI check timed out.')), 30000);
    const stop = () => finish(signal.reason ?? new Error('Cancelled.'));
    function finish(error, result) { if(settled)return; settled=true; clearTimeout(timer); signal?.removeEventListener('abort',stop); probe?.dispose(); error?reject(error):resolve(result); }
    if(signal?.aborted){finish(signal.reason);return;} signal?.addEventListener('abort',stop,{once:true});
    probe = new PythonClient({ lowMemory:true, persistent:false, createWorker:PythonSandbox.factory(sdk,{persistent:false}), onMessage:item=>{
      if(item.type==='text' && item.stream==='stdout'){ if(text.length+String(item.text).length>65536){finish(new Error('Python AI output exceeds 64 KiB.'));return;} text+=item.text; }
      else if(item.type==='done') finish(null, item.ok && (expected===undefined || text===expected));
      else if(item.type==='fatal'||item.type==='stopped') finish(new Error('Python AI sandbox check failed.'));
    }});
    probe.run(document.src,document.python.stdin,'auto');
  });
}
export async function mountPythonAi({config,type,urlState,sdk,getSnapshot,getFingerprint,onApply,container,status}) {
  type.ai={describe:'Python Online document: src is Python source; python.stdin is program input; python.autorun is a boolean and must be preserved. Preserve unrelated code. Python executes only in the app sandbox after an explicit Run.',paths:['/src','/python/stdin'],checks:{runsAndOutputs:createPythonAiCheck(sdk)}};
  const storage=createStorage({prefix:config.storagePrefix}), ai=await createAi({config,type,storage});
  if(!ai)return null;
  const dialog=createDialog('Ask for a Python change',{id:'python-ai'});
  const ask=createAskPanel({ai,type,urlState,getSnapshot,getFingerprint,onApply,container:dialog.body});
  dialog.dialog.addEventListener('close',()=>ask.cancel());
  const button=element('button','Ask',{type:'button',id:'ask-open'});button.onclick=()=>{dialog.open();ask.open();};
  document.querySelector('.toolbar').prepend(button);
  createAiSettings({ai,container,onChange:ask.refreshModels});
  let comparison;
  const compare=element('button','Compare models',{type:'button'});compare.onclick=async()=>{
    try{if(!comparison){const response=await fetch('ai-suite.json');if(!response.ok)throw new Error('AI suite is unavailable.');comparison=createCompareModels({ai,type,suite:await response.json(),storage,getSnapshot,getFingerprint,onApply,urlState});}await comparison.refresh();comparison.open();}
    catch(error){status(error.message);}
  };container.append(compare);
  return {cancel:ask.cancel,ai,type};
}
