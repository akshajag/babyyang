import test from 'node:test';
import assert from 'node:assert/strict';
import {guidedInstruction} from '../dist/session-guidance.js';
import {newGuidedSession} from '../dist/session-kit.js';
test('setup instructions work before assessment phases exist',()=>{
  assert.match(guidedInstruction(newGuidedSession()),/save the plan/);
  for(const stage of ['play','waiting','complete']) assert.ok(guidedInstruction({stage}).length>20);
  assert.match(guidedInstruction(null),/recovery/);
});
test('assessment guidance does not reveal answers or change with correctness',()=>{
  for(const stage of ['before','after','nextday']){
    const s={stage,phases:{[stage]:{confidence:null,answers:[]}}};
    assert.match(guidedInstruction(s),/confidence/);
    s.phases[stage].confidence='skip';
    const instruction=guidedInstruction(s);
    s.phases[stage].answers=[{response:'left',expected:'right',correct:false}];
    assert.equal(guidedInstruction(s),instruction);
    s.phases[stage].answers[0]={response:'equal',expected:'equal',correct:true};
    assert.equal(guidedInstruction(s),instruction);
    assert.doesNotMatch(instruction,/left|right|sun|leaf|correct/);
    s.phases[stage].answers=[{},{},{}];
    assert.match(guidedInstruction(s),/All first responses are saved/);
  }
});
