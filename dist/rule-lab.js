// A deliberately tiny, validated rule language. No eval, generated code or model calls.
export const LAB_TOKENS=['sun','leaf','star','moon'];
export const LAB_CHOICES=['left','equal','right'];
export const labKey=t=>t.kind==='fraction'?`f:${t.pair.join(':')}`:`p:${t.block.join(':')}:${t.length}`;
export const labTruth=t=>t.kind==='fraction'?(t.pair[0]===t.pair[1]?'equal':t.pair[0]<t.pair[1]?'left':'right'):t.block[t.length%t.block.length];
export function labCases(mission){
 if(mission==='fraction'){const cases=[];for(let a=2;a<=8;a++)for(let b=2;b<=8;b++)cases.push({kind:'fraction',pair:[a,b]});return cases.sort((a,b)=>Math.max(...a.pair)-Math.max(...b.pair)||a.pair[0]-b.pair[0]||a.pair[1]-b.pair[1]);}
 if(mission!=='pattern')throw Error('Choose Fraction Foundry or Pattern Grove.');
 const cases=[];for(const a of LAB_TOKENS)for(const b of LAB_TOKENS)if(a!==b){for(let length=2;length<=8;length++)cases.push({kind:'pattern',block:[a,b],length});for(const c of LAB_TOKENS)if(c!==a&&c!==b)for(let length=2;length<=8;length++)cases.push({kind:'pattern',block:[a,b,c],length});}
 return cases.sort((a,b)=>a.block.length-b.block.length||a.length-b.length||labKey(a).localeCompare(labKey(b)));
}
export function validateLabTask(t,mission){
 if(t?.kind!==mission)throw Error('Use a case from this mission.');
 if(mission==='fraction'){if(!Array.isArray(t.pair)||t.pair.length!==2||t.pair.some(n=>!Number.isInteger(n)||n<2||n>8))throw Error('Choose 2 to 8 equal parts for each matching whole.');}
 else if(!Array.isArray(t.block)||![2,3].includes(t.block.length)||new Set(t.block).size!==t.block.length||t.block.some(x=>!LAB_TOKENS.includes(x))||!Number.isInteger(t.length)||t.length<2||t.length>8)throw Error('Choose 2 or 3 different loop tiles and show 2 to 8 tiles.');
 return t;
}
export function validateRecipe(mission,p){
 if(mission==='fraction'){if(!p||Object.keys(p).sort().join(',')!=='equal,fewer,more'||['fewer','equal','more'].some(k=>!LAB_CHOICES.includes(p[k])))throw Error('Fill all three recipe branches.');}
 else if(mission==='pattern'){if(!p||Object.keys(p).sort().join(',')!=='end,move,start'||!['first','last'].includes(p.start)||!['shown','none'].includes(p.move)||!['wrap','stay'].includes(p.end))throw Error('Choose a start, movement and end action.');}
 else throw Error('Unknown mission.');return p;
}
export function runRecipe(mission,p,t){
 validateRecipe(mission,p);validateLabTask(t,mission);
 if(mission==='fraction'){const [a,b]=t.pair,branch=a<b?'fewer':a===b?'equal':'more';return{prediction:p[branch],steps:[{label:'Read the part counts',value:`Left ${a}; right ${b}.`},{label:'Choose a branch',value:`The left whole has ${branch==='equal'?'the same number of':branch} equal parts.`},{label:'Follow your instruction',value:p[branch]}]};}
 const start=p.start==='first'?0:t.block.length-1,moves=p.move==='shown'?t.length:0,index=p.end==='wrap'?(start+moves)%t.block.length:Math.min(start+moves,t.block.length-1);
 return{prediction:t.block[index],steps:[{label:'Start the pointer',value:`Tile ${start+1}: ${t.block[start]}.`},{label:'Move the pointer',value:p.move==='shown'?`Move ${moves} steps, one for every shown tile.`:'Do not move.'},{label:'Handle the end',value:`${p.end==='wrap'?'Start again at the first tile when needed':'Stay at the last tile at the end'}. Land on tile ${index+1}: ${t.block[index]}.`}],index};
}
export function labHypotheses(mission){return mission==='fraction'?[
 {id:'fewer',name:'Fewer parts → bigger piece',recipe:{fewer:'left',equal:'equal',more:'right'}},
 {id:'more',name:'More parts → bigger piece',recipe:{fewer:'right',equal:'equal',more:'left'}},
 {id:'left',name:'Always choose the left piece',recipe:{fewer:'left',equal:'left',more:'left'}},
 {id:'same',name:'Always call them the same',recipe:{fewer:'equal',equal:'equal',more:'equal'}}
 ]:[
 {id:'repeat',name:'Follow the whole repeating loop',recipe:{start:'first',move:'shown',end:'wrap'}},
 {id:'stop',name:'Stop when you reach the last tile',recipe:{start:'first',move:'shown',end:'stay'}},
 {id:'first',name:'Always choose the first loop tile',recipe:{start:'first',move:'none',end:'wrap'}},
 {id:'offset',name:'Start at the last tile, then follow the loop',recipe:{start:'last',move:'shown',end:'wrap'}}];}
