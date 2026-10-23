import {labCases,labHypotheses,labTruth,labKey,validateLabTask,runRecipe} from './rule-lab.js';
// Pip is an explicit four-rule learner. Examples eliminate inconsistent rules;
// the displayed prediction is always the first surviving rule, never a scripted result.
const mentorKey=t=>t.kind==='fraction'?`f:${[...t.pair].sort((a,b)=>a-b).join(':')}`:labKey(t);
const mentorPrediction=(m,id,t)=>runRecipe(m,labHypotheses(m).find(h=>h.id===id).recipe,t).prediction;
export function mentorSeed(mission,fraction,pattern){
 const candidates=mission==='fraction'?[...(fraction?.experiments||[]),...(fraction?.checks||[])].map(a=>({task:{kind:'fraction',pair:a.pair},choice:a.choice})):(pattern?.practices||[]).map(a=>({task:{kind:'pattern',block:a.block,length:4},choice:a.choice}));
 for(const c of candidates.reverse())try{validateLabTask(c.task,mission);if(c.choice!==labTruth(c.task)&&labHypotheses(mission).some((h,i)=>i>0&&mentorPrediction(mission,h.id,c.task)===c.choice))return structuredClone(c);}catch{}
 return null;
}
export function newMentor(mission='fraction',seed=null){
 if(!['fraction','pattern'].includes(mission))throw Error('Choose fractions or patterns.');
 const rules=labHypotheses(mission),priority=[...rules.slice(1).map(h=>h.id),rules[0].id];let linked=false;
 if(seed){validateLabTask(seed.task,mission);const match=rules.slice(1).find(h=>mentorPrediction(mission,h.id,seed.task)===seed.choice&&seed.choice!==labTruth(seed.task));if(!match)throw Error('That earlier response does not match one of Pip’s little rules.');priority.splice(priority.indexOf(match.id),1);priority.unshift(match.id);linked=true;}
 return {version:1,mission,seed:seed?structuredClone(seed):null,linked,priority,alive:[...priority],phase:'teach',task:seed?structuredClone(seed.task):mission==='fraction'?{kind:'fraction',pair:[2,4]}:{kind:'pattern',block:['sun','leaf'],length:4},choice:null,examples:[],attempts:[],hints:0,feedback:'',challenges:[],challengeIndex:0,audits:[],confidence:null,words:'',support:'unknown',events:[]};
}
export function mentorCoverage(s){const tasks=labCases(s.mission),id=s.alive[0];return{before:tasks.filter(t=>mentorPrediction(s.mission,s.priority[0],t)===labTruth(t)).length,now:tasks.filter(t=>mentorPrediction(s.mission,id,t)===labTruth(t)).length,total:tasks.length,rule:labHypotheses(s.mission).find(h=>h.id===id).name};}
function rebuildMentor(s){s.alive=s.priority.filter(id=>s.examples.every(e=>mentorPrediction(s.mission,id,e.task)===e.choice));if(!s.alive.length)throw Error('These examples do not leave a consistent rule.');}
function mentorChallengeSet(s){
 const used=new Set([...s.examples.map(e=>mentorKey(e.task)),...s.audits.flatMap(a=>a.cards.map(c=>mentorKey(c.task)))]),pool=labCases(s.mission).filter(t=>!used.has(mentorKey(t))),out=[];
 // Put a genuine gap first if Pip still has one; otherwise vary answer/loop types.
 const bad=pool.find(t=>mentorPrediction(s.mission,s.alive[0],t)!==labTruth(t));if(bad)out.push(bad);
 const types=s.mission==='fraction'?['left','right','equal']:['two','three','wrap'];
 for(const type of types){if(out.length===3)break;const t=pool.find(t=>!out.some(x=>mentorKey(x)===mentorKey(t))&&(s.mission==='fraction'?labTruth(t)===type:type==='two'?t.block.length===2:type==='three'?t.block.length===3:t.length%t.block.length===0));if(t)out.push(t);}
 for(const t of pool){if(out.length===3)break;if(!out.some(x=>mentorKey(x)===mentorKey(t)))out.push(t);}
 if(out.length<3)throw Error('This lesson has used the available fresh challenges. Keep your lesson story or try the other subject.');
 return out.map(task=>({task:structuredClone(task),pip:mentorPrediction(s.mission,s.alive[0],task),choice:null,checked:false}));
}
export function mentorStep(old,action){
 if(!action||typeof action.type!=='string')throw Error('Choose a lesson action.');if(old.events.length>=600)throw Error('This lesson notebook is full. Save its story before starting another.');
 const s=structuredClone(old),a=structuredClone(action);s.feedback='';
 if(a.type==='case'){if(s.phase!=='teach')throw Error('Return to teaching first.');validateLabTask(a.task,s.mission);s.task=a.task;s.choice=null;}
 else if(a.type==='choose'){if(!['teach','challenge'].includes(s.phase)||(s.phase==='challenge'&&s.challenges[s.challengeIndex]?.checked))throw Error('Choose the next step first.');const task=s.phase==='teach'?s.task:s.challenges[s.challengeIndex].task;if(a.value!=='unsure'&&!(task.kind==='fraction'?['left','equal','right']:['sun','leaf','star','moon']).includes(a.value))throw Error('Choose a piece or tile.');s.choice=a.value;}
 else if(a.type==='hint'){if(!['teach','challenge'].includes(s.phase))throw Error('Open an example first.');const t=s.phase==='teach'?s.task:s.challenges[s.challengeIndex].task,answer=labTruth(t);s.hints++;s.feedback=t.kind==='fraction'?`The wholes match. ${t.pair[0]===t.pair[1]?'Both have the same number of equal parts, so the pieces match.':`More equal parts make each piece smaller. The ${answer} piece reaches farther because its whole has fewer parts.`}`:`Say the little loop: ${t.block.join(', ')}. After the last loop tile, start again. Follow ${t.length} shown tiles; ${answer} comes next.`;}
 else if(a.type==='teach'){if(s.phase!=='teach'||!s.choice)throw Error('Choose what you want to teach Pip.');const expected=labTruth(s.task);s.attempts.push({task:structuredClone(s.task),choice:s.choice,correct:s.choice===expected,hints:s.hints});if(s.choice!==expected)s.feedback='Let’s check the model together before teaching this example. Pip has not changed its rule. You can choose “Show me how to compare” for a little help.';else if(s.examples.some(e=>mentorKey(e.task)===mentorKey(s.task)))s.feedback='This example is already in your lesson. Try a different one to help Pip learn more.';else{const before=s.alive[0];s.examples.push({task:structuredClone(s.task),choice:s.choice,hints:s.hints});rebuildMentor(s);s.feedback=before===s.alive[0]?'Pip kept the same rule. A different example may help it notice more.':'Your example changed the rule Pip follows. Try a new challenge to see what carries over.';}}
 else if(a.type==='undo'){if(s.phase!=='teach'||!s.examples.length)throw Error('There is no teaching example to take back.');s.examples.pop();rebuildMentor(s);s.feedback='Last example taken back. Pip now follows the examples still in your lesson.';}
 else if(a.type==='challenge'){if(s.phase!=='teach'||!s.examples.length)throw Error('Teach Pip at least one example first.');s.challenges=mentorChallengeSet(s);s.challenges[0].hintsBefore=s.hints;s.challengeIndex=0;s.choice=null;s.phase='challenge';}
 else if(a.type==='check'){const c=s.challenges[s.challengeIndex];if(s.phase!=='challenge'||!s.choice||c.checked)throw Error('Make your own prediction first.');c.choice=s.choice;c.checked=true;c.expected=labTruth(c.task);c.pipCorrect=c.pip===c.expected;c.teacherCorrect=c.choice===c.expected;c.hintsAtCheck=s.hints;}
 else if(a.type==='next'){if(s.phase!=='challenge'||!s.challenges[s.challengeIndex]?.checked)throw Error('Check this challenge first.');if(s.challengeIndex===2){s.audits.push({cards:structuredClone(s.challenges),rule:s.alive[0],examples:s.examples.length});s.phase=s.challenges.every(c=>c.pipCorrect)?'story':'coach';}else{s.challengeIndex++;s.challenges[s.challengeIndex].hintsBefore=s.hints;}s.choice=null;}
 else if(a.type==='coach'){if(s.phase!=='coach')throw Error('Finish Pip’s challenges first.');s.task=structuredClone(s.challenges.find(c=>!c.pipCorrect).task);s.phase='teach';s.choice=null;s.feedback='This new example surprised Pip. What could you teach it now?';}
 else if(a.type==='confidence'){if(s.phase!=='story'||!['ready','unsure','help','skip'].includes(a.value))throw Error('Choose how you feel about teaching.');s.confidence=a.value;}
 else if(a.type==='words'){if(s.phase!=='story'||typeof a.value!=='string'||a.value.length>400)throw Error('Keep your lesson story within 400 characters.');s.words=a.value;}
 else if(a.type==='support'){if(!['unknown','independent','tutor'].includes(a.value))throw Error('Choose a help record.');s.support=a.value;}
 else throw Error('Unknown lesson action.');s.events.push(a);return s;
}
export function restoreMentor(raw,mission){if(!raw||raw.version!==1||raw.mission!==mission||!Array.isArray(raw.events)||raw.events.length>600)throw Error('This lesson could not be restored.');let s=newMentor(mission,raw.seed);for(const a of raw.events)s=mentorStep(s,a);return s;}
