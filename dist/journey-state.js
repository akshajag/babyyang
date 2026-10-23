import {createSession,reduce} from './engine.js';
import {newPattern,patternReduce} from './pattern.js';
// Tour scenes run through the same reducers as ordinary mission play.
export function fractionJourney(stage='build'){
 let s=createSession();for(const a of [{type:'START',feeling:'skip'},{type:'PREDICT',choice:'unsure'},{type:'EXPLORE'}])s=reduce(s,a);
 if(stage==='build')return s;
 for(const a of [{type:'CHOOSE',choice:'left'},{type:'TEST'}])s=reduce(s,a);
 if(stage==='compare')return s;
 for(const a of [{type:'SAVE'},{type:'RULE',rule:'smaller'},{type:'REASON',reason:'parts'},{type:'PATCH'}])s=reduce(s,a);
 if(stage==='repair')return s;
 if(stage==='check')return reduce(s,{type:'BEGIN_CHECK'});
 throw Error('Unknown fraction tour scene.');
}
export function patternJourney(stage='build'){
 let s=newPattern();if(stage==='build')return s;
 for(const a of [{type:'choose',value:'sun'},{type:'test'}])s=patternReduce(s,a);
 if(stage==='compare')return s;
 for(const a of [{type:'save'},{type:'rule',value:'loop'},{type:'patch'}])s=patternReduce(s,a);
 if(stage==='repair')return s;
 throw Error('Unknown pattern tour scene.');
}
export function temporaryJourneyStorage(source){const overlay=new Map();return{get memoryOnly(){return source.memoryOnly;},getItem:k=>overlay.has(k)?overlay.get(k):source.getItem(k),setItem:(k,v)=>overlay.set(k,String(v)),removeItem:k=>overlay.set(k,null)};}
if(typeof window!=='undefined')window.fixiverseJourneyModels={fractionJourney,patternJourney,temporaryJourneyStorage};
