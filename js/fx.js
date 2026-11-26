// Juice: pooled particles (cotton fluff, sparks, dust, ice, scrap), floating numbers, rings, beams,
// limp ragdolls for fallen rags, screen shake and flashes. All in world coordinates.
import { TAU, rgba, clamp } from './util.js';
import { drawRag, drawFoe, limb } from './art.js';

const MAXP = 1400;
const P = Array.from({ length: MAXP }, () => ({ on: false }));
let pi = 0;
export const FX = {
  texts: [], rings: [], beams: [], bodies: [], shake: 0, flash: 0, flashCol: '#ffffff', mult: 1, nums: true,
  reset() { P.forEach(p => (p.on = false)); this.texts.length = 0; this.rings.length = 0; this.beams.length = 0; this.bodies.length = 0; this.shake = 0; this.flash = 0; },
  p(x, y, vx, vy, life, size, col, o = {}) {
    const p = P[pi]; pi = (pi + 1) % MAXP;
    p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.size = size; p.col = col;
    p.g = o.g ?? 500; p.drag = o.drag ?? 1.5; p.add = !!o.add; p.shape = o.shape || 'c'; p.spin = o.spin || 0; p.a = Math.random() * TAU;
  },
  burst(x, y, n, col, sp = 220, life = 0.6, size = 4, o = {}) {
    n = Math.round(n * this.mult);
    for (let i = 0; i < n; i++) {
      const a = (o.dirA ?? -Math.PI / 2) + (Math.random() - 0.5) * (o.spread ?? TAU), v = sp * (0.35 + Math.random() * 0.75);
      this.p(x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.7), Array.isArray(col) ? col[i % col.length] : col, o);
    }
  },
  fluff(x, y, n, col = '#f6f2ea') { this.burst(x, y, n, [col, '#ffffff', '#e6dfd2'], 160, 1.1, 6, { g: -40, drag: 2.5, shape: 'fluff' }); },
  text(x, y, s, col = '#fff', o = {}) { if (this.texts.length > 90) this.texts.shift(); this.texts.push({ x, y, s, col, t: 0, life: o.life || 0.9, size: o.size || 16, vy: o.vy ?? -60, pop: o.pop || 0 }); },
  ring(x, y, r0, r1, col, life = 0.45, w = 4) { this.rings.push({ x, y, r0, r1, col, t: 0, life, w }); },
  beam(x0, x1, y, col, life = 0.5, w = 30) { this.beams.push({ x0, x1, y, col, t: 0, life, w }); },
  kick(s) { this.shake = Math.max(this.shake, s); },
  flashScreen(a, col = '#ffffff') { this.flash = Math.max(this.flash, a); this.flashCol = col; },

  // a limp ragdoll: six verlet points flung back and up, then it fades
  body(u, mult = 1) {
    if (this.bodies.length > 40) this.bodies.shift();
    const d = u.dir, s = (u.s.look && u.s.look.size) || u.s.size || 1, x = u.x, y = u.y;
    const kx = -d * (220 + Math.random() * 160) * mult, ky = -(380 + Math.random() * 220) * mult;
    const pts = [[0, -72], [0, -55], [0, -28], [10, -40], [-10, -40], [6, 0], [-6, 0]].map(([px, py], i) => {
      const jx = (Math.random() - 0.5) * 120, jy = (Math.random() - 0.5) * 120;
      return { x: x + px * d * s, y: y + py * s, ox: x + px * d * s - (kx + jx) / 60, oy: y + py * s - (ky + jy + (i === 0 ? -60 : 0)) / 60 };
    });
    this.bodies.push({ u, pts, t: 0, s, ragdoll: !!u.s.rag || u.s.kind === 'doll' || u.s.kind === 'golem', spin: (Math.random() - 0.5) * 8, rot: 0, x, y, vx: kx * 0.6, vy: ky * 0.7 });
  },

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 30); this.flash = Math.max(0, this.flash - dt * 3);
    for (const p of P) {
      if (!p.on) continue;
      p.life -= dt; if (p.life <= 0) { p.on = false; continue; }
      p.vy += p.g * dt; const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vy *= dr;
      p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.spin * dt;
      if (p.y > 8 && p.g > 0) { p.y = 8; p.vy *= -0.3; p.vx *= 0.7; }
    }
    for (const t of this.texts) { t.t += dt; t.y += t.vy * dt; t.vy *= Math.exp(-3 * dt); }
    this.texts = this.texts.filter(t => t.t < t.life);
    for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < r.life);
    for (const b of this.beams) b.t += dt; this.beams = this.beams.filter(b => b.t < b.life);
    const ST = [[0, 1, 17], [1, 2, 27], [1, 3, 18], [1, 4, 18], [2, 5, 28], [2, 6, 28]];
    for (const b of this.bodies) {
      b.t += dt;
      if (b.ragdoll) {
        for (const p of b.pts) { const vx = (p.x - p.ox) * 0.985, vy = (p.y - p.oy) * 0.985; p.ox = p.x; p.oy = p.y; p.x += vx; p.y += vy + 1400 * dt * dt; if (p.y > 6) { p.y = 6; p.ox = p.x - vx * 0.5; p.oy = p.y + vy * 0.3; } }
        for (let k = 0; k < 3; k++) for (const [a, c, L] of ST) {
          const A = b.pts[a], C = b.pts[c], dx = C.x - A.x, dy = C.y - A.y, d = Math.hypot(dx, dy) || 1, f = (d - L * b.s) / d / 2;
          A.x += dx * f; A.y += dy * f; C.x -= dx * f; C.y -= dy * f;
        }
      } else { b.vy += 1400 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.spin * dt; if (b.y > 0) { b.y = 0; b.vy *= -0.35; b.vx *= 0.6; b.spin *= 0.6; } }
    }
    this.bodies = this.bodies.filter(b => b.t < 1.6);
  },

  // world -> screen: sx = (x - camX) * z, sy = gy + y * z
  draw(g, camX, z, gy, layer) {
    if (layer === 'bodies') {
      for (const b of this.bodies) {
        const a = clamp(1.6 - b.t, 0, 1);
        g.globalAlpha = a;
        if (b.ragdoll) {
          const look = b.u.s.look || {}, col = b.u.s.rag ? '#e6dfd2' : look.col || '#555', acc = b.u.s.rag ? look.acc || '#c8ff2e' : '#20182a';
          g.lineCap = 'round';
          const X = p => (p.x - camX) * z, Y = p => gy + p.y * z, pt = b.pts, w = z * b.s;
          for (const [i, j, ww] of [[2, 6, 9], [1, 4, 8], [1, 2, 17], [2, 5, 10], [1, 3, 8]]) limb(g, X(pt[i]), Y(pt[i]), X(pt[j]), Y(pt[j]), ww * w, i === 1 && j === 2 ? col : (j === 4 || j === 6 ? '#b9b1a4' : col));
          limb(g, X(pt[1]) - 5 * w, Y(pt[1]), X(pt[1]) + 5 * w, Y(pt[1]), 5 * w, acc);
          g.fillStyle = col; g.beginPath(); g.arc(X(pt[0]), Y(pt[0]), 12.5 * w, 0, TAU); g.fill();
          g.strokeStyle = '#2b2633'; g.lineWidth = 1.6 * w; const hx = X(pt[0]) + 3 * w, hy = Y(pt[0]) - 1 * w;
          g.beginPath(); g.moveTo(hx - 3 * w, hy - 2 * w); g.lineTo(hx + 1 * w, hy + 2 * w); g.moveTo(hx + 1 * w, hy - 2 * w); g.lineTo(hx - 3 * w, hy + 2 * w); g.stroke();
        } else {
          drawFoe(g, b.u.s, { t: b.t, move: 0, atk: -1 }, z, b.u.dir, { x: (b.x - camX) * z, y: gy + b.y * z, rot: b.rot, flash: Math.max(0, 0.6 - b.t) });
        }
      }
      g.globalAlpha = 1; return;
    }
    // particles
    for (const p of P) {
      if (!p.on) continue;
      const a = clamp(p.life / p.max * 1.6, 0, 1), x = (p.x - camX) * z, y = gy + p.y * z, s = p.size * z * (p.shape === 'fluff' ? 1 : clamp(p.life / p.max + 0.3, 0, 1));
      if (x < -20 || x > g.canvas.width + 20) continue;
      g.globalAlpha = a; g.globalCompositeOperation = p.add ? 'lighter' : 'source-over'; g.fillStyle = p.col;
      if (p.shape === 'sq') { g.save(); g.translate(x, y); g.rotate(p.a); g.fillRect(-s / 2, -s / 2, s, s); g.restore(); }
      else if (p.shape === 'fluff') { g.beginPath(); g.arc(x, y, s, 0, TAU); g.arc(x + s * 0.7, y - s * 0.3, s * 0.7, 0, TAU); g.arc(x - s * 0.6, y - s * 0.2, s * 0.6, 0, TAU); g.fill(); }
      else if (p.shape === 'line') { g.strokeStyle = p.col; g.lineWidth = Math.max(1, s * 0.5); g.beginPath(); g.moveTo(x, y); g.lineTo(x - p.vx * 0.03 * z, y - p.vy * 0.03 * z); g.stroke(); }
      else { g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    for (const b of this.beams) {
      const k = b.t / b.life, a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      const x0 = (b.x0 - camX) * z, x1 = (b.x1 - camX) * z, y = gy + b.y * z, w = b.w * z * (1 - k * 0.5);
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = rgba(b.col, a * 0.35); g.fillRect(x0, y - w, x1 - x0, w * 2);
      g.fillStyle = rgba(b.col, a * 0.9); g.fillRect(x0, y - w * 0.3, x1 - x0, w * 0.6);
      g.fillStyle = rgba('#ffffff', a); g.fillRect(x0, y - w * 0.1, x1 - x0, w * 0.2);
      g.globalCompositeOperation = 'source-over';
    }
    for (const r of this.rings) {
      const k = r.t / r.life, rr = (r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - k, 3))) * z;
      g.strokeStyle = rgba(r.col, 1 - k); g.lineWidth = r.w * z * (1 - k * 0.6);
      g.beginPath(); g.ellipse((r.x - camX) * z, gy + r.y * z, rr, rr * 0.45, 0, 0, TAU); g.stroke();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const t of this.texts) {
      const k = t.t / t.life, a = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1, pop = t.pop ? 1 + Math.max(0, 0.4 - t.t * 2) : 1;
      g.globalAlpha = a; g.font = `900 ${Math.round(t.size * pop * Math.min(1.3, z + 0.25))}px Rubik, system-ui, sans-serif`;
      const x = (t.x - camX) * z, y = gy + t.y * z;
      g.lineWidth = 4; g.strokeStyle = 'rgba(12,14,21,0.85)'; g.strokeText(t.s, x, y); g.fillStyle = t.col; g.fillText(t.s, x, y);
    }
    g.globalAlpha = 1;
  },
};
export { drawRag };
