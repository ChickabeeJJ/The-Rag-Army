// Player state, persistence, bonus aggregation, unit stat building and every progression action.
import { RAGS, RAG_IDS, BASIC_UNLOCKS, STARTER } from './data/rags.js';
import { RARITY, levelMult, levelCost } from './data/core.js';
import { POWERUPS, POWERUP_MAX, powerupCost, CANNONS, CANNON_MAX, cannonCost, COMBOS, TALENTS, talentCost, TREASURES, FLAT_FX,
  MISSIONS_DAILY, MISSIONS_WEEKLY, BADGES, LOGIN, BANNERS, RATES, DRAW_COST, DRAW11_COST, DUPE, PLUS_MAX, SCAV_AREAS, RANK_REWARDS, ITEMS } from './data/meta.js';
import { dayNumber, weekNumber, RNG, clamp } from './util.js';

const KEY = 'ragarmy.save.v1';
export const VERSION = 3;
const ENERGY_SEC = 60;

function fresh() {
  return {
    v: VERSION, created: Date.now(),
    thread: 1500, buttons: 450, ticket: 1, ntix: 3, plat: 0, np: 0, gem: 0, mythgem: 0,
    energy: 50, energyT: Date.now(),
    rags: { [STARTER]: { lv: 1, plus: 0, form: 0, maxForm: 0, tal: {}, use: 0 } },
    lineups: Array.from({ length: 5 }, (_, i) => (i === 0 ? [STARTER] : [])), lineupIdx: 0,
    story: [0, 0, 0, 0, 0, 0, 0, 0, 0], treasure: {}, legend: {}, legendSub: {}, outbreak: {},
    spire: 0, yardBest: 0, yardWeek: -1, yardWeekBest: 0, yardClaimed: [], gauntlet: { week: -1, k: 0 }, tangle: null, tangleBest: 0, trek: 0, rival: 0, hasteBest: 0, festClear: {},
    powerups: {}, cannons: { spool: 1 }, cannon: 'spool',
    items: { quick: 2, sack: 2, auto: 2, lookout: 2, seeker: 2, lamp: 2 }, itemsOn: {},
    mats: { cotton: 6, wool: 3 }, dyes: {},
    scav: { lv: 1, xp: 0, helpers: 0, area: 'attic', end: 0, dur: 0 },
    missions: { day: -1, week: -1, prog: {}, claimed: {} },
    stats: { wins: 0, kills: 0, deploys: 0, cannons: 0, events: 0, levelups: 0, draws: 0, bosses: 0, scavs: 0, battles: 0 },
    login: { last: -1, count: 0 }, badges: {}, rankClaimed: [], seenFoes: {}, seenRags: { [STARTER]: 1 },
    settings: { sfx: 0.8, music: 0.45, fx: 1, dmgNum: 1, shake: 1, speed: 1 },
    tutorial: 0, pity: 0,
  };
}

export let S = fresh();
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object' && d.rags) S = migrate({ ...fresh(), ...d });
    }
  } catch (e) { S = fresh(); }
  tickEnergy(); dailyReset();
  return S;
}
function migrate(d) {
  const f = fresh();
  for (const k of ['stats', 'settings', 'scav', 'missions', 'login', 'items', 'mats', 'dyes', 'powerups', 'cannons']) d[k] = { ...f[k], ...(d[k] || {}) };
  while (d.story.length < 9) d.story.push(0);
  for (const id in d.rags) if (!RAGS[id]) delete d.rags[id];
  if (!d.rags[STARTER]) d.rags[STARTER] = f.rags[STARTER];
  d.lineups = (d.lineups || f.lineups).map(l => (l || []).filter(id => d.rags[id]).slice(0, 10));
  while (d.lineups.length < 5) d.lineups.push([]);
  d.v = VERSION;
  return d;
}
let saveT = 0;
export function save(now = false) {
  clearTimeout(saveT);
  const go = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked: keep playing */ } };
  if (now) go(); else saveT = setTimeout(go, 300);
}
export function resetSave() { S = fresh(); save(true); }
export function exportSave() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
export function importSave(str) {
  const d = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
  if (!d || !d.rags) throw new Error('not a save');
  S = migrate({ ...fresh(), ...d }); save(true);
}

