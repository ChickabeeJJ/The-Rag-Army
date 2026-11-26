// Stage generation for every mode. Stages are deterministic: the same key always builds the same stage.
import { RNG, hashStr } from '../util.js';
import { ENEMIES, pool } from './enemies.js';

export const ARCS = [
  { id: 'seam', n: 'The Long Seam', theme: 0, mult: 1, traits: ['crimson', 'drifting', 'shadow', 'steel', 'gilded'] },
  { id: 'fray', n: 'The Fraying Lands', theme: 1, mult: 3.2, traits: ['starborn', 'crimson', 'drifting', 'shadow', 'steel', 'gilded'] },
  { id: 'void', n: 'The Unspun Void', theme: 2, mult: 7, traits: ['revenant', 'void', 'ancient', 'starborn', 'shadow', 'steel'] },
];
export const CH_MULT = [1, 1.6, 2.1];
const CH_NAMES = ['Chapter 1', 'Chapter 2', 'Chapter 3'];
const A = ['Button', 'Thimble', 'Bobbin', 'Spindle', 'Needle', 'Spool', 'Ribbon', 'Tassel', 'Hem', 'Seam', 'Patch', 'Felt', 'Lint', 'Yarn', 'Cotton', 'Linen', 'Pinch', 'Velvet', 'Tweed', 'Lace'];
const B = ['Hollow', 'Hill', 'Crossing', 'Meadow', 'Pass', 'Ridge', 'Marsh', 'Wood', 'Bay', 'Falls', 'Fields', 'Gate', 'Harbor', 'Grove', 'Steps', 'Point', 'Drift', 'Reach', 'Isle', 'Spire'];
const NAMES = ARCS.map((a, ai) => {
  const r = RNG(77 + ai * 1013), used = new Set(), out = [];
  while (out.length < 48) { const n = r.pick(A) + ' ' + r.pick(B); if (!used.has(n)) { used.add(n); out.push(n); } }
  out[47] = ['The Last Knot', 'The Frayed Crown', 'The Needle Throne'][ai];
  return out;
});
export const storyName = (arc, i) => NAMES[arc][i];

// spawn entry: e = foe id, mag = % strength, first = seconds before the first one, int = [min,max] seconds between,
// n = how many (0 = endless), trig = only after the foe keep falls to this fraction, boss = boss shockwave
const sp = (e, mag, first, int, n = 0, trig = 1, boss = 0) => ({ e, mag: Math.round(mag), first, int, n, trig, boss });

function trailOf(traits, lvl) {
  // which traits are allowed this deep into a chapter
  const k = Math.min(traits.length, 1 + Math.floor(lvl * (traits.length + 0.5)));
  return ['plain', ...traits.slice(0, k)];
}

