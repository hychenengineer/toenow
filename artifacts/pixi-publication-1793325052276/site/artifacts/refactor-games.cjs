// One-off mechanical extraction, kept out of the shipped application.
const fs = require('node:fs');
const path = require('node:path');
const ids = ['spot-quick','number-pop','ball-track','shadow-match','space-scale','add-up','tap-match','block-match'];
const originalFile = 'artifacts/refactor-original-pages.json';
if (!fs.existsSync(originalFile)) fs.writeFileSync(originalFile, JSON.stringify(Object.fromEntries(ids.map(id => [id, fs.readFileSync(`games/${id}/index.html`, 'utf8')]))));
const originals = JSON.parse(fs.readFileSync(originalFile));
function moduleSource(id, part, body, exports, deps = []) {
  const args = deps.map(d => d.variable);
  return `// ${part}: game-specific code. See README.md for responsibilities and load order.\n(function (root, factory) {\n  if (typeof module === 'object' && module.exports) {\n    module.exports = factory(root${deps.map(d => `, require('./${d.file}.js')`).join('')});\n  } else {\n    const games = root.ToenowGameModules = root.ToenowGameModules || {};\n    const game = games['${id}'] = games['${id}'] || {};\n    game.${part} = factory(root${deps.map(d => `, game.${d.file}`).join('')});\n  }\n})(typeof window !== 'undefined' ? window : globalThis, function (window${args.map(a => ', '+a).join('')}) {\n  'use strict';\n${body}\n  return { ${exports.join(', ')} };\n});\n`;
}
function split(id) {
  const dir = `games/${id}`;
  let html = originals[id];
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  if (styles.length !== 1) throw Error(id+' stylesheet count '+styles.length);
  fs.writeFileSync(dir+'/style.css', styles[0][1]);
  html = html.replace(styles[0][0], '<link rel="stylesheet" href="./style.css">');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter(m => !/\bsrc=/.test(m[0]));
  const main = scripts.find(m => m[1].includes('(function ()'));
  if (!main) throw Error(id+' missing controller');
  let code = main[1];
  const files = [];
  function take(part, start, end, exports, deps = [], prefix = '') {
    const a=code.indexOf(start), b=code.indexOf(end,a+start.length);
    if (a<0||b<0) throw Error(id+' missing '+part+' boundary '+start+' / '+end);
    const body=code.slice(a,b);
    // Keep moved source byte-for-byte inside its new module.
    fs.writeFileSync(`${dir}/${part}.js`, moduleSource(id,part,prefix+body,exports,deps));
    code=code.slice(0,a)+`const { ${exports.join(', ')} } = window.ToenowGameModules['${id}'].${part};\n\n        `+code.slice(b);
    files.push(part);
  }
  if (id === 'spot-quick') {
    take('shapes','function cutout(', '// ==================================================\n        // 4. DOM', ['SPECIMEN_POOL']);
    // Rules are non-contiguous because the original state object sits between them.
    const a=code.indexOf('const TIERS ='), b=code.indexOf('const state =',a);
    const c=code.indexOf('function getCurrentScoreTier('), d=code.indexOf('function setupWave(',c);
    const rules=code.slice(a,b)+code.slice(c,d);
    fs.writeFileSync(`${dir}/rules.js`, moduleSource(id,'rules', 'const { SPECIMEN_POOL } = shapes;\n'+rules, ['TIERS','getTierForWave','getCurrentScoreTier','shuffleArray','generateCandidatesForTier'],[{file:'shapes',variable:'shapes'}]));
    code=code.slice(0,c)+code.slice(d);
    code=code.slice(0,a)+`const { TIERS, getTierForWave, getCurrentScoreTier, shuffleArray, generateCandidatesForTier } = window.ToenowGameModules['${id}'].rules;\n        `+code.slice(b);
    files.push('rules');
    const x=code.indexOf('let audioCtx ='), y=code.indexOf('// ==================================================\n        // 3.',x);
    const audio=code.slice(x,y);
    const factory='function createAudio() {\n'+audio+`\nfunction toggle() {\n  audioEnabled = !audioEnabled;\n  if (audioOutput && audioCtx) audioOutput.gain.setValueAtTime(audioEnabled ? 1 : 0, audioCtx.currentTime);\n  if (audioEnabled) ensureAudioContext();\n  return audioEnabled;\n}\nreturn { ensureAudioContext, playCorrectBlip, playIncorrectBuzz, toggle };\n}\n`;
    fs.writeFileSync(`${dir}/audio.js`,moduleSource(id,'audio',factory,['createAudio']));
    code=code.slice(0,x)+`const audio = window.ToenowGameModules['${id}'].audio.createAudio();\n        const { ensureAudioContext, playCorrectBlip, playIncorrectBuzz } = audio;\n        `+code.slice(y);
    const old=`audioEnabled = !audioEnabled;\n          if (audioOutput && audioCtx) {\n            audioOutput.gain.setValueAtTime(audioEnabled ? 1 : 0, audioCtx.currentTime);\n          }\n          if (audioEnabled) ensureAudioContext();`;
    if(!code.includes(old))throw Error('mute boundary');
    code=code.replace(old,'const audioEnabled = audio.toggle();');
    files.push('audio');
  }
  if (id === 'number-pop') {
    take('audio','class SoundSynth', 'const sound = new SoundSynth();', ['SoundSynth']);
    take('rules','function shouldTriggerPerkDraft()', 'const MAX_PARTICLES =', ['shouldTriggerPerkDraft','getWaveType','isBreatherWave','getTimerDecayMultiplier','getMaxBankableTime','getTimerStageInfo','formatSurvivalTime','getCoreCountForWave','getWaveTierName','parseFractionLabel','hasValueCollision','pickUniqueFromList','generateWaveItem','formatNearMissMessage']);
  }
  if (id === 'ball-track') {
    take('audio','class QuantumAudioEngine', 'const audio = new QuantumAudioEngine();', ['QuantumAudioEngine']);
    take('rules','const EARLY_WAVE_TABLE =', '// --- DOM References ---', ['EARLY_WAVE_TABLE','getWaveConfig','calculateWaveClearScore','calculateSpeedMultiplier','calculateOverdriveMultiplier','generateSwapSchedule']);
  }
  if (id === 'shadow-match') {
    take('audio','class SoundEngine', 'const sound = new SoundEngine();', ['SoundEngine']);
    take('shapes','function buildStarVertices(', 'function randomFloat()', ['SHAPE_VOCABULARY','ALL_SHAPE_IDS']);
    take('rules','function randomFloat()', 'const arcadeFrame =', ['randomFloat','traceShapePath','getLevelSpecForWave','shuffleArray','canonicalKey','generateWaveSetup','resolveCapacitiveCardHit','getCognitiveTierBadge'], [{file:'shapes',variable:'shapes'}], 'const { SHAPE_VOCABULARY, ALL_SHAPE_IDS } = shapes;\n');
  }
  if (id === 'space-scale') {
    take('data','const ARCHETYPES =', 'const SYNAPSE_RANKS =', ['ARCHETYPES','GREEK_NAMES']);
    take('audio','class SoundEngine', 'const sound = new SoundEngine();', ['SoundEngine']);
    take('rules','function createRng(', '// Particle pool', ['createRng','shuffleArray','getWaveDurationSec','getLevelForWave','getLevelTimeBonusSec','calculateWaveDuration','computeTorqueTiltAngle','generateOverhauledPuzzle'], [{file:'data',variable:'data'}], 'const { ARCHETYPES, GREEK_NAMES } = data;\n');
  }
  if (id === 'add-up') {
    take('rules','function evaluateSelection(', '// --- Native Web Audio API Synthesizer ---', ['evaluateSelection','randInt','calculateTimeRefund','getChainMultiplier','getLevelInfoForWave','generateWaveData']);
    take('audio','const Sfx =', '// --- Zero-GC Pooled Particles & Shockwaves ---', ['Sfx']);
  }
  if (id === 'tap-match') {
    take('data','const SHAPES =', 'const TOUCH_HITBOX_PADDING =', ['SHAPES','GLYPHS','COLORS','COLOR_MAP']);
    take('audio','class SoundEngine', 'const audio = new SoundEngine();', ['SoundEngine']);
    take('rules','function getWaveConfig(', 'function buildNodeMatrix()', ['getWaveConfig','generateTargetCriteria','doesNodeMatchTarget','computeHitPoints'], [{file:'data',variable:'data'}], 'const { SHAPES, GLYPHS, COLORS } = data;\n');
  }
  if (id === 'block-match') {
    const x=code.indexOf('var audioCtx ='), y=code.indexOf('// --- Staged Phase Transition Briefings',x);
    const body=code.slice(x,y);
    fs.writeFileSync(`${dir}/audio.js`,moduleSource(id,'audio','function createAudio() {\n'+body+`\nfunction toggle() {\n  audioEnabled = !audioEnabled;\n  if (audioOutput && audioCtx) audioOutput.gain.setValueAtTime(audioEnabled ? 1 : 0, audioCtx.currentTime);\n  if (audioEnabled) ensureAudio();\n  return audioEnabled;\n}\nreturn { ensureAudio, playSiliconTap, playWaveSurge, playBriefingAlert, playGlitchBuzz, toggle };\n}\n`,['createAudio']));
    code=code.slice(0,x)+`const audio = window.ToenowGameModules['${id}'].audio.createAudio();\n        const { ensureAudio, playSiliconTap, playWaveSurge, playBriefingAlert, playGlitchBuzz } = audio;\n        `+code.slice(y);
    const old=`audioEnabled = !audioEnabled;\n          if (audioOutput && audioCtx) {\n            audioOutput.gain.setValueAtTime(audioEnabled ? 1 : 0, audioCtx.currentTime);\n          }\n          if (audioEnabled) ensureAudio();`;
    if(!code.includes(old))throw Error('block mute boundary');
    code=code.replace(old,'const audioEnabled = audio.toggle();'); files.push('audio');
    take('rules','var PHASE_BRIEFINGS =', '// --- Constants & Session State ---', ['PHASE_BRIEFINGS','getPhaseForWave','getGridSizeForWave','getWaveConfig','rotateMatrixCW','applySpatialTransform','generateProceduralTemplate','generateWaveBoard']);
  }
  // Mount at the original position, before the controller queries generated nodes.
  const mount = scripts.find(m => m !== main && m[1].includes('ToenowScreens.mount'));
  if(!mount)throw Error(id+' mount');
  code=mount[1]+'\n'+code;
  fs.writeFileSync(dir+'/main.js',code);
  html=html.replace(mount[0],'').replace(main[0], files.map(f=>`<script src="./${f}.js"></script>`).join('\n    ')+'\n    <script src="./main.js"></script>');
  fs.writeFileSync(dir+'/index.html',html);
  console.log('Extracted '+id+': '+files.join(', ')+', main, style');
}
for(const id of process.argv.slice(2))split(id);
