// Battle simulation: pure logic, no DOM. A long lane, your keep on the left, the foe keep on the right.
// Rags walk right, foes walk left; anything with a target in reach stops and fights.
import { RNG, clamp } from './util.js';
import { ENEMIES } from './data/enemies.js';

export const STEP = 1 / 60;
const KB_DIST = 165, KB_TIME = 0.5, BASE_PAD = 150, FIELD_MAX = 50, FOE_MAX = 45;
export const LOOM_MAX = 8;
export const loomRate = (lv, B) => (13 + 7 * (lv - 1)) * (1 + (B.loomRate || 0));
export const loomCap = (lv, B) => (400 + 400 * (lv - 1)) * (1 + (B.loomCap || 0));
export const loomCost = (lv, cm) => Math.round(100 * lv * cm);

let UID = 1;

export class Battle {
  constructor(stage, lineup, o = {}) {
    this.stage = stage; this.o = o;
    this.B = o.B || {};
    this.rng = RNG(o.seed || ((Math.random() * 1e9) | 0));
    this.t = 0; this.L = stage.len;
    this.timeLimit = stage.timeLimit || (stage.rules && stage.rules.timeLimit) || 0;
    this.cm = stage.costMult || 1;
    this.loom = o.items && o.items.sack ? LOOM_MAX : 1;
    this.money = Math.min(loomCap(this.loom, this.B), 75 + (this.B.startScrap || 0));
    const baseHp = Math.round(3000 * (1 + (this.B.baseHp || 0)));
    this.pBase = { x: BASE_PAD, hp: baseHp, max: baseHp, side: 0, flash: 0 };
    this.eBase = { x: this.L - BASE_PAD, hp: stage.baseHp, max: stage.baseHp, side: 1, flash: 0, immune: !!stage.immuneBase };
    this.units = []; this.waves = []; this.surges = []; this.events = []; this.shots = [];
    this.slots = lineup.map(s => ({ s, cd: 0 }));
    this.spawners = (stage.spawns || []).map(e => ({ ...e, def: ENEMIES[e.e], next: e.trig >= 1 ? e.first : Infinity, count: 0, on: e.trig >= 1 }));
    this.cannon = { id: o.cannon || 'spool', lv: o.cannonLv || 1, charge: 0, time: Math.max(6, 18 * (1 - (this.B.cannonCharge || 0))), reach: 1000 + (this.B.cannonRange || 0) };
    this.result = null; this.paused = false; this.contUsed = false;
    this.stats = { kills: 0, deploys: 0, cannons: 0, bossKills: 0, baseDmg: 0, dmg: 0 };
    this.lookT = 4; this.autoT = 0;
    this.deployCount = 0;
    if (stage.rival) { this.rival = { money: 0, t: 2, slots: o.rivalStats.map(s => ({ s, cd: 2 })) }; }
  }

