import {OBS_CHECKS} from './dist/observation.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=name=>readFileSync(new URL(`dist/${name}`,import.meta.url),'utf8');
const engine=read('engine.js').replace(/\bexport /g,'');
const appSource=read('app.js');
const imports=appSource.match(/^import \{([^}]+)\} from/)[1];
const app=appSource.replace(/^import .*?;\s*/,'');
const pattern=read('pattern.js').replace(/\bexport /g,'');
const hub=read('hub.js').replace(/^import[^;]+;\s*/gm,'');
const patternNames='TOKENS,nextToken,patternPrediction,newPattern,PATTERN_CHECKS,patternReduce';
const profiles=read('profiles.js').replace(/^import[^;]+;\s*/gm,'').replace(/\bexport /g,'');
const saveTools=read('save-tools.js').replace(/\bexport /g,'');
const recoveryUI=read('recovery-ui.js');
const tutor=read('tutor.js');
const observationEngine=read('observation.js').replace(/\bexport /g,'');
const observationUI=read('observation-ui.js').replace(/^import[^;]+;\s*/gm,'');
const bookshelf=read('landing.js')+'\n'+read('bookshelf.js');
const pilotKit=read('pilot-kit.js').replace(/\bexport /g,'');
const sessionKit=read('session-kit.js').replace(/^import[^;]+;\s*/gm,'').replace(/\bexport /g,'');
const sessionGuidance=read('session-guidance.js').replace(/\bexport /g,'');
const sessionUI=read('session-ui.js').replace(/^import[^;]+;\s*/gm,'');
const demoTour=read('scroll-model.js').replace(/\bexport /g,'')+'\n'+read('tour.js');
const journeyState=read('journey-state.js').replace(/^import[^;]+;\s*/gm,'').replace(/\bexport /g,'');
const growth=read('growth.js').replace(/\bexport /g,'');
const growthUI=read('growth-ui.js').replace(/^import[^;]+;\s*/gm,'');
const labEngine=read('rule-lab.js').replace(/\bexport /g,'');
const labUI=read('rule-lab-ui.js').replace(/^import[^;]+;\s*/gm,'');
const mentorEngine=read('mentor.js').replace(/^import[^;]+;\s*/gm,'').replace(/\bexport /g,'');
const mentorAnalysis=read('mentor-analysis.js').replace(/^import[^;]+;\s*/gm,'').replace(/\bexport /g,'');
const mentorUI=read('mentor-ui.js').replace(/^import[^;]+;\s*/gm,'');
const labNames='LAB_TOKENS,LAB_CHOICES,labCases,validateLabTask,labKey,labTruth,labHypotheses,newLab,labStep,restoreLab,runRecipe,labCertificate';
const growthNames='DAY_MS,CHECK_PHASES,taskKey,expected,newPractice,practiceTarget,practiceStep,newPilot,beginCheck,checkStep,pilotSummary,pilotCSV';
const roomImage=readFileSync(new URL('dist/assets/tutoring-room.webp',import.meta.url)).toString('base64');
const styles=read('styles.css').replaceAll("url('assets/tutoring-room.webp')",`url('data:image/webp;base64,${roomImage}')`);
const script=`${read("mission-ui.js")}
(()=>{${saveTools}\n${profiles}})();(()=>{${recoveryUI}})();(()=>{${observationEngine}\n${observationUI}})();(()=>{const OBS_CHECKS=${JSON.stringify(OBS_CHECKS)};${pilotKit}
${sessionKit}
${sessionGuidance}
${sessionUI}})();(()=>{${engine}
${pattern}
${journeyState}})();${demoTour}
(()=>{${tutor}})();${bookshelf}\n(()=>{const {${growthNames}}=(()=>{${growth}\nreturn {${growthNames}};})();${growthUI}})();\n(()=>{const {${labNames}}=(()=>{${labEngine}\nreturn {${labNames}};})();${labUI}\n${mentorEngine}\n${mentorAnalysis}\n${mentorUI}})();\n(()=>{const {${imports}}=(()=>{${engine}\nreturn {${imports}};})();\n${app}})();\n(()=>{const {${patternNames}}=(()=>{${pattern}\nreturn {${patternNames}};})();\n${hub}})();`;
// Check the bundled script as well as its separate source modules.
new Function(script);
const html=read('index.html').replace('<link rel="stylesheet" href="styles.css">',()=>`<style>${styles}</style>`).replace('<script type="module" src="hub.js"></script>',()=>`<script type="module">${script}</script>`);
const destination=new URL('./index.html',import.meta.url);
writeFileSync(destination,html);
console.log('Built index.html');
