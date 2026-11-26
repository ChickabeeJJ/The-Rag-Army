// Glue between menus and battles: lineup building under stage rules, energy and items, and every
// reward / progress update when a battle ends.
import { S, save, unitStats, battleBonus, grant, addRag, storyUnlocks, track, newBadges, tickEnergy } from './save.js';
import { RAGS, RAG_IDS } from './data/rags.js';
import { ITEMS, MATERIALS } from './data/meta.js';
import { OUTBREAK_STAGES, TANGLE_CHARMS, YARD_TIERS, SAGAS } from './data/stages.js';
import { Scene } from './scene.js';
import { weekNumber } from './util.js';

export const lineupIds = () => (S.lineups[S.lineupIdx] || []).filter(id => S.rags[id]);
export function ruleBlocks(stage, id) {
  const R = stage.rules; if (!R) return null;
  const d = RAGS[id];
  if (R.rarity && !R.rarity.includes(d.rarity)) return 'rarity';
  if (R.maxCost) { const c = unitStats(id, {}, { costMult: stage.costMult || 1 }).cost; if (c > R.maxCost) return 'cost'; }
  return null;
}
export function ruleText(R) {
  if (!R) return '';
  const t = [];
  if (R.rarity) t.push('Only ' + R.rarity.map(r => ({ basic: 'Basic', special: 'Special', rare: 'Rare', sr: 'Epic', uber: 'Mythic', legend: 'Legend' }[r])).join(' / ') + ' rags');
  if (R.maxCost) t.push(`Rags cost at most ${R.maxCost}`);
  if (R.noCannon) t.push('No cannon');
  if (R.maxDeploy) t.push(`Deploy at most ${R.maxDeploy} rags`);
  if (R.timeLimit) t.push(`Win within ${R.timeLimit}s`);
  return t.join(' · ');
}
export function canAfford(stage) { tickEnergy(); return S.energy >= (stage.energy || 0); }

// borrowed: [{id, lv, form}] for the Legend Trek; extra: tangle charms
export function startBattle(stage, ui, o = {}) {
  tickEnergy();
  if ((stage.energy || 0) > S.energy) return 'energy';
  const ids = o.borrowed ? o.borrowed.map(b => b.id) : lineupIds().filter(id => !ruleBlocks(stage, id));
  if (!ids.length) return 'lineup';
  S.energy -= stage.energy || 0;
  const items = {};
  for (const k of Object.keys(ITEMS)) if (S.itemsOn[k] && (S.items[k] || 0) > 0 && !o.noItems) { items[k] = 1; S.items[k]--; }
  const charms = o.charms || [];
  const B = battleBonus(ids, charms);
  const lineup = o.borrowed
    ? o.borrowed.map(b => unitStats(b.id, B, { lv: b.lv, form: b.form, plus: 0, noTal: 1, costMult: stage.costMult }))
    : ids.map(id => unitStats(id, B, { costMult: stage.costMult }));
  const rivalStats = stage.rival ? stage.rival.lineup.map(id => ({ ...unitStats(id, {}, { lv: stage.rival.lv, form: stage.rival.form, plus: 0, noTal: 1 }), traits: [] })) : null;
  S.stats.battles++; save();
  const opts = { B, items, cannon: S.cannon, cannonLv: S.cannons[S.cannon] || 1, rivalStats };
  Scene.start(stage, lineup, opts, b => ui.result(finish(stage, b, { items, B, o }), stage, o));
  return null;
}

const matFor = stage => {
  const arcMats = [['cotton', 'wool', 'linen'], ['felt', 'silk', 'denim'], ['velvet', 'silk', 'denim']];
  return arcMats[Math.min(2, stage.arc ?? (stage.theme || 0))];
};
function roll(stage, B, items) {
  const got = {}, up = 1 + (B.dropUp || 0);
  for (const d of stage.drops || []) {
    if (!d.ch || Math.random() >= d.ch * (d.ch >= 1 ? 1 : up)) continue;
    const n = d.amt || 1;
    if (d.k === 'mat') { const m = matFor(stage)[Math.floor(Math.random() * 3)]; (got.mat = got.mat || {})[m] = (got.mat?.[m] || 0) + 1 + Math.floor(Math.random() * 3); }
    else if (d.k === 'dye') { const c = d.id || ['red', 'blue', 'green', 'gold', 'violet'][Math.floor(Math.random() * 5)]; (got.dye = got.dye || {})[c] = (got.dye?.[c] || 0) + n; }
    else if (d.k === 'rag') got.rag = d.id;
    else got[d.k] = (got[d.k] || 0) + n;
  }
  return got;
}

