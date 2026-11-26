// Every menu screen, modal and toast. DOM only; the canvas behind shows the home island or the battle.
import { el, $, fmt, fmtTime, pct, weekNumber, RNG } from './util.js';
import { ic } from './icons.js';
import { S, save, tickEnergy, energyMax, energyNext, refillEnergy, userRank, levelUp, levelCap, capUp, evolve, canEvolve, evolveReq, talentUp, powerUp,
  cannonUnlocked, cannonUp, buySpecial, currentBanner, draw, scavAreas, scavStart, scavCollect, scavXpNeed, scavHelper, claimMission, claimRank,
  treasureSetInfo, activeCombos, unitStats, battleBonus, loginCheck, resetSave, exportSave, importSave, totalClears, newBadges } from './save.js';
import { RAGS, RAG_IDS } from './data/rags.js';
import { ENEMIES, ENEMY_IDS } from './data/enemies.js';
import { RARITY, TRAITS, ABIL, IMMUNE_NAMES, levelCost } from './data/core.js';
import { POWERUPS, POWERUP_MAX, powerupCost, CANNONS, CANNON_MAX, cannonCost, ITEMS, COMBOS, TALENTS, talentCost, TREASURE_FX, FLAT_FX, TREASURE_Q,
  MISSIONS_DAILY, MISSIONS_WEEKLY, BADGES, LOGIN, BANNERS, RATES, DRAW_COST, DRAW11_COST, SCAV_TIMES, RANK_REWARDS, MATERIALS, DYES } from './data/meta.js';
import { ARCS, storyStage, SAGAS, legendStage, legendName, eventList, eventStage, outbreakStage, OUTBREAK_STAGES, spireStage, yardStage, YARD_TIERS,
  gauntletStages, tangleStage, TANGLE_CHARMS, trekStage, rivalStage } from './data/stages.js';
import { ragPortrait, foePortrait } from './art.js';
import { startBattle, lineupIds, ruleBlocks, ruleText, isCleared, onLose, newTangle, tangleCharms, trekLineup } from './game.js';
import { Scene } from './scene.js';
import { sfx, music, setVolume } from './audio.js';

const root = () => $('#screens');
const cv = c => { const n = el('canvas', { width: c.width, height: c.height }); n.getContext('2d').drawImage(c, 0, 0); return n; };
const ragImg = (id, form, size = 96) => cv(ragPortrait(RAGS[id].look, form ?? (S.rags[id] ? S.rags[id].form : 0), size));
const foeImg = (id, size = 96) => cv(foePortrait(ENEMIES[id], size));
const RNAME = id => { const d = RAGS[id], o = S.rags[id]; return d.forms[o ? o.form : 0].name; };
const rarCol = r => RARITY[r].col;
const traitTag = t => el('span.trait', { style: { background: TRAITS[t].col } }, TRAITS[t].name);
const ITEM_IC = { quick: 'fast', sack: 'sack', auto: 'cpu', lookout: 'eye', seeker: 'lamp', lamp: 'book' };

export function toast(t) { const box = $('#toasts'), n = el('div.toast', t); box.append(n); setTimeout(() => n.remove(), 2200); }
export function modal(content, cls = '') { const m = $('#modal'); m.innerHTML = ''; m.append(el('div.sheet' + cls, content)); m.classList.remove('hidden'); return m; }
export function closeModal() { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; }
function rewardSpans(got) {
  return (got || []).map(g => {
    const [k, a, b] = g;
    if (k === 'thread') return el('span', { html: ic('thread') + ' ' + fmt(a) });
    if (k === 'buttons') return el('span', { html: `<span class="gold">${ic('button')}</span> ${a}` });
    if (k === 'ticket') return el('span', { html: ic('ticket') + ` ${a} Rare ticket` });
    if (k === 'ntix') return el('span', { html: ic('ticket') + ` ${a} Thread ticket` });
    if (k === 'plat') return el('span', { html: `<span style="color:#e9ecf4">${ic('ticket')}</span> ${a} Platinum ticket` });
    if (k === 'np') return el('span', { html: ic('needle') + ` ${a} NP` });
    if (k === 'gem') return el('span', { html: `<span class="acc">${ic('gem')}</span> ${a} Seam Gem` });
    if (k === 'mythgem') return el('span', { html: `<span style="color:#ff5ea8">${ic('gem')}</span> ${a} Mythic Gem` });
    if (k === 'item') return el('span', { html: ic(ITEM_IC[a]) + ' ' + ITEMS[a].n });
    if (k === 'mat') return el('span', { html: `<span style="color:${MATERIALS[a].col}">${ic('thread')}</span> ${b} ${MATERIALS[a].n}` });
    if (k === 'dye') return el('span', { html: `<span style="color:${DYES[a].col}">${ic('dye')}</span> ${b} ${DYES[a].n}` });
    if (k === 'rag') return el('span', { html: `${ic('army')} ${RAGS[a].names[0]} ${b === 'new' ? '<span class="tag">NEW</span>' : '+1'}` });
    return el('span', String(a));
  });
}
const rewardObjSpans = r => rewardSpans(Object.entries(r || {}).map(([k, v]) => (k === 'mat' || k === 'dye' ? Object.entries(v).map(([m, n]) => [k, m, n]) : [[k, v]])).flat());

/* ------------------------------------------------------------ chrome */
function pills() {
  tickEnergy();
  return el('div.row', { style: { gap: '6px', justifyContent: 'flex-end' } },
    el('div.pill', { html: `<span class="gold">${ic('button')}</span><b>${fmt(S.buttons)}</b>` }),
    el('div.pill', { html: `${ic('thread')}<b>${fmt(S.thread)}</b>` }),
    el('button.pill', { onclick: energyModal, html: `<span class="acc">${ic('energy')}</span><b class="en-val">${S.energy}/${energyMax()}</b><small class="en-t"></small>` }),
    el('div.pill', { html: `${ic('star')}<b>Rank ${userRank()}</b>` }));
}
function energyModal() {
  modal([el('h2', 'Energy'), el('p.muted', `Battles cost energy. You get 1 back every minute (max ${energyMax()}). Raise the cap with the Pack Size upgrade and treasures.`),
    el('div.acts', el('button.btn.primary', { onclick: () => { if (refillEnergy()) { toast('Energy refilled'); closeModal(); UI.refresh(); } else toast('Not enough Buttons'); } }, el('b', { html: `Refill · <span>${ic('button')}</span> 30` })), el('button.btn', { onclick: closeModal }, 'Close'))]);
}
function bar(title, back = () => UI.home()) {
  return el('div.bar', el('button.round', { onclick: () => { sfx('ui'); back(); }, title: 'Back', html: ic('back') }), el('h2', title), pills());
}
function screen(id, ...kids) { const r = root(); r.innerHTML = ''; const s = el('div.screen#' + id, ...kids); r.append(s); return s; }

