// For each stage, finds the lowest rag level (same lineup) that wins 2 of 2 seeds with the autopilot.
// Run: node tools/minlevel.mjs
import { Battle, STEP } from '../js/battle.js';
import { storyStage, legendStage, spireStage } from '../js/data/stages.js';
import { unitStats } from '../js/save.js';
const formFor = L => (L >= 30 ? 2 : L >= 10 ? 1 : 0);
function win(stage, ids, L, B, seed) {
  const lineup = ids.map(id => unitStats(id, B, { lv: L, form: formFor(L), plus: 0, noTal: 1, costMult: stage.costMult || 1 }));
  const b = new Battle(stage, lineup, { B, items: { auto: 1 }, seed });
  let t = 0; while (!b.result && t < 480) { b.update(STEP); b.events.length = 0; t += STEP; }
  return b.result === 'win';
}
function minLv(stage, ids, B) {
  let lo = 1, hi = 60;
  if (!win(stage, ids, hi, B, 1)) return '>60';
  while (lo < hi) { const m = (lo + hi) >> 1; if (win(stage, ids, m, B, 1) && win(stage, ids, m, B, 2)) hi = m; else lo = m + 1; }
  return lo;
}
const BASICS = ['stitch', 'bolster', 'scrapper', 'jab', 'longarm', 'hopper', 'kite', 'bigwig', 'hemline'];
const UNL = [0, 1, 2, 4, 6, 9, 13, 17, 22];
const MID = ['stitch', 'mitten', 'bolster', 'scrapper', 'longarm', 'twine', 'needle', 'denim_brute', 'cord_ram', 'bigwig'];
const END = ['stitch', 'mitten', 'bolster', 'denim_brute', 'twine', 'needle', 'stone', 'ember', 'tide', 'rime'];
const T1 = { loomRate: 0.3, cannonPow: 0.5, baseHp: 0.5 };
const T2 = { loomRate: 0.6, loomCap: 0.5, cannonPow: 1, baseHp: 1, ragHp: 0.4, ragAtk: 0.4, vs_crimson: 1, vs_drifting: 1, vs_shadow: 1, vs_gilded: 1, vs_steel: 1, starward: 1 };
const cases = (process.argv[2] || 'all');
const out = [];
const R = (n, st, ids, B, exp) => { const m = minLv(st, ids, B); out.push(`${n.padEnd(16)} min ${String(m).padStart(3)}  expected ~${exp}`); console.log(out[out.length - 1]); };
if (cases === 'all' || cases === 'c1') for (const i of [0, 2, 5, 11, 17, 23, 29, 35, 41, 47]) R(`Seam1-${i + 1}`, storyStage(0, 0, i), BASICS.filter((_, k) => UNL[k] <= i), {}, Math.min(10, 1 + Math.floor(i / 5)));
if (cases === 'all' || cases === 'c2') for (const i of [0, 11, 23, 35, 47]) R(`Seam2-${i + 1}`, storyStage(0, 1, i), BASICS, T1, 12 + Math.floor(i / 6));
if (cases === 'all' || cases === 'c3') for (const i of [0, 23, 47]) R(`Seam3-${i + 1}`, storyStage(0, 2, i), MID, { ...T1, ragHp: 0.2, ragAtk: 0.2 }, 20 + Math.floor(i / 8));
if (cases === 'all' || cases === 'arc2') for (const [c, i] of [[0, 0], [0, 23], [0, 47], [1, 23], [2, 0], [2, 47]]) R(`Fray${c + 1}-${i + 1}`, storyStage(1, c, i), END, { ...T2, starward: c === 0 ? i / 47 : 1 }, 26 + c * 4 + Math.floor(i / 16));
if (cases === 'all' || cases === 'arc3') for (const [c, i] of [[0, 0], [0, 47], [1, 23], [2, 0], [2, 47]]) R(`Void${c + 1}-${i + 1}`, storyStage(2, c, i), [...END.slice(0, 6), 'voidrag', 'gauze', 'paisley', 'dragon'], { ...T2, ragHp: 0.8, ragAtk: 0.8, vs_void: 1, vs_revenant: 1, vs_ancient: 1 }, 36 + c * 5 + Math.floor(i / 16));
if (cases === 'all' || cases === 'misc') { R('Legend1-1', legendStage(0, 0, 0, 0), MID, T1, 22); R('Legend12-4', legendStage(0, 11, 3, 0), MID, T2, 30); R('Legend24-4', legendStage(0, 23, 3, 0), END, T2, 40); R('Uncanny1-1', legendStage(1, 0, 0, 0), END, T2, 42); R('Spire10', spireStage(10), MID, T2, 26); R('Spire30', spireStage(30), END, T2, 36); R('Spire50', spireStage(50), END, { ...T2, ragHp: 0.8, ragAtk: 0.8 }, 48); }