/* the generic composer used by story, legend, spire, tangle and gauntlets */
export function compose(key, { lvl, mag, traits, maxTier, boss = null, bossMag = null, finale = null, finaleMag = null, extra = 0, heavyTier = null }) {
  const r = RNG(hashStr(key));
  const ps = pool(traits, maxTier);
  const t1 = pool(traits, 1), t2 = pool(traits, 2);
  const fod = t1.length ? r.pick(t1) : ENEMIES.lint;
  // heavier tiers already carry big base stats, so stage strength applies to them more gently
  const tm = e => mag / (1 + 0.4 * Math.max(0, e.tier - 2));
  const S = [sp(fod.id, mag * 0.6, 1.5, [Math.max(3.5, 9 - lvl * 4), Math.max(6, 14 - lvl * 5)])];
  if (lvl > 0.25) S.push(sp((t2.length ? r.pick(t2) : fod).id, mag * 0.75, 10, [12, 20]));
  // mids lean toward the lower tiers; heavier foes come in smaller numbers
  const mids = ps.filter(e => e.tier >= 2);
  const nm = 1 + Math.floor(lvl * 2.5) + extra;
  for (let k = 0; k < nm && mids.length; k++) {
    const e = r() < 0.6 ? r.pick(mids.filter(x => x.tier <= Math.max(2, maxTier - 1))) || r.pick(mids) : r.pick(mids);
    const many = Math.max(1, 5 - e.tier + Math.floor(lvl * 3));
    S.push(sp(e.id, tm(e), r.range(14, 36), [r.range(12, 20), r.range(22, 34)], r.int(1, many)));
  }
  const hT = heavyTier || maxTier, hp = heavyTier ? pool(traits, hT) : ps;
  const heavy = hp.filter(e => e.tier >= Math.max(2, hT - 1));
  if (lvl > 0.1 && heavy.length) {
    const h1 = r.pick(heavy), h2 = r.pick(heavy);
    S.push(sp(h1.id, tm(h1), 1, [20, 30], lvl > 0.5 ? 2 : 1, 0.7));
    if (lvl > 0.55) S.push(sp(h2.id, tm(h2), 2, [25, 40], 1, 0.4));
  }
  if (boss) {
    S.push(sp(boss, (bossMag || mag) / (1 + 0.25 * Math.max(0, ENEMIES[boss].tier - 4)), 1, [60, 60], 1, 0.99, 1));
    // escorts arrive with the boss
    S.push(sp(fod.id, mag, 3, [3, 4], 6, 0.99));
  }
  if (finale) S.push(sp(finale, (finaleMag || mag) / (1 + 0.5 * Math.max(0, ENEMIES[finale].tier - 4)), 1, [60, 60], 1, 0.5, 1));
  return S;
}

const BOSS_BY_ARC = [
  ['spoolgolem', 'matron', 'greatmoth', 'inkwell', 'ironclad', 'giltmother'],
  ['stareater', 'matron', 'giltmother', 'inkwell', 'greatmoth', 'ironclad'],
  ['unburied', 'stareater', 'inkwell', 'ironclad', 'giltmother', 'matron'],
];
const FINALE = [['spoolgolem', 'greatmoth', 'unraveller'], ['stareater', 'giltmother', 'frayqueen'], ['unburied', 'stareater', 'needleking']];

/* ---------------------------------------------------------------- story */
export function storyStage(arc, ch, i) {
  const a = ARCS[arc], lvl = i / 47, m = a.mult * CH_MULT[ch];
  const key = `s${arc}-${ch}-${i}`;
  const mag = 100 * m * (1.4 + 3 * lvl);
  const traits = ch === 0 ? trailOf(a.traits, lvl) : ['plain', ...a.traits];
  const maxTier = Math.min(6, 1 + Math.floor(lvl * 2.6) + (ch > 0 ? 1 : 0) + arc), heavyTier = Math.min(6, maxTier + 1);
  const isBoss = i % 12 === 11 && i !== 47;
  let spawns;
  if (arc === 0 && ch === 0 && i < 3) spawns = tutorialSpawns(i);
  else spawns = compose(key, { lvl, mag: i === 47 ? mag * 0.6 : mag, traits, maxTier, boss: isBoss ? BOSS_BY_ARC[arc][(i / 12 | 0) + ch * 2] || BOSS_BY_ARC[arc][0] : null, bossMag: mag * (arc === 0 && ch === 0 ? 0.1 + 0.15 * lvl : arc === 0 ? 0.3 : 0.45), finale: i === 47 ? FINALE[arc][ch] : null, finaleMag: mag * (arc === 0 && ch === 0 ? 0.3 : 0.22), extra: ch, heavyTier });
  return {
    key, mode: 'story', arc, ch, i, spawns, name: storyName(arc, i), sub: `${a.n} · ${CH_NAMES[ch]} · Stage ${i + 1}`,
    len: 2500 + 45 * (i % 10) + arc * 150 + (isBoss || i === 47 ? 300 : 0),
    baseHp: Math.round((i < 3 && arc + ch === 0 ? 1200 + i * 600 : (2600 + 380 * i)) * m),
    energy: Math.min(45, 4 + Math.floor(i / 4) + arc * 6 + ch * 2),
    costMult: [1, 1.15, 1.3][ch], theme: a.theme, sky: i % 4,
    thread: Math.round((120 + 50 * i) * m),
    treasure: `${arc}-${ch}-${i}`,
    first: i === 47 ? { ticket: 3, buttons: 100, ...(ch === 2 ? { plat: 1 } : {}) } : isBoss ? { buttons: 30 } : i % 4 === 3 ? { buttons: 5 } : null,
    drops: [{ k: 'mat', ch: 0.35 }],
    boss: isBoss || i === 47, music: isBoss || i === 47 ? 'boss' : 'battle',
  };
}
function tutorialSpawns(i) {
  if (i === 0) return [sp('lint', 100, 2, [6, 9]), sp('sockhound', 100, 20, [20, 26], 2)];
  if (i === 1) return [sp('lint', 110, 1.5, [5, 8]), sp('sockhound', 110, 12, [14, 20], 4), sp('beetle', 100, 1, [30, 30], 1, 0.6)];
  return [sp('lint', 120, 1.5, [4.5, 7]), sp('sockhound', 120, 8, [12, 18], 5), sp('emberlint', 100, 20, [10, 16], 4), sp('beetle', 110, 1, [25, 30], 2, 0.7)];
}

