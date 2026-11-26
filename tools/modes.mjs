// Runs one battle of every mode with the autopilot to catch crashes and absurd outcomes.
// Run: node tools/modes.mjs
import { Battle, STEP } from '../js/battle.js';
import * as ST from '../js/data/stages.js';
import { unitStats } from '../js/save.js';
import { RAG_IDS } from '../js/data/rags.js';
import { ENEMIES } from '../js/data/enemies.js';

const LINE = ['stitch', 'mitten', 'bolster', 'denim_brute', 'twine', 'needle', 'stone', 'ember', 'tide', 'rime'];
const B = { loomRate: 0.4, cannonPow: 0.5, baseHp: 0.5, ragHp: 0.3, ragAtk: 0.3, starward: 1 };
function run(name, stage, lv = 30, ids = LINE) {
  for (const s of stage.spawns || []) if (!ENEMIES[s.e]) throw new Error(name + ': unknown foe ' + s.e);
  const cm = stage.costMult || 1;
  const rivalStats = stage.rival ? stage.rival.lineup.map(id => ({ ...unitStats(id, {}, { lv: stage.rival.lv, form: stage.rival.form, noTal: 1 }), traits: [] })) : null;
  const b = new Battle(stage, ids.map(id => unitStats(id, B, { lv, form: lv >= 30 ? 2 : 1, noTal: 1, costMult: cm })), { B, items: { auto: 1, lookout: 1 }, seed: 3, rivalStats, cannon: 'quake' });
  let t = 0; while (!b.result && t < 400) { b.update(STEP); b.events.length = 0; t += STEP; }
  console.log(`${name.padEnd(34)} ${String(b.result || 'timeout').padEnd(7)} ${Math.round(t)}s kills ${b.stats.kills} baseDmg ${Math.round(b.stats.baseDmg)}`);
}
const ev = ST.eventList(new Date('2026-11-28'));
run('Rival bout 1', ST.rivalStage(0, RAG_IDS), 15);
run('Rival bout 8', ST.rivalStage(7, RAG_IDS), 35);
run('Scrap Yard', ST.yardStage(1), 30);
run('Trek 1', ST.trekStage(1), 20);
run('Trek 40', ST.trekStage(40), 45);
for (const e of ev) run('Event ' + e.n + ' t0', ST.eventStage(e, 0), 25);
run('Outbreak 0-3', ST.outbreakStage(0, 3), 25);
run('Outbreak 8-7', ST.outbreakStage(8, 7), 50);
run('Spire 1', ST.spireStage(1), 20);
run('Spire 50', ST.spireStage(50), 50);
run('Tangle 5 battle', ST.tangleStage(5, 'battle'), 25);
run('Tangle 30', ST.tangleStage(30, 'battle'), 45);
run('Gauntlet 1', ST.gauntletStages(2, 5)[0], 25);
run('Legend 0-0-0 c3', ST.legendStage(0, 0, 0, 3), 30);
run('Uncanny 11-3', ST.legendStage(1, 11, 3, 0), 50);
let n = 0; for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) for (let i = 0; i < 48; i++) { const s = ST.storyStage(a, c, i); if (!s.spawns.length || s.spawns.some(x => !ENEMIES[x.e])) throw new Error('bad ' + s.key); n++; }
console.log('story stages ok', n);