/* -------------------------------------------------------------- energy */
export const energyMax = () => 50 + ((S.powerups.energy || 1) - 1) * 3 + Math.floor(treasureBonus().energyMax || 0);
export function tickEnergy() {
  const now = Date.now(), max = energyMax();
  if (S.energy >= max) { S.energyT = now; return; }
  const gain = Math.floor((now - S.energyT) / (ENERGY_SEC * 1000));
  if (gain > 0) { S.energy = Math.min(max, S.energy + gain); S.energyT += gain * ENERGY_SEC * 1000; }
}
export const energyNext = () => (S.energy >= energyMax() ? 0 : ENERGY_SEC - (Date.now() - S.energyT) / 1000);
export function refillEnergy() { if (S.buttons < 30) return false; S.buttons -= 30; S.energy = Math.max(S.energy, energyMax()); save(); return true; }

/* ------------------------------------------------------- rank & resets */
export const userRank = () => Object.values(S.rags).reduce((a, r) => a + r.lv + r.plus, 0) + POWERUPS.reduce((a, p) => a + (S.powerups[p.id] || 1), 0);
export function dailyReset() {
  const d = dayNumber(), w = weekNumber();
  if (S.missions.day !== d) { S.missions.day = d; for (const m of MISSIONS_DAILY) { delete S.missions.prog[m.id]; delete S.missions.claimed[m.id]; } }
  if (S.missions.week !== w) { S.missions.week = w; for (const m of MISSIONS_WEEKLY) { delete S.missions.prog[m.id]; delete S.missions.claimed[m.id]; } }
}
export function track(stat, n = 1) {
  S.stats[stat] = (S.stats[stat] || 0) + n;
  for (const m of [...MISSIONS_DAILY, ...MISSIONS_WEEKLY]) if (m.stat === stat) S.missions.prog[m.id] = (S.missions.prog[m.id] || 0) + n;
}
export function loginCheck() {
  const d = dayNumber();
  if (S.login.last === d) return null;
  S.login.last = d; S.login.count = (S.login.count % 28) + 1;
  const r = LOGIN[S.login.count - 1]; grant(r); save();
  return { day: S.login.count, r };
}
export function newBadges() {
  const out = [];
  for (const b of BADGES) if (!S.badges[b.id] && b.test(S, RAG_IDS.length, RAGS)) { S.badges[b.id] = Date.now(); out.push(b); grant({ buttons: 20 }); }
  return out;
}

/* ------------------------------------------------------------- rewards */
// reward object: { thread, buttons, ticket, ntix, plat, np, gem, mythgem, item:'id'|[...], rag:'id', mat:{..}, dye:{..} }
export function grant(r) {
  if (!r) return [];
  const got = [];
  for (const k of ['thread', 'buttons', 'ticket', 'ntix', 'plat', 'np', 'gem', 'mythgem']) if (r[k]) { S[k] += r[k]; got.push([k, r[k]]); }
  if (r.item) [].concat(r.item).forEach(i => { S.items[i] = (S.items[i] || 0) + 1; got.push(['item', i]); });
  if (r.mat) for (const m in r.mat) { S.mats[m] = (S.mats[m] || 0) + r.mat[m]; got.push(['mat', m, r.mat[m]]); }
  if (r.dye) for (const m in r.dye) { S.dyes[m] = (S.dyes[m] || 0) + r.dye[m]; got.push(['dye', m, r.dye[m]]); }
  if (r.rag) { const res = addRag(r.rag); got.push(['rag', r.rag, res]); }
  return got;
}
export function addRag(id) {
  S.seenRags[id] = 1;
  const own = S.rags[id], d = RAGS[id];
  if (!own) { S.rags[id] = { lv: 1, plus: 0, form: 0, maxForm: 0, tal: {}, use: 0 }; const L = S.lineups[S.lineupIdx]; if (L.length < 10) L.push(id); return 'new'; }
  const [p, np] = DUPE[d.rarity];
  if (own.plus < PLUS_MAX[d.rarity]) own.plus += p; else S.np += 2;
  S.np += np;
  return 'dupe';
}
export function storyUnlocks() {
  // basic rags appear as you clear chapter 1 of The Long Seam
  const got = [];
  for (const [n, id] of BASIC_UNLOCKS) if ((S.story[0] || 0) >= n && !S.rags[id]) { addRag(id); got.push(id); }
  return got;
}
export const totalClears = () => S.story.reduce((a, b) => a + b, 0) + Object.keys(S.legend).length;