/* --------------------------------------------------------- legend seams */
const LEG_THEMES = [
  ['The Moth Fields', ['drifting']], ['Ember Steppe', ['crimson']], ['Ink Marsh', ['shadow']], ['The Steel Gate', ['steel']],
  ['Gilded Loft', ['gilded']], ['Mixed Bag', ['crimson', 'drifting']], ['Dusk Road', ['shadow', 'drifting']], ['Rust Valley', ['crimson', 'steel']],
  ['Halo Heights', ['gilded', 'drifting']], ['Starfall Bay', ['starborn']], ['The Grave Garden', ['revenant']], ['Relic Dunes', ['ancient']],
  ['Hollow Wood', ['shadow', 'crimson']], ['Shimmer Isle', ['starborn', 'gilded']], ['Rot Bog', ['revenant', 'shadow']], ['The Edge', ['void']],
  ['Cotton Canyon', ['drifting', 'steel']], ['Button Ruins', ['ancient', 'crimson']], ['Mothlight', ['drifting', 'starborn']], ['Iron Orchard', ['steel', 'gilded']],
  ['Ashen Hem', ['crimson', 'revenant']], ['Silent Spool', ['void', 'shadow']], ['The Great Knot', ['ancient', 'void']], ['Last Light', ['starborn', 'void', 'gilded']],
];
export const SAGAS = [
  { id: 'tales', n: 'Tales of the Seam', subs: 24, unlock: s => (s.story[0] || 0) >= 48, base: 1.2, step: 0.32 },
  { id: 'uncanny', n: 'Uncanny Tales', subs: 12, unlock: s => (s.legendSub.tales || 0) >= 24, base: 9, step: 0.9 },
];
export const CROWN_MAG = [1, 1.5, 2, 3];
const LEG_RULES = [null, null, null, null, { rarity: ['basic', 'special', 'rare'] }, null, { maxCost: 1500 }, null, { noCannon: 1 }, null, { maxDeploy: 30 }, { timeLimit: 240 }];
export function legendName(saga, sub) { const t = LEG_THEMES[(sub + saga * 7) % LEG_THEMES.length]; return (saga ? 'Uncanny ' : '') + t[0]; }
export function legendStage(saga, sub, st, crown = 0) {
  const S = SAGAS[saga], key = `l${saga}-${sub}-${st}`;
  const t = LEG_THEMES[(sub + saga * 7) % LEG_THEMES.length];
  const lvl = Math.min(1, (sub + st / 4) / S.subs);
  const m = (S.base + S.step * sub + st * 0.15 * (1 + sub * 0.1)) * CROWN_MAG[crown];
  const mag = 100 * m;
  const maxTier = Math.min(6, 2 + Math.floor(lvl * 4) + saga);
  const r = RNG(hashStr(key));
  const rules = LEG_RULES[(sub * 4 + st) % LEG_RULES.length];
  const spawns = compose(key, { lvl, mag, traits: ['plain', ...t[1]], maxTier, boss: st === 3 ? r.pick(BOSS_BY_ARC[Math.min(2, saga + (sub > 14 ? 1 : 0))]) : null, bossMag: mag * 0.5, extra: 1 });
  const dropPool = ['button_knight', 'pinwheel', 'lantern', 'spike_cushion', 'thimble'];
  return {
    key, mode: 'legend', saga, sub, st, crown, spawns, name: `${t[0]} ${['I', 'II', 'III', 'IV'][st]}`, sub2: legendName(saga, sub),
    sub: `${S.n} · ${legendName(saga, sub)} · ${'♛'.repeat(crown + 1)}`,
    len: 2700 + st * 120 + saga * 200, baseHp: Math.round((6000 + sub * 2500 + st * 1500) * m / 1.5),
    energy: Math.min(60, 12 + sub + st * 2 + saga * 10), costMult: 1.5, theme: (sub + saga) % 3, sky: (sub + st) % 4,
    thread: Math.round((900 + sub * 350 + st * 200) * (1 + crown * 0.5) * (1 + saga * 2)), rules,
    first: { buttons: crown === 0 ? (st === 3 ? 30 : 10) : 10 * (crown + 1) },
    drops: [{ k: 'dye', ch: 0.25 }, { k: 'ticket', ch: 0.06 }, { k: 'rag', id: dropPool[sub % dropPool.length], ch: st === 3 ? 0.12 : 0 }, { k: 'gem', ch: saga ? 0.2 : 0.05 }],
    boss: st === 3, music: st === 3 ? 'boss' : 'battle',
  };
}