  /* ------------------------------------------------------------- input */
  loomUp() {
    if (this.loom >= LOOM_MAX) return false;
    const c = loomCost(this.loom, this.cm);
    if (this.money < c) return false;
    this.money -= c; this.loom++; this.ev('loom', this.pBase.x, -40);
    return true;
  }
  deploy(i) {
    const sl = this.slots[i];
    if (!sl || this.result || sl.cd > 0 || this.money < sl.s.cost) return false;
    if (this.units.filter(u => u.side === 0 && !u.wall && u.state !== 'dead').length >= FIELD_MAX) { this.ev('full', this.pBase.x, -60); return false; }
    const R = this.stage.rules;
    if (R && R.maxDeploy && this.deployCount >= R.maxDeploy) { this.ev('full', this.pBase.x, -60); return false; }
    this.money -= sl.s.cost; sl.cd = sl.s.cd; this.deployCount++;
    this.spawn(sl.s, 0, this.pBase.x + 50);
    this.stats.deploys++;
    return true;
  }
  fire() {
    const c = this.cannon;
    if (c.charge < 1 || this.result || (this.stage.rules && this.stage.rules.noCannon)) return false;
    c.charge = 0; this.stats.cannons++;
    const lv = c.lv, pow = 120 * (1 + (this.B.cannonPow || 0)) * (1 + 0.15 * (lv - 1));
    const x0 = this.pBase.x, x1 = x0 + c.reach;
    this.ev('cannon', x0, 0, { id: c.id, reach: c.reach });
    if (c.id === 'wall') {
      const front = this.units.filter(u => u.side === 0 && this.alive(u)).reduce((m, u) => Math.max(m, u.x), x0 + 300);
      const w = this.spawn({ id: 'wall', name: 'Rag Wall', hp: 1e9, atk: 0, range: 0, speed: 0, freq: 99, fs: 99, kb: 1, area: 0, ab: { immune: ['kb', 'freeze', 'slow', 'weaken', 'wave', 'surge', 'warp', 'curse', 'toxic', 'boss'] }, look: {}, traits: [] }, 0, Math.min(front + 40, this.L - 400));
      w.wall = 5 + lv * 0.6; return true;
    }
    if (c.id === 'quake') { this.waves.push({ side: 0, x: x0 + 40, dir: 1, left: c.reach, speed: 700, dmg: pow * 0.5, src: null, hit: new Set(), quake: 1 }); return true; }
    for (const u of this.units) {
      if (u.side !== 1 || !this.alive(u) || u.x > x1) continue;
      if (c.id === 'spool') { this.dealRaw(u, pow, null); if (!this.immune(u, 'kb')) this.knock(u); }
      else if (c.id === 'frost') { this.dealRaw(u, pow * 0.2, null); this.status(u, 'freeze', 2.5 * (1 + 0.1 * lv)); }
      else if (c.id === 'snare') { this.status(u, 'slow', 5 * (1 + 0.1 * lv)); }
      else if (c.id === 'breaker') { if (u.barrier > 0) { u.barrier = 0; this.ev('barrierBreak', u.x, u.y); } if (u.husk > 0) { u.husk = 0; this.ev('huskBreak', u.x, u.y); } this.dealRaw(u, pow * 1.5, null); }
      else if (c.id === 'lance') { u.unravelled = true; this.dealRaw(u, pow * 1.4, null); }
    }
    return true;
  }
  continueBattle() {
    if (this.contUsed || this.result !== 'lose') return false;
    this.contUsed = true; this.result = null;
    this.pBase.hp = this.pBase.max; this.money = loomCap(this.loom, this.B);
    for (const u of this.units) if (u.side === 1 && this.alive(u)) { u.x = Math.min(this.L - 300, u.x + 700); u.state = 'walk'; }
    this.ev('continue', this.pBase.x, 0);
    return true;
  }

  /* -------------------------------------------------------- simulation */
  update(dt) {
    if (this.result || this.paused) return;
    this.t += dt;
    // economy
    this.money = Math.min(loomCap(this.loom, this.B), this.money + loomRate(this.loom, this.B) * dt);
    for (const s of this.slots) s.cd = Math.max(0, s.cd - dt);
    if (!(this.stage.rules && this.stage.rules.noCannon)) this.cannon.charge = Math.min(1, this.cannon.charge + dt / this.cannon.time);
    this.pBase.flash = Math.max(0, this.pBase.flash - dt * 4); this.eBase.flash = Math.max(0, this.eBase.flash - dt * 4);
    this.spawnFoes(dt);
    if (this.rival) this.rivalAI(dt);
    if (this.o.items && this.o.items.auto) this.autopilot(dt);
    if (this.o.items && this.o.items.lookout) this.lookout(dt);
    for (const u of this.units) this.step(u, dt);
    this.stepWaves(dt); this.stepSurges(dt);
    for (const s of this.shots) s.t += dt;
    this.shots = this.shots.filter(s => s.t < s.life);
    this.units = this.units.filter(u => !(u.state === 'gone'));
    if (this.timeLimit && this.t >= this.timeLimit) this.result = this.stage.immuneBase ? 'done' : 'lose';
    if (this.eBase.hp <= 0 && !this.eBase.immune) { this.result = 'win'; this.ev('win', this.eBase.x, 0); }
    if (this.pBase.hp <= 0) { this.result = 'lose'; this.ev('lose', this.pBase.x, 0); }
  }