/* -------------------------------------------------------------- UI */
export const UI = {
  cur: 'home', arg: null, mapSel: null, armySel: null,
  show(name, arg) { if (Scene.b) Scene.stop(); this.cur = name; this.arg = arg; closeModal(); this[name](arg); },
  refresh() { if (this.cur && this[this.cur]) this[this.cur](this.arg); },

  /* ------------------------------------------------------------- home */
  home() {
    this.cur = 'home'; music('home');
    const next = nextStory();
    const L = (n, icn, f, dot) => el('button.btn', { onclick: () => { sfx('ui'); f(); } }, el('span', { html: ic(icn) }), n, dot ? el('i.dot') : null);
    const missionsReady = [...MISSIONS_DAILY, ...MISSIONS_WEEKLY].some(m => !S.missions.claimed[m.id] && (S.missions.prog[m.id] || 0) >= m.goal) || RANK_REWARDS.some(([n], i) => userRank() >= n && !S.rankClaimed.includes(i));
    const scavReady = S.scav.end && Date.now() >= S.scav.end;
    screen('home',
      el('div.home-panel',
        el('div.title', el('span.t1', 'THE'), el('span.t2', [...'RAG'].map((c, i) => el('span', { style: { animationDelay: i * 0.07 + 's' } }, c))), el('span.t3', 'ARMY')),
        el('p.tagline', 'Stitch an army. Hold the lane. Unravel the Frayed.'),
        el('button.btn.primary.big', { onclick: () => { sfx('ui'); UI.show('prep', { stage: next }); } }, el('span', { html: ic('play') }), el('span.bt', el('b', 'Battle'), el('small', `${next.name} · ${ARCS[next.arc].n} ${next.ch + 1}-${next.i + 1}`))),
        el('div.home-grid',
          L('World Map', 'map', () => UI.show('map')), L('Legend Seams', 'book', () => UI.show('legend'), false),
          L('Events', 'calendar', () => UI.show('events')), L('Challenges', 'trophy', () => UI.show('challenges')),
          L('Army', 'army', () => UI.show('army')), L('Lineup', 'lineup', () => UI.show('lineup')),
          L('Ragbag', 'bag', () => UI.show('ragbag'), S.ticket > 0 || S.plat > 0), L('Workshop', 'wrench', () => UI.show('workshop')),
          L('Scavenger', 'pick', () => UI.show('scav'), scavReady), L('Missions', 'check', () => UI.show('missions'), missionsReady),
          L('Treasures', 'chest', () => UI.show('treasures')), L('Guide', 'eye', () => UI.show('guide')),
          L('Settings', 'gear', () => UI.show('settings')))),
      el('div.corner.tr', pills()),
      el('div.ver', 'THE RAG ARMY · v1.0'));
  },

  /* -------------------------------------------------------------- map */
  map(arg) {
    const sel = arg ?? this.mapSel ?? currentArcCh();
    this.mapSel = sel;
    const arc = Math.floor(sel / 3), ch = sel % 3;
    const unlocked = k => k === 0 || (S.story[k - 1] || 0) >= 48;
    const cleared = S.story[sel] || 0;
    const nodes = Array.from({ length: 48 }, (_, i) => {
      const st = storyStage(arc, ch, i), open = i <= cleared, q = S.treasure[st.treasure] || 0;
      return el('button.node' + (open ? '' : '.lock') + (i === Math.min(cleared, 47) ? '.sel' : ''), { onclick: () => open && UI.show('prep', { stage: st, back: () => UI.show('map', sel) }) },
        el('span.n', `${i + 1}`), el('span.t' + (st.boss ? '.boss' : ''), st.name), i < cleared ? el('span.chk', { html: ic('check') }) : null,
        el('div.pips', el('i.pip.q' + q)));
    });
    screen('map', bar('World Map'), el('div.wrap',
      el('div.tabs', ARCS.map((a, ai) => el('button.btn' + (ai === arc ? '.on' : '') + (unlocked(ai * 3) ? '' : '.off'), { onclick: () => unlocked(ai * 3) && UI.show('map', ai * 3) }, a.n))),
      el('div.tabs', [0, 1, 2].map(c => el('button.btn' + (c === ch ? '.on' : '') + (unlocked(arc * 3 + c) ? '' : '.off'), { onclick: () => unlocked(arc * 3 + c) && UI.show('map', arc * 3 + c) }, `Chapter ${c + 1} · ${S.story[arc * 3 + c] || 0}/48`))),
      el('p.muted', { style: { marginBottom: '10px', fontSize: '13px' } }, ['Each stage hides a treasure. Clear a stage to have a chance at it; Gold beats Silver beats Bronze. Six treasures make a set bonus (see Treasures).', 'Starborn foes shrug off damage here until you gather Starward treasures from this land.', 'Revenants get back up and Void foes wear regrowing husks. Bring Unravellers and Husk Pierce.'][arc]),
      el('div.stage-grid', nodes)));
  },

  /* ------------------------------------------------------------- prep */
  prep({ stage, back, o = {} }) {
    const backFn = back || (() => UI.home());
    const foes = [...new Set((stage.spawns || []).map(s => s.e))];
    const ids = o.borrowed ? o.borrowed.map(b => b.id) : lineupIds();
    const B = battleBonus(ids, o.charms || []);
    const combos = activeCombos(ids);
    const slots = Array.from({ length: 10 }, (_, i) => {
      const id = ids[i];
      if (!id) return el('div.slot.empty', '+');
      const blocked = !o.borrowed && ruleBlocks(stage, id);
      const form = o.borrowed ? o.borrowed[i].form : S.rags[id].form;
      const n = el('div.slot', { title: RAGS[id].forms[form].name, style: blocked ? { opacity: 0.3 } : {} }, ragImg(id, form, 80));
      return n;
    });
    const itemRow = el('div.row', { style: { gap: '6px' } }, Object.keys(ITEMS).map(k => {
      const n = S.items[k] || 0, on = !!S.itemsOn[k] && n > 0;
      return el('button.btn.small' + (on ? '.primary' : ''), { title: ITEMS[k].d, onclick: () => { if (!n) return toast('None left: earn more from missions and login stamps'); S.itemsOn[k] = !S.itemsOn[k]; save(); UI.prep({ stage, back, o }); } }, el('b', { html: `${ic(ITEM_IC[k])} ${ITEMS[k].n} ×${n}` }));
    }));
    const cannons = el('div.row', { style: { gap: '6px' } }, CANNONS.filter(c => cannonUnlocked(c)).map(c => el('button.btn.small' + (S.cannon === c.id ? '.primary' : ''), { title: c.d, onclick: () => { S.cannon = c.id; save(); UI.prep({ stage, back, o }); } }, `${c.n} ${S.cannons[c.id] || 1}`)));
    const R = stage.rules ? ruleText(stage.rules) : '';
    const drops = (stage.drops || []).filter(d => d.ch > 0).map(d => el('span', { html: `${d.k === 'rag' ? ic('army') + ' ' + RAGS[d.id].names[0] : d.k === 'dye' ? ic('dye') + ' Dye' : d.k === 'mat' ? ic('thread') + ' Materials' : d.k === 'ticket' ? ic('ticket') + ' Rare ticket' : d.k === 'ntix' ? ic('ticket') + ' Thread ticket' : d.k === 'gem' ? ic('gem') + ' Seam Gem' : d.k === 'mythgem' ? ic('gem') + ' Mythic Gem' : d.k === 'buttons' ? ic('button') + ' Buttons' : d.k} <small class="muted">${d.ch >= 1 ? '' : Math.round(d.ch * 100) + '%'}</small>` }));
    const go = () => {
      sfx('ui');
      const err = startBattle(stage, UI, o);
      if (err === 'energy') { toast('Not enough energy'); return energyModal(); }
      if (err === 'lineup') return toast(o.borrowed ? 'No rags' : 'Your lineup has no rags allowed on this stage');
      root().innerHTML = ''; this.cur = 'battle'; this.lastPrep = { stage, back, o };
    };
    screen('prep', bar(stage.name, backFn), el('div.wrap.cols',
      el('div.card.detail',
        el('div.lbl', stage.sub), el('h3', { style: { margin: '4px 0 10px' } }, stage.name),
        stage.mode === 'legend' ? crownPick(stage, back, o) : null,
        R ? el('p', { style: { color: '#ffb13d', fontSize: '13px', marginBottom: '8px' } }, 'Rules: ' + R) : null,
        el('div.lbl', 'Foes'), el('div.foes', { style: { margin: '6px 0 12px' } }, foes.map(id => el('div.foe', foeImg(id, 64), ENEMIES[id].name))),
        stage.rival ? el('p.muted', { style: { fontSize: '13px' } }, `A rival army of level ${stage.rival.lv} rags fights back with its own loom.`) : null,
        el('div.lbl', 'Rewards'),
        el('div.rew', { style: { margin: '6px 0 6px' } }, el('span', { html: `${ic('thread')} ${fmt(Math.round((stage.thread || 0) * (1 + (B.threadUp || 0))))}` }), stage.treasure ? el('span', { html: `${ic('chest')} Treasure <small class="muted">${TREASURE_Q[S.treasure[stage.treasure] || 0] || 'none yet'}</small>` }) : null, drops),
        stage.first && !isCleared(stage) ? el('div.rew', el('span.tag', 'First clear'), rewardObjSpans(stage.first)) : null,
        el('div.sep'),
        el('div.row', el('span.lbl', 'Foe keep'), el('b', stage.immuneBase ? 'Invincible (score attack)' : fmt(stage.baseHp)), el('span.lbl', 'Lane'), el('b', fmt(stage.len)), el('span.lbl', 'Cost ×'), el('b', String(stage.costMult || 1)))),
      el('div.card',
        el('div.row', el('div.lbl.grow', o.borrowed ? 'Borrowed lineup' : `Lineup ${S.lineupIdx + 1}`), o.borrowed ? null : el('button.btn.small', { onclick: () => UI.show('lineup', { back: () => UI.show('prep', { stage, back, o }) }) }, 'Edit')),
        el('div.slots', { style: { margin: '8px 0' } }, slots),
        combos.length ? el('p', { style: { fontSize: '12px', color: '#c8ff2e', marginBottom: '6px' } }, 'Combos: ' + combos.map(c => c.n + ' (' + c.d + ')').join(' · ')) : null,
        o.charms && o.charms.length ? el('p', { style: { fontSize: '12px', color: '#ffc933' } }, 'Charms: ' + o.charms.map(c => c.n).join(', ')) : null,
        el('div.lbl', { style: { marginTop: '6px' } }, 'Battle items'), itemRow,
        stage.rules && stage.rules.noCannon ? null : [el('div.lbl', { style: { marginTop: '10px' } }, 'Cannon'), cannons],
        el('div.sep'),
        el('button.btn.primary.big', { style: { width: '100%' }, onclick: go }, el('span', { html: ic('sword') }), el('span.bt', el('b', 'Fight'), el('small', { html: `${ic('energy')} ${stage.energy || 0} energy · you have ${S.energy}` }))))));
  },

  /* ----------------------------------------------------------- legend */
  legend(arg = {}) {
    const saga = arg.saga ?? 0, SG = SAGAS[saga];
    const open = SG.unlock(S);
    const done = S.legendSub[SG.id] || 0;
    const sub = arg.sub ?? Math.min(done, SG.subs - 1);
    const subs = Array.from({ length: SG.subs }, (_, k) => el('button.node' + (k <= done && open ? '' : '.lock') + (k === sub ? '.sel' : ''), { onclick: () => k <= done && open && UI.show('legend', { saga, sub: k }) },
      el('span.n', `Seam ${k + 1}`), el('span.t', legendName(saga, k)), k < done ? el('span.chk', { html: ic('check') }) : null));
    const stages = open ? [0, 1, 2, 3].map(st => {
      const best = S.legend[`l${saga}-${sub}-${st}`] || 0, prevOk = st === 0 || (S.legend[`l${saga}-${sub}-${st - 1}`] || 0) >= 1;
      const s = legendStage(saga, sub, st, 0);
      return el('div.li', el('div.grow', el('b', s.name), el('small', `${'♛'.repeat(best)}${'·'.repeat(4 - best)}  ${s.rules ? ruleText(s.rules) : ''}`)),
        el('button.btn.small' + (prevOk ? '.primary' : '.off'), { onclick: () => prevOk && UI.show('prep', { stage: legendStage(saga, sub, st, Math.min(3, best)), back: () => UI.show('legend', { saga, sub }) }) }, 'Play'));
    }) : [el('p.muted', saga === 0 ? 'Clear chapter 1 of The Long Seam to open the Legend Seams.' : 'Clear all 24 Tales of the Seam to open the Uncanny Tales.')];
    screen('legend', bar('Legend Seams'), el('div.wrap',
      el('div.tabs', SAGAS.map((g, i) => el('button.btn' + (i === saga ? '.on' : ''), { onclick: () => UI.show('legend', { saga: i }) }, g.n))),
      el('p.muted', { style: { fontSize: '13px', marginBottom: '10px' } }, 'Short seams of four stages. Each stage can be cleared on up to four crowns (stronger foes, better first-clear Buttons). Some stages have rules. Stage IV may drop a special rag.'),
      el('div.cols', el('div.stage-grid', subs), el('div.card', el('div.lbl', `Seam ${sub + 1}`), el('h3', { style: { margin: '4px 0 10px', fontSize: '20px', fontWeight: 900 } }, legendName(saga, sub)), el('div.list', stages)))));
  },

  /* ----------------------------------------------------------- events */
  events() {
    const ev = eventList();
    const rows = ev.map(e => el('div.li', el('div.grow', el('b', e.n), el('small', e.d + (e.kind === 'haste' && S.hasteBest ? ` Best: ${S.hasteBest}s` : ''))),
      el('div.row', { style: { gap: '4px' } }, Array.from({ length: e.tiers }, (_, t) => { const st = eventStage(e, t); return el('button.btn.small' + (S.festClear[st.key] ? '.primary' : ''), { onclick: () => UI.show('prep', { stage: st, back: () => UI.show('events') }) }, ['Easy', 'Normal', 'Hard', 'Expert'][t] || 'Play'); }))));
    const obs = [];
    for (let k = 0; k < 9; k++) if ((S.story[k] || 0) >= 48) {
      obs.push(el('div.li', el('div.grow', el('b', `Rot Outbreak · ${ARCS[Math.floor(k / 3)].n} ch.${k % 3 + 1}`), el('small', 'The cleared stages rot over with Revenants. Bring Unravellers.')),
        el('div.row', { style: { gap: '4px' } }, OUTBREAK_STAGES.map((_, j) => { const st = outbreakStage(k, j); const ok = j === 0 || S.outbreak[outbreakStage(k, j - 1).key]; return el('button.btn.small' + (S.outbreak[st.key] ? '.primary' : ok ? '' : '.off'), { onclick: () => ok && UI.show('prep', { stage: st, back: () => UI.show('events') }) }, String(j + 1)); }))));
    }
    screen('events', bar('Events'), el('div.wrap',
      el('p.muted', { style: { fontSize: '13px', marginBottom: '10px' } }, `Today is ${ev[0].day}. Daily stages rotate every day; the festival changes every month.`),
      el('div.list', rows), el('div.sep'), el('div.lbl', 'Rot Outbreaks'), el('div.list', { style: { marginTop: '6px' } }, obs.length ? obs : [el('p.muted', 'Clear a whole chapter to start its Rot Outbreak.')])));
  },

  /* ------------------------------------------------------- challenges */
  challenges() {
    const wk = weekNumber();
    if (S.gauntlet.week !== wk) { S.gauntlet = { week: wk, k: 0 }; save(); }
    const prog = S.story.filter(x => x >= 48).length + 1;
    const gs = gauntletStages(prog, wk);
    const yardBest = S.yardWeek === wk ? S.yardWeekBest : 0;
    const tile = (title, desc, btn, f, extra) => el('div.card', el('h3', { style: { fontSize: '20px', fontWeight: 900 } }, title), el('p.muted', { style: { fontSize: '13px', margin: '6px 0 10px' } }, desc), extra || null, el('button.btn.primary', { onclick: f }, btn));
    const gate = (S.story[0] || 0) >= 24;
    screen('challenges', bar('Challenges'), el('div.wrap', !gate ? el('p.gold', { style: { marginBottom: '10px' } }, 'Most challenges open after stage 24 of The Long Seam.') : null,
      el('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' } },
        tile('Needle Spire', `50 floors, each harder than the last. A boss guards every tenth floor. Best: floor ${S.spire}.`, S.spire >= 50 ? 'Replay floor 50' : `Floor ${S.spire + 1}`, () => gate ? UI.show('prep', { stage: spireStage(Math.min(50, S.spire + 1)), back: () => UI.show('challenges') }) : toast('Clear Long Seam stage 24 first')),
        tile('The Scrap Yard', `Score attack: deal as much damage as you can to an unbreakable keep in 2 minutes. Week best: ${fmt(yardBest)}. All-time: ${fmt(S.yardBest)}.`, 'Score attack', () => gate ? UI.show('prep', { stage: yardStage(wk), back: () => UI.show('challenges') }) : toast('Clear Long Seam stage 24 first'),
          el('div.rew', { style: { marginBottom: '10px' } }, YARD_TIERS.map(([n, r], i) => el('span', { style: { opacity: S.yardWeek === wk && S.yardClaimed.includes(i) ? 0.4 : 1 } }, fmt(n) + ': ', rewardObjSpans(r))))),
        tile('Weekly Gauntlet', `Five battles in a row with no breaks; lose one and you start over. Progress: ${S.gauntlet.k}/5. Prize: 2 Rare tickets and 80 Buttons.`, S.gauntlet.k >= 5 ? 'Done this week' : `Battle ${S.gauntlet.k + 1}`, () => gate && S.gauntlet.k < 5 ? UI.show('prep', { stage: gs[S.gauntlet.k], back: () => UI.show('challenges') }) : toast(gate ? 'Come back next week' : 'Clear Long Seam stage 24 first')),
        tile('The Tangle', `A run of 30 floors. Pick a door on every floor: battles, elite battles, charms that power up this run, or a cache. Lose once and the run ends. Best: floor ${S.tangleBest}.`, S.tangle ? `Continue · floor ${S.tangle.floor}` : 'Start a run', () => gate ? UI.show('tangle') : toast('Clear Long Seam stage 24 first')),
        tile('Legend Trek', `48 levels of Legend stages, each with a random borrowed lineup. Progress: ${S.trek}/48.`, S.trek >= 48 ? 'Complete' : `Level ${S.trek + 1}`, () => {
          if ((S.story[0] || 0) < 48) return toast('Clear chapter 1 of The Long Seam first');
          if (S.trek >= 48) return toast('Trek complete!');
          const lv = S.trek + 1; UI.show('prep', { stage: trekStage(lv), back: () => UI.show('challenges'), o: { borrowed: trekLineup(lv), noItems: 1 } });
        }),
        tile('Rival Dojo', `A rival rag army with its own loom fights back. It grows stronger every time you win. Wins: ${S.rival}.`, `Bout ${S.rival + 1}`, () => gate ? UI.show('prep', { stage: rivalStage(S.rival, RAG_IDS), back: () => UI.show('challenges') }) : toast('Clear Long Seam stage 24 first')))));
  },
  tangle() {
    if (!S.tangle) newTangle();
    const T = S.tangle;
    if (T.floor > 30) { const g = claimTangleEnd(); return modal([el('h2', 'Tangle cleared!'), el('div.rew', rewardSpans(g)), el('div.acts', el('button.btn.primary', { onclick: () => UI.show('challenges') }, 'Back'))]); }
    const r = RNG(T.seed * 31 + T.floor);
    const kinds = T.floor % 10 === 0 ? ['battle'] : [r.pick(['battle', 'elite']), r.pick(['charm', 'battle', 'cache']), r.pick(['elite', 'charm', 'battle'])];
    const charms = tangleCharms();
    const door = k => {
      if (k === 'battle' || k === 'elite') return UI.show('prep', { stage: tangleStage(T.floor, k), back: () => UI.show('tangle'), o: { charms } });
      if (k === 'cache') { const g = []; g.push(...grantMsg({ thread: 1500 * T.floor, mat: { cotton: 2, wool: 2 } })); T.floor++; save(); toast('Cache: thread and materials'); return UI.show('tangle'); }
      const opts = TANGLE_CHARMS.filter(c => !T.charms.includes(c.id)); const pick3 = [r.pick(opts), r.pick(opts), r.pick(opts)].filter((v, i, a) => v && a.indexOf(v) === i);
      modal([el('h2', 'Pick a charm'), el('div.list', pick3.map(c => el('button.li', { onclick: () => { T.charms.push(c.id); T.floor++; save(); closeModal(); UI.show('tangle'); } }, el('div.grow', el('b', c.n), el('small', c.d)))))]);
    };
    screen('tangle', bar('The Tangle', () => UI.show('challenges')), el('div.wrap',
      el('div.card', el('div.lbl', 'Floor'), el('h3', { style: { fontSize: '40px', fontWeight: 900 } }, `${T.floor} / 30`),
        el('p.muted', 'Charms this run: ' + (charms.length ? charms.map(c => c.n).join(', ') : 'none')),
        el('div.grid', { style: { marginTop: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' } }, kinds.map(k => el('button.btn' + (k === 'elite' ? '.danger' : k === 'charm' ? '.gold' : ''), { style: { minHeight: '90px' }, onclick: () => door(k) },
          el('b', { battle: 'Battle', elite: 'Elite battle', charm: 'Charm', cache: 'Cache' }[k]), el('small', { battle: 'A normal fight', elite: 'Harder fight, better loot', charm: 'Power up this run', cache: 'Free thread and materials' }[k])))),
        el('div.sep'), el('button.btn.small.danger', { onclick: () => { S.tangle = null; save(); UI.show('challenges'); } }, 'Abandon run'))));
  },

  /* ------------------------------------------------------------- army */
  army(sel) {
    const id = sel || this.armySel || Object.keys(S.rags)[0];
    this.armySel = id;
    const cards = RAG_IDS.map(k => {
      const own = S.rags[k], d = RAGS[k];
      return el('button.ragcard' + (k === id ? '.sel' : '') + (own ? '' : '.lock'), { onclick: () => UI.show('army', k) },
        own || S.seenRags[k] ? ragImg(k, own ? own.form : 0, 76) : el('div', { style: { width: '76px', height: '76px', display: 'grid', placeItems: 'center', fontSize: '30px', color: '#2e3447', fontWeight: 900 } }, '?'),
        el('span.nm', own || S.seenRags[k] ? RNAME(k) : '???'), el('span.lv', own ? `Lv ${own.lv}${own.plus ? '+' + own.plus : ''}` : d.buy ? `${d.buy} Buttons` : d.unlock !== undefined ? 'Story' : d.drop ? 'Event drop' : 'Ragbag'),
        el('i.rar', { style: { background: rarCol(d.rarity) } }));
    });
    screen('army', bar('Army'), el('div.wrap.cols',
      el('div', el('p.muted', { style: { fontSize: '13px', marginBottom: '8px' } }, `${Object.keys(S.rags).length}/${RAG_IDS.length} rags · ${S.np} NP · ${S.gem} Seam Gems · ${S.mythgem} Mythic Gems`), el('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))' } }, cards)),
      ragDetail(id)));
  },

  /* ----------------------------------------------------------- lineup */
  lineup(arg = {}) {
    const L = S.lineups[S.lineupIdx];
    const back = arg.back || (() => UI.home());
    const slots = Array.from({ length: 10 }, (_, i) => L[i] ? el('button.slot', { title: 'Remove', onclick: () => { L.splice(i, 1); save(); UI.lineup(arg); } }, ragImg(L[i], undefined, 80)) : el('div.slot.empty', '+'));
    const owned = RAG_IDS.filter(k => S.rags[k]);
    const combos = activeCombos(L);
    screen('lineup', bar('Lineup', back), el('div.wrap',
      el('div.tabs', S.lineups.map((_, i) => el('button.btn' + (i === S.lineupIdx ? '.on' : ''), { onclick: () => { S.lineupIdx = i; save(); UI.lineup(arg); } }, `Lineup ${i + 1}`))),
      el('div.cols',
        el('div', el('div.slots', slots), el('p.muted', { style: { fontSize: '12px', margin: '8px 0' } }, 'Tap a rag to add or remove it. Up to 10. The first five sit on keys 1-5, the next five on 6-0.'),
          el('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' } }, owned.map(k => {
            const inL = L.includes(k), st = unitStats(k, {});
            return el('button.ragcard' + (inL ? '.inlu' : ''), { onclick: () => { if (inL) L.splice(L.indexOf(k), 1); else if (L.length < 10) L.push(k); else toast('Lineup is full'); save(); UI.lineup(arg); } },
              el('span.cost', String(st.cost)), ragImg(k, undefined, 76), el('span.nm', RNAME(k)), el('span.lv', `Lv ${S.rags[k].lv}`), el('i.rar', { style: { background: rarCol(RAGS[k].rarity) } }));
          }))),
        el('div.card', el('div.lbl', 'Active combos'), el('div.list', { style: { margin: '6px 0 12px' } }, combos.length ? combos.map(c => el('div.li', el('div.grow', el('b', c.n), el('small', c.d)))) : [el('p.muted', 'None. Put the right rags together to trigger combos.')]),
          el('div.lbl', 'All combos'), el('div.list', { style: { marginTop: '6px' } }, COMBOS.map(c => el('div.li', { style: { opacity: c.rags.every(r => S.rags[r]) ? 1 : 0.5 } }, el('div.grow', el('b', c.n), el('small', c.d + ' · ' + c.rags.map(r => S.seenRags[r] || S.rags[r] ? RAGS[r].names[0] : '???').join(' + '))))))))));
  },

  /* ----------------------------------------------------------- ragbag */
  ragbag() {
    const bn = currentBanner();
    const doDraw = (n, pay) => {
      const res = draw(n, pay);
      if (!res) return toast(pay === 'buttons' ? 'Not enough Buttons' : 'No tickets');
      sfx('gacha');
      const best = res.some(r => r.rar === 'uber' || r.rar === 'legend');
      setTimeout(() => best && sfx('rare'), 500);
      modal([el('h2', best ? 'Mythic find!' : 'Ragbag'), el('div.reveal', res.map((r, i) => r.rag
        ? el('div.ragcard' + (r.rar === 'uber' ? '.big' : r.rar === 'legend' ? '.leg' : ''), { style: { animationDelay: i * 0.06 + 's' } }, ragImg(r.rag, 0, 76), el('span.nm', RAGS[r.rag].names[0]), el('span.lv', r.res === 'new' ? 'NEW!' : 'Dupe: +1 level, NP'), el('i.rar', { style: { background: rarCol(RAGS[r.rag].rarity) } }))
        : el('div.ragcard', { style: { animationDelay: i * 0.06 + 's' } }, el('div', { style: { height: '76px', display: 'grid', placeItems: 'center' }, html: ic(r.item ? ITEM_IC[r.item] : r.mat ? 'thread' : 'thread') }), el('span.nm', r.item ? ITEMS[r.item].n : r.mat ? `${r.n} ${MATERIALS[r.mat].n}` : `${fmt(r.thread)} thread`)))),
        el('div.acts', el('button.btn.primary', { onclick: () => { closeModal(); UI.ragbag(); } }, 'Nice'))]);
      newBadges(); save();
    };
    const specials = RAG_IDS.filter(k => RAGS[k].buy);
    screen('ragbag', bar('Ragbag'), el('div.wrap.cols',
      el('div',
        el('div.banner', { style: { '--bcol': bn.col } }, el('div.lbl', 'Rare Ragbag · featured this week'), el('h3', bn.n), el('p.muted', { style: { fontSize: '13px' } }, 'Featured Mythic rags are twice as likely. An 11-draw always ends on an Epic or better. A Mythic is guaranteed within 100 draws.'),
          el('div.feat', bn.feat.map(k => ragImg(k, 0, 86)))),
        el('div.row', { style: { margin: '12px 0' } },
          el('button.btn.primary', { onclick: () => doDraw(1, 'buttons') }, el('b', { html: `Draw 1 · ${ic('button')} ${DRAW_COST}` })),
          el('button.btn.primary', { onclick: () => doDraw(11, 'buttons') }, el('b', { html: `Draw 11 · ${ic('button')} ${DRAW11_COST}` })),
          el('button.btn', { onclick: () => doDraw(1, 'ticket') }, el('b', `Rare ticket (${S.ticket})`)),
          el('button.btn', { onclick: () => doDraw(Math.min(11, S.ticket), 'ticket') }, el('b', `Use up to 11 tickets`)),
          el('button.btn.gold', { onclick: () => doDraw(1, 'plat') }, el('b', `Platinum (${S.plat})`), el('small', 'Mythic or Legend'))),
        el('p.muted', { style: { fontSize: '12px' } }, `Rates: Rare ${pct(RATES.rare)} · Epic ${pct(RATES.sr)} · Mythic ${(RATES.uber * 100).toFixed(1)}% · Legend ${(RATES.legend * 100).toFixed(1)}%. Draws since last Mythic: ${S.pity}.`),
        el('div.sep'), el('div.lbl', 'Thread Bag'), el('p.muted', { style: { fontSize: '13px', margin: '6px 0' } }, 'Thread tickets come from events and login stamps. The Thread Bag holds Special rags, battle items, materials and thread.'),
        el('div.row', el('button.btn', { onclick: () => doDraw(1, 'ntix') }, el('b', `Open 1 (${S.ntix})`)), el('button.btn', { onclick: () => doDraw(Math.min(10, S.ntix), 'ntix') }, el('b', 'Open up to 10')))),
      el('div.card', el('div.lbl', 'Special rags for Buttons'), el('div.list', { style: { marginTop: '8px' } }, specials.map(k => el('div.li', ragImg(k, 0, 56), el('div.grow', el('b', RAGS[k].names[0]), el('small', RAGS[k].desc[0])),
        S.rags[k] ? el('span.tag', 'Owned') : el('button.btn.small.primary', { onclick: () => { if (buySpecial(k)) { sfx('rare'); toast(RAGS[k].names[0] + ' joined your army!'); UI.ragbag(); } else toast('Not enough Buttons'); } }, el('b', { html: `${ic('button')} ${RAGS[k].buy}` }))))),
        el('p.muted', { style: { fontSize: '12px', marginTop: '10px' } }, 'The Steel Spindle only drops from the Steel Ring event.'))));
  },

  /* --------------------------------------------------------- workshop */
  workshop(tab = 'up') {
    const ups = POWERUPS.map(p => {
      const lv = S.powerups[p.id] || 1, c = powerupCost(lv);
      return el('div.li', el('div.grow', el('b', `${p.n} · Lv ${lv}/${POWERUP_MAX}`), el('small', p.d)),
        lv >= POWERUP_MAX ? el('span.tag', 'Max') : el('button.btn.small' + (S.thread >= c ? '.primary' : ''), { onclick: () => { if (powerUp(p.id)) { sfx('loom'); UI.workshop('up'); } else toast('Not enough thread'); } }, el('b', { html: `${ic('thread')} ${fmt(c)}` })));
    });
    const cans = CANNONS.map(c => {
      const ok = cannonUnlocked(c), lv = S.cannons[c.id] || (ok ? 1 : 0), cost = cannonCost(lv);
      const costStr = Object.entries(cost).filter(([, n]) => n > 0).map(([m, n]) => `${n} ${MATERIALS[m].n}`).join(', ');
      return el('div.li', { style: { opacity: ok ? 1 : 0.45 } }, el('div.grow', el('b', `${c.n}${ok ? ' · Lv ' + lv : ''}`), el('small', ok ? c.d : `Unlocks after ${c.unlock} stage clears (you have ${totalClears()}).`)),
        ok ? el('div.row', { style: { gap: '4px' } }, el('button.btn.small' + (S.cannon === c.id ? '.primary' : ''), { onclick: () => { S.cannon = c.id; save(); UI.workshop('can'); } }, S.cannon === c.id ? 'Equipped' : 'Equip'),
          lv >= CANNON_MAX ? el('span.tag', 'Max') : el('button.btn.small', { title: costStr, onclick: () => { if (!S.cannons[c.id]) S.cannons[c.id] = 1; if (cannonUp(c.id)) { sfx('loom'); UI.workshop('can'); } else toast('Need ' + costStr); } }, 'Upgrade')) : null);
    });
    const mats = el('div.rew', Object.keys(MATERIALS).map(m => el('span', { html: `<span style="color:${MATERIALS[m].col}">${ic('thread')}</span> ${MATERIALS[m].n} ${S.mats[m] || 0}` })), Object.keys(DYES).map(m => el('span', { html: `<span style="color:${DYES[m].col}">${ic('dye')}</span> ${DYES[m].n} ${S.dyes[m] || 0}` })));
    screen('workshop', bar('Workshop'), el('div.wrap',
      el('div.tabs', el('button.btn' + (tab === 'up' ? '.on' : ''), { onclick: () => UI.workshop('up') }, 'Upgrades'), el('button.btn' + (tab === 'can' ? '.on' : ''), { onclick: () => UI.workshop('can') }, 'Cannons')),
      tab === 'up' ? el('div.list', ups) : [el('p.muted', { style: { fontSize: '13px', marginBottom: '8px' } }, 'Cannons upgrade with materials from battles and the Scavenger.'), mats, el('div.list', { style: { marginTop: '10px' } }, cans)]));
  },

  /* -------------------------------------------------------- scavenger */
  scav() {
    const sc = S.scav, now = Date.now(), areas = scavAreas();
    let body;
    if (sc.end && now < sc.end) body = el('div.card', el('div.lbl', 'Out scavenging'), el('h3', { style: { fontSize: '26px', fontWeight: 900, margin: '6px 0' } }, (areas.find(a => a.id === sc.area) || areas[0]).n), el('p', { class: 'scav-t' }, 'Back in ' + fmtTime((sc.end - now) / 1000)));
    else if (sc.end) body = el('div.card', el('h3', { style: { fontSize: '26px', fontWeight: 900 } }, 'The scavengers are back!'), el('button.btn.primary.big', { style: { marginTop: '10px' }, onclick: () => { const g = scavCollect(); sfx('rare'); modal([el('h2', 'Haul'), el('div.rew', rewardSpans(g)), el('div.acts', el('button.btn.primary', { onclick: () => { closeModal(); UI.scav(); } }, 'Great'))]); } }, 'Collect'));
    else body = el('div.card', el('div.lbl', 'Send the scavengers out'), el('p.muted', { style: { fontSize: '13px', margin: '6px 0 10px' } }, 'They bring back thread, materials and sometimes items, dye and gems. Longer trips and further areas bring more. They keep going while the game is closed.'),
      el('div.list', areas.map(a => el('div.li', el('div.grow', el('b', a.n), el('small', a.mats.map(m => MATERIALS[m].n).join(', '))), el('div.row', { style: { gap: '4px' } }, SCAV_TIMES.map(m => el('button.btn.small', { onclick: () => { scavStart(a.id, m); sfx('ui'); UI.scav(); } }, m + 'm')))))));
    screen('scav', bar('Scavenger'), el('div.wrap.cols', body,
      el('div.card', el('div.lbl', 'Crew'), el('h3', { style: { fontSize: '22px', fontWeight: 900, margin: '6px 0' } }, `Level ${sc.lv}`), el('div.prog', el('i', { style: { width: pct(sc.xp / scavXpNeed()) } })),
        el('p.muted', { style: { fontSize: '13px', margin: '8px 0' } }, `+${Math.round(sc.lv * 6)}% haul from level. Helpers: ${sc.helpers}/10 (+10% each).`),
        el('button.btn', { onclick: () => { if (scavHelper()) { toast('A helper joined'); UI.scav(); } else toast('Need 50 Buttons (max 10 helpers)'); } }, el('b', { html: `Hire helper · ${ic('button')} 50` })))));
  },

  /* --------------------------------------------------------- missions */
  missions(tab = 'daily') {
    const mrow = m => { const p = Math.min(m.goal, S.missions.prog[m.id] || 0), done = S.missions.claimed[m.id];
      return el('div.li', el('div.grow', el('b', m.n), el('small', `${p}/${m.goal}`), el('div.prog', el('i', { style: { width: pct(p / m.goal) } }))), el('div.rew', rewardObjSpans(m.r)),
        done ? el('span.tag.alt', 'Claimed') : el('button.btn.small' + (p >= m.goal ? '.primary' : '.off'), { onclick: () => { const g = claimMission(m); if (g) { sfx('scrap'); toast('Claimed!'); UI.missions(tab); } } }, 'Claim')); };
    let body;
    if (tab === 'daily') body = el('div.list', MISSIONS_DAILY.map(mrow));
    else if (tab === 'weekly') body = el('div.list', MISSIONS_WEEKLY.map(mrow));
    else if (tab === 'badges') body = el('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' } }, BADGES.map(b => el('div.li', { style: { opacity: S.badges[b.id] ? 1 : 0.45 } }, el('span', { class: S.badges[b.id] ? 'gold' : 'muted', html: ic('trophy') }), el('div.grow', el('b', b.n), el('small', b.d)))));
    else if (tab === 'stamps') body = el('div', el('p.muted', { style: { fontSize: '13px', marginBottom: '8px' } }, `Log in each day for a stamp. Day ${S.login.count} of 28.`), el('div.stamps', LOGIN.map((r, i) => el('div.stamp' + (i < S.login.count ? '.done' : '') + (i === S.login.count - 1 ? '.today' : ''), el('div', `Day ${i + 1}`, el('br'), Object.keys(r).map(k => k === 'item' ? ITEMS[r.item].n : k === 'thread' ? fmt(r.thread) + ' thread' : k === 'buttons' ? r.buttons + ' Buttons' : k === 'ticket' ? r.ticket + ' Rare ticket' : k === 'plat' ? 'Platinum' : k === 'ntix' ? 'Thread ticket' : k).join(''))))));
    else body = el('div', el('p.muted', { style: { fontSize: '13px', marginBottom: '8px' } }, `Your rank is the sum of every rag level and upgrade level: ${userRank()}. Claiming a rank reward refills energy.`),
      el('button.btn.primary', { onclick: () => { const g = claimRank(); if (g.length) { sfx('rare'); modal([el('h2', 'Rank rewards'), el('div.rew', rewardSpans(g)), el('div.acts', el('button.btn.primary', { onclick: () => { closeModal(); UI.missions('rank'); } }, 'OK'))]); } else toast('Nothing to claim yet'); } }, 'Claim all'),
      el('div.list', { style: { marginTop: '10px' } }, RANK_REWARDS.map(([n, r], i) => el('div.li', { style: { opacity: S.rankClaimed.includes(i) ? 0.45 : 1 } }, el('div.grow', el('b', `Rank ${n}`)), el('div.rew', rewardObjSpans(r))))));
    screen('missions', bar('Missions'), el('div.wrap', el('div.tabs', [['daily', 'Daily'], ['weekly', 'Weekly'], ['badges', 'Badges'], ['stamps', 'Login stamps'], ['rank', 'Rank rewards']].map(([k, n]) => el('button.btn' + (tab === k ? '.on' : ''), { onclick: () => UI.missions(k) }, n))), body));
  },

  /* -------------------------------------------------------- treasures */
  treasures(sel = 0) {
    const ai = Math.floor(sel / 3), ci = sel % 3;
    const sets = treasureSetInfo(ai, ci);
    screen('treasures', bar('Treasures'), el('div.wrap',
      el('div.tabs', ARCS.map((a, i) => el('button.btn' + (i === ai ? '.on' : ''), { onclick: () => UI.treasures(i * 3) }, a.n))),
      el('div.tabs', [0, 1, 2].map(c => el('button.btn' + (c === ci ? '.on' : ''), { onclick: () => UI.treasures(ai * 3 + c) }, `Chapter ${c + 1}`))),
      el('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' } }, sets.map((s, si) => el('div.li', el('div.grow', el('b', TREASURE_FX[s.fx]), el('small', `Stages ${si * 6 + 1}-${si * 6 + 6} · ${s.flat ? '+' + Math.round(s.val) : '+' + Math.round(s.val * 100) + '%'} of ${s.flat ? s.max : Math.round(s.max * 100) + '%'}`), el('div.pips', { style: { marginTop: '6px' } }, s.q.map(q => el('i.pip.q' + q)))))))));
  },

  /* ------------------------------------------------------------ guide */
  guide(tab = 'rags') {
    const list = tab === 'rags'
      ? RAG_IDS.map(k => (S.seenRags[k] || S.rags[k]) ? el('button.ragcard', { onclick: () => guideRag(k) }, ragImg(k, 0, 76), el('span.nm', RAGS[k].names[0]), el('i.rar', { style: { background: rarCol(RAGS[k].rarity) } })) : el('div.ragcard.lock', el('div', { style: { height: '76px', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 900, color: '#2e3447' } }, '?'), el('span.nm', '???')))
      : ENEMY_IDS.map(k => S.seenFoes[k] ? el('button.ragcard', { onclick: () => guideFoe(k) }, foeImg(k, 76), el('span.nm', ENEMIES[k].name), el('div', ENEMIES[k].traits.map(traitTag))) : el('div.ragcard.lock', el('div', { style: { height: '76px', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 900, color: '#2e3447' } }, '?'), el('span.nm', '???')));
    screen('guide', bar('Guide'), el('div.wrap',
      el('div.tabs', el('button.btn' + (tab === 'rags' ? '.on' : ''), { onclick: () => UI.guide('rags') }, `Rags ${Object.keys(S.seenRags).length}/${RAG_IDS.length}`), el('button.btn' + (tab === 'foes' ? '.on' : ''), { onclick: () => UI.guide('foes') }, `Foes ${Object.keys(S.seenFoes).length}/${ENEMY_IDS.length}`), el('button.btn' + (tab === 'how' ? '.on' : ''), { onclick: () => UI.guide('how') }, 'How to play')),
      tab === 'how' ? howTo() : el('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))' } }, list)));
  },

  /* --------------------------------------------------------- settings */
  settings() {
    const st = S.settings;
    const slider = (k, n) => el('div.li', el('div.grow', el('b', n)), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st[k], style: { maxWidth: '220px' }, oninput: e => { st[k] = +e.target.value; setVolume(st.sfx, st.music); save(); } }));
    const tog = (k, n, d) => el('div.li', el('div.grow', el('b', n), el('small', d)), el('button.btn.small' + (st[k] ? '.primary' : ''), { onclick: () => { st[k] = st[k] ? 0 : 1; save(); UI.settings(); } }, st[k] ? 'On' : 'Off'));
    screen('settings', bar('Settings'), el('div.wrap.cols',
      el('div.list', slider('sfx', 'Sound effects'), slider('music', 'Music'),
        el('div.li', el('div.grow', el('b', 'Effects'), el('small', 'Particle amount')), el('div.row', { style: { gap: '4px' } }, [[0.4, 'Low'], [1, 'Full']].map(([v, n]) => el('button.btn.small' + (st.fx === v ? '.primary' : ''), { onclick: () => { st.fx = v; save(); UI.settings(); } }, n)))),
        tog('shake', 'Screen shake', 'Camera shake on big hits'), tog('dmgNum', 'Damage numbers', 'Floating numbers on hits')),
      el('div.card', el('div.lbl', 'Save'), el('p.muted', { style: { fontSize: '13px', margin: '6px 0' } }, 'Your progress is saved in this browser. Copy the code to move it to another device.'),
        el('div.row', el('button.btn.small', { onclick: () => { const t = el('textarea', { readonly: true }, exportSave()); modal([el('h2', 'Save code'), t, el('div.acts', el('button.btn', { onclick: closeModal }, 'Close'))]); t.select(); } }, 'Export'),
          el('button.btn.small', { onclick: () => { const t = el('textarea'); modal([el('h2', 'Import save'), t, el('div.acts', el('button.btn.primary', { onclick: () => { try { importSave(t.value); closeModal(); toast('Save loaded'); UI.home(); } catch (e) { toast('That code did not work'); } } }, 'Load'), el('button.btn', { onclick: closeModal }, 'Cancel'))]); } }, 'Import'),
          el('button.btn.small.danger', { onclick: () => modal([el('h2', 'Erase everything?'), el('p.muted', 'This deletes all progress in this browser. It cannot be undone.'), el('div.acts', el('button.btn.danger', { onclick: () => { resetSave(); closeModal(); location.reload(); } }, 'Erase'), el('button.btn', { onclick: closeModal }, 'Cancel'))]) }, 'Reset')),
        el('div.sep'), el('div.lbl', 'Controls'), el('p', { style: { fontSize: '13px', lineHeight: 1.7, marginTop: '6px' }, html: '<kbd>1</kbd>-<kbd>0</kbd> deploy · <kbd>Q</kbd> loom · <kbd>E</kbd>/<kbd>Space</kbd> cannon · <kbd>F</kbd> speed · <kbd>P</kbd> pause · drag or <kbd>A</kbd>/<kbd>D</kbd> to look around' }),
        el('div.sep'), el('p.muted', { style: { fontSize: '12px' } }, 'The Rag Army. All art drawn in code, every sound synthesized. Rubik font under the SIL Open Font License.'))));
  },

  /* -------------------------------------------------- battle results */
  result(sum, stage, o) {
    const b = Scene.b;
    const contOk = !sum.win && !sum.done && !b.contUsed && stage.mode !== 'trek';
    const leave = () => { if (!sum.win && !sum.done) onLose(stage); Scene.stop(); closeModal(); backTo(stage); };
    const retry = () => { if (!sum.win && !sum.done) onLose(stage); Scene.stop(); closeModal(); const P = this.lastPrep; UI.show('prep', P); };
    const next = sum.win && stage.mode === 'story' ? nextStoryAfter(stage) : null;
    const content = [
      el('h2', sum.win ? 'Victory!' : sum.done ? 'Time!' : 'Defeat'),
      el('p.muted', stage.name),
      sum.done ? el('p', { style: { fontSize: '26px', fontWeight: 900, margin: '8px 0' } }, 'Score ' + fmt(sum.score)) : null,
      sum.time ? el('p', { style: { fontSize: '22px', fontWeight: 900 } }, `Time ${sum.time}s${sum.best ? ' · new best!' : ''}`) : null,
      el('div.rew', { style: { margin: '10px 0' } }, sum.thread ? el('span', { html: `${ic('thread')} ${fmt(sum.thread)}` }) : null, rewardSpans(sum.got)),
      sum.treasure ? el('p', { style: { margin: '6px 0' }, html: `${ic('chest')} Treasure found: <b class="gold">${TREASURE_Q[sum.treasure.q]}</b>${sum.treasure.kept ? '' : ' (you already had one as good)'}` }) : null,
      sum.first ? el('div.rew', el('span.tag', 'First clear'), rewardSpans(sum.first)) : null,
      sum.unlocked.length ? el('p.acc', { style: { margin: '8px 0', fontWeight: 900 } }, 'New rag joined: ' + sum.unlocked.map(k => RAGS[k].names[0]).join(', ') + '!') : null,
      sum.badges.length ? el('p.gold', { style: { margin: '6px 0' } }, 'Badge: ' + sum.badges.map(x => x.n).join(', ')) : null,
      el('p.muted', { style: { fontSize: '12px' } }, `Foes defeated: ${b.stats.kills} · Rags deployed: ${b.stats.deploys} · Time ${Math.round(b.t)}s`),
      !sum.win && !sum.done ? el('p', { style: { fontSize: '13px', marginTop: '8px' } }, tipFor(stage)) : null,
      el('div.acts',
        contOk ? el('button.btn.gold', { onclick: () => { if (S.buttons < 30) return toast('Need 30 Buttons'); S.buttons -= 30; save(); closeModal(); b.continueBattle(); Scene.ended = false; Scene.onEnd = bb => UI.result(contFinish(stage, bb, sum), stage, o); } }, el('b', { html: `Continue · ${ic('button')} 30` })) : null,
        next ? el('button.btn.primary', { onclick: () => { Scene.stop(); closeModal(); UI.show('prep', { stage: next, back: () => UI.show('map', next.arc * 3 + next.ch) }); } }, 'Next stage') : null,
        el('button.btn', { onclick: retry }, 'Retry'), el('button.btn', { onclick: leave }, 'Back')),
    ];
    modal(content, sum.win ? '.win' : '.lose');
  },
  pauseMenu() {
    modal([el('h2', 'Paused'), el('p.muted', Scene.ctx.stage.name),
      el('div.acts', { style: { flexDirection: 'column' } },
        el('button.btn.primary', { onclick: () => { closeModal(); Scene.resume(); } }, 'Resume'),
        el('button.btn', { onclick: () => { onLose(Scene.ctx.stage); Scene.stop(); closeModal(); UI.show('prep', this.lastPrep); } }, 'Retry'),
        el('button.btn.danger', { onclick: () => { onLose(Scene.ctx.stage); Scene.stop(); closeModal(); backTo(Scene.ctx ? Scene.ctx.stage : null); } }, 'Retreat'))]);
  },
};
Scene.onPause = () => UI.pauseMenu();

