export const VERSION='0.1.0';
export const RULES={
  bigger:{name:'More parts → bigger piece',short:'Choose the larger bottom number',description:'If both wholes match, choose the piece with the larger bottom number.'},
  smaller:{name:'More parts → smaller piece',short:'Choose the smaller bottom number',description:'For ONE piece from matching wholes, fewer equal parts means a bigger piece. Matching bottom numbers mean equal pieces.'},
  equal:{name:'Every piece is equal',short:'Always choose “same size”',description:'Call both pieces the same size, whatever the bottom numbers.'}
};
export const key=p=>[...p].sort((a,b)=>a-b).join(':');
export function validatePair(p){if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n)||n<2||n>8))throw Error('Use two whole-number denominators from 2 to 8.');}
export function truth(p){validatePair(p);return p[0]===p[1]?'equal':p[0]<p[1]?'left':'right';}
export function predict(rule,p){validatePair(p);if(!Object.hasOwn(RULES,rule))throw Error('Unknown rule.');if(p[0]===p[1]||rule==='equal')return'equal';return(rule==='smaller'?p[0]<p[1]:p[0]>p[1])?'left':'right';}
export const isWitness=p=>predict('bigger',p)!==truth(p);
export function fresh(seen){const used=new Set(seen.map(key));const pairs=[];for(let a=2;a<=8;a++)for(let b=a+1;b<=8;b++)if(!used.has(key([a,b])))pairs.push([a,b]);const eq=Array.from({length:7},(_,i)=>[i+2,i+2]).find(p=>!used.has(key(p)));if(pairs.length<2||!eq)throw Error('No fresh examples left. Finish this session and return later.');return[pairs[0],[pairs[1][1],pairs[1][0]],eq];}
export function createSession(){return{version:VERSION,id:globalThis.crypto?.randomUUID?.()||`session-${Date.now()}`,phase:'welcome',pair:[3,6],prediction:null,choice:null,tested:null,witness:null,rule:'bigger',candidate:null,reason:null,repairPassed:false,message:null,seen:[[2,4]],experiments:[],hints:[],adultHelp:false,checks:[],checkIndex:0,checkChoice:null,checkResult:null,verificationAttempts:0,confidenceBefore:null,confidenceAfter:null,events:[],access:{large:false,motion:false},overlay:false};}
function requirePhase(s,...phases){if(!phases.includes(s.phase))throw Error('That action is not available at this step.');}
const choices=['left','right','equal','unsure'];
function validChoice(c){if(!choices.includes(c))throw Error('Choose a piece, same size, or not sure.');}
export function reduce(previous,action){
  const s=structuredClone(previous);s.message=null;
  const log=(type,data={})=>s.events.push({type,...data,at:new Date().toISOString()});
  switch(action.type){
    case 'START':requirePhase(s,'welcome');s.phase='predict';s.confidenceBefore=action.feeling||'skip';log('started',{feeling:s.confidenceBefore});break;
    case 'PREDICT':requirePhase(s,'predict');if(s.prediction!==null)throw Error('Prediction already recorded.');validChoice(action.choice);s.prediction=action.choice;log('prediction',{choice:action.choice,pair:[2,4]});break;
    case 'EXPLORE':requirePhase(s,'predict');if(s.prediction===null)throw Error('Make a prediction or choose not sure.');s.phase='build';break;
    case 'PAIR':requirePhase(s,'build');validatePair(action.pair);s.pair=action.pair;s.choice=null;s.tested=null;s.overlay=false;break;
    case 'CHOOSE':requirePhase(s,'build');validChoice(action.choice);s.choice=action.choice;s.tested=null;break;
    case 'TEST':{
      requirePhase(s,'build');if(s.choice===null)throw Error('Choose a prediction first.');
      const distinct=new Set(s.experiments.map(e=>key(e.pair)));if(distinct.size>=5&&!distinct.has(key(s.pair)))throw Error('You have explored five different pairs. Revisit one, save evidence, or finish for today.');
      s.tested={pair:[...s.pair],choice:s.choice,truth:truth(s.pair),machine:predict('bigger',s.pair),hints:s.hints.filter(h=>h.phase==='build').map(h=>h.id)};
      s.experiments.push(s.tested);s.seen.push([...s.pair]);log('experiment',s.tested);break;
    }
    case 'SAVE':requirePhase(s,'build');if(!s.tested||s.tested.choice!==s.tested.truth||!isWitness(s.tested.pair))throw Error('Find a pair where the machine disagrees, and identify the larger piece.');s.witness=structuredClone(s.tested);s.phase='repair';log('witness_saved',{pair:s.witness.pair});break;
    case 'RULE':requirePhase(s,'repair');if(!Object.hasOwn(RULES,action.rule))throw Error('Unknown rule.');s.candidate=action.rule;s.repairPassed=false;break;
    case 'REASON':requirePhase(s,'repair');if(!['parts','same','tutor'].includes(action.reason))throw Error('Choose an explanation.');s.reason=action.reason;s.repairPassed=false;if(action.reason==='tutor')s.adultHelp=true;break;
    case 'PATCH':requirePhase(s,'repair');if(!s.candidate||!s.reason)throw Error('Choose a rule and a reason first.');if(!s.witness||!isWitness(s.witness.pair)||s.witness.choice!==truth(s.witness.pair))throw Error('Valid saved evidence is required.');log('patch_tested',{candidate:s.candidate,reason:s.reason});if(s.candidate!=='smaller'){s.message='This rule still disagrees with your evidence. Try another repair.';break;}if(s.reason==='same'){s.message='Look at your two pieces: are they actually the same size? Revisit your reason.';break;}s.rule='smaller';s.repairPassed=true;log('rule_repaired');break;
    case 'BEGIN_CHECK':requirePhase(s,'repair','complete');if(!s.repairPassed||!s.witness)throw Error('Repair the rule using your evidence first.');if(s.verificationAttempts>=2)throw Error('You have finished two checks. Save your work and return another day.');s.checks=fresh(s.seen).map(pair=>({pair,choice:null,truth:truth(pair),hints:[]}));s.seen.push(...s.checks.map(c=>[...c.pair]));s.checkIndex=0;s.checkChoice=null;s.checkResult=null;s.overlay=false;s.phase='verify';s.verificationAttempts++;log('check_started',{pairs:s.checks.map(c=>c.pair),attempt:s.verificationAttempts});break;
    case 'CHECK_CHOICE':requirePhase(s,'verify');if(s.checkResult)throw Error('Continue to the next case.');validChoice(action.choice);s.checkChoice=action.choice;break;
    case 'CHECK':{
      requirePhase(s,'verify');if(s.checkResult||s.checkChoice===null)throw Error('Choose your comparison first.');const c=s.checks[s.checkIndex];c.choice=s.checkChoice;c.hints=s.hints.filter(h=>h.phase==='verify'&&h.index===s.checkIndex&&h.attempt===s.verificationAttempts).map(h=>h.id);s.seen.push([...c.pair]);s.checkResult={correct:c.choice===c.truth,truth:c.truth};log('check_submitted',{...c,attempt:s.verificationAttempts});break;
    }
    case 'NEXT_CHECK':requirePhase(s,'verify');if(!s.checkResult)throw Error('Submit this comparison first.');if(s.checkIndex<2){s.checkIndex++;s.checkChoice=null;s.checkResult=null;s.overlay=false;}else{s.phase='complete';log('check_finished',{correct:s.checks.filter(c=>c.choice===c.truth).length,total:3});}break;
    case 'HINT':if(!['predict','build','repair','verify'].includes(s.phase))throw Error('Start investigating to use a hint.');if(!['align','overlay','worked'].includes(action.id))throw Error('Unknown hint.');s.hints.push({id:action.id,phase:s.phase,index:s.checkIndex,attempt:s.verificationAttempts});if(action.id==='worked')s.seen.push([2,4]);s.overlay=action.id;log('hint',{id:action.id,phase:s.phase});break;
    case 'ADULT_HELP':s.adultHelp=true;log('tutor_help_recorded');break;
    case 'ACCESS':if(!['large','motion'].includes(action.setting))throw Error('Unknown setting.');s.access[action.setting]=!s.access[action.setting];break;
    case 'CONFIDENCE':if(!['ready','unsure','help','skip'].includes(action.value))throw Error('Invalid reflection.');s.confidenceAfter=action.value;log('reflection',{value:action.value});break;
    case 'FINISH':if(s.phase==='welcome')throw Error('Start a mission first.');s.phase='complete';log('practice_finished');break;
    default:throw Error('Unknown action.');
  }
  return s;
}
export function summary(s){return{mission:'Fraction Foundry',version:s.version,sessionId:s.id,ruleRepaired:s.repairPassed,witness:s.witness?.pair||null,experiments:s.experiments.length,freshCorrect:s.checks.filter(c=>c.choice===c.truth).length,freshAnswered:s.checks.filter(c=>c.choice!==null).length,instructionalHints:s.hints.length,adultHelp:s.adultHelp?'reported':'not recorded (may be unknown)',confidenceBefore:s.confidenceBefore,confidenceAfter:s.confidenceAfter,accessSettings:s.access,outcome:s.repairPassed&&s.checks.length===3&&s.checks.every(c=>c.choice===c.truth)?'repaired with fresh-case evidence':'practice recorded',note:'Prototype session evidence; not a claim of mastery or validated learning improvement.'};}
export function restore(raw){const s=JSON.parse(raw);if(s.version!==VERSION||!['welcome','predict','build','repair','verify','complete'].includes(s.phase)||!Array.isArray(s.events)||!Array.isArray(s.seen))throw Error('Unsupported saved session.');validatePair(s.pair);if(s.witness)validatePair(s.witness.pair);s.seen.forEach(validatePair);if(!Array.isArray(s.checks)||s.checks.length>3)throw Error('Invalid saved check.');s.checks.forEach(c=>validatePair(c.pair));return s;}


const KEY='fixiverse-investigations-v1';
export function archiveSession(session,summary,storage){
  let history=[];try{history=JSON.parse(storage.getItem(KEY)||'[]');if(!Array.isArray(history))history=[];}catch{}
  const record={...summary,finishedAt:new Date().toISOString(),seen:session.seen,checks:session.checks};
  history=history.filter(r=>r.sessionId!==record.sessionId);history.unshift(record);
  storage.setItem(KEY,JSON.stringify(history.slice(0,30)));return history;
}
export function history(storage){try{const h=JSON.parse(storage.getItem(KEY)||'[]');return Array.isArray(h)?h:[];}catch{return[];}}
export function comparison(records){return records.slice(0,10).map(r=>({date:r.finishedAt,correct:r.freshCorrect,answered:r.freshAnswered,hints:r.instructionalHints,help:r.adultHelp,reflection:r.confidenceAfter}));}