  spawnFoes() {
    const frac = this.eBase.hp / this.eBase.max;
    let alive = 0; for (const u of this.units) if (u.side === 1 && u.state !== 'dead' && u.state !== 'gone') alive++;
    for (const s of this.spawners) {
      if (!s.on && frac <= s.trig) { s.on = true; s.next = this.t + s.first * 0.3; }
      if (!s.on || this.t < s.next || (s.n && s.count >= s.n)) continue;
      if (alive >= FOE_MAX && !s.boss) { s.next = this.t + 1; continue; }
      const ramp = 1 + (this.stage.magRamp || 0) * this.t;
      const u = this.spawnFoe(s.def, s.mag * ramp, s.boss);
      u.y += this.rng.range(-4, 4);
      s.count++; alive++;
      s.next = this.t + this.rng.range(s.int[0], s.int[1]);
    }
  }
  spawnFoe(def, mag, boss) {
    const m = mag / 100;
    const steel = def.traits.includes('steel');
    const st = { id: def.id, name: def.name, hp: Math.max(1, Math.round(def.hp * (steel ? Math.sqrt(m) : m))), atk: Math.round(def.atk * m), range: def.range, speed: def.speed, freq: def.freq, fs: def.fs, kb: def.kb, area: def.area, ab: def.ab, look: def.look, traits: def.traits, kind: def.kind, size: def.size, drop: def.drop, foe: 1 };
    const u = this.spawn(st, 1, this.eBase.x - 40);
    u.mag = mag; u.boss = !!boss || !!def.ab.boss;
    if (def.ab.barrier) u.barrier = def.ab.barrier;
    if (def.ab.husk) { u.husk = u.huskMax = Math.round(def.ab.husk * m); }
    if (def.ab.revive) u.revives = def.ab.revive[0];
    if (def.ab.burrow) u.burrows = def.ab.burrow[0];
    this.ev('foe', u.x, u.y, { id: def.id });
    if (u.boss && boss) {
      this.ev('boss', u.x, 0, { name: def.name });
      for (const r of this.units) if (r.side === 0 && this.alive(r) && !r.wall && !this.immune(r, 'boss') && !this.immune(r, 'kb')) this.knock(r, 1.3);
    }
    return u;
  }
  spawn(s, side, x) {
    const u = {
      uid: UID++, s, side, dir: side ? -1 : 1, x, y: this.rng.range(-14, 14), hp: s.hp, maxHp: s.hp,
      state: 'walk', st: 0, hitDone: 0, kbDone: 0, kbT: 0, kbFrom: 0, anim: this.rng() * 10, flash: 0, born: this.t,
      freeze: 0, slow: 0, weaken: 0, weakMult: 1, curse: 0, dodgeT: 0, warpT: 0, barrier: 0, husk: 0, huskMax: 0, revives: 0, burrows: 0,
      downT: 0, emerging: 0, survived: false, unravelled: false, mag: 100, boss: false,
    };
    this.units.push(u);
    if (side === 0) this.ev('deploy', x, u.y, { id: s.id });
    return u;
  }

  alive(u) { return u.state !== 'dead' && u.state !== 'gone' && u.state !== 'down'; }
  targetable(u) { return this.alive(u) && u.state !== 'kb' && u.state !== 'burrow' && u.state !== 'warp' && !u.emerging; }
  immune(u, k) { return u.s.ab.immune && u.s.ab.immune.includes(k); }
  hasTrait(u, list) { return list === 'all' || (u.s.traits || []).some(t => list.includes(t)); }
  abOn(u) { return u.curse <= 0; }

  // targets in reach of attacker u. returns { units, base }
  scan(u, forHit) {
    const s = u.s, ab = this.abOn(u) ? s.ab : {}, d = u.dir;
    let lo = -25, hi = s.range;
    if (forHit && ab.ld) { lo = ab.ld[0]; hi = ab.ld[0] + ab.ld[1]; }
    if (ab.omni) lo = -ab.omni;
    const only = ab.only && ab.vs ? ab.vs : null;
    const res = [];
    for (const e of this.units) {
      if (e.side === u.side || !this.targetable(e)) continue;
      const dist = (e.x - u.x) * d;
      if (dist < lo || dist > hi) continue;
      if (only && !this.hasTrait(e, only)) continue;
      res.push({ e, dist });
    }
    const base = u.side ? this.pBase : this.eBase;
    const bd = (base.x - u.x) * d;
    return { list: res, base: bd >= lo - 60 && bd <= hi + 10 ? base : null };
  }