/* ------------------------------------------------------------- bonuses */
let tbCache = null, tbKey = '';
export function treasureBonus() {
  const k = Object.keys(S.treasure).length + ':' + Object.values(S.treasure).reduce((a, b) => a + b, 0);
  if (tbCache && k === tbKey) return tbCache;
  const B = {};
  TREASURES.forEach((arc, ai) => arc.forEach((sets, ci) => sets.forEach(([fx, max], si) => {
    let pts = 0; for (let j = 0; j < 6; j++) pts += S.treasure[`${ai}-${ci}-${si * 6 + j}`] || 0;
    if (pts) B[fx] = (B[fx] || 0) + max * pts / 18;
  })));
  tbCache = B; tbKey = k; return B;
}
export function treasureSetInfo(ai, ci) {
  return TREASURES[ai][ci].map(([fx, max], si) => {
    let pts = 0; const q = [];
    for (let j = 0; j < 6; j++) { const v = S.treasure[`${ai}-${ci}-${si * 6 + j}`] || 0; pts += v; q.push(v); }
    return { fx, max, pts, q, val: max * pts / 18, flat: FLAT_FX.has(fx) };
  });
}
export function activeCombos(lineup) {
  const set = new Set(lineup);
  return COMBOS.filter(c => c.rags.every(r => set.has(r))).slice(0, 5);
}
// every bonus that applies to one battle, gathered into one flat object
export function battleBonus(lineup, extra = []) {
  const B = { ...treasureBonus() };
  const add = (k, v) => (B[k] = (B[k] || 0) + v);
  for (const p of POWERUPS) add(p.id === 'research' ? 'cdDown' : p.id === 'accounting' ? 'killScrap' : p.id === 'study' ? 'threadUp' : p.id, ((S.powerups[p.id] || 1) - 1) * p.per);
  for (const c of activeCombos(lineup)) add(c.fx, c.v);
  for (const e of extra) add(e.fx, e.v);
  B.cdDown = Math.min(0.6, B.cdDown || 0);
  B.starward = Math.min(1, B.starward || 0);
  return B;
}

/* ------------------------------------------------------- unit stats */
// Builds the battle-ready stat block of a rag. `o` overrides level/form for borrowed or rival rags.
export function unitStats(id, B = {}, o = {}) {
  const d = RAGS[id], own = S.rags[id] || {};
  const form = o.form ?? own.form ?? 0, lv = o.lv ?? own.lv ?? 1, plus = o.plus ?? own.plus ?? 0;
  const F = d.forms[form];
  const tal = form === 2 && !o.noTal ? (own.tal || {}) : {};
  const T = k => tal[k] || 0;
  const m = levelMult(lv + plus);
  const ab = JSON.parse(JSON.stringify(F.ab));
  const pc = T('procCh') * 0.04, pd = 1 + T('procDur') * 0.08 + (B.procDur || 0);
  if (T('kbUp')) ab.kb = (ab.kb || 0) + T('kbUp') * 0.04;
  if (ab.kb) ab.kb = Math.min(1, ab.kb + pc);
  for (const k of ['freeze', 'slow', 'weaken', 'curse']) if (ab[k]) { ab[k][0] = Math.min(1, ab[k][0] + pc); ab[k][1] *= pd; }
  for (const k of ['wave', 'miniwave', 'surge']) if (ab[k]) ab[k][0] = Math.min(1, ab[k][0] + pc);
  if (T('crit')) ab.crit = (ab.crit || 0) + T('crit') * 0.03;
  if (T('survive')) ab.survive = Math.min(1, (ab.survive || 0) + T('survive') * 0.08);
  if (T('dodge')) { ab.dodge = [Math.min(0.6, (ab.dodge ? ab.dodge[0] : 0) + T('dodge') * 0.03), 1]; ab.dodgeVs = 'all'; }
  ab.immune = [...(ab.immune || [])];
  if (T('immWave')) ab.immune.push('wave'); if (T('immSurge')) ab.immune.push('surge'); if (T('immWarp')) ab.immune.push('warp');
  ab.res = { weaken: T('resWeaken') * 0.15, slow: T('resSlow') * 0.15, toxic: T('resToxic') * 0.15, kb: T('resKb') * 0.15 };
  const cm = o.costMult || 1;
  return {
    id, rag: 1, name: F.name, form, lv, plus, look: d.look, rarity: d.rarity,
    hp: Math.round(F.hp * m * (1 + T('hp') * 0.04) * (1 + (B.ragHp || 0))),
    atk: Math.round(F.atk * m * (1 + T('atk') * 0.04) * (1 + (B.ragAtk || 0))),
    range: F.range + T('range') * 8,
    speed: (F.speed + T('speed') * 3) * (1 + (B.ragSpeed || 0)),
    freq: F.freq, fs: F.fs, kb: F.kb, area: F.area,
    cost: Math.round(F.cost * (1 - T('cost') * 0.03) * cm),
    cd: Math.max(1.6, F.cd * (1 - T('cd') * 0.04) * (1 - (B.cdDown || 0))),
    ab, traits: [],
  };
}
export function levelCap(id) {
  const d = RAGS[id], r = RARITY[d.rarity], own = S.rags[id];
  const base = (S.story[0] || 0) >= 48 ? r.cap : 10;
  return Math.min(r.capMax, base + (own.capUp || 0));
}

