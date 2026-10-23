import {labCases,labHypotheses,runRecipe,labTruth} from './rule-lab.js';
const lessonPrediction=(mission,rule,task)=>runRecipe(mission,rule.recipe,task).prediction;
// Exact set cover over at most four rule bits: O(examples * 16), not 2^examples.
export function lessonLens(state){
 const rules=labHypotheses(state.mission),examples=state.examples;
 const masks=examples.map(e=>rules.reduce((bits,h,i)=>bits|(lessonPrediction(state.mission,h,e.task)!==e.choice?1<<i:0),0));
 const target=masks.reduce((a,b)=>a|b,0),dp=Array(1<<rules.length).fill(null);dp[0]=[];
 masks.forEach((mask,index)=>{const before=dp.map(v=>v&&[...v]);before.forEach((path,bits)=>{if(!path)return;const next=bits|mask,candidate=[...path,index];if(!dp[next]||candidate.length<dp[next].length)dp[next]=candidate;});});
 const fitting=skip=>rules.filter(h=>examples.every((e,i)=>i===skip||lessonPrediction(state.mission,h,e.task)===e.choice));
 const full=fitting(-1),cases=labCases(state.mission);
 return{minimum:dp[target],survivors:full.map(h=>h.id),scope:rules.length,examples:examples.map((e,index)=>{
  const without=fitting(index),added=without.filter(h=>!full.some(x=>x.id===h.id));let witness=null;
  if(added.length)for(const task of cases){const withChoices=[...new Set(full.map(h=>lessonPrediction(state.mission,h,task)))],withoutChoices=[...new Set(without.map(h=>lessonPrediction(state.mission,h,task)))];if(withoutChoices.some(p=>!withChoices.includes(p))){witness={task:structuredClone(task),withChoices,withoutChoices,expected:labTruth(task)};break;}}
  return{index,task:structuredClone(e.task),uniqueEvidence:added.length>0,restoredRules:added.map(h=>({id:h.id,name:h.name})),witness};
 })};
}
export function mentorEvidence(state){
 const rows=state.audits.flatMap((a,r)=>a.cards.filter(c=>c.checked).map((c,i)=>({round:r+1,finishedRound:true,item:i+1,...structuredClone(c)})));
 if(state.phase==='challenge')rows.push(...state.challenges.filter(c=>c.checked).map((c,i)=>({round:state.audits.length+1,finishedRound:false,item:i+1,...structuredClone(c)})));
 for(const r of rows){r.outcome=r.choice==='unsure'?'unsure':r.choice===labTruth(r.task)?'fits':'revisit';r.itemTraces=Number.isFinite(r.hintsBefore)&&Number.isFinite(r.hintsAtCheck)?Math.max(0,r.hintsAtCheck-r.hintsBefore):null;}
 const latest=rows.filter(r=>r.round===(rows.at(-1)?.round)),focus=latest.find(r=>r.outcome==='revisit')||latest.find(r=>r.outcome==='unsure');let target=null;
 if(focus){const t=focus.task;target=state.mission==='fraction'?{skill:t.pair[0]===t.pair[1]?'equal':'compare',title:t.pair[0]===t.pair[1]?'When both pieces match':'Compare one piece from matching wholes',why:`The learner ${focus.outcome==='unsure'?'reported uncertainty on':'missed'} a fraction challenge in Teach Pip. Pip’s answer is not used to assign this practice.`}:{skill:t.block.length===3?'three-loop':'two-loop',title:t.block.length===3?'Follow a three-tile loop':'Follow the whole little loop',why:`The learner ${focus.outcome==='unsure'?'reported uncertainty on':'missed'} a ${t.block.length}-tile challenge in Teach Pip. Pip’s answer is not used to assign this practice.`};}
 return{rows,latest,counts:{fits:latest.filter(r=>r.outcome==='fits').length,revisit:latest.filter(r=>r.outcome==='revisit').length,unsure:latest.filter(r=>r.outcome==='unsure').length},target};
}
export function mentorEvidenceCSV(alias,states){
 const rows=[['learner','mission','round','finished_round','item','task','learner_response','model_answer','response_outcome','model_traces_this_item','adult_help_reported_for_lesson','teaching_readiness']];
 for(const state of states.filter(Boolean))for(const r of mentorEvidence(state).rows)rows.push([alias,state.mission,r.round,r.finishedRound,r.item,r.task.kind==='fraction'?`1/${r.task.pair[0]} vs 1/${r.task.pair[1]}`:`${r.task.block.join('/')} length ${r.task.length}`,r.choice,labTruth(r.task),r.outcome,r.itemTraces??'unknown',state.support,state.confidence??'not recorded']);
 const cell=x=>{let s=String(x??'');if(/^\s*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return{csv:rows.map(row=>row.map(cell).join(',')).join('\r\n'),count:rows.length-1};
}