  step(u, dt) {
    const s = u.s;
    u.anim += dt; u.flash = Math.max(0, u.flash - dt * 5);
    if (u.state === 'dead') { u.st += dt; if (u.st > 0.05) u.state = 'gone'; return; }
    if (u.wall) { u.wall -= dt; if (u.wall <= 0) { u.state = 'gone'; this.ev('wallGone', u.x, u.y); } return; }
    // status timers
    u.freeze = Math.max(0, u.freeze - dt); u.slow = Math.max(0, u.slow - dt); u.curse = Math.max(0, u.curse - dt); u.dodgeT = Math.max(0, u.dodgeT - dt);
    if (u.weaken > 0) { u.weaken -= dt; if (u.weaken <= 0) u.weakMult = 1; }
    if (u.state === 'down') { u.downT -= dt; if (u.downT <= 0) { u.state = 'walk'; u.hp = Math.round(u.maxHp * s.ab.revive[2]); u.kbDone = 0; this.ev('revive', u.x, u.y); u.emerging = 0.6; } return; }
    if (u.emerging > 0) { u.emerging -= dt; return; }
    if (u.state === 'kb') {
      u.kbT += dt; const k = clamp(u.kbT / KB_TIME, 0, 1);
      u.x = u.kbFrom - u.dir * u.kbDist * (1 - Math.pow(1 - k, 2));
      u.x = clamp(u.x, BASE_PAD - 20, this.L - BASE_PAD + 20);
      if (k >= 1) { u.state = 'walk'; u.st = 0; }
      return;
    }
    if (u.state === 'warp') { u.warpT -= dt; if (u.warpT <= 0) { u.state = 'walk'; u.emerging = 0.3; this.ev('warpOut', u.x, u.y); } return; }
    if (u.state === 'burrow') {
      const mv = s.speed * 2.2 * dt; u.x += u.dir * mv; u.burrowLeft -= mv;
      if (u.burrowLeft <= 0 || (u.dir < 0 && u.x < this.pBase.x + 120)) { u.state = 'walk'; u.emerging = 0.5; this.ev('emerge', u.x, u.y); }
      return;
    }
    if (u.freeze > 0) return;
    const tscale = u.slow > 0 ? 0.45 : 1;
    if (u.state === 'walk') {
      const sc = this.scan(u, false);
      if (sc.list.length || sc.base) {
        if (u.burrows > 0 && sc.list.length && this.abOn(u)) { u.burrows--; u.state = 'burrow'; u.burrowLeft = s.ab.burrow[1]; this.ev('burrow', u.x, u.y); return; }
        u.state = 'atk'; u.st = 0; u.hitDone = 0; return;
      }
      u.x += u.dir * s.speed * (u.slow > 0 ? 0.15 : 1) * dt;
      const lim = u.side ? this.pBase.x + 20 : this.eBase.x - 20;
      if ((u.x - lim) * u.dir > 0) u.x = lim;
      return;
    }
    if (u.state === 'atk') {
      u.st += dt * tscale;
      const ab = s.ab, multi = this.abOn(u) && ab.multi ? ab.multi : 1;
      while (u.hitDone < multi && u.st >= s.fs + u.hitDone * 0.16) { this.attack(u, 1 / multi, u.hitDone === 0); u.hitDone++; }
      if (u.st >= Math.max(s.freq, s.fs + multi * 0.16 + 0.15)) {
        const sc = this.scan(u, false);
        if (sc.list.length || sc.base) { u.st = 0; u.hitDone = 0; } else { u.state = 'walk'; u.st = 0; }
      }
    }
  }

  atkOf(u) {
    let a = u.s.atk * u.weakMult;
    const ab = u.s.ab;
    if (this.abOn(u) && ab.strengthen && u.hp <= u.maxHp * ab.strengthen[0]) a *= ab.strengthen[1];
    return a;
  }

