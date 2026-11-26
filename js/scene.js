// Battle scene: owns the running Battle, the camera, the HUD, input and the event -> effect mapping.
import { Battle, STEP, loomCost, loomCap, LOOM_MAX } from './battle.js';
import { drawWorld, drawRag, drawFoe, drawKeep, drawSpire, ragPortrait, glow, limb } from './art.js';
import { FX } from './fx.js';
import { sfx, music } from './audio.js';
import { S, save } from './save.js';
import { el, $, clamp, lerp, fmt, TAU, rgba, mixHex } from './util.js';
import { ic } from './icons.js';
import { ITEMS } from './data/meta.js';

const SIDE_COL = ['#c8ff2e', '#ff5ea8'];
const CANNON_COL = { spool: '#c8ff2e', frost: '#9ff3ff', snare: '#ffd84a', wall: '#ece6dc', breaker: '#ffffff', quake: '#c49a62', lance: '#ff5ea8' };

export const Scene = {
  b: null, cam: { x: 0, tx: 0, drag: 0, lastDrag: -10 }, speed: 1, acc: 0, t: 0, onEnd: null, ended: false, endT: 0, hud: null, ctx: null, tut: 0,

  start(stage, lineupStats, opts, onEnd) {
    if (this.hud) { this.hud.root.remove(); this.hud = null; }
    FX.reset();
    FX.mult = S.settings.fx; FX.nums = !!S.settings.dmgNum;
    this.b = new Battle(stage, lineupStats, opts);
    this.ctx = { stage, opts };
    this.onEnd = onEnd; this.ended = false; this.endT = 0; this.t = 0; this.acc = 0;
    this.speed = Math.min(S.settings.speed || 1, opts.items && opts.items.quick ? 3 : 2);
    this.cam.x = this.cam.tx = -200; this.cam.lastDrag = -10;
    this.tut = stage.key === 's0-0-0' && S.tutorial < 3 ? 1 : 0;
    this.buildHud();
    music(stage.music || 'battle');
    document.body.classList.add('battle');
  },
  stop() { this.b = null; if (this.hud) this.hud.root.remove(); this.hud = null; document.body.classList.remove('battle'); $('.tut') && $('.tut').remove(); },

  /* ---------------------------------------------------------------- HUD */
  buildHud() {
    const b = this.b, stage = this.ctx.stage;
    const H = {};
    const slots = Array.from({ length: 10 }, (_, i) => {
      const sl = b.slots[i];
      const n = el('button.dslot' + (sl ? '' : '.emptyslot'), { onpointerdown: e => { e.preventDefault(); this.tryDeploy(i); } });
      if (sl) {
        const c = ragPortrait(sl.s.look, sl.s.form, 64); const cv = el('canvas', { width: 64, height: 64 }); cv.getContext('2d').drawImage(c, 0, 0);
        n.append(cv, el('span.c', String(sl.s.cost)), el('kbd.k', String((i + 1) % 10)), el('i.cd'));
      }
      return n;
    });
    H.loom = el('button.bigbtn.loom', { onpointerdown: e => { e.preventDefault(); this.tryLoom(); } }, el('span', { html: ic('loom') }), el('b', 'Loom'), el('small', ''), el('i.fill'));
    H.cannon = el('button.bigbtn.cannon', { onpointerdown: e => { e.preventDefault(); this.tryCannon(); } }, el('span', { html: ic('cannon') }), el('b', 'Cannon'), el('small', ''), el('i.fill'));
    if (stage.rules && stage.rules.noCannon) H.cannon.classList.add('off');
    H.money = el('b', '0'); H.cap = el('small', '/0');
    H.speed = el('button.round', { title: 'Speed (F)', onclick: () => this.cycleSpeed() }, el('b', '1x'));
    H.pB = el('i'); H.eB = el('i'); H.pBt = el('span'); H.eBt = el('span');
    H.timer = el('div.sname', '');
    const items = Object.keys(this.ctx.opts.items || {}).filter(k => this.ctx.opts.items[k]).map(k => el('span', ITEMS[k].n));
    H.root = el('div#hud',
      el('div.hud-top',
        el('div', el('div.wallet', el('span', { html: ic('scrap') }), H.money, H.cap), el('div.items-on', { style: { marginTop: '6px' } }, items)),
        el('div.bases', el('div.sname', stage.name), el('div.hpbars', el('div.hpb', H.pB, H.pBt), el('div.hpb.foe', H.eB, H.eBt)), H.timer),
        el('div.hud-btns', H.speed, el('button.round', { title: 'Pause (P)', onclick: () => this.pause() }, el('span', { html: ic('pause') })))),
      el('div.hud-bot', H.loom, el('div.deploy', slots), H.cannon));
    H.slots = slots;
    document.body.append(H.root);
    this.hud = H; this.hudCache = {};
    this.updateHud(true);
  },
  updateHud(force) {
    const b = this.b, H = this.hud, C = this.hudCache; if (!b || !H) return;
    const m = Math.floor(b.money), cap = Math.floor(loomCap(b.loom, b.B));
    if (force || C.m !== m) { H.money.textContent = fmt(m); C.m = m; }
    if (force || C.cap !== cap) { H.cap.textContent = '/' + fmt(cap); C.cap = cap; }
    const lc = loomCost(b.loom, b.cm), lmax = b.loom >= LOOM_MAX;
    const lk = `${b.loom}:${lmax}:${m >= lc}`;
    if (force || C.lk !== lk) { H.loom.querySelector('b').textContent = `Loom ${b.loom}`; H.loom.querySelector('small').textContent = lmax ? 'MAX' : fmt(lc); H.loom.classList.toggle('ready', !lmax && m >= lc); C.lk = lk; }
    H.loom.querySelector('.fill').style.height = (lmax ? 100 : clamp(m / lc, 0, 1) * 100) + '%';
    const ch = b.cannon.charge;
    H.cannon.querySelector('.fill').style.height = ch * 100 + '%';
    const ck = ch >= 1;
    if (force || C.ck !== ck) { H.cannon.classList.toggle('ready', ck && !(b.stage.rules && b.stage.rules.noCannon)); H.cannon.querySelector('small').textContent = ck ? 'READY' : 'charging'; C.ck = ck; }
    b.slots.forEach((sl, i) => {
      const n = H.slots[i], cd = sl.cd / sl.s.cd, poor = m < sl.s.cost;
      n.querySelector('.cd').style.height = cd * 100 + '%';
      const k = `${poor}:${cd <= 0}`;
      if (force || C['s' + i] !== k) { n.classList.toggle('poor', poor); n.classList.toggle('ready', !poor && cd <= 0); C['s' + i] = k; }
    });
    const pf = b.pBase.hp / b.pBase.max, ef = b.eBase.immune ? 1 : b.eBase.hp / b.eBase.max;
    H.pB.style.width = pf * 100 + '%'; H.eB.style.width = ef * 100 + '%';
    const bt = `${Math.ceil(b.pBase.hp)}|${Math.ceil(b.eBase.hp)}`;
    if (force || C.bt !== bt) { H.pBt.textContent = fmt(Math.ceil(b.pBase.hp)); H.eBt.textContent = b.eBase.immune ? 'Score ' + fmt(b.stats.baseDmg) : fmt(Math.ceil(b.eBase.hp)); C.bt = bt; }
    if (b.stage.timeLimit) H.timer.textContent = `${Math.max(0, Math.ceil(b.stage.timeLimit - b.t))}s left`;
    else if (b.stage.timed) H.timer.textContent = `${b.t.toFixed(1)}s`;
    if (force || C.sp !== this.speed) { H.speed.querySelector('b').textContent = this.speed + 'x'; C.sp = this.speed; }
  },
  tryDeploy(i) {
    if (!this.b || this.b.result) return;
    if (this.b.deploy(i)) { S.stats.deploys = S.stats.deploys; if (this.tut === 1) this.tutStep(2); }
    else sfx('error', 0.15);
  },
  tryLoom() { if (this.b && this.b.loomUp()) { sfx('loom'); if (this.tut === 2) this.tutStep(3); } else sfx('error', 0.15); },
  tryCannon() { if (this.b && this.b.fire()) { if (this.tut === 3) this.tutStep(4); } else sfx('error', 0.15); },
  cycleSpeed() { const max = this.ctx.opts.items && this.ctx.opts.items.quick ? 3 : 2; this.speed = this.speed >= max ? 1 : this.speed + 1; S.settings.speed = Math.min(2, this.speed); save(); sfx('ui'); },
  pause() { if (!this.b || this.b.result) return; this.b.paused = true; sfx('ui'); this.onPause && this.onPause(); },
  resume() { if (this.b) this.b.paused = false; },
  tutStep(n) {
    this.tut = n; $('.tut') && $('.tut').remove();
    document.querySelectorAll('.hl').forEach(x => x.classList.remove('hl'));
    const msg = { 1: 'Tap a rag below (or press <b>1</b>) to send it down the lane. It costs <b>scrap</b>.', 2: 'Scrap builds up on its own. Tap <b>Loom</b> (or <b>Q</b>) to earn it faster.', 3: 'When the <b>Cannon</b> glows, fire it (<b>E</b>) to blast every foe in reach.', 4: 'Knock down the foe spire on the right to win!' }[n];
    if (!msg) { S.tutorial = 3; save(); return; }
    document.body.append(el('div.tut', { html: msg }));
    const hl = { 1: this.hud.slots[0], 2: this.hud.loom, 3: this.hud.cannon }[n];
    if (hl) hl.classList.add('hl');
    if (n === 4) { setTimeout(() => { $('.tut') && $('.tut').remove(); }, 4000); S.tutorial = 3; save(); }
  },

  /* ------------------------------------------------------------ update */
  key(e) {
    if (!this.b) return;
    const k = e.key.toLowerCase();
    if (k >= '0' && k <= '9') { const i = k === '0' ? 9 : +k - 1; this.tryDeploy(i); }
    else if (k === 'q') this.tryLoom();
    else if (k === 'e' || k === ' ') this.tryCannon();
    else if (k === 'f') this.cycleSpeed();
    else if (k === 'p' || k === 'escape') this.pause();
    else if (k === 'arrowleft' || k === 'a') { this.cam.tx -= 200; this.cam.lastDrag = this.t; }
    else if (k === 'arrowright' || k === 'd') { this.cam.tx += 200; this.cam.lastDrag = this.t; }
  },
  update(dt) {
    const b = this.b; if (!b) return;
    this.t += dt;
    if (!b.paused && !b.result) {
      this.acc += dt * this.speed;
      let n = 0;
      while (this.acc >= STEP && n < 8) { b.update(STEP); this.acc -= STEP; n++; }
      if (n >= 8) this.acc = 0;
    }
    this.handleEvents();
    FX.update(b.paused ? 0 : dt * Math.min(this.speed, 2));
    if (this.tut === 2 && b.money >= loomCost(b.loom, b.cm) + 10 && $('.tut') && !$('.tut').dataset.s) { /* hint is up already */ }
    if (this.tut === 2 && b.t > 6 && !this.hud.loom.classList.contains('hl')) this.tutStep(2);
    if (this.tut === 3 && b.cannon.charge >= 1 && !this.hud.cannon.classList.contains('hl')) this.tutStep(3);
    if (b.result && !this.ended) { this.ended = true; this.endT = this.t; }
    if (this.ended && this.t - this.endT > 1.4 && this.onEnd) { const f = this.onEnd; this.onEnd = null; f(b); }
    this.updateHud();
  },
  handleEvents() {
    const b = this.b, num = FX.nums;
    let hits = 0;
    for (const e of b.events) {
      switch (e.type) {
        case 'deploy': FX.burst(e.x, e.y - 4, 8, ['#e6dfd2', '#c8ff2e'], 160, 0.4, 3, { g: 300 }); sfx('deploy'); S.stats.deploys++; break;
        case 'foe': if (!S.seenFoes[e.id] && !e.rag) S.seenFoes[e.id] = 1; break;
        case 'hit': {
          hits++;
          if (hits < 14) FX.burst(e.x - (e.side ? -6 : 6), e.y - 34, e.big ? 9 : 3, e.side ? ['#ffffff', '#ff8a3d'] : ['#ffffff', SIDE_COL[1]], e.big ? 300 : 180, 0.25, 2.5, { add: true, g: 200, shape: 'line' });
          if (num && (e.crit || e.big || Math.random() < 0.3)) FX.text(e.x, e.y - 60, fmt(e.v), e.crit ? '#ffc933' : e.side ? '#ff8a94' : '#ffffff', { size: e.crit ? 20 : 14, pop: e.crit });
          if (e.crit) sfx('crit', 0.06); else sfx(e.big ? 'bighit' : 'hit', 0.05);
          if (e.big) FX.kick(2);
          break;
        }
        case 'kb': FX.burst(e.x, -2, 6, ['#d8cfc0', '#b9b1a4'], 140, 0.5, 4, { dirA: -Math.PI / 2, spread: 2, g: 200 }); sfx('kb', 0.08); break;
        case 'die': {
          FX.body({ s: e.s, dir: e.dir, x: e.x, y: e.y }, e.boss ? 1.6 : 1);
          FX.fluff(e.x, e.y - 30, e.boss ? 30 : 10, e.side ? (e.s.look && e.s.look.col) || '#ddd' : '#f6f2ea');
          sfx(e.side ? 'foedie' : 'die', 0.05);
          if (e.boss) { FX.kick(14); FX.flashScreen(0.5); FX.ring(e.x, -20, 20, 360, '#ffffff', 0.8, 8); S.stats.bosses = (S.stats.bosses || 0); }
          break;
        }
        case 'scrap': if (e.v > 0) FX.text(e.x, e.y - 80, '+' + fmt(e.v), '#ffc933', { size: 12, vy: -40, life: 0.7 }); sfx('scrap', 0.09); break;
        case 'cannon': this.cannonFx(e); break;
        case 'wave': sfx('wave', 0.1); break;
        case 'surge': sfx('surge', 0.1); FX.burst(e.x, 0, 14, [SIDE_COL[e.side], '#ffffff'], 320, 0.6, 3, { add: true, dirA: -Math.PI / 2, spread: 0.8, g: 100 }); break;
        case 'boss': this.banner('Boss: ' + e.name, '#ff8a94'); sfx('boss'); FX.kick(10); FX.ring(e.x, -10, 40, 900, '#ff5ea8', 1, 10); break;
        case 'baseHit': if (e.side === 0) { FX.kick(3); sfx('base', 0.2); } FX.burst(e.x + (e.side ? -40 : 40), -80 - Math.random() * 80, 3, e.side ? ['#3a3442', '#ff5ea8'] : ['#ece6dc', '#c8ff2e'], 200, 0.5, 4, { shape: 'sq', spin: 8 }); break;
        case 'freeze': FX.burst(e.x, e.y - 40, 6, ['#bfefff', '#ffffff'], 150, 0.5, 3, { shape: 'sq', spin: 6, add: true }); sfx('freeze', 0.12); break;
        case 'slow': FX.text(e.x, e.y - 90, 'SNAG', '#ffd84a', { size: 11 }); break;
        case 'weaken': FX.text(e.x, e.y - 90, 'FRAY', '#ff9ad0', { size: 11 }); break;
        case 'curse': FX.text(e.x, e.y - 90, 'HEX', '#b46bff', { size: 11 }); break;
        case 'toxic': FX.burst(e.x, e.y - 40, 6, '#8fd16a', 100, 0.6, 3, { g: -60 }); break;
        case 'barrierBreak': case 'huskBreak': FX.burst(e.x, e.y - 40, 18, ['#ffffff', '#b46bff', '#9ff3ff'], 360, 0.6, 3, { shape: 'sq', spin: 10, add: true }); FX.text(e.x, e.y - 100, e.type === 'barrierBreak' ? 'BARRIER BROKEN' : 'HUSK TORN', '#ffffff', { size: 13, pop: 1 }); sfx('shatter'); break;
        case 'blocked': if (Math.random() < 0.4) FX.text(e.x, e.y - 90, 'BLOCK', '#9ff3ff', { size: 11 }); sfx('barrier', 0.1); break;
        case 'huskHit': if (Math.random() < 0.3) FX.burst(e.x, e.y - 40, 3, '#b46bff', 140, 0.3, 2, { add: true }); break;
        case 'dodge': FX.text(e.x, e.y - 90, 'MISS', '#ffffff', { size: 12 }); break;
        case 'survive': FX.text(e.x, e.y - 100, 'HANG ON!', '#ffc933', { size: 14, pop: 1 }); break;
        case 'savage': FX.text(e.x, e.y - 110, 'SAVAGE!', '#ff4d5a', { size: 15, pop: 1 }); FX.kick(4); break;
        case 'down': FX.fluff(e.x, e.y - 20, 6, '#8fd16a'); break;
        case 'revive': FX.text(e.x, e.y - 90, 'GOT BACK UP', '#8fd16a', { size: 12 }); FX.ring(e.x, 0, 10, 90, '#8fd16a', 0.6, 4); sfx('revive', 0.2); break;
        case 'burrow': case 'emerge': FX.burst(e.x, 0, 12, ['#8b6b4f', '#5e4230'], 240, 0.6, 4, { dirA: -Math.PI / 2, spread: 1.6 }); break;
        case 'warp': case 'warpOut': FX.ring(e.x, e.y - 30, 6, 60, '#5fd8ff', 0.4, 3); break;
        case 'waveBlock': FX.ring(e.x, e.y - 30, 10, 70, '#ffffff', 0.4, 5); break;
        case 'loom': FX.text(this.b.pBase.x, -230, 'LOOM UP!', '#ffc933', { size: 18, pop: 1 }); FX.burst(this.b.pBase.x, -200, 16, ['#ffc933', '#ffffff'], 260, 0.7, 3, { add: true }); break;
        case 'full': this.toast('Your army is at full strength.'); break;
        case 'continue': this.banner('Back on your feet!', '#c8ff2e'); FX.flashScreen(0.6, '#c8ff2e'); break;
        case 'win': this.banner('Victory!', '#c8ff2e'); sfx('win'); FX.kick(16); FX.flashScreen(0.7); music(null); break;
        case 'lose': this.banner('Defeat', '#ff8a94'); sfx('lose'); FX.kick(10); music(null); break;
        case 'wallGone': FX.fluff(e.x, -60, 16); break;
        default: break;
      }
    }
    b.events.length = 0;
  },
  cannonFx(e) {
    const col = CANNON_COL[e.id] || '#c8ff2e', x0 = e.x + 40, x1 = e.x + e.reach;
    sfx('cannon'); FX.kick(9); FX.flashScreen(0.25, col);
    if (e.id === 'quake') { FX.burst(x0, 0, 30, ['#c49a62', '#8b6b4f'], 400, 0.8, 5, { dirA: -Math.PI / 2, spread: 1.4 }); return; }
    if (e.id === 'wall') { FX.burst(x0, -200, 20, ['#ece6dc', '#c8ff2e'], 300, 0.8, 5); return; }
    FX.beam(x0, x1, -36, col, 0.6, 34);
    for (let x = x0; x < x1; x += 60) FX.burst(x, -36, 2, [col, '#ffffff'], 240, 0.5, 3, { add: true, g: 120 });
    S.stats.cannons++;
  },
  banner(txt, col) { const n = el('div.banner-msg', { style: { color: col } }, txt); document.body.append(n); setTimeout(() => n.remove(), 2300); },
  toast(t) { const box = $('#toasts'); if (!box || box.childElementCount > 2) return; const n = el('div.toast', t); box.append(n); setTimeout(() => n.remove(), 1800); },

  /* ------------------------------------------------------------ render */
  view(W, H) { const z = clamp(H / 560, 0.55, 1.6); return { z, gy: Math.round(H * 0.72), vw: W / z }; },
  pointer(type, dx) {
    if (type === 'drag') { const { z } = this.lastView || { z: 1 }; this.cam.tx -= dx / z; this.cam.lastDrag = this.t; }
    if (type === 'wheel') { this.cam.tx += dx; this.cam.lastDrag = this.t; }
  },
  render(g, W, H) {
    const b = this.b; if (!b) return;
    const v = this.view(W, H); this.lastView = v;
    const { z, gy, vw } = v, cam = this.cam;
    // follow the front line unless the player panned recently
    if (this.t - cam.lastDrag > 2.5) {
      let front = b.pBase.x; for (const u of b.units) if (u.side === 0 && b.alive(u) && !u.wall) front = Math.max(front, u.x);
      let foe = b.eBase.x; for (const u of b.units) if (u.side === 1 && b.alive(u)) foe = Math.min(foe, u.x);
      cam.tx = Math.min(front, foe) - vw * 0.5;
    }
    cam.tx = clamp(cam.tx, -220, b.L - vw + 220);
    cam.x = lerp(cam.x, cam.tx, 0.12);
    const sh = FX.shake * (S.settings.shake ? 1 : 0);
    g.save();
    if (sh > 0) g.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    const st = b.stage;
    drawWorld(g, W, H, st.theme || 0, st.sky || 0, cam.x, z, gy, b.L, this.t);
    const X = x => (x - cam.x) * z;
    drawKeep(g, X(b.pBase.x), gy, z, b.pBase.hp / b.pBase.max, b.pBase.flash, this.t, b.cannon.charge);
    drawSpire(g, X(b.eBase.x), gy, z, b.eBase.hp / b.eBase.max, b.eBase.flash, this.t, st.theme || 0, st.boss);
    // surges and waves on the ground
    for (const s of b.surges) {
      const x = X(s.x), col = SIDE_COL[s.side], a = 0.6 + Math.sin(this.t * 30) * 0.2;
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(0, gy - 200 * z, 0, gy); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, rgba(col, 0.55 * a));
      g.fillStyle = gr; g.fillRect(x - s.w / 2 * z, gy - 200 * z, s.w * z, 200 * z);
      for (let i = 0; i < 4; i++) limb(g, x + (i - 1.5) * 24 * z, gy, x + (i - 1.5) * 24 * z + Math.sin(this.t * 20 + i) * 6 * z, gy - 160 * z, 3 * z, rgba('#ffffff', 0.5 * a));
      g.restore();
    }
    for (const w of b.waves) {
      const x = X(w.x), col = w.quake ? '#c49a62' : SIDE_COL[w.side];
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(col, w.mini ? 0.5 : 0.85); g.lineWidth = (w.mini ? 4 : 7) * z;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x - w.dir * i * 22 * z, gy - 22 * z, 18 * z, (52 - i * 10) * z, 0, -Math.PI / 2, Math.PI / 2, w.dir < 0); g.stroke(); }
      g.restore();
    }
    FX.draw(g, cam.x, z, gy, 'bodies');
    // units, back to front
    const list = b.units.filter(u => u.state !== 'gone' && u.state !== 'dead').sort((a, c) => a.y - c.y);
    for (const u of list) this.drawUnit(g, u, X(u.x), gy + u.y * z * 0.8, z, b);
    // shots
    for (const s of b.shots) {
      const k = s.t / s.life;
      g.save(); g.globalCompositeOperation = 'lighter';
      if (s.kind === 'ld') { const x = X(s.x); g.fillStyle = rgba(SIDE_COL[s.side], 0.35 * (1 - k)); g.fillRect(x - s.w / 2 * z, gy - 60 * z, s.w * z, 60 * z); }
      else { const x0 = X(s.x0), x1 = X(s.x1), y = gy + (s.y - 40) * z; const hx = lerp(x0, x1, Math.min(1, k * 1.6)); limb(g, lerp(x0, x1, Math.max(0, k * 1.6 - 0.4)), y - Math.sin(Math.min(1, k * 1.6) * Math.PI) * 30 * z, hx, y - Math.sin(Math.min(1, k * 1.6) * Math.PI) * 30 * z, (s.kind === 'snipe' ? 3 : 4) * z, rgba(s.kind === 'snipe' ? '#ffffff' : (s.col || SIDE_COL[s.side]), 1 - k)); }
      g.restore();
    }
    FX.draw(g, cam.x, z, gy, 'fx');
    g.restore();
    if (FX.flash > 0) { g.fillStyle = rgba(FX.flashCol, FX.flash * 0.5); g.fillRect(0, 0, W, H); }
    // off-screen indicator for the foe keep and the front
    g.fillStyle = 'rgba(12,14,21,.5)'; g.fillRect(W / 2 - 120, H - 6, 240, 4);
    const prog = clamp(cam.x / Math.max(1, b.L - vw), 0, 1);
    g.fillStyle = '#c8ff2e'; g.fillRect(W / 2 - 120 + prog * 200, H - 6, 40, 4);
  },
  drawUnit(g, u, sx, sy, z, b) {
    const s = u.s;
    if (u.wall) {
      g.save(); g.translate(sx, sy); g.scale(z, z);
      const a = clamp(u.wall, 0, 1);
      g.globalAlpha = a; g.fillStyle = '#ece6dc'; g.beginPath(); g.roundRect(-26, -170, 52, 170, 16); g.fill();
      for (let i = 0; i < 5; i++) { g.fillStyle = ['#c8ff2e', '#7fb0e2', '#ff9ad0', '#ffc933', '#45e08a'][i]; g.beginPath(); g.roundRect(-18, -160 + i * 32, 36, 24, 6); g.fill(); }
      g.restore(); g.globalAlpha = 1; return;
    }
    if (u.state === 'burrow') { g.fillStyle = '#5e4230'; g.beginPath(); g.ellipse(sx, sy, 26 * z, 9 * z, 0, Math.PI, 0); g.fill(); return; }
    let rot = 0, lift = 0, alpha = 1;
    const P = { t: u.anim, move: u.state === 'walk' && u.freeze <= 0 ? 1 : 0, atk: -1, cadence: Math.max(5, s.speed / 6) };
    if (u.state === 'atk') { const fs = Math.max(0.05, s.fs); P.atk = u.st < fs ? (u.st / fs) * 0.55 : Math.min(1, 0.55 + (u.st - fs) / 0.35 * 0.45); }
    if (u.state === 'kb') { const k = clamp(u.kbT / 0.5, 0, 1); rot = -Math.sin(k * Math.PI) * 0.7; lift = -Math.sin(k * Math.PI) * 38 * z; }
    if (u.state === 'down') { rot = -1.45; alpha = 0.55; }
    if (u.state === 'warp') alpha = 0.3 + Math.sin(this.t * 30) * 0.2;
    if (u.emerging > 0) alpha = 0.6;
    if (u.slow > 0) P.t = u.anim * 0.4;
    // contact shadow
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(sx, sy + 1, 18 * z * (s.size || (s.look && s.look.size) || 1), 4 * z, 0, 0, TAU); g.fill();
    g.globalAlpha = alpha;
    const o = { x: sx, y: sy + lift, rot, flash: u.flash, frozen: u.freeze > 0, cursed: u.curse > 0, form: s.form || 0, down: u.state === 'down' };
    if (s.rag) drawRag(g, s.look, P, z, u.dir, o);
    else drawFoe(g, s, P, z, u.dir, o);
    g.globalAlpha = 1;
    const top = sy + lift - (s.rag ? 92 * ((s.look && s.look.size) || 1) * ((s.look && s.look.tall) || 1) : (s.kind === 'bird' ? 80 : s.kind === 'doll' || s.kind === 'golem' ? 100 : 50) * (s.size || 1)) * z;
    if (u.barrier > 0 || u.husk > 0) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = u.barrier > 0 ? 'rgba(159,243,255,.7)' : 'rgba(180,107,255,.7)'; g.lineWidth = 3 * z;
      g.beginPath(); g.ellipse(sx, (sy + top) / 2, 40 * z * (s.size || 1), (sy - top) / 2 + 10 * z, 0, 0, TAU); g.stroke(); g.restore();
    }
    if (u.weaken > 0) { g.fillStyle = '#ff9ad0'; g.beginPath(); g.moveTo(sx - 5 * z, top - 10 * z); g.lineTo(sx + 5 * z, top - 10 * z); g.lineTo(sx, top - 2 * z); g.fill(); }
    if (u.curse > 0) { g.strokeStyle = '#b46bff'; g.lineWidth = 2 * z; g.beginPath(); g.arc(sx + 10 * z, top - 8 * z, 5 * z, 0, TAU); g.moveTo(sx + 6 * z, top - 12 * z); g.lineTo(sx + 14 * z, top - 4 * z); g.stroke(); }
    if (u.slow > 0) { g.strokeStyle = '#ffd84a'; g.lineWidth = 1.6 * z; g.beginPath(); for (let i = 0; i < 3; i++) g.ellipse(sx, sy - (10 + i * 14) * z, 16 * z, 4 * z, 0.2, 0, TAU); g.stroke(); }
    if (u.boss || (u.side === 1 && s.hp > 5000 && u.hp < u.maxHp)) {
      const w = 70 * z, f = clamp(u.hp / u.maxHp, 0, 1);
      g.fillStyle = 'rgba(12,14,21,.75)'; g.fillRect(sx - w / 2, top - 22 * z, w, 6 * z);
      g.fillStyle = u.boss ? '#ff5ea8' : '#ffb13d'; g.fillRect(sx - w / 2, top - 22 * z, w * f, 6 * z);
      if (u.husk > 0) { g.fillStyle = '#b46bff'; g.fillRect(sx - w / 2, top - 28 * z, w * clamp(u.husk / u.huskMax, 0, 1), 3 * z); }
    }
  },
};
