import {mountGallery} from '../vendor/fragment-kit-v0.3.3/src/index.js';
import {urlState} from './fragment-config.mjs';
const container=document.getElementById('gallery');
const gallery=mountGallery({container,urlState:{build:doc=>urlState.build(doc,{url:new URL('./',location.href).href})},catalog:PythonExamples.catalog.map(sample=>({id:sample.id,title:sample.label,tags:sample.tags,description:sample.description,document:{src:sample.src,python:{stdin:sample.stdin||'',autorun:true}},cover:'gallery/covers/'+sample.id+'.png'}))});
container.querySelector('input').id='search';container.querySelector('select').id='tag';