export function verifyRecipe(mission,recipe){
 validateRecipe(mission,recipe);const cases=labCases(mission);let passed=0,counterexample=null;
 for(const task of cases){const got=runRecipe(mission,recipe,task).prediction,truth=labTruth(task);if(got===truth)passed++;else if(!counterexample)counterexample={task,got,expected:truth};}
 return{total:cases.length,passed,correct:passed===cases.length,counterexample,recipe:structuredClone(recipe),scope:mission==='fraction'?'One piece from each of two same-sized wholes; 2 to 8 equal parts each.':'Loops of 2 or 3 distinct sun/leaf/star/moon tiles; 2 to 8 shown tiles.'};
}
// Minimize the largest surviving group, then maximize distinct predictions.
// This is an experiment suggestion; the child must still make and test a prediction.
export function suggestLabCase(mission,alive,used=[]){
 const rules=labHypotheses(mission).filter(h=>alive.includes(h.id));if(rules.length<2)return null;
 const seen=new Set(used);let best=null;
 for(const task of labCases(mission)){if(seen.has(labKey(task)))continue;const counts={};for(const h of rules){const answer=runRecipe(mission,h.recipe,task).prediction;counts[answer]=(counts[answer]||0)+1;}const groups=Object.keys(counts).length,worst=Math.max(...Object.values(counts));if(groups<2)continue;if(!best||worst<best.worst||worst===best.worst&&groups>best.groups)best={task,groups,worst};}
 return best;
}
export function newLab(mission){const rules=labHypotheses(mission);if(!['fraction','pattern'].includes(mission))throw Error('Choose a mission.');return{version:1,id:globalThis.crypto?.randomUUID?.()||String(Date.now()),mission,phase:'experiment',task:mission==='fraction'?{kind:'fraction',pair:[2,4]}:{kind:'pattern',block:['sun','leaf'],length:4},choice:null,test:null,evidence:[],attempts:[],alive:rules.map(h=>h.id),recipe:structuredClone(rules[1].recipe),edits:[],runs:[],verifications:[],verified:null,hints:0,explanation:'',createdAt:Date.now()};}
export function labStep(old,a){
 const s=structuredClone(old),mission=s.mission;
 switch(a.type){
 case'case':validateLabTask(a.task,mission);s.task=structuredClone(a.task);s.choice=null;s.test=null;s.phase='experiment';break;
 case'choose':if(!(mission==='fraction'?LAB_CHOICES:LAB_TOKENS).includes(a.value))throw Error('Choose your prediction.');s.choice=a.value;s.test=null;break;
 case'test':if(!s.choice)throw Error('Choose your own prediction first.');{const predictions=labHypotheses(mission).map(h=>({id:h.id,prediction:runRecipe(mission,h.recipe,s.task).prediction})),correct=s.choice===labTruth(s.task),separates=new Set(predictions.filter(h=>s.alive.includes(h.id)).map(h=>h.prediction)).size>1;s.test={task:structuredClone(s.task),choice:s.choice,correct,predictions,separates};s.attempts.push({...structuredClone(s.test),hints:s.hints});}break;
 case'keep':if(!s.test?.correct||!s.test.separates)throw Error('Keep a correct prediction that separates at least two remaining rules.');if(s.evidence.some(e=>labKey(e.task)===labKey(s.task)))throw Error('This clue is already in your notebook.');{const before=[...s.alive];s.alive=s.alive.filter(id=>s.test.predictions.find(h=>h.id===id).prediction===labTruth(s.task));s.evidence.push({...structuredClone(s.test),eliminated:before.filter(id=>!s.alive.includes(id)),hints:s.hints});s.test=null;s.choice=null;}break;
 case'suggest':{const next=suggestLabCase(mission,s.alive,s.evidence.map(e=>labKey(e.task)));if(!next)throw Error('Your clues already separate the remaining rules. Try building your recipe.');s.task=next.task;s.choice=null;s.test=null;s.phase='experiment';s.hints++;}break;
 case'recipe':if(!s.evidence.length)throw Error('Keep one useful clue first.');s.phase='recipe';break;
 case'edit':if(!s.evidence.length)throw Error('Keep one clue before editing your recipe.');{const next={...s.recipe,[a.slot]:a.value};validateRecipe(mission,next);s.recipe=next;s.verified=null;s.phase='recipe';s.edits.push({slot:a.slot,value:a.value});}break;
 case'run':if(!s.evidence.length)throw Error('Keep one clue before running a recipe.');s.runs.push({task:structuredClone(s.task),recipe:structuredClone(s.recipe),trace:runRecipe(mission,s.recipe,s.task)});break;
 case'verify':if(!s.evidence.length)throw Error('Keep one clue before checking a recipe.');s.verified=verifyRecipe(mission,s.recipe);s.verifications.push(structuredClone(s.verified));s.phase=s.verified.correct?'complete':'recipe';break;
 case'counterexample':if(!s.verified?.counterexample)throw Error('Check your recipe first.');s.task=structuredClone(s.verified.counterexample.task);s.phase='experiment';s.choice=null;s.test=null;break;
 case'explain':s.explanation=String(a.value).slice(0,400);break;
 case'support':if(!['independent','tutor','unknown'].includes(a.value))throw Error('Choose a help record.');s.support=a.value;break;
 default:throw Error('Unknown Rule Lab action.');}
 return s;
}
export function restoreLab(saved,mission){
 if(saved?.version!==1||saved.mission!==mission||!['experiment','recipe','complete'].includes(saved.phase))throw Error('Saved lab could not be restored.');
 validateLabTask(saved.task,mission);validateRecipe(mission,saved.recipe);
 for(const name of ['evidence','attempts','edits','runs','verifications','alive'])if(!Array.isArray(saved[name]))throw Error('Saved lab record is incomplete.');
 const copy=structuredClone(saved),rules=labHypotheses(mission);let alive=rules.map(h=>h.id);const seen=new Set();
 for(const e of copy.evidence){validateLabTask(e.task,mission);if(e.choice!==labTruth(e.task)||seen.has(labKey(e.task)))throw Error('A saved clue needs recovery.');seen.add(labKey(e.task));const before=[...alive];alive=alive.filter(id=>runRecipe(mission,rules.find(h=>h.id===id).recipe,e.task).prediction===labTruth(e.task));e.eliminated=before.filter(id=>!alive.includes(id));}
 copy.alive=alive;copy.test=null;copy.choice=null;copy.explanation=String(copy.explanation||'').slice(0,400);if(!['independent','tutor','unknown'].includes(copy.support))copy.support='unknown';
 if(copy.phase!=='experiment'&&!copy.evidence.length)throw Error('A saved recipe is missing its supporting clue.');
 if(copy.verified){copy.verified=verifyRecipe(mission,copy.recipe);if(copy.phase==='complete'&&!copy.verified.correct)copy.phase='recipe';}else if(copy.phase==='complete')copy.phase='recipe';return copy;
}
export function labCertificate(s,alias){
 const checked=verifyRecipe(s.mission,s.recipe);if(s.phase!=='complete'||!s.verified?.correct||!checked.correct||!s.evidence.length)throw Error('Verify your recipe before making a postcard.');
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const recipeLines=s.mission==='fraction'?[['fewer','fewer equal parts than the right whole'],['equal','the same number of equal parts'],['more','more equal parts than the right whole']].map(([k,label])=>`If the left whole has ${label}, ${s.recipe[k]==='equal'?'call the pieces the same size':`choose the ${s.recipe[k]} piece`}.`):[`Start at the ${s.recipe.start} loop tile.`,s.recipe.move==='shown'?'Move one step for every shown tile.':'Do not move the pointer.',s.recipe.end==='wrap'?'At the end, start at the first tile again.':'At the end, stay at the last tile.'];
 const title=s.mission==='fraction'?'Fraction Foundry':'Pattern Grove';const caseLabel=t=>t.kind==='fraction'?`1/${t.pair[0]} vs 1/${t.pair[1]}`:`${t.block.join(' / ')}; ${t.length} shown tiles`;
 return`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Fixiverse · My rule postcard</title><style>body{font:16px/1.7 system-ui,sans-serif;color:#3f583e;background:#f5efdb;margin:0;padding:7%}main{max-width:850px;margin:auto;background:#fff9e8;padding:6%;border:1px solid #c5caaa;border-radius:20px}h1,h2{font-family:Georgia,serif}h1{font-size:38px}h2{font-size:24px}pre{white-space:pre-wrap;background:#e5ebd4;padding:18px;border-radius:10px}li{margin:15px 0}small{color:#627451}@media print{body{background:white;padding:0}main{border:0}}</style><main><small>FIXIVERSE / MY RULE POSTCARD</small><h1>${esc(alias)}’s ${title} discovery</h1><p><b>${checked.passed} of ${checked.total} cases</b> match the expected result in the checked set.</p><p>${esc(checked.scope)}</p><h2>My recipe</h2><ol>${recipeLines.map(line=>`<li>${esc(line)}</li>`).join('')}</ol><h2>The clues I kept</h2><ol>${s.evidence.map(e=>`<li>${esc(caseLabel(e.task))}: my prediction was ${esc(e.choice)}. It ruled out ${e.eliminated.map(id=>esc(labHypotheses(s.mission).find(h=>h.id===id)?.name||id)).join('; ')||'no additional rules'}.</li>`).join('')}</ol><h2>In my words</h2><p>${esc(s.explanation||'No explanation recorded.')}</p><h2>Support and process</h2><p>${s.attempts.length} prediction tests · ${s.edits.length} recipe edits · ${s.hints} experiment suggestions.</p><p>Tutor help: ${esc(({independent:'no tutor help reported',tutor:'tutor help reported',unknown:'not known'})[s.support||'unknown'])}.</p><small>This postcard records app actions and a finite recipe check. It does not establish learning, mastery, or that the rule works outside the stated set. No external scripts or services are used.</small></main></html>`;
}