  attack(u, share, first) {
    const s = u.s, ab = this.abOn(u) ? s.ab : {};
    const sc = this.scan(u, true);
    let targets = sc.list;
    if (!s.area && targets.length) { targets.sort((a, b) => a.dist - b.dist); targets = [targets[0]]; }
    const dmg = this.atkOf(u) * share;
    this.ev('swing', u.x, u.y, { side: u.side, uid: u.uid, ld: !!ab.ld });
    if (ab.ld) this.shots.push({ x: u.x + u.dir * (ab.ld[0] + ab.ld[1] / 2), w: ab.ld[1], side: u.side, t: 0, life: 0.3, kind: 'ld' });
    else if (s.range > 220) this.shots.push({ x0: u.x, x1: u.x + u.dir * Math.min(s.range, targets.length ? targets[0].dist : s.range), y: u.y, side: u.side, t: 0, life: 0.22, kind: 'bolt', col: s.look && (s.look.acc || s.look.col) });
    let hitAny = false;
    for (const { e } of targets) { this.hit(u, e, dmg); hitAny = true; }
    if (sc.base && (s.area || !targets.length)) { this.hitBase(u, sc.base, dmg); hitAny = true; }
    if (!first || !hitAny) return;
    // per-attack procs that spawn things
    if (ab.wave && this.rng() < ab.wave[0]) this.makeWave(u, ab.wave[1], dmg / share, false);
    else if (ab.miniwave && this.rng() < ab.miniwave[0]) this.makeWave(u, ab.miniwave[1], dmg / share * 0.2, true);
    if (ab.surge && this.rng() < ab.surge[0]) this.makeSurge(u, u.x + u.dir * this.rng.range(ab.surge[2], ab.surge[3]), ab.surge[1], dmg / share);
  }

  makeWave(u, lvl, dmg, mini) {
    this.waves.push({ side: u.side, x: u.x + u.dir * 40, dir: u.dir, left: 380 * lvl, speed: 950, dmg, src: u, hit: new Set(), mini });
    this.ev('wave', u.x, u.y, { side: u.side, mini });
  }
  makeSurge(u, x, lvl, dmg) {
    x = clamp(x, BASE_PAD, this.L - BASE_PAD);
    this.surges.push({ side: u.side, x, w: 170, t: 0, next: 0.25, hits: lvl, dmg, src: u });
    this.ev('surge', x, 0, { side: u.side });
  }
  stepWaves(dt) {
    for (const w of this.waves) {
      const mv = w.speed * dt; w.x += w.dir * mv; w.left -= mv;
      for (const e of this.units) {
        if (e.side === w.side || !this.targetable(e) || w.hit.has(e.uid)) continue;
        if (Math.abs(e.x - w.x) > 45) continue;
        w.hit.add(e.uid);
        if (e.s.ab.waveBlock && this.abOn(e) && !w.quake) { w.left = 0; this.ev('waveBlock', e.x, e.y); break; }
        if (this.immune(e, 'wave') && !w.quake) continue;
        if (w.quake) { this.dealRaw(e, w.dmg, null); if (!this.immune(e, 'kb')) this.knock(e); continue; }
        if (w.src) this.hit(w.src, e, w.dmg, true); else this.dealRaw(e, w.dmg, null);
      }
      const base = w.side ? this.pBase : this.eBase;
      if (!w.hit.has('base') && Math.abs(base.x - w.x) < 50 && w.src) { w.hit.add('base'); this.hitBase(w.src, base, w.dmg); }
    }
    this.waves = this.waves.filter(w => w.left > 0);
  }
  stepSurges(dt) {
    for (const g of this.surges) {
      g.t += dt;
      if (g.t >= g.next && g.hits > 0) {
        g.hits--; g.next += 0.45;
        for (const e of this.units) {
          if (e.side === g.side || !this.targetable(e) || Math.abs(e.x - g.x) > g.w / 2) continue;
          if (this.immune(e, 'surge')) continue;
          if (g.src) this.hit(g.src, e, g.dmg, true); else this.dealRaw(e, g.dmg, null);
        }
        const base = g.side ? this.pBase : this.eBase;
        if (Math.abs(base.x - g.x) < g.w / 2 + 40 && g.src) this.hitBase(g.src, base, g.dmg);
      }
    }
    this.surges = this.surges.filter(g => g.hits > 0 || g.t < g.next);
  }

