// Headless balance sweep: plays stages with the autopilot at an expected player power and reports
// win/lose, time, and keep health left. Run: node tools/balance.mjs
import { Battle, STEP } from '../js/battle.js';
import { storyStage, legendStage, spireStage, eventList, eventStage } from '../js/data/stages.js';
import { unitStats, battleBonus } from '../js/save.js';
import { RAGS } from '../js/data/rags.js';

function play(stage, ids, lv, form, B = {}, seed = 1) {
  const cm = stage.costMult || 1;
  const lineup = ids.map(id => unitStats(id, B, { lv, form, plus: 0, noTal: 1, costMult: cm }));
  const b = new Battle(stage, lineup, { B, items: { auto: 1 }, seed });
  let t = 0;
  while (!b.result && t < 600) { b.update(STEP); b.events.length = 0; t += STEP; }
  return { r: b.result || 'timeout', t: Math.round(t), base: Math.round(b.pBase.hp / b.pBase.max * 100), kills: b.stats.kills };
}
const BASICS = ['stitch', 'bolster', 'scrapper', 'jab', 'longarm', 'hopper', 'kite', 'bigwig', 'hemline'];
const UNL = [0, 1, 2, 4, 6, 9, 13, 17, 22];
const GACHA = ['mitten', 'scarecrow', 'needle', 'twine', 'denim_brute', 'cord_ram'];
const rows = [];
function row(name, stage, ids, lv, form, B) {
  const res = [1, 2, 3].map(s => play(stage, ids, lv, form, B, s));
  const w = res.filter(r => r.r === 'win').length;
  rows.push(`${name.padEnd(30)} lv${String(lv).padStart(2)} f${form} | wins ${w}/3 | ${res.map(r => `${r.r[0]}${r.t}s/${r.base}%`).join('  ')}`);
}
// The Long Seam, chapter 1, with the expected unlocked basics and levels
for (const i of [0, 1, 2, 5, 11, 17, 23, 29, 35, 41, 47]) {
  const ids = BASICS.filter((_, k) => UNL[k] <= i);
  const lv = Math.min(10, 1 + Math.floor(i / 5));
  row(`Seam 1-${i + 1}`, storyStage(0, 0, i), ids, lv, lv >= 10 ? 1 : 0, {});
}
const T1 = { loomRate: 0.3, cannonPow: 0.5, baseHp: 0.5, ragHp: 0, ragAtk: 0 };
for (const i of [0, 11, 23, 35, 47]) row(`Seam 2-${i + 1}`, storyStage(0, 1, i), BASICS, 15 + Math.floor(i / 8), 1, T1);
for (const i of [0, 23, 47]) row(`Seam 3-${i + 1}`, storyStage(0, 2, i), [...BASICS.slice(0, 6), ...GACHA.slice(0, 4)], 20 + Math.floor(i / 10), 1, { ...T1, ragHp: 0.2, ragAtk: 0.2 });
const T2 = { loomRate: 0.6, loomCap: 0.5, cannonPow: 1, baseHp: 1, ragHp: 0.4, ragAtk: 0.4, vs_crimson: 1, vs_drifting: 1, vs_shadow: 1, vs_gilded: 1 };
for (const i of [0, 23, 47]) row(`Fray 1-${i + 1}`, storyStage(1, 0, i), [...BASICS.slice(0, 5), ...GACHA], 25 + Math.floor(i / 12), 2, { ...T2, starward: i / 47 });
for (const i of [0, 47]) row(`Fray 3-${i + 1}`, storyStage(1, 2, i), ['stitch', 'mitten', 'bolster', 'denim_brute', 'twine', 'needle', 'stone', 'ember', 'tide', 'rime'], 32, 2, { ...T2, starward: 1, ragHp: 0.6, ragAtk: 0.6 });
for (const i of [0, 47]) row(`Void 1-${i + 1}`, storyStage(2, 0, i), ['stitch', 'mitten', 'bolster', 'denim_brute', 'gauze', 'paisley', 'stone', 'ember', 'voidrag', 'rime'], 36, 2, { ...T2, starward: 1, ragHp: 0.7, ragAtk: 0.7 });
for (const i of [0, 47]) row(`Void 3-${i + 1}`, storyStage(2, 2, i), ['stitch', 'mitten', 'bolster', 'denim_brute', 'gauze', 'paisley', 'stone', 'dragon', 'voidrag', 'echo'], 45, 2, { ...T2, starward: 1, ragHp: 1, ragAtk: 1, vs_void: 1, vs_revenant: 1, vs_ancient: 1 });
row('Legend 1-1 c1', legendStage(0, 0, 0, 0), [...BASICS.slice(0, 6), ...GACHA.slice(0, 4)], 20, 1, T1);
row('Legend 12-4 c1', legendStage(0, 11, 3, 0), [...BASICS.slice(0, 5), ...GACHA], 30, 2, T2);
row('Spire 10', spireStage(10), [...BASICS.slice(0, 5), ...GACHA], 25, 2, T2);
row('Spire 30', spireStage(30), ['stitch', 'mitten', 'bolster', 'denim_brute', 'twine', 'needle', 'stone', 'ember', 'tide', 'rime'], 35, 2, { ...T2, ragHp: 0.6, ragAtk: 0.6 });
const ev = eventList(new Date('2026-11-27'));
row('Thread Mill easy', eventStage(ev[0], 0), BASICS.slice(0, 6), 8, 0, {});
console.log(rows.join('\n'));
console.log('rags', Object.keys(RAGS).length);
