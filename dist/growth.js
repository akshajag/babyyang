// Evidence-aware practice and a small, explicitly non-diagnostic pilot protocol.
export const DAY_MS=86400000;
export const CHECK_PHASES=['before','after','later'];
const symbols=['sun','leaf','star','moon'];
export const taskKey=t=>t.kind==='fraction'?`f:${[...t.pair].sort((a,b)=>a-b).join(':')}`:`p:${t.block.join(':')}:${t.length}`;
export const expected=t=>t.kind==='fraction'?(t.pair[0]===t.pair[1]?'equal':t.pair[0]<t.pair[1]?'left':'right'):t.block[t.length%t.block.length];
export function taskBank(mission){
 if(!['fraction','pattern'].includes(mission))throw Error('Choose a mission.');
 if(mission==='fraction'){const out=[];for(let a=2;a<=10;a++)for(let b=a;b<=10;b++)out.push({kind:'fraction',pair:[a,b],skill:a===b?'equal':b-a===1?'close':'compare'});return out;}
 const out=[];for(const a of symbols)for(const b of symbols)if(a!==b){for(const length of [4,5,6,7])out.push({kind:'pattern',block:[a,b],length,skill:'two-loop'});for(const c of symbols)if(c!==a&&c!==b)for(const length of [4,5,7,8])out.push({kind:'pattern',block:[a,b,c],length,skill:'three-loop'});}return out;
}
export function chooseTasks(mission,used=[],offset=0,skills=null){
 const bank=taskBank(mission),seen=new Set(used),wanted=skills||(mission==='fraction'?['compare','close','equal']:['two-loop','two-loop','three-loop']);
 return wanted.map((skill,i)=>{const pool=bank.filter(t=>t.skill===skill&&!seen.has(taskKey(t)));if(!pool.length)throw Error('No unused questions remain for this check.');const t=structuredClone(pool[(offset+i*3)%pool.length]);if(t.kind==='fraction'&&t.pair[0]!==t.pair[1]&&(offset+i)%2)t.pair.reverse();seen.add(taskKey(t));return t;});
}
export function practiceTarget(f,p,mission){
 if(mission==='fraction'){const missed=[...(f?.checks||[]),...(f?.experiments||[])].filter(a=>a.choice!=null&&a.choice!==a.truth);return missed.some(a=>a.pair?.[0]===a.pair?.[1])?{skill:'equal',title:'When both pieces match',why:'A recorded comparison missed equal-sized pieces.'}:{skill:'compare',title:'More parts, smaller pieces',why:missed.length?'A recorded comparison needs another look.':'Start with comparing one piece from matching wholes.'};}
 const three=(p?.answers||[]).some((a,i)=>!a.correct&&i>0)||(p?.practices||[]).some(a=>a.block?.length===3&&a.choice!==a.expected);
 return {skill:three?'three-loop':'two-loop',title:three?'Follow a three-tile loop':'Follow the whole little loop',why:three?'A recorded three-tile check needs another look.':'Practice following the loop instead of copying its last tile.'};
}
export function newPractice(mission,target,reserved=[],offset=0){
 let tasks;try{tasks=chooseTasks(mission,reserved,offset,Array(3).fill(target.skill));}catch{throw Error('No unreserved practice questions remain. Finish the check-ins or choose the other mission.');}
 return{version:1,mission,target,tasks,index:0,answers:[],attempts:[],hints:0,choice:null,feedback:'',tested:false,revealed:false,complete:false};
}
export function practiceStep(old,a){
 const s=structuredClone(old);if(s.complete)throw Error('This practice visit is finished.');const t=s.tasks[s.index];
 if(a.type==='choose'){if(s.tested)throw Error('Choose the next question.');if(!(t.kind==='fraction'?['left','equal','right']:symbols).includes(a.value))throw Error('Choose an answer.');s.choice=a.value;}
 else if(a.type==='hint'){s.hints++;s.feedback=t.kind==='fraction'?'The wholes match. More equal parts means each piece is smaller. Matching part counts mean matching pieces.':'Say the small loop. After its last tile, start at the first tile again.';}
 else if(a.type==='submit'){if(!s.choice||s.tested)throw Error('Choose an answer first.');const correct=s.choice===expected(t);s.attempts.push({index:s.index,choice:s.choice,correct,hints:s.hints});const tries=s.attempts.filter(v=>v.index===s.index).length;if(correct||tries>=2){s.tested=true;s.revealed=!correct;s.answers.push({task:structuredClone(t),firstTry:correct&&tries===1,correct,attempts:tries,hints:s.hints,revealed:!correct});}s.feedback=correct?'Your idea fits. You can explain it to Pip.':tries>=2?`Let’s look together: ${t.kind==='fraction'?{left:'the left piece is bigger',right:'the right piece is bigger',equal:'the pieces match'}[expected(t)]:`the loop needs ${expected(t)} next`}. Trace the model, then try a new question.`:'A useful clue. Take a hint or compare the model, then try again.';}
 else if(a.type==='next'){if(!s.tested)throw Error('Check this question first.');if(s.index===2)s.complete=true;else s.index++;s.choice=null;s.tested=false;s.revealed=false;s.feedback='';}
 else throw Error('Unknown practice action.');return s;
}
export function newPilot(mission,now=Date.now()){
 const plan={};let used=[];for(let i=0;i<3;i++){plan[CHECK_PHASES[i]]=chooseTasks(mission,used,i*7);used.push(...plan[CHECK_PHASES[i]].map(taskKey));}return{version:1,mission,createdAt:now,plan,checks:{},current:null};
}
export function beginCheck(old,phase,now=Date.now(),context={}){
 const s=structuredClone(old);if(!CHECK_PHASES.includes(phase))throw Error('Choose a check-in.');if(s.checks[phase]?.complete)throw Error('This check-in is already recorded.');if(s.current){if(s.current.phase!==phase)throw Error('Finish the current check-in first.');return s;}
 const i=CHECK_PHASES.indexOf(phase);if(i>0&&!s.checks[CHECK_PHASES[i-1]]?.complete)throw Error('Finish the earlier check-in first.');if(phase==='later'&&now-s.checks.after.completedAt<DAY_MS)throw Error('The later check opens 24 hours after the after check.');
 s.current={phase,startedAt:now,context:structuredClone(context),tasks:structuredClone(s.plan[phase]),answers:[],index:0,choice:null,readiness:null,hints:0,adultHelp:null,complete:false};return s;
}
export function checkStep(old,a,now=Date.now()){
 const s=structuredClone(old),c=s.current;if(!c)throw Error('Start a check-in first.');
 if(a.type==='readiness'){if(!['ready','unsure','help','skip'].includes(a.value)||c.readiness!==null)throw Error('Choose a readiness response once.');c.readiness=a.value;}
 else if(a.type==='hint'){if(c.readiness===null||c.index>=3)throw Error('Choose a readiness response first.');c.hints++;}
 else if(a.type==='answer'){if(c.readiness===null||c.index>=3||a.index!==c.index)throw Error('This question is not available.');const t=c.tasks[c.index];if(!(t.kind==='fraction'?['left','equal','right']:symbols).includes(a.value))throw Error('Choose an answer.');c.answers.push({task:structuredClone(t),choice:a.value,correct:a.value===expected(t),hints:c.hints});c.index++;}
 else if(a.type==='finish'){if(c.answers.length!==3||!['independent','tutor','unknown'].includes(a.value))throw Error('Answer three questions and record help used.');c.adultHelp=a.value;c.complete=true;c.completedAt=now;s.checks[c.phase]=c;s.current=null;}
 else throw Error('Unknown check-in action.');return s;
}
export function pilotSummary(pilot){return CHECK_PHASES.map(phase=>{const c=pilot?.checks?.[phase];return{phase,recorded:!!c?.complete,correct:c?.answers.filter(a=>a.correct).length??null,total:c?.answers.length??0,hints:c?.hints??null,adultHelp:c?.adultHelp??null,readiness:c?.readiness??null,completedAt:c?.completedAt??null};});}
export function pilotCSV(learners,read){
 const rows=[['learner','mission','phase','completed_at','item','task','response','correct','cumulative_hints','total_hints','tutor_help','readiness','hours_since_after','prior_practice_visits','prior_mission_phase','prior_exposure']];
 for(const learner of learners)for(const mission of ['fraction','pattern']){const p=read(learner.id,`fixiverse-checkins-${mission}-v1`);for(const phase of CHECK_PHASES){const c=p?.checks?.[phase];if(!c?.complete)continue;c.answers.forEach((a,i)=>rows.push([learner.alias,mission,phase,new Date(c.completedAt).toISOString(),i+1,taskKey(a.task),a.choice,a.correct,a.hints,c.hints,c.adultHelp,c.readiness,phase==='later'?((c.completedAt-p.checks.after.completedAt)/3600000).toFixed(2):'',c.context?.priorPracticeVisits??'unknown',c.context?.missionPhase??'unknown',c.context?.priorExposure??'unknown']));}}
 const cell=x=>{let s=String(x??'');if(/^\s*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return{csv:rows.map(r=>r.map(cell).join(',')).join('\r\n'),rowCount:rows.length-1};
}
