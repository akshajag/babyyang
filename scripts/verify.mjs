import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const run=args=>{const result=spawnSync(process.execPath,args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);};
const walk=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(folder,e.name)):[join(folder,e.name)]);
const sources=[...walk('dist'),...walk('tests'),'build-standalone.mjs','server.mjs','scripts/verify.mjs'].filter(f=>/\.(mjs|js)$/.test(f));
for(const file of sources){
  run(['--check',file]);
  for(const match of readFileSync(file,'utf8').matchAll(/(?:from\s+|import\s*)['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]/g)){
    assert.ok(existsSync(resolve(dirname(file),match[1])),`Missing import: ${file} -> ${match[1]}`);
  }
}
run(['--test',...walk('tests').filter(f=>f.endsWith('.test.mjs')).sort()]);
const before=readFileSync('index.html','utf8');
run(['build-standalone.mjs']);
assert.equal(readFileSync('index.html','utf8'),before,'index.html is stale. Run npm run build and commit the result.');
assert.ok(before.includes('window.fixiverseMissionUI')&&before.includes('guidedInstruction'));
assert.ok(before.includes('data:image/webp;base64,'),'The standalone illustration must be embedded.');
assert.ok(!before.includes('\u2014'),'App text must not contain em dashes.');
assert.ok(!before.includes('QA Release Session')&&!before.includes('QA Storybook Tutor'),'Do not bundle QA learner data.');
console.log(`Verified ${sources.length} JavaScript files, relative imports, all tests and a reproducible standalone build.`);