  hitBase(u, base, dmg) {
    if (base.side === 1 && base.immune) { const v = dmg * (u.s.ab.base && this.abOn(u) ? 4 : 1); this.stats.baseDmg += v; base.flash = 1; this.ev('baseHit', base.x, 0, { side: 1, v }); return; }
    const v = dmg * (u.side === 0 && u.s.ab.base && this.abOn(u) ? 4 : 1);
    base.hp = Math.max(0, base.hp - v); base.flash = 1;
    if (u.side === 0) this.stats.baseDmg += v;
    this.ev('baseHit', base.x, 0, { side: base.side, v });
  }

  // a hit from attacker a on target e (procs + trait maths)
  hit(a, e, raw, secondary) {
    if (!this.targetable(e)) return;
    const A = a.s, ab = this.abOn(a) ? A.ab : {}, E = e.s, eb = this.abOn(e) ? E.ab : {};
    // sidestep
    if (eb.dodge && (eb.dodgeVs === 'all' || this.hasTrait(a, eb.vs || []) || (a.side === 1 && eb.dodgeVs === 'all'))) {
      if (e.dodgeT > 0) return;
      if (this.rng() < eb.dodge[0]) { e.dodgeT = eb.dodge[1]; this.ev('dodge', e.x, e.y); return; }
    }
    let dmg = raw, crit = false;
    const vsOK = !ab.vs || this.hasTrait(e, ab.vs);
    // rag attacking a foe
    if (a.side === 0 && !e.s.rag) {
      const tr = e.s.traits || [];
      const mast = t => clamp(this.B['vs_' + t] || 0, 0, 1);
      const best = ab.vs ? Math.max(0, ...tr.filter(t => ab.vs === 'all' || ab.vs.includes(t)).map(mast)) : 0;
      if (ab.vs && vsOK) {
        if (ab.insane) dmg *= 5 + best; else if (ab.massive) dmg *= 3 + best; else if (ab.strong) dmg *= 1.5 + 0.3 * best;
      }
      if (tr.includes('starborn')) dmg *= 0.5 + 0.5 * (this.B.starward || 0);
    }
    // foe attacking a rag: the rag's defences
    if (a.side === 1 && e.s.rag && eb.vs && this.hasTrait(a, eb.vs)) {
      const tr = a.s.traits || [];
      const best = Math.max(0, ...tr.filter(t => eb.vs === 'all' || eb.vs.includes(t)).map(t => clamp(this.B['vs_' + t] || 0, 0, 1)));
      if (eb.tough) dmg *= 1 / 6 - 0.02 * best; else if (eb.resist) dmg *= 0.25 - 0.05 * best; else if (eb.strong) dmg *= 0.5 - 0.1 * best;
    }
    if (ab.crit && this.rng() < ab.crit) { dmg *= 2; crit = true; }
    if (ab.savage && this.rng() < ab.savage[0]) { dmg *= ab.savage[1]; crit = true; this.ev('savage', e.x, e.y); }
    // barrier and husk block everything else
    if (e.barrier > 0) {
      if ((ab.breaker && this.rng() < ab.breaker) || dmg >= e.barrier) { e.barrier = 0; this.ev('barrierBreak', e.x, e.y); }
      else this.ev('blocked', e.x, e.y);
      return;
    }
    if (e.husk > 0) {
      if (ab.pierce && this.rng() < ab.pierce) { e.husk = 0; this.ev('huskBreak', e.x, e.y); }
      else { e.husk -= dmg; if (e.husk <= 0) { this.ev('huskBreak', e.x, e.y); e.husk = 0; } else { this.ev('huskHit', e.x, e.y); return; } return; }
    }
    // steel
    if ((e.s.traits || []).includes('steel') && !crit) dmg = 1;
    if ((e.s.traits || []).includes('steel') && ab.steelKill) dmg += e.hp * ab.steelKill;
    if (ab.unravel && vsOK) e.unravelled = true;
    if (ab.scrap) e.scrapX2 = true;
    this.dealRaw(e, dmg, a, crit);
    if (e.state === 'dead' || e.state === 'down' || e.state === 'gone') return;
    // status procs
    const res = e.s.ab.res || {};
    if (vsOK) {
      if (ab.kb && !this.immune(e, 'kb') && e.state !== 'kb' && this.rng() < ab.kb && !(res.kb && this.rng() < res.kb)) this.knock(e);
      if (ab.freeze && !this.immune(e, 'freeze') && this.rng() < ab.freeze[0]) this.status(e, 'freeze', ab.freeze[1] * (a.side === 0 ? 1 + (this.B.procDur || 0) : 1));
      if (ab.slow && !this.immune(e, 'slow') && this.rng() < ab.slow[0]) this.status(e, 'slow', ab.slow[1] * (1 - (res.slow || 0)) * (a.side === 0 ? 1 + (this.B.procDur || 0) : 1));
      if (ab.weaken && !this.immune(e, 'weaken') && this.rng() < ab.weaken[0]) { this.status(e, 'weaken', ab.weaken[1] * (1 - (res.weaken || 0))); e.weakMult = ab.weaken[2]; }
      if (ab.curse && !this.immune(e, 'curse') && this.rng() < ab.curse[0]) this.status(e, 'curse', ab.curse[1]);
      if (ab.warp && !this.immune(e, 'warp') && e.state !== 'warp' && this.rng() < ab.warp[0]) { e.state = 'warp'; e.warpT = ab.warp[2]; e.x = clamp(e.x - e.dir * ab.warp[1], BASE_PAD + 30, this.L - BASE_PAD - 30); this.ev('warp', e.x, e.y); }
      if (ab.toxic && !this.immune(e, 'toxic') && this.rng() < ab.toxic[0]) { this.dealRaw(e, e.maxHp * ab.toxic[1] * (1 - (res.toxic || 0)), a); this.ev('toxic', e.x, e.y); }
    }
  }
  status(e, k, dur) {
    if (this.immune(e, k)) return;
    e[k] = Math.max(e[k], dur);
    if (k === 'freeze' && e.state === 'atk') { /* frozen mid-swing: the swing resumes after */ }
    this.ev(k, e.x, e.y);
  }