/* --------------------------------------------------------------- events */
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DYE_DAY = ['prism', 'red', 'blue', 'green', 'gold', 'violet', 'prism'];
const MONTH_FEST = ['Frost Knit', 'Heart Stitch', 'Spring Thread', 'Rain Quilt', 'Bloom Hem', 'Sun Patch', 'Firefly Seam', 'Harvest Moon', 'Leaf Fall', 'Pumpkin Patch', 'Harvest Stitch', 'Winter Wool'];
export function eventList(date = new Date()) {
  const d = date.getDay(), mo = date.getMonth();
  const L = [];
  L.push({ id: 'mill', n: 'Thread Mill', d: 'Thread-heavy foes that give a mountain of thread.', tiers: 4, kind: 'mill' });
  L.push({ id: 'dye', n: `Dye Garden: ${DYE_DAY[d] === 'prism' ? 'Prism' : DYE_DAY[d][0].toUpperCase() + DYE_DAY[d].slice(1)}`, d: 'Drops dye used for third forms.', tiers: 3, kind: 'dye', dye: DYE_DAY[d] });
  if ([1, 3, 5].includes(d)) L.push({ id: 'steelring', n: 'Steel Ring', d: 'Steel foes only. May drop the Steel Spindle rag.', tiers: 3, kind: 'steel' });
  if ([2, 4, 6].includes(d)) L.push({ id: 'tickets', n: 'Ticket Run', d: 'Drops ragbag tickets.', tiers: 3, kind: 'tickets' });
  if ([0, 6].includes(d)) L.push({ id: 'buttons', n: 'Button Hunt', d: 'Weekend stages that drop Buttons.', tiers: 3, kind: 'buttons' });
  if ([0, 3].includes(d)) L.push({ id: 'gems', n: 'Gem Trail', d: 'Drops Seam Gems that raise level caps.', tiers: 3, kind: 'gems' });
  L.push({ id: 'fest' + mo, n: `${MONTH_FEST[mo]} Festival`, d: 'This month\'s festival. Clear all four for a Platinum ticket.', tiers: 4, kind: 'fest' });
  L.push({ id: 'haste', n: 'Trial of Haste', d: 'Always open. Clear it as fast as you can; your best time is kept.', tiers: 1, kind: 'haste' });
  L.forEach(e => (e.day = DOW[d]));
  return L;
}
export function eventStage(ev, tier) {
  const key = `e-${ev.id}-${tier}`, r = RNG(hashStr(key));
  const m = [1.2, 3, 7, 14][tier] || 1;
  const base = { key, mode: 'event', ev: ev.id, tier, name: `${ev.n} · ${['Easy', 'Normal', 'Hard', 'Expert'][tier]}`, sub: `Event · ${ev.day}`, len: 2600, costMult: 1, theme: tier % 3, sky: (tier + 1) % 4, energy: [10, 20, 35, 50][tier], baseHp: Math.round(5000 * m), music: 'battle' };
  const mag = 100 * m;
  if (ev.kind === 'mill') return { ...base, spawns: [sp('lint', mag, 1, [3, 5]), sp('serpent', mag, 6, [10, 16], 0), sp('hollow', mag, 20, [20, 30], 3)], thread: Math.round(8000 * m * m * 0.6), drops: [] };
  if (ev.kind === 'dye') return { ...base, spawns: compose(key, { lvl: tier / 3, mag, traits: ['plain', 'crimson', 'drifting', 'shadow'], maxTier: 2 + tier }), thread: Math.round(1500 * m), drops: [{ k: 'dye', id: ev.dye, ch: 1, amt: 1 + tier }] };
  if (ev.kind === 'steel') return { ...base, spawns: [sp('ironthimble', 100, 1, [6, 9]), sp('tinhound', 100, 10, [14, 20], 4), sp('chromebeetle', 100 + tier * 100, 25, [25, 35], 2 + tier), ...(tier === 2 ? [sp('ironclad', 100, 1, [60, 60], 1, 0.6, 1)] : [])], baseHp: Math.round(3000 * m), thread: Math.round(6000 * m), drops: [{ k: 'rag', id: 'steel_spindle', ch: [0.08, 0.15, 0.3][tier] }] };
  if (ev.kind === 'tickets') return { ...base, spawns: compose(key, { lvl: tier / 2.5, mag, traits: ['plain', 'crimson', 'gilded'], maxTier: 2 + tier }), thread: Math.round(2000 * m), drops: [{ k: 'ntix', ch: 1, amt: 1 + tier }, { k: 'ticket', ch: [0.1, 0.25, 0.5][tier] }] };
  if (ev.kind === 'buttons') return { ...base, spawns: compose(key, { lvl: tier / 2.5, mag, traits: ['plain', 'drifting', 'shadow'], maxTier: 2 + tier }), thread: Math.round(2000 * m), drops: [{ k: 'buttons', ch: 1, amt: [10, 25, 50][tier] }] };
  if (ev.kind === 'gems') return { ...base, spawns: compose(key, { lvl: tier / 2.5, mag, traits: ['plain', 'starborn', 'revenant'], maxTier: 2 + tier }), thread: Math.round(2000 * m), drops: [{ k: 'gem', ch: 1, amt: 1 + tier }, { k: 'mythgem', ch: [0, 0.2, 0.5][tier] }] };
  if (ev.kind === 'fest') return { ...base, spawns: compose(key, { lvl: tier / 3, mag, traits: ['plain', r.pick(['crimson', 'drifting', 'shadow', 'gilded'])], maxTier: 2 + tier, boss: tier === 3 ? r.pick(BOSS_BY_ARC[0]) : null, bossMag: mag * 0.5 }), thread: Math.round(3000 * m), first: tier === 3 ? { plat: 1 } : { buttons: 20 }, drops: [{ k: 'mat', ch: 1 }] };
  // haste: fixed stage, clear for time
  return { ...base, name: 'Trial of Haste', spawns: [sp('lint', 200, 1, [3, 5]), sp('sockhound', 200, 5, [8, 12]), sp('beetle', 200, 15, [15, 20], 4), sp('crab', 150, 1, [30, 30], 2, 0.5)], baseHp: 20000, energy: 0, thread: 3000, timed: 1, drops: [] };
}