/* ------------------------------------------------------------- helpers */
import { finish as finishBattle } from './game.js';
function contFinish(stage, b, prev) {
  // a continued battle: settle it now (the earlier loss gave no rewards)
  return finishBattle(stage, b, { items: {}, B: b.B, o: {} });
}
function backTo(stage) {
  if (!stage) return UI.home();
  if (stage.mode === 'story') return UI.show('map', stage.arc * 3 + stage.ch);
  if (stage.mode === 'legend') return UI.show('legend', { saga: stage.saga, sub: stage.sub });
  if (stage.mode === 'event' || stage.mode === 'outbreak') return UI.show('events');
  if (stage.mode === 'tangle') return S.tangle ? UI.show('tangle') : UI.show('challenges');
  return UI.show('challenges');
}
function currentArcCh() { for (let k = 0; k < 9; k++) if ((S.story[k] || 0) < 48) return k; return 8; }
function nextStory() { const k = currentArcCh(); return storyStage(Math.floor(k / 3), k % 3, Math.min(47, S.story[k] || 0)); }
function nextStoryAfter(st) { if (st.i < 47) return storyStage(st.arc, st.ch, st.i + 1); const k = st.arc * 3 + st.ch + 1; return k < 9 ? storyStage(Math.floor(k / 3), k % 3, 0) : null; }
function grantMsg(r) { return []; }
function claimTangleEnd() { S.tangle = null; S.tangleBest = Math.max(S.tangleBest, 30); const g = []; save(); return g; }
function tipFor(stage) {
  const tr = new Set((stage.spawns || []).flatMap(s => ENEMIES[s.e].traits));
  if (tr.has('steel')) return 'Tip: Steel foes take 1 damage per hit. Critical hits (Jab, Needle, Velvet Rogue, Steel Spindle) cut through.';
  if (tr.has('starborn')) return 'Tip: Starborn foes shrug off half your damage until you collect Starward treasures in The Fraying Lands.';
  if (tr.has('revenant')) return 'Tip: Revenants get back up. Unravellers (Gauze, Void Rag, the Thread Lance cannon) keep them down.';
  if (tr.has('void')) return 'Tip: Void foes wear husks that regrow when shoved. Husk Pierce (Paisley, Void Rag) or the Breaker Cannon tears them off.';
  return 'Tip: level up your rags in Army, grow the loom early, and keep a cheap wall rag in front of your hitters.';
}
function crownPick(stage, back, o) {
  const best = S.legend[stage.key] || 0;
  return el('div.crowns', { style: { marginBottom: '10px' } }, [0, 1, 2, 3].map(c => el('button.btn.small' + (c === stage.crown ? '.on' : '') + (c <= best ? '' : '.off'), { onclick: () => c <= best && UI.show('prep', { stage: legendStage(stage.saga, stage.sub, stage.st, c), back, o }) }, '♛'.repeat(c + 1))));
}
export function abilLines(ab, F) {
  const L = [], vs = ab.vs === 'all' ? 'all' : (ab.vs || []).map(t => TRAITS[t].name).join(', ');
  const on = vs ? ` vs ${vs}` : '';
  if (ab.only) L.push(['Targets only', vs]);
  if (ab.insane) L.push(['Ruinous', `5x damage${on}`]); else if (ab.massive) L.push(['Massive', `3x damage${on}`]); else if (ab.strong) L.push(['Strong', `1.5x damage, half damage taken${on}`]);
  if (ab.tough) L.push(['Unbreakable', `takes 1/6 damage${on}`]); else if (ab.resist) L.push(['Resistant', `takes 1/4 damage${on}`]);
  if (ab.kb) L.push(['Shove', `${pct(Math.min(1, ab.kb))} chance${on}`]);
  if (ab.freeze) L.push(['Freeze', `${pct(ab.freeze[0])} for ${ab.freeze[1].toFixed(1)}s${on}`]);
  if (ab.slow) L.push(['Snag', `${pct(ab.slow[0])} for ${ab.slow[1].toFixed(1)}s${on}`]);
  if (ab.weaken) L.push(['Fray', `${pct(ab.weaken[0])}: attack to ${pct(ab.weaken[2])} for ${ab.weaken[1].toFixed(1)}s${on}`]);
  if (ab.curse) L.push(['Hex', `${pct(ab.curse[0])} for ${ab.curse[1].toFixed(1)}s${on}`]);
  if (ab.crit) L.push(['Critical', `${pct(ab.crit)} for 2x (ignores Steel)`]);
  if (ab.savage) L.push(['Savage Seam', `${pct(ab.savage[0])} for ${ab.savage[1]}x`]);
  if (ab.wave) L.push(['Ripple', `${pct(ab.wave[0])} · level ${ab.wave[1]}`]);
  if (ab.miniwave) L.push(['Mini Ripple', `${pct(ab.miniwave[0])} · level ${ab.miniwave[1]} (20%)`]);
  if (ab.surge) L.push(['Surge', `${pct(ab.surge[0])} · ${ab.surge[1]} hit${ab.surge[1] > 1 ? 's' : ''} at ${ab.surge[2]}-${ab.surge[3]}`]);
  if (ab.strengthen) L.push(['Second Wind', `under ${pct(ab.strengthen[0])} health, attack x${ab.strengthen[1]}`]);
  if (ab.survive) L.push(['Hang On', `${pct(ab.survive)} to survive a lethal blow`]);
  if (ab.steelKill) L.push(['Steel Shred', `${pct(ab.steelKill)} of a Steel foe's health per hit`]);
  if (ab.breaker) L.push(['Barrier Breaker', pct(ab.breaker)]);
  if (ab.pierce) L.push(['Husk Pierce', pct(ab.pierce)]);
  if (ab.unravel) L.push(['Unraveller', 'Revenants it finishes stay down']);
  if (ab.scrap) L.push(['Scavenger', 'double scrap from foes it finishes']);
  if (ab.dodge) L.push(['Sidestep', `${pct(ab.dodge[0])} for ${ab.dodge[1]}s${ab.dodgeVs === 'all' ? '' : on}`]);
  if (ab.waveBlock) L.push(['Ripple Wall', 'stops foe ripples']);
  if (ab.multi) L.push(['Multi-hit', `${ab.multi} hits per attack`]);
  if (ab.ld) L.push(['Long distance', `hits ${ab.ld[0]}-${ab.ld[0] + ab.ld[1]} ahead`]);
  if (ab.omni) L.push(['Omni strike', `also hits ${ab.omni} behind`]);
  if (ab.barrier) L.push(['Barrier', fmt(ab.barrier)]);
  if (ab.husk) L.push(['Husk', fmt(ab.husk) + ' (at 100%)']);
  if (ab.revive) L.push(['Get Back Up', `${ab.revive[0]}x after ${ab.revive[1]}s at ${pct(ab.revive[2])}`]);
  if (ab.burrow) L.push(['Burrow', `${ab.burrow[0]}x, ${ab.burrow[1]} far`]);
  if (ab.warp) L.push(['Warp', `${pct(ab.warp[0])}, ${ab.warp[1]} far`]);
  if (ab.toxic) L.push(['Toxic', `${pct(ab.toxic[0])}: ${pct(ab.toxic[1])} of max health`]);
  if (ab.deathSurge) L.push(['Death Surge', `level ${ab.deathSurge[0]}`]);
  if (ab.boss) L.push(['Boss', 'shockwave on arrival']);
  if (ab.immune && ab.immune.length) L.push(['Immune', [...new Set(ab.immune)].map(k => IMMUNE_NAMES[k]).join(', ')]);
  return L;
}
function statsBlock(st, foe) {
  const dps = st.atk * (st.ab.multi ? 1 : 1) / Math.max(st.freq, st.fs + 0.3);
  const cells = [['Health', fmt(st.hp)], ['Attack', fmt(st.atk)], ['DPS', fmt(dps)], ['Reach', st.range], ['Speed', Math.round(st.speed)], ['Attack every', st.freq.toFixed(2) + 's'], ['Shoves', st.kb], ['Target', st.area ? 'Area' : 'Single']];
  if (!foe) cells.push(['Cost', st.cost], ['Recharge', st.cd.toFixed(1) + 's']); else cells.push(['Scrap', st.drop]);
  return el('div.stat', cells.map(([k, v]) => el('div', el('small', k), el('b', String(v)))));
}
function ragDetail(id) {
  const d = RAGS[id], own = S.rags[id];
  if (!own) return el('div.card', el('h3', { style: { fontSize: '22px', fontWeight: 900 } }, S.seenRags[id] ? d.names[0] : '???'), el('p.muted', d.buy ? `Buy it in the Ragbag for ${d.buy} Buttons.` : d.unlock !== undefined ? `Joins when you clear stage ${d.unlock} of The Long Seam.` : d.drop ? 'Drops from the Steel Ring event.' : `Found in the Rare Ragbag (${RARITY[d.rarity].name}).`));
  const st = unitStats(id, battleBonus([id]));
  const cap = levelCap(id), cost = levelCost(own.lv, d.rarity);
  const req = evolveReq(id);
  const forms = el('div.row.formtabs', { style: { gap: '4px' } }, d.forms.map((f, i) => el('button.btn.small' + (own.form === i ? '.primary' : i <= own.maxForm ? '' : '.off'), { onclick: () => { if (i <= own.maxForm) { own.form = i; save(); UI.army(id); } } }, f.name)));
  const talents = own.maxForm >= 2 ? el('div.list', d.talents.map(k => { const T = TALENTS[k], lv = own.tal[k] || 0, c = talentCost(d.rarity, lv);
    return el('div.li', el('div.grow', el('b', `${T.n} ${lv}/${T.max}`), el('small', T.d)), lv >= T.max ? el('span.tag', 'Max') : el('button.btn.small' + (S.np >= c ? '.primary' : ''), { onclick: () => { if (talentUp(id, k)) { sfx('loom'); UI.army(id); } else toast(`Need ${c} NP`); } }, `${c} NP`)); })) : el('p.muted', { style: { fontSize: '12px' } }, 'Talents open on the third form. Needle Points (NP) come from duplicate ragbag draws.');
  return el('div.card',
    el('div.row', el('div.bigport', ragImg(id, own.form, 150)), el('div.grow', el('div.lbl', { style: { color: rarCol(d.rarity) } }, RARITY[d.rarity].name), el('h3', { style: { fontSize: '24px', fontWeight: 900 } }, d.forms[own.form].name),
      el('p', { style: { fontSize: '14px', fontWeight: 800 } }, `Level ${own.lv}${own.plus ? ' +' + own.plus : ''} / ${cap}`), el('p.muted', { style: { fontSize: '13px', marginTop: '4px' } }, d.forms[own.form].desc))),
    el('div', { style: { margin: '8px 0' } }, forms),
    statsBlock(st),
    el('div.abil', { style: { marginTop: '8px' } }, abilLines(st.ab).map(([k, v]) => el('div', { html: `<b>${k}</b> ${v}` }))),
    el('div.row', { style: { marginTop: '10px' } },
      own.lv < cap ? el('button.btn.primary', { onclick: () => { if (levelUp(id)) { sfx('loom'); UI.army(id); } else toast('Not enough thread'); } }, el('b', { html: `Level up · ${ic('thread')} ${fmt(cost)}` })) : el('span.tag.alt', 'Level cap reached'),
      own.lv >= cap && cap < RARITY[d.rarity].capMax ? el('button.btn', { onclick: () => { if (capUp(id)) { sfx('rare'); UI.army(id); } else toast((S.story[0] || 0) < 48 ? 'Clear chapter 1 of The Long Seam first' : 'Need a Seam Gem (Mythic Gem past 30 for Mythic/Legend)'); } }, el('b', { html: `Raise cap · ${ic('gem')}` })) : null,
      own.maxForm === 1 ? el('button.btn' + (canEvolve(id) ? '.gold' : ''), { onclick: () => { if (evolve(id)) { sfx('rare'); toast('Third form!'); UI.army(id); } else toast(`Needs level ${req.lv}, ${fmt(req.thread)} thread and ${Object.entries(req.dyes).map(([k, n]) => n + ' ' + DYES[k].n).join(', ')}`); } }, el('b', 'Third form'), el('small', `Lv ${req.lv} · ${Object.entries(req.dyes).map(([k, n]) => n + ' ' + k).join(', ')}`)) : null,
      own.maxForm === 0 ? el('small.muted', 'Second form at level 10') : null),
    el('div.sep'), el('div.lbl', 'Talents'), talents);
}
function guideRag(k) {
  const d = RAGS[k];
  modal([el('div.row', ragImg(k, 2, 110), el('div.grow', el('div.lbl', { style: { color: rarCol(d.rarity) } }, RARITY[d.rarity].name), el('h2', d.names.join(' / ')))),
    d.forms.map(f => el('div', { style: { marginTop: '10px' } }, el('b', f.name), el('p.muted', { style: { fontSize: '13px' } }, f.desc))),
    el('div.sep'), statsBlock(unitStats(k, {}, { lv: 30, form: 2, noTal: 1 })), el('p.muted', { style: { fontSize: '11px', marginTop: '4px' } }, 'Shown at level 30, third form.'),
    el('div.abil', { style: { marginTop: '8px' } }, abilLines(d.forms[2].ab).map(([a, v]) => el('div', { html: `<b>${a}</b> ${v}` }))),
    el('div.acts', el('button.btn', { onclick: closeModal }, 'Close'))]);
}
function guideFoe(k) {
  const e = ENEMIES[k];
  modal([el('div.row', foeImg(k, 110), el('div.grow', el('div', e.traits.map(traitTag)), el('h2', e.name), el('p.muted', e.desc))),
    statsBlock({ ...e, ab: e.ab }, true), el('p.muted', { style: { fontSize: '11px', marginTop: '4px' } }, 'Shown at 100% strength. Stages make foes stronger.'),
    el('div.abil', { style: { marginTop: '8px' } }, abilLines(e.ab).map(([a, v]) => el('div', { html: `<b>${a}</b> ${v}` })), e.traits.filter(t => t !== 'plain').map(t => el('div', { html: `<b>${TRAITS[t].name}</b> ${TRAITS[t].desc}` }))),
    el('div.acts', el('button.btn', { onclick: closeModal }, 'Close'))]);
}
function howTo() {
  const P = (h, t) => el('div.li', el('div.grow', el('b', h), el('small', t)));
  return el('div.list',
    P('The lane', 'Your keep is on the left, the foe spire on the right. Knock the spire down to win; lose your keep and you lose.'),
    P('Scrap and the loom', 'Scrap trickles in by itself and from every foe you defeat. Spend it on rags. Upgrading the loom makes scrap come faster and raises your wallet.'),
    P('Deploying', 'Each rag costs scrap and needs to recharge after you send it. Cheap walls (Stitch, Mitten) hold the line while your hitters work from behind.'),
    P('Fighting', 'Rags stop and attack anything in reach. Single-target rags hit the closest foe; area rags hit everything in reach. Long-distance rags hit a zone ahead.'),
    P('Shoves', 'Units are shoved back a few times as they lose health. Shoving breaks attacks and buys time.'),
    P('The cannon', 'It charges over time. Fire it to hurt and shove every foe in reach. Other cannons in the Workshop freeze, snag, wall, break barriers, quake or pierce.'),
    P('Traits', 'Foes have traits (Crimson, Drifting, Shadow, Steel, Gilded, Starborn, Revenant, Ancient, Void). Many rags are strong against particular traits. Check the Guide.'),
    P('Bosses', 'A boss arrives with a shockwave that shoves every rag back. Keep sending walls.'),
    P('Growing', 'Win thread to level rags. Level 10 gives a second form; level 20-30 plus dye gives a third form and talents. Treasures and Workshop upgrades make every battle easier.'),
    P('Energy', 'Battles cost energy. It refills one point a minute.'));
}
export function dailyLogin() {
  const r = loginCheck();
  if (r) setTimeout(() => modal([el('h2', `Login stamp · day ${r.day}`), el('p.muted', 'Come back tomorrow for the next stamp.'), el('div.rew', { style: { margin: '10px 0' } }, rewardObjSpans(r.r)), el('div.acts', el('button.btn.primary', { onclick: closeModal }, 'Thanks'))]), 400);
}
export function tickUi() {
  // energy timer text
  tickEnergy();
  document.querySelectorAll('.en-val').forEach(n => (n.textContent = `${S.energy}/${energyMax()}`));
  const nx = energyNext();
  document.querySelectorAll('.en-t').forEach(n => (n.textContent = nx > 0 ? fmtTime(nx) : ''));
  const st = document.querySelector('.scav-t');
  if (st && S.scav.end) { const left = (S.scav.end - Date.now()) / 1000; if (left <= 0) UI.scav(); else st.textContent = 'Back in ' + fmtTime(left); }
}