  dealRaw(e, dmg, a, crit) {
    if (!this.alive(e) || e.wall) return;
    if (dmg <= 0) return;
    if ((e.s.traits || []).includes('steel') && !a && !crit) dmg = 1;
    const prev = e.hp;
    e.hp -= dmg; e.flash = 1;
    this.stats.dmg += a && a.side === 0 ? dmg : 0;
    this.ev('hit', e.x, e.y, { v: Math.round(dmg), crit, side: e.side, big: dmg > e.maxHp * 0.25 });
    if (e.hp <= 0) {
      const eb = e.s.ab;
      if (eb.survive && !e.survived && this.abOn(e) && this.rng() < eb.survive) { e.hp = 1; e.survived = true; this.ev('survive', e.x, e.y); this.knock(e); return; }
      this.kill(e, a);
      return;
    }
    // shove thresholds
    const n = e.s.kb;
    if (n > 1) {
      const step = e.maxHp / n;
      const before = Math.floor((e.maxHp - prev) / step), after = Math.floor((e.maxHp - e.hp) / step);
      if (after > before && after > e.kbDone) { e.kbDone = after; this.knock(e); }
    }
  }
  knock(e, mult = 1) {
    if (!this.alive(e) || e.wall) return;
    e.state = 'kb'; e.kbT = 0; e.kbFrom = e.x; e.kbDist = KB_DIST * mult; e.st = 0; e.hitDone = 0;
    if (e.huskMax) e.husk = e.huskMax;
    this.ev('kb', e.x, e.y, { side: e.side });
  }
  kill(e, a) {
    const eb = e.s.ab;
    if (e.side === 1 && eb.deathSurge && this.abOn(e)) this.makeSurge(e, e.x, eb.deathSurge[0], e.s.atk);
    if (e.side === 1 && e.revives > 0 && !e.unravelled) {
      e.revives--; e.state = 'down'; e.downT = eb.revive[1]; e.hp = 0;
      this.ev('down', e.x, e.y, { uid: e.uid });
      return;
    }
    e.state = 'dead'; e.st = 0; e.hp = 0;
    this.ev('die', e.x, e.y, { side: e.side, uid: e.uid, s: e.s, dir: e.dir, boss: e.boss });
    if (e.side === 1) {
      this.stats.kills++;
      if (e.boss) this.stats.bossKills++;
      const drop = (e.s.drop || e.s.cost * 0.4 || 0) * (1 + (this.B.killScrap || 0)) * (e.scrapX2 ? 2 : 1);
      this.money = Math.min(loomCap(this.loom, this.B), this.money + drop);
      this.ev('scrap', e.x, e.y, { v: Math.round(drop) });
    }
  }

