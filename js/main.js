// Boot, canvas, main loop, input routing and the home island scene.
import { S, load, save, storyUnlocks, tickEnergy } from './save.js';
import { UI, dailyLogin, tickUi } from './ui.js';
import { Scene } from './scene.js';
import { initAudio, setVolume, suspend } from './audio.js';
import { drawWorld, drawRag, drawKeep } from './art.js';
import { RAGS } from './data/rags.js';
import { clamp, $ } from './util.js';
import { lineupIds } from './game.js';

const cvs = $('#stage'), g = cvs.getContext('2d');
let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = Math.round(innerWidth * dpr); H = Math.round(innerHeight * dpr);
  cvs.width = W; cvs.height = H; cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px';
  const portrait = innerHeight > innerWidth * 1.15 && innerWidth < 700;
  $('#turn').classList.toggle('hidden', !portrait || turnDismissed);
}
let turnDismissed = false;
$('#turn button').onclick = () => { turnDismissed = true; $('#turn').classList.add('hidden'); };
addEventListener('resize', resize);

/* ------------------------------------------------------------ home scene */
const home = { rags: [], t: 0 };
function homeRags() {
  const ids = lineupIds().slice(0, 6);
  if (!ids.length) ids.push('stitch');
  home.rags = ids.map((id, i) => ({ id, x: 0.68 + i * 0.05, tx: 0.68 + i * 0.05, dir: 1, t: Math.random() * 10, wait: Math.random() * 3 }));
}
function renderHome(dt) {
  home.t += dt;
  const z = clamp(H / 620, 0.6, 1.8), gy = Math.round(H * 0.74);
  const prog = S.story.findIndex(v => v < 48), theme = prog < 0 ? 2 : Math.min(2, Math.floor(prog / 3));
  drawWorld(g, W, H, theme, 0, -W * 0.15 / z, z, gy, W / z * 1.3, home.t);
  drawKeep(g, W * 0.6, gy, z * 0.9, 1, 0, home.t, 1);
  for (const r of home.rags) {
    r.wait -= dt;
    if (r.wait <= 0) { r.tx = 0.66 + Math.random() * 0.3; r.wait = 2 + Math.random() * 4; }
    const dx = r.tx - r.x, mv = Math.abs(dx) > 0.004;
    if (mv) { r.dir = Math.sign(dx); r.x += r.dir * dt * 0.035; }
    r.t += dt;
    const d = RAGS[r.id], own = S.rags[r.id];
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(r.x * W, gy + 2, 16 * z, 4 * z, 0, 0, Math.PI * 2); g.fill();
    drawRag(g, d.look, { t: r.t, move: mv ? 1 : 0, atk: !mv && Math.sin(r.t * 0.7) > 0.97 ? (r.t * 2) % 1 : -1, cadence: 8 }, z, r.dir, { x: r.x * W, y: gy, form: own ? own.form : 0 });
  }
}

/* ------------------------------------------------------------- loop */
let last = performance.now(), uiT = 0, lastLineup = '';
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (Scene.b) { Scene.update(dt); Scene.render(g, W, H); }
  else {
    const key = lineupIds().join(',');
    if (key !== lastLineup) { lastLineup = key; homeRags(); }
    renderHome(dt);
  }
  uiT += dt; if (uiT > 1) { uiT = 0; tickUi(); }
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------ input */
let drag = null;
cvs.addEventListener('pointerdown', e => { unlock(); if (Scene.b) { drag = { x: e.clientX }; cvs.setPointerCapture(e.pointerId); } });
cvs.addEventListener('pointermove', e => { if (drag && Scene.b) { const dx = (e.clientX - drag.x) * dpr; drag.x = e.clientX; if (Math.abs(dx) > 0) Scene.pointer('drag', dx); } });
cvs.addEventListener('pointerup', () => (drag = null));
cvs.addEventListener('pointercancel', () => (drag = null));
cvs.addEventListener('wheel', e => { if (Scene.b) { Scene.pointer('wheel', (e.deltaX || e.deltaY) * 1.2); e.preventDefault(); } }, { passive: false });
addEventListener('keydown', e => {
  unlock();
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (Scene.b && $('#modal').classList.contains('hidden')) { Scene.key(e); if (e.key === ' ') e.preventDefault(); }
  else if (e.key === 'Escape' && !$('#modal').classList.contains('hidden') && !Scene.b) $('#modal').classList.add('hidden');
});
addEventListener('pointerdown', unlock, { once: false });
let unlocked = false;
function unlock() { if (unlocked) return; unlocked = true; initAudio(); setVolume(S.settings.sfx, S.settings.music); }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (Scene.b && !Scene.b.result && !Scene.b.paused) Scene.pause(); suspend(true); save(true); }
  else { suspend(false); tickEnergy(); }
});
addEventListener('pagehide', () => save(true));

/* ------------------------------------------------------------- boot */
load(); storyUnlocks(); save();
resize();
UI.home();
dailyLogin();
requestAnimationFrame(frame);
window.__rag = { S, UI, Scene };