/* ------------------------------------------------------------- actions */
export function levelUp(id) {
  const own = S.rags[id], d = RAGS[id];
  if (!own || own.lv >= levelCap(id)) return false;
  const c = levelCost(own.lv, d.rarity);
  if (S.thread < c) return false;
  S.thread -= c; own.lv++; track('levelups');
  if (own.lv >= 10 && own.maxForm < 1) { own.maxForm = 1; own.form = 1; }
  save(); return true;
}
export function capUp(id) {
  const own = S.rags[id], d = RAGS[id], r = RARITY[d.rarity];
  const cur = levelCap(id); if (cur >= r.capMax || (S.story[0] || 0) < 48) return false;
  const myth = d.rarity === 'uber' || d.rarity === 'legend';
  if (myth && cur >= 30) { if (S.mythgem < 1) return false; S.mythgem--; } else { if (S.gem < 1) return false; S.gem--; }
  own.capUp = (own.capUp || 0) + 1; save(); return true;
}
export function evolveReq(id) {
  const d = RAGS[id];
  return { lv: ['basic', 'special', 'rare'].includes(d.rarity) ? 20 : 30, dyes: d.dyes, thread: { basic: 20000, special: 40000, rare: 60000, sr: 100000, uber: 200000, legend: 300000 }[d.rarity] };
}
export function canEvolve(id) {
  const own = S.rags[id]; if (!own || own.maxForm !== 1) return false;
  const q = evolveReq(id);
  return own.lv >= q.lv && S.thread >= q.thread && Object.entries(q.dyes).every(([k, n]) => (S.dyes[k] || 0) >= n);
}
export function evolve(id) {
  if (!canEvolve(id)) return false;
  const own = S.rags[id], q = evolveReq(id);
  S.thread -= q.thread; for (const [k, n] of Object.entries(q.dyes)) S.dyes[k] -= n;
  own.maxForm = 2; own.form = 2; save(); return true;
}
export function talentUp(id, key) {
  const own = S.rags[id], d = RAGS[id];
  if (!own || own.maxForm < 2) return false;
  const lv = own.tal[key] || 0; if (lv >= TALENTS[key].max) return false;
  const c = talentCost(d.rarity, lv); if (S.np < c) return false;
  S.np -= c; own.tal[key] = lv + 1; save(); return true;
}
export function powerUp(id) {
  const lv = S.powerups[id] || 1; if (lv >= POWERUP_MAX) return false;
  const c = powerupCost(lv); if (S.thread < c) return false;
  S.thread -= c; S.powerups[id] = lv + 1; tickEnergy(); save(); return true;
}
export const cannonUnlocked = c => totalClears() >= c.unlock;
export function cannonUp(id) {
  const lv = S.cannons[id] || 0; if (lv >= CANNON_MAX) return false;
  const c = cannonCost(lv);
  if (!Object.entries(c).every(([m, n]) => (S.mats[m] || 0) >= n)) return false;
  for (const [m, n] of Object.entries(c)) S.mats[m] -= n;
  S.cannons[id] = lv + 1; save(); return true;
}
export function buySpecial(id) {
  const d = RAGS[id]; if (!d.buy || S.rags[id] || S.buttons < d.buy) return false;
  S.buttons -= d.buy; addRag(id); save(); return true;
}

