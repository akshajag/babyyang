// Versioned, local-only recovery. Imports create copies and never replace a learner.
export const PROFILE_INDEX='fixiverse-learners-v1';
export const SAVE_KEYS=['fixiverse-guided-session-v1','fixiverse-observations-v1','fixiverse-foundry-v1','fixiverse-pattern-v1','fixiverse-access-v1','fixiverse-investigations-v1','fixiverse-pattern-history-v1','fixiverse-grove-repaired-v1',...['fraction','pattern'].flatMap(m=>[`fixiverse-mentor-${m}-v1`,`fixiverse-rule-lab-${m}-v1`,`fixiverse-checkins-${m}-v1`,`fixiverse-practice-${m}-v1`,`fixiverse-practice-visits-${m}-v1`])];
export const savedKey=(id,k)=>id==='original'?k:`fx:${id}:${k}`;
export function createResilientStorage(native,onFailure=()=>{}){
 const cache=new Map();let failed=!native;
 const fail=()=>{if(!failed){failed=true;onFailure();}};
 return{get memoryOnly(){return failed;},getItem(k){if(!failed){try{const v=native.getItem(k);if(v===null)cache.delete(k);else cache.set(k,v);return v;}catch{fail();}}return cache.get(k)??null;},setItem(k,v){v=String(v);cache.set(k,v);if(!failed)try{native.setItem(k,v);}catch{fail();}},removeItem(k){cache.delete(k);if(!failed)try{native.removeItem(k);}catch{fail();}},
 // New learner records first, index last: a failed import never publishes partial learners.
 commitNew(entries,index){if(failed)throw Error('Browser saving is unavailable. Download a backup before closing this visit.');const written=[];try{for(const [k,v]of entries){if(native.getItem(k)!==null)throw Error('A restored learner ID already exists. Try again.');native.setItem(k,v);written.push(k);}native.setItem(PROFILE_INDEX,index);}catch(err){for(const k of written)try{native.removeItem(k);}catch{}fail();throw Error('Restore could not be saved. Your existing learners were kept. Download a backup and try a browser with available storage.');}for(const [k,v]of entries)cache.set(k,v);cache.set(PROFILE_INDEX,index);}
 };
}
export function snapshotWorkspace(store,model){return{format:'fixiverse-workspace',version:1,createdAt:new Date().toISOString(),learners:model.learners.map(p=>({alias:p.alias,records:Object.fromEntries(SAVE_KEYS.map(k=>[k,store.getItem(savedKey(p.id,k))]).filter(([,v])=>v!==null))}))};}
function inspectJSON(x,depth=0){if(depth>35)throw Error('This backup is nested too deeply.');if(typeof x==='string'&&x.length>300000)throw Error('A backup field is too long.');if(x&&typeof x==='object'){if(Array.isArray(x)&&x.length>10000)throw Error('A backup list is too large.');for(const [k,v]of Object.entries(x)){if(['__proto__','constructor','prototype'].includes(k))throw Error('This backup contains an unsupported field.');inspectJSON(v,depth+1);}}}
function recordShape(k,r){
 const bad=()=>{throw Error('A saved learning record is incomplete or has invalid fields.');};
 const array=(o,n)=>{if(!Array.isArray(o[n])||o[n].some(v=>v===null))bad();};
 const pair=p=>{if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n)||n<2||n>10))bad();};
 const tokens=b=>{if(!Array.isArray(b)||![2,3].includes(b.length)||b.some(t=>!['sun','leaf','star','moon'].includes(t)))bad();};
 const task=t=>{if(!t||!['fraction','pattern'].includes(t.kind))bad();if(t.kind==='fraction')pair(t.pair);else{tokens(t.block);if(!Number.isInteger(t.length)||t.length<2||t.length>8)bad();}};
 const walk=o=>{if(!o||typeof o!=='object')return;for(const [name,v]of Object.entries(o)){if(['index','checkIndex','wrongTests','wrongRepairs','freshCorrect','freshAnswered','instructionalHints','answered','verificationAttempts','firstTryCorrect','total','passed','failed','elapsed','createdAt','startedAt','finishedAtMs'].includes(name)&&(!Number.isFinite(v)||v<0))bad();if(name==='correct'&&!['number','boolean'].includes(typeof v))bad();if(name==='hints'&&!Array.isArray(v)&&(!Number.isInteger(v)||v<0))bad();if(name==='pair')pair(v);if(name==='block')tokens(v);walk(v);}};walk(r);
 if(Array.isArray(r)){if(r.some(v=>!v||typeof v!=='object'||Array.isArray(v)))bad();return;}
 if(k==='fixiverse-guided-session-v1'){if(r.version!==1||!['setup','before','play','after','waiting','nextday','complete'].includes(r.stage))bad();if(r.stage!=='setup'&&(!r.phases||!r.play||!['Fraction','Pattern'].includes(r.focus)))bad();}
 if(k==='fixiverse-observations-v1'){if(r.version!==1)bad();array(r,'sessions');if(r.sessions.length>40)bad();}
 if(k==='fixiverse-foundry-v1'){if(!['welcome','predict','build','repair','verify','complete'].includes(r.phase)||!['bigger','smaller','equal'].includes(r.rule))bad();pair(r.pair);for(const n of ['events','seen','checks','experiments','hints'])array(r,n);r.seen.forEach(pair);r.checks.forEach(c=>pair(c.pair));r.experiments.forEach(c=>pair(c.pair));}
 if(k==='fixiverse-pattern-v1'){if(!['build','repair','check','complete'].includes(r.phase))bad();tokens(r.block);array(r,'answers');if(r.practices!==undefined)array(r,'practices');}
 if(k.startsWith('fixiverse-mentor-')){if(r.version!==1||!['fraction','pattern'].includes(r.mission))bad();array(r,'events');if(r.events.length>600)bad();}
 if(k.startsWith('fixiverse-rule-lab-')){if(!['experiment','recipe','complete'].includes(r.phase))bad();task(r.task);for(const n of ['evidence','attempts','alive','edits','runs','verifications'])array(r,n);if(!r.recipe||typeof r.recipe!=='object')bad();r.evidence.forEach(e=>task(e.task));}
 if(k.startsWith('fixiverse-checkins-')){if(!r.plan||!r.checks||typeof r.checks!=='object')bad();for(const n of ['before','after','later']){if(!Array.isArray(r.plan[n])||r.plan[n].length!==3)bad();r.plan[n].forEach(task);}if(r.current){array(r.current,'answers');array(r.current,'tasks');r.current.tasks.forEach(task);}}
 if(/^fixiverse-practice-(fraction|pattern)-v1$/.test(k)){for(const n of ['tasks','answers','attempts'])array(r,n);if(r.tasks.length!==3||!r.target||typeof r.target.title!=='string')bad();r.tasks.forEach(task);}
}
export function validateBackup(text){
 if(typeof text!=='string'||text.length>5000000)throw Error('Choose a Fixiverse workspace backup smaller than 5 MB.');let data;try{data=JSON.parse(text);}catch{throw Error('This file is not valid JSON. Choose a workspace backup.');}inspectJSON(data);
 if(data?.format!=='fixiverse-workspace'||data.version!==1||!Array.isArray(data.learners)||!data.learners.length||data.learners.length>100)throw Error('Choose a version 1 Fixiverse workspace backup (1 to 100 learners). Learner-record exports are not workspace backups.');
 for(const p of data.learners){if(typeof p?.alias!=='string'||!p.alias.trim()||p.alias.length>40||!p.records||Array.isArray(p.records)||typeof p.records!=='object')throw Error('A learner in this backup is incomplete.');for(const [k,v]of Object.entries(p.records)){if(!SAVE_KEYS.includes(k)||typeof v!=='string')throw Error('This backup contains an unsupported saved record.');let record;try{record=JSON.parse(v);}catch{throw Error('A saved record in this backup is not valid JSON.');}inspectJSON(record);if(record===null)continue;const list=/history|investigations|practice-visits/.test(k);if(list?!Array.isArray(record):k==='fixiverse-grove-repaired-v1'?typeof record!=='boolean':typeof record!=='object'||Array.isArray(record))throw Error('A saved record has the wrong format.');recordShape(k,record);}}
 return structuredClone(data);
}
export function restoreWorkspace(store,model,backup,uuid){
 backup=validateBackup(JSON.stringify(backup));const aliases=new Set(model.learners.map(p=>p.alias.toLowerCase())),ids=new Set(model.learners.map(p=>p.id)),entries=[],added=[];
 for(const p of backup.learners){let alias=p.alias.trim(),n=1;while(aliases.has(alias.toLowerCase())){const suffix=` (copy ${n++})`;alias=p.alias.trim().slice(0,40-suffix.length)+suffix;}aliases.add(alias.toLowerCase());const id=uuid();if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id)||ids.has(id))throw Error('Could not create a unique learner ID. Try again.');ids.add(id);added.push({id,alias});for(const [k,v]of Object.entries(p.records))entries.push([savedKey(id,k),v]);}
 const next={...model,learners:[...model.learners,...added]};store.commitNew(entries,JSON.stringify(next));return{model:next,added};
}
