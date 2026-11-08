import {LocalDrafts} from '../vendor/fragment-kit-v0.3.5/src/index.js';
export default class PythonDrafts extends LocalDrafts {
  constructor(storage){super({storage,key:'pythononline:work',parse:text=>{const value=JSON.parse(text);return typeof value?.src==='string'&&(value.python?.stdin==null||typeof value.python.stdin==='string')?value:null;}});}
  history(){
    const legacy=JSON.parse(this.storage?.getItem('pythononline:previous-work')||'[]');
    if(!Array.isArray(legacy))throw Error('Invalid previous work.');
    return [...new Set([...super.history(),...legacy.filter(value=>typeof value?.src==='string').map(value=>JSON.stringify(value))])];
  }
}