/* ------------------------------------------------------------- ragbag */
export const currentBanner = () => BANNERS[weekNumber() % BANNERS.length];
const GACHA_POOL = r => RAG_IDS.filter(id => RAGS[id].rarity === r && !(r === 'special'));
export function draw(n, pay) {
  // pay: 'buttons' | 'ticket' | 'plat' | 'ntix'
  if (pay === 'buttons') { const c = n === 11 ? DRAW11_COST : DRAW_COST * n; if (S.buttons < c) return null; S.buttons -= c; }
  else if (pay === 'ticket') { if (S.ticket < n) return null; S.ticket -= n; }
  else if (pay === 'plat') { if (S.plat < 1) return null; S.plat--; n = 1; }
  else if (pay === 'ntix') { if (S.ntix < n) return null; S.ntix -= n; }
  const rng = Math.random, feat = currentBanner().feat, out = [];
  for (let i = 0; i < n; i++) {
    let rar;
    if (pay === 'ntix') {
      // the Thread Bag: specials, items and materials
      const x = rng();
      if (x < 0.25) { const ids = RAG_IDS.filter(id => RAGS[id].rarity === 'special' && RAGS[id].buy); const id = ids[Math.floor(rng() * ids.length)]; out.push({ rag: id, res: addRag(id), rar: 'special' }); }
      else if (x < 0.55) { const it = Object.keys(ITEMS)[Math.floor(rng() * 6)]; grant({ item: it }); out.push({ item: it }); }
      else if (x < 0.8) { const m = ['cotton', 'wool', 'linen', 'felt'][Math.floor(rng() * 4)]; grant({ mat: { [m]: 3 } }); out.push({ mat: m, n: 3 }); }
      else { grant({ thread: 3000 }); out.push({ thread: 3000 }); }
      continue;
    }
    if (pay === 'plat') rar = rng() < 0.06 ? 'legend' : 'uber';
    else {
      const x = rng(); S.pity++;
      rar = x < RATES.legend ? 'legend' : x < RATES.legend + RATES.uber ? 'uber' : x < RATES.legend + RATES.uber + RATES.sr ? 'sr' : 'rare';
      if (n === 11 && i === 10 && rar === 'rare') rar = 'sr'; // an 11-draw always ends on Epic or better
      if (S.pity >= 100 && rar !== 'uber' && rar !== 'legend') rar = 'uber'; // soft guarantee: one Mythic every 100 draws
    }
    if (rar === 'uber' || rar === 'legend') S.pity = 0;
    let pool = GACHA_POOL(rar);
    if (rar === 'uber' && rng() < 0.5) pool = feat;
    const id = pool[Math.floor(rng() * pool.length)];
    out.push({ rag: id, res: addRag(id), rar });
  }
  track('draws', n); save();
  return out;
}

/* ----------------------------------------------------------- scavenger */
export const scavAreas = () => SCAV_AREAS.filter(a => totalClears() >= a.unlock);
export function scavStart(area, min) {
  if (S.scav.end) return false;
  S.scav.area = area; S.scav.dur = min; S.scav.end = Date.now() + min * 60000; save(); return true;
}
export function scavCollect() {
  if (!S.scav.end || Date.now() < S.scav.end) return null;
  const a = SCAV_AREAS.find(x => x.id === S.scav.area) || SCAV_AREAS[0];
  const ai = SCAV_AREAS.indexOf(a), min = S.scav.dur, y = (1 + S.scav.lv * 0.06) * (1 + S.scav.helpers * 0.1);
  const r = RNG(S.scav.end | 0), mat = {};
  for (let i = 0; i < Math.ceil(min / 4 * y); i++) { const m = r.pick(a.mats); mat[m] = (mat[m] || 0) + 1; }
  const rew = { thread: Math.round(min * 220 * (1 + ai * 0.5) * y), mat };
  if (r() < min / 120 * y) rew.item = r.pick(Object.keys(ITEMS));
  if (ai >= 3 && r() < min / 150) rew.dye = { [r.pick(['red', 'blue', 'green', 'gold', 'violet'])]: 1 };
  if (ai >= 5 && r() < min / 300) rew.gem = 1;
  const got = grant(rew);
  S.scav.xp += min; while (S.scav.xp >= scavXpNeed()) { S.scav.xp -= scavXpNeed(); S.scav.lv = Math.min(30, S.scav.lv + 1); }
  S.scav.end = 0; track('scavs'); save();
  return got;
}
export const scavXpNeed = () => 20 + S.scav.lv * 15;
export function scavHelper() { if (S.scav.helpers >= 10 || S.buttons < 50) return false; S.buttons -= 50; S.scav.helpers++; save(); return true; }

/* ----------------------------------------------------- missions, rank */
export function claimMission(m) {
  if (S.missions.claimed[m.id] || (S.missions.prog[m.id] || 0) < m.goal) return null;
  S.missions.claimed[m.id] = 1; const g = grant(m.r); save(); return g;
}
export function claimRank() {
  const r = userRank(), got = [];
  RANK_REWARDS.forEach(([n, rew], i) => { if (r >= n && !S.rankClaimed.includes(i)) { S.rankClaimed.push(i); got.push(...grant(rew)); S.energy = Math.max(S.energy, energyMax()); } });
  if (got.length) save();
  return got;
}
export const clampEnergy = () => (S.energy = clamp(S.energy, 0, 999));
export { POWERUPS, CANNONS };