/* ------------------------------------------------------- rot outbreaks */
export const OUTBREAK_STAGES = [5, 11, 17, 23, 29, 35, 41, 47];
export function outbreakStage(arcCh, k) {
  const arc = Math.floor(arcCh / 3), ch = arcCh % 3, i = OUTBREAK_STAGES[k];
  const s = storyStage(arc, ch, i);
  const rev = pool(['revenant'], 6);
  const r = RNG(hashStr('ob' + arcCh + k));
  s.spawns = s.spawns.map(e => {
    if (e.boss) return { ...e, e: 'unburied', mag: e.mag * 0.7 };
    const tier = ENEMIES[e.e].tier, alt = rev.filter(x => Math.abs(x.tier - tier) <= 1);
    return { ...e, e: (alt.length ? r.pick(alt) : r.pick(rev)).id, mag: e.mag * 1.3 };
  });
  return { ...s, key: `o${arcCh}-${k}`, mode: 'outbreak', arcCh, k, name: 'Rot: ' + s.name, sub: `Rot Outbreak · ${ARCS[arc].n} · ${CH_NAMES[ch]}`, treasure: null, first: { buttons: 30, gem: 2 }, energy: s.energy + 5, drops: [{ k: 'gem', ch: 0.2 }] };
}

/* ---------------------------------------------------------- needle spire */
export function spireStage(f) {
  const key = 'sp' + f, lvl = f / 50, mag = 100 * Math.pow(1 + f * 0.32, 1.35);
  const boss = f % 10 === 0 ? ['spoolgolem', 'inkwell', 'giltmother', 'stareater', 'unburied'][f / 10 - 1] : null;
  return {
    key, mode: 'spire', f, name: `Floor ${f}`, sub: 'The Needle Spire', len: 2600 + f * 20, baseHp: Math.round(8000 * mag / 100),
    spawns: compose(key, { lvl, mag, traits: ['plain', 'crimson', 'drifting', 'shadow', 'gilded', 'steel', 'starborn', 'revenant', 'ancient', 'void'].slice(0, 3 + Math.floor(f / 6)), maxTier: Math.min(6, 2 + Math.floor(f / 9)), boss, bossMag: mag * 0.6, extra: 1 }),
    energy: 15 + Math.floor(f / 2), costMult: 1.5, theme: 1, sky: 2, thread: Math.round(3000 * mag / 100),
    first: f % 10 === 0 ? { buttons: 100, ticket: 1 } : f % 5 === 0 ? { buttons: 30 } : { buttons: 5 }, drops: [{ k: 'mat', ch: 0.6 }], boss: !!boss, music: boss ? 'boss' : 'battle',
  };
}