  /* ----------------------------------------------------- helpers / AI */
  lookout(dt) {
    this.lookT -= dt; if (this.lookT > 0) return;
    this.lookT = 6.5;
    let f = null; for (const u of this.units) if (u.side === 1 && this.targetable(u) && u.x < this.pBase.x + 1500 && (!f || u.x < f.x)) f = u;
    if (!f) { this.lookT = 1; return; }
    this.shots.push({ x0: this.pBase.x, x1: f.x, y: f.y - 30, side: 0, t: 0, life: 0.25, kind: 'snipe' });
    this.dealRaw(f, 50, null); if (!this.immune(f, 'kb')) this.knock(f);
  }
  foeNear(dist) { let n = 0; for (const u of this.units) if (u.side === 1 && this.alive(u) && u.x - this.pBase.x < dist) n++; return n; }
  autopilot(dt) {
    this.autoT -= dt; if (this.autoT > 0) return;
    this.autoT = 0.35;
    const near = this.foeNear(this.L * 0.6), threat = this.foeNear(this.cannon.reach * 0.8);
    if (this.cannon.charge >= 1 && (threat >= 3 || this.foeNear(500) >= 1)) this.fire();
    const cap = loomCap(this.loom, this.B), danger = this.foeNear(450) > 0, lc = loomCost(this.loom, this.cm);
    // grow the loom early, like a sensible player; only hold off while the keep is in danger
    if (this.loom < LOOM_MAX && this.money >= lc && (this.loom < 4 || !danger || this.money > cap * 0.8)) { this.loomUp(); return; }
    const saving = this.loom < 6 && this.money < lc && !danger;
    // cheapest walls whenever foes are on the field, the rest when affordable
    const order = this.slots.map((sl, i) => ({ sl, i })).filter(o => o.sl.cd <= 0 && this.money >= o.sl.s.cost);
    if (!order.length) return;
    const wallMax = 200 * this.cm;
    const walls = order.filter(o => o.sl.s.cost <= wallMax).sort((a, b) => a.sl.s.cost - b.sl.s.cost);
    let wallsUp = 0; for (const u of this.units) if (u.side === 0 && this.alive(u) && !u.wall && u.s.cost <= wallMax) wallsUp++;
    // the hitter worth saving for: the priciest one the wallet can hold that is (nearly) recharged
    const want = this.slots.map((sl, i) => ({ sl, i })).filter(o => o.sl.s.cost > wallMax && o.sl.s.cost <= cap && o.sl.cd < 2).sort((a, b) => b.sl.s.cost - a.sl.s.cost)[0];
    if (want && want.sl.cd <= 0 && this.money >= want.sl.s.cost && !saving) { this.deploy(want.i); return; }
    const hold = want && wallsUp >= 3 && !this.foeNear(900);
    if (near && walls.length && (danger || wallsUp < 3 || (!hold && !saving))) this.deploy(walls[0].i);
    const big = order.filter(o => o.sl.s.cost > wallMax).sort((a, b) => b.sl.s.cost - a.sl.s.cost);
    if (!want && big.length && !saving && (near || this.money > cap * 0.7)) this.deploy(big[0].i);
  }
  rivalAI(dt) {
    const R = this.rival;
    R.money = Math.min(4000, R.money + (26 + this.t * 0.25) * dt);
    for (const s of R.slots) s.cd = Math.max(0, s.cd - dt);
    R.t -= dt; if (R.t > 0) return;
    R.t = 0.9 + this.rng() * 1.2;
    const ok = R.slots.filter(s => s.cd <= 0 && s.s.cost <= R.money);
    if (!ok.length) return;
    const pick = this.rng() < 0.5 ? ok.sort((a, b) => a.s.cost - b.s.cost)[0] : ok[Math.floor(this.rng() * ok.length)];
    R.money -= pick.s.cost; pick.cd = pick.s.cd;
    const u = this.spawn({ ...pick.s, drop: Math.round(pick.s.cost * 0.5) }, 1, this.eBase.x - 40);
    this.ev('foe', u.x, u.y, { id: pick.s.id, rag: 1 });
  }
  ev(type, x, y, d) { if (this.events.length < 600) this.events.push({ type, x, y, ...d }); }
}
