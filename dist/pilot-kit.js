export const PILOT_FORMS={
 A:{Fraction:[{pair:[3,6],answer:'left'},{pair:[5,4],answer:'right'},{pair:[7,7],answer:'equal'}],Pattern:[{block:['sun','leaf'],length:5,answer:'leaf'},{block:['moon','star'],length:6,answer:'moon'},{block:['leaf','sun','moon'],length:5,answer:'moon'}]},
 B:{Fraction:[{pair:[8,4],answer:'right'},{pair:[6,7],answer:'left'},{pair:[6,6],answer:'equal'}],Pattern:[{block:['star','moon'],length:5,answer:'moon'},{block:['leaf','star'],length:6,answer:'leaf'},{block:['moon','leaf','star'],length:5,answer:'star'}]},
 C:{Fraction:[{pair:[5,10],answer:'left'},{pair:[9,8],answer:'right'},{pair:[8,8],answer:'equal'}],Pattern:[{block:['leaf','moon'],length:5,answer:'moon'},{block:['sun','star'],length:6,answer:'sun'},{block:['star','sun','leaf'],length:5,answer:'leaf'}]}
};
export const PILOT_STAGES=['Before','Play','After','Next-day'];
export function pilotAssignment(index){if(!Number.isInteger(index)||index<0||index>7)throw Error('Use learner index 0 to 7.');const forms=['A','B','C'];return{id:`K${String(index+1).padStart(2,'0')}`,Before:forms[index%3],After:forms[(index+1)%3],'Next-day':forms[(index+2)%3],Play:''};}