/* ------------------------------------------------------------ scrap yard */
export function yardStage(week) {
  const key = 'yard' + week, r = RNG(hashStr(key));
  const tr = ['plain', r.pick(['crimson', 'drifting', 'shadow', 'gilded']), r.pick(['starborn', 'steel', 'revenant'])];
  return {
    key, mode: 'yard', name: 'The Scrap Yard', sub: `Score attack · Week ${week % 100}`, len: 2400, baseHp: 1e12, immuneBase: 1, timeLimit: 120,
    spawns: compose(key, { lvl: 0.6, mag: 300, traits: tr, maxTier: 5, extra: 2 }).map(s => ({ ...s, trig: 1, n: 0 })),
    magRamp: 0.012, energy: 10, costMult: 1, theme: 0, sky: 3, thread: 2000, drops: [], music: 'battle',
  };
}
export const YARD_TIERS = [[20000, { thread: 20000 }], [80000, { buttons: 20 }], [200000, { ticket: 1 }], [500000, { buttons: 60 }], [1000000, { plat: 1 }]];

/* -------------------------------------------------------------- gauntlet */
export function gauntletStages(progress, week) {
  const r = RNG(hashStr('g' + week));
  const arcCh = Math.max(0, Math.min(8, progress - 1));
  const arc = Math.floor(arcCh / 3), ch = arcCh % 3;
  return Array.from({ length: 5 }, (_, k) => {
    const s = storyStage(arc, ch, Math.min(47, 20 + k * 6 + r.int(0, 3)));
    return { ...s, key: `g${week}-${k}`, mode: 'gauntlet', gi: k, name: `Gauntlet ${k + 1}/5: ${s.name}`, sub: 'Weekly Gauntlet', treasure: null, first: null, energy: k === 0 ? 30 : 0, spawns: s.spawns.map(x => ({ ...x, mag: x.mag * 1.3 })) };
  });
}

