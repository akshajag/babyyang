export const TOKENS=['sun','leaf','star','moon'];
export function nextToken(block,length){if(!Array.isArray(block)||block.length<2||block.length>3||block.some(t=>!TOKENS.includes(t))||!Number.isInteger(length)||length<1)throw Error('Invalid repeating loop');return block[length%block.length];}
export function patternPrediction(rule,block,length){if(rule==='loop')return nextToken(block,length);if(rule==='last')return block[(length-1)%block.length];if(rule==='sun')return'sun';throw Error('Unknown pattern rule');}
export function newPattern(){return{version:1,id:globalThis.crypto?.randomUUID?.()||String(Date.now()),wrongTests:0,wrongRepairs:0,practices:[],repairs:[],phase:'build',block:['sun','leaf'],choice:null,tested:false,witness:null,candidate:null,repaired:false,index:0,answers:[],feedback:'',hints:0};}
export const PATTERN_CHECKS=[{block:['moon','star'],length:5},{block:['leaf','sun','moon'],length:5},{block:['star','moon','leaf'],length:7}];
export function patternReduce(old,a){const s=structuredClone(old);s.feedback='';switch(a.type){
case'block':if(s.phase!=='build'||!TOKENS.includes(a.value)||![0,1].includes(a.index))throw Error('Choose a loop tile');s.block[a.index]=a.value;s.choice=null;s.tested=false;break;
case'choose':if(!['build','check'].includes(s.phase)||!TOKENS.includes(a.value)||(s.phase==='check'&&s.tested))throw Error('Choose a tile');s.choice=a.value;s.tested=false;break;
case'test':if(s.phase!=='build'||!s.choice)throw Error('Choose what comes next');s.tested=true;s.practices??=[];s.practices.push({block:[...s.block],choice:s.choice,expected:nextToken(s.block,4),hints:s.hints});if(s.choice!==nextToken(s.block,4))s.wrongTests=(s.wrongTests||0)+1;s.feedback=s.choice===nextToken(s.block,4)?'Your tile fits the loop. Compare it with Pip’s tile.':'Follow the loop from its beginning. You can try another tile.';break;
case'save':if(s.phase!=='build'||!s.tested||s.choice!==nextToken(s.block,4)||s.choice===patternPrediction('last',s.block,4))throw Error('Find a loop where your correct tile and Pip’s tile differ.');s.witness=[...s.block];s.phase='repair';s.choice=null;break;
case'rule':if(s.phase!=='repair'||!['loop','last','sun'].includes(a.value))throw Error('Choose a repair');s.candidate=a.value;s.repaired=false;break;
case'patch':if(s.phase!=='repair'||!s.candidate)throw Error('Choose a repair first');s.repairs??=[];s.repairs.push({candidate:s.candidate,accepted:s.candidate==='loop'});if(s.candidate!=='loop'){s.wrongRepairs=(s.wrongRepairs||0)+1;s.feedback='That rule does not explain how a repeating loop works. Try following the whole loop.';break;}s.repaired=true;s.feedback='Your repair follows the whole loop. Try it in new patterns!';break;
case'begin':if(s.phase!=='repair'||!s.repaired)throw Error('Repair the loop first');s.phase='check';s.choice=null;s.tested=false;break;
case'check':if(s.phase!=='check'||!s.choice||s.tested)throw Error('Choose your next tile');{const c=PATTERN_CHECKS[s.index],correct=s.choice===nextToken(c.block,c.length);s.answers.push({choice:s.choice,correct,hints:s.hints});s.tested=true;s.feedback=correct?'Your tile keeps the loop going!':`The loop needs ${nextToken(c.block,c.length)} next. Follow it one tile at a time.`;}break;
case'next':if(s.phase!=='check'||!s.tested)throw Error('Check this tile first');if(s.index===2)s.phase='complete';else s.index++;s.tested=false;s.choice=null;break;
case'hint':s.hints++;s.feedback='Say the small loop aloud. Start again when you reach its end. The outlined tiles show one loop.';break;
default:throw Error('Unknown action');}return s;}


