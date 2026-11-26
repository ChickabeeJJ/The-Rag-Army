// Every sound is synthesized with WebAudio. Music is a small procedural loop per scene.
let ctx = null, master = null, sfxBus = null, musBus = null;
const vol = { sfx: 0.8, music: 0.45 };
const last = {};
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = vol.music * 0.5; musBus.connect(master);
  } catch (e) { ctx = null; }
}
export function setVolume(s, m) { vol.sfx = s; vol.music = m; if (sfxBus) { sfxBus.gain.value = s; musBus.gain.value = m * 0.5; } }
export function suspend(on) { if (ctx) on ? ctx.suspend() : ctx.resume(); }

function tone(f, dur, type = 'sine', v = 0.3, slide = 0, delay = 0, bus = sfxBus) {
  if (!ctx) return;
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
let noiseBuf = null;
function noise(dur, v = 0.3, fc = 1200, q = 1, delay = 0, type = 'bandpass') {
  if (!ctx) return;
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = fc; f.Q.value = q;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const R = (a, b) => a + Math.random() * (b - a);
// name -> sound; a short per-name cooldown keeps crowds from turning into noise
const SFX = {
  ui: () => tone(660, 0.06, 'square', 0.08, 1.2),
  tap: () => tone(520, 0.05, 'triangle', 0.12),
  deploy: () => { tone(R(380, 440), 0.09, 'triangle', 0.18, 1.6); noise(0.06, 0.08, 2400, 2); },
  hit: () => { noise(0.07, 0.16, R(700, 1100), 1.4); tone(R(140, 180), 0.06, 'sine', 0.14, 0.5); },
  bighit: () => { noise(0.16, 0.3, 500, 0.9); tone(90, 0.18, 'sine', 0.3, 0.4); },
  crit: () => { tone(1200, 0.08, 'square', 0.1, 1.5); noise(0.1, 0.2, 3000, 3); },
  kb: () => noise(0.18, 0.12, 900, 0.7, 0, 'lowpass'),
  die: () => { tone(R(300, 360), 0.16, 'triangle', 0.14, 0.4); noise(0.14, 0.1, 1600, 1); },
  foedie: () => { noise(0.2, 0.16, R(1600, 2200), 0.8); tone(R(500, 600), 0.1, 'sine', 0.08, 2); },
  scrap: () => { tone(1320, 0.05, 'square', 0.05); tone(1760, 0.07, 'square', 0.05, 1, 0.04); },
  loom: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.14, 1, i * 0.05)),
  charge: () => tone(880, 0.12, 'sine', 0.1, 1.5),
  cannon: () => { noise(0.6, 0.45, 400, 0.6, 0, 'lowpass'); tone(120, 0.5, 'sawtooth', 0.22, 0.3); tone(60, 0.7, 'sine', 0.35, 0.5); },
  wave: () => { tone(300, 0.3, 'sine', 0.12, 2.2); noise(0.3, 0.08, 1200, 2); },
  surge: () => { tone(200, 0.35, 'sawtooth', 0.08, 3); noise(0.35, 0.12, 2200, 3); },
  freeze: () => { tone(1800, 0.2, 'sine', 0.06, 0.6); noise(0.15, 0.08, 6000, 4); },
  boss: () => { tone(80, 1.4, 'sawtooth', 0.22, 0.7); tone(82, 1.4, 'sawtooth', 0.18, 0.69); noise(1, 0.2, 200, 0.5, 0, 'lowpass'); },
  base: () => { noise(0.25, 0.25, 300, 0.8, 0, 'lowpass'); tone(70, 0.3, 'sine', 0.25, 0.6); },
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.18, 1, i * 0.11)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, 'triangle', 0.16, 1, i * 0.18)),
  gacha: () => [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.18, 'square', 0.06, 1, i * 0.07)),
  rare: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.5, 'triangle', 0.15, 1, i * 0.09)); noise(0.8, 0.08, 6000, 2, 0.3); },
  error: () => tone(160, 0.15, 'square', 0.1, 0.8),
  revive: () => tone(200, 0.4, 'sine', 0.12, 2.5),
  barrier: () => { tone(900, 0.06, 'square', 0.08); tone(600, 0.06, 'square', 0.06, 1, 0.03); },
  shatter: () => { noise(0.3, 0.25, 4000, 1.5); tone(1400, 0.2, 'triangle', 0.1, 0.4); },
};
export function sfx(name, cd = 0.04) {
  if (!ctx || !SFX[name]) return;
  const t = ctx.currentTime;
  if (last[name] && t - last[name] < cd) return;
  last[name] = t; SFX[name]();
}

/* -------------------------------------------------------------- music */
let musTimer = 0, musName = '', step = 0;
const SONGS = {
  home: { bpm: 92, root: 57, prog: [0, 5, 3, 4], lead: [0, 4, 7, 9, 7, 4, 2, 4], bass: 'triangle', leadT: 'triangle' },
  battle: { bpm: 128, root: 52, prog: [0, 0, 3, 5], lead: [0, 3, 7, 10, 7, 3, 5, 7], bass: 'sawtooth', leadT: 'square' },
  boss: { bpm: 140, root: 45, prog: [0, 1, 0, 6], lead: [0, 1, 7, 6, 0, 3, 1, 0], bass: 'sawtooth', leadT: 'square' },
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export function music(name) {
  if (name === musName) return;
  musName = name; clearInterval(musTimer); step = 0;
  if (!name || !SONGS[name]) return;
  const S = SONGS[name], sixteenth = 60 / S.bpm / 4;
  musTimer = setInterval(() => {
    if (!ctx || ctx.state !== 'running' || vol.music <= 0) { step++; return; }
    const bar = Math.floor(step / 16) % 4, s = step % 16, chord = S.root + S.prog[bar];
    if (s % 4 === 0) tone(mtof(chord - 12), sixteenth * 3.5, S.bass, 0.18, 1, 0, musBus);
    if (s % 2 === 1 && Math.random() < 0.7) tone(mtof(chord + 12 + S.lead[(step >> 1) % 8]), sixteenth * 1.6, S.leadT, 0.05, 1, 0, musBus);
    if (s % 8 === 4) { /* snare-ish */ if (ctx) { const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(180, t); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); o.connect(g); g.connect(musBus); o.start(t); o.stop(t + 0.1); } }
    if (s === 0 || s === 8) tone(mtof(chord + 7), sixteenth * 6, 'sine', 0.04, 1, 0, musBus);
    step++;
  }, sixteenth * 1000);
}