/* ---------------------------------------------------------------- tangle */
export const TANGLE_CHARMS = [
  { id: 'atk', n: 'Sharp Thread', d: 'Rag attack +20% this run', fx: 'ragAtk', v: 0.2 },
  { id: 'hp', n: 'Thick Batting', d: 'Rag health +20% this run', fx: 'ragHp', v: 0.2 },
  { id: 'scrap', n: 'Deep Pockets', d: 'Start every battle with +800 scrap', fx: 'startScrap', v: 800 },
  { id: 'cannon', n: 'Oiled Spool', d: 'Cannon charges 25% faster', fx: 'cannonCharge', v: 0.25 },
  { id: 'cd', n: 'Busy Needles', d: 'Recharge 15% faster', fx: 'cdDown', v: 0.15 },
  { id: 'loom', n: 'Spun Gold', d: 'Loom speed +25%', fx: 'loomRate', v: 0.25 },
  { id: 'base', n: 'Quilted Walls', d: 'Keep health +50%', fx: 'baseHp', v: 0.5 },
];
export function tangleStage(floor, door) {
  const key = `t${floor}-${door}`, elite = door === 'elite';
  const lvl = floor / 30, mag = 100 * (1.5 + floor * 0.45) * (elite ? 1.6 : 1);
  return {
    key, mode: 'tangle', floor, door, name: `Tangle ${floor}${elite ? ' · Elite' : ''}`, sub: 'The Tangle', len: 2600, baseHp: Math.round(5000 * mag / 100),
    spawns: compose(key, { lvl, mag, traits: ['plain', 'crimson', 'drifting', 'shadow', 'steel', 'gilded', 'starborn', 'revenant'].slice(0, 2 + Math.floor(floor / 4)), maxTier: Math.min(6, 2 + Math.floor(floor / 6)), boss: floor % 10 === 0 ? BOSS_BY_ARC[Math.min(2, floor / 10 - 1)][0] : null, bossMag: mag * 0.5, extra: elite ? 1 : 0 }),
    energy: floor === 1 ? 20 : 0, costMult: 1.25, theme: 2, sky: floor % 4, thread: Math.round(1500 * mag / 100), drops: [{ k: 'mat', ch: elite ? 1 : 0.5 }], boss: floor % 10 === 0, music: floor % 10 === 0 ? 'boss' : 'battle',
  };
}

/* ------------------------------------------------------------ legend trek */
export function trekStage(level) {
  const r = RNG(hashStr('trek' + level));
  const saga = level > 36 ? 1 : 0, sub = saga ? r.int(0, 5) : r.int(0, Math.min(23, Math.floor(level / 2))), st = r.int(0, 3);
  const s = legendStage(saga, sub, st, 0);
  return { ...s, key: 'k' + level, mode: 'trek', level, name: `Trek ${level}: ${s.name}`, sub: 'Legend Trek · borrowed lineup', energy: 0, first: level % 12 === 0 ? { buttons: 50, ...(level === 48 ? { plat: 1 } : {}) } : { buttons: 5 }, drops: [], rules: null };
}

/* ------------------------------------------------------------- rival dojo */
export function rivalStage(wins, ragIds) {
  const r = RNG(hashStr('rival' + wins));
  const lineup = Array.from({ length: 6 }, () => r.pick(ragIds));
  const lv = Math.min(50, 8 + wins * 4);
  return {
    key: 'r' + wins, mode: 'rival', wins, name: `Rival Bout ${wins + 1}`, sub: 'Rival Dojo · a rag army fights back', len: 2800, baseHp: 6000 + wins * 3000,
    spawns: [], rival: { lineup, lv, form: Math.min(2, Math.floor(wins / 3)) }, energy: 15, costMult: 1, theme: 0, sky: 1,
    thread: 4000 + wins * 1500, first: { buttons: 30 }, drops: [], music: 'boss',
  };
}
