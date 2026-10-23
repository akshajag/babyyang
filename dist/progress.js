const KEY='fixiverse-investigations-v1';
export function archiveSession(session,summary,storage){
  let history=[];try{history=JSON.parse(storage.getItem(KEY)||'[]');if(!Array.isArray(history))history=[];}catch{}
  const record={...summary,finishedAt:new Date().toISOString(),seen:session.seen,checks:session.checks};
  history=history.filter(r=>r.sessionId!==record.sessionId);history.unshift(record);
  storage.setItem(KEY,JSON.stringify(history.slice(0,30)));return history;
}
export function history(storage){try{const h=JSON.parse(storage.getItem(KEY)||'[]');return Array.isArray(h)?h:[];}catch{return[];}}
export function comparison(records){return records.slice(0,10).map(r=>({date:r.finishedAt,correct:r.freshCorrect,answered:r.freshAnswered,hints:r.instructionalHints,help:r.adultHelp,reflection:r.confidenceAfter}));}