export function finish(stage, b, ctx) {
  const { items, B, o } = ctx;
  const win = b.result === 'win', done = b.result === 'done';
  const sum = { win, done, thread: 0, got: [], first: null, treasure: null, unlocked: [], score: 0, badges: [], newRank: null };
  track('kills', b.stats.kills); S.stats.bosses += b.stats.bossKills;
  for (const m of ['w_boss']) S.missions.prog[m] = (S.missions.prog[m] || 0) + b.stats.bossKills;
  track('cannons', 0); track('deploys', 0);
  if (stage.mode === 'event') track('events');
  if (done && stage.mode === 'yard') {
    sum.score = Math.round(b.stats.baseDmg + b.stats.kills * 100);
    const wk = weekNumber();
    if (S.yardWeek !== wk) { S.yardWeek = wk; S.yardWeekBest = 0; S.yardClaimed = []; }
    S.yardWeekBest = Math.max(S.yardWeekBest, sum.score); S.yardBest = Math.max(S.yardBest, sum.score);
    YARD_TIERS.forEach(([need, r], i) => { if (S.yardWeekBest >= need && !S.yardClaimed.includes(i)) { S.yardClaimed.push(i); sum.got.push(...grant(r)); } });
    sum.thread = Math.round(stage.thread * (1 + (B.threadUp || 0)) * (items.lamp ? 1.5 : 1));
    S.thread += sum.thread;
  }
  if (win) {
    track('wins');
    sum.thread = Math.round((stage.thread || 0) * (1 + (B.threadUp || 0)) * (items.lamp ? 1.5 : 1));
    S.thread += sum.thread;
    // treasure
    if (stage.treasure) {
      const ch = items.seeker ? 1 : 0.3 * (1 + (B.dropUp || 0));
      if (Math.random() < ch) {
        const q = items.seeker ? 3 : Math.random() < 0.15 ? 3 : Math.random() < 0.45 ? 2 : 1;
        const cur = S.treasure[stage.treasure] || 0;
        sum.treasure = { q, kept: q > cur };
        if (q > cur) S.treasure[stage.treasure] = q;
      }
    }
    const firstKey = 'fc:' + stage.key + ':' + (stage.crown || 0);
    const wasCleared = isCleared(stage);
    progress(stage, b, sum);
    if (stage.first && !wasCleared && !S[firstKey]) { S[firstKey] = 1; sum.first = grant(stage.first); }
    sum.got.push(...grant(roll(stage, B, items)));
    sum.unlocked = storyUnlocks();
  }
  sum.badges = newBadges();
  save(true);
  return sum;
}

export function isCleared(st) {
  switch (st.mode) {
    case 'story': return (S.story[st.arc * 3 + st.ch] || 0) > st.i;
    case 'legend': return (S.legend[st.key] || 0) > (st.crown || 0);
    case 'outbreak': return !!S.outbreak[st.key];
    case 'spire': return S.spire >= st.f;
    case 'trek': return S.trek >= st.level;
    case 'event': return !!S.festClear[st.key];
    default: return false;
  }
}
function progress(st, b, sum) {
  switch (st.mode) {
    case 'story': { const k = st.arc * 3 + st.ch; S.story[k] = Math.max(S.story[k] || 0, st.i + 1); break; }
    case 'legend': {
      S.legend[st.key] = Math.max(S.legend[st.key] || 0, (st.crown || 0) + 1);
      const sg = SAGAS[st.saga].id;
      let n = 0; while (n < SAGAS[st.saga].subs && [0, 1, 2, 3].every(j => S.legend[`l${st.saga}-${n}-${j}`] >= 1)) n++;
      S.legendSub[sg] = Math.max(S.legendSub[sg] || 0, n);
      break;
    }
    case 'outbreak': S.outbreak[st.key] = 1; break;
    case 'spire': S.spire = Math.max(S.spire, st.f); break;
    case 'trek': S.trek = Math.max(S.trek, st.level); break;
    case 'rival': S.rival = Math.max(S.rival, st.wins + 1); break;
    case 'gauntlet': S.gauntlet.k = st.gi + 1; if (st.gi === 4) { sum.got.push(...grant({ ticket: 2, buttons: 80 })); } break;
    case 'tangle': if (S.tangle) { S.tangle.floor = st.floor + 1; S.tangleBest = Math.max(S.tangleBest, st.floor); if (st.floor % 5 === 0) sum.got.push(...grant({ buttons: 20 + st.floor * 2 })); } break;
    case 'event':
      S.festClear[st.key] = 1;
      if (st.timed) { const tt = Math.round(b.t * 10) / 10; sum.time = tt; if (!S.hasteBest || tt < S.hasteBest) { S.hasteBest = tt; sum.best = true; } }
      break;
    default: break;
  }
}
// a lost tangle run ends; a lost gauntlet resets to stage 1
export function onLose(st) {
  if (st.mode === 'tangle' && S.tangle) { S.tangle = null; save(); }
  if (st.mode === 'gauntlet') { S.gauntlet.k = 0; save(); }
}
export function newTangle() { S.tangle = { floor: 1, charms: [], seed: Date.now() % 100000 }; save(); return S.tangle; }
export function tangleCharms() { return (S.tangle ? S.tangle.charms : []).map(id => TANGLE_CHARMS.find(c => c.id === id)).filter(Boolean); }
export function trekLineup(level) {
  const pool = RAG_IDS.filter(id => RAGS[id].rarity !== 'legend');
  let s = level * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const out = new Set(['stitch', 'mitten']);
  while (out.size < 10) out.add(pool[Math.floor(rnd() * pool.length)]);
  const lv = Math.min(50, 15 + level), form = lv >= 30 ? 2 : 1;
  return [...out].map(id => ({ id, lv, form }));
}
export { OUTBREAK_STAGES, MATERIALS, addRag };
