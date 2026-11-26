// All art is drawn in code. Rags fuse two looks: Element Rag's flat chunky mannequin (thick round limbs,
// no outlines, accent cuffs and a headband with trailing tails) and On Two Feet's cloth doll (sphere head,
// two glowing oval eyes, visible stitches, scarf). Foes, the Frayed, are darker toys and hollow dolls.
import { TAU, mixHex, rgba, clamp, RNG, lerp } from './util.js';

/* ---------------------------------------------------------- primitives */
export function limb(g, x1, y1, x2, y2, w, col) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function disc(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function ell(g, x, y, rx, ry, col, rot = 0) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); }
export function glow(g, x, y, r, col, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, 0.9 * a)); gr.addColorStop(0.4, rgba(col, 0.35 * a)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
function stitchLine(g, x1, y1, x2, y2, col, n = 4, w = 1.6) {
  g.strokeStyle = col; g.lineWidth = w; g.beginPath();
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * 3, ny = dx / L * 3;
  for (let i = 0; i <= n; i++) { const t = i / n, x = x1 + dx * t, y = y1 + dy * t; g.moveTo(x - nx, y - ny); g.lineTo(x + nx, y + ny); }
  g.stroke();
}
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/* --------------------------------------------------------------- rags */
// P = { t, move (0..1 walking), atk (-1 idle, 0..1 swing progress), kb (0..1 tumble), hurt }
export function ragPose(look, P) {
  const tall = look.tall || 1, t = P.t, mv = P.move;
  const ph = t * (P.cadence || 9);
  const bob = mv ? Math.abs(Math.sin(ph)) * -2.4 : Math.sin(t * 2.2) * 0.8;
  let lean = mv ? 3 : 0, armF = mv ? Math.sin(ph) * 0.7 : 0.25 + Math.sin(t * 2) * 0.06, armB = mv ? -Math.sin(ph) * 0.7 : -0.15;
  let elbF = 0.5, elbB = 0.4;
  const a = P.atk;
  if (a >= 0) {
    if (a < 0.55) { const k = a / 0.55; armF = lerp(0.3, -2.5, k); elbF = lerp(0.5, 1.4, k); lean = lerp(0, -4, k); armB = lerp(-0.2, 0.6, k); }
    else if (a < 0.75) { const k = (a - 0.55) / 0.2; armF = lerp(-2.5, 1.45, k); elbF = lerp(1.4, 0.1, k); lean = lerp(-4, 8, k); armB = lerp(0.6, -0.9, k); }
    else { const k = (a - 0.75) / 0.25; armF = lerp(1.45, 0.3, k); elbF = lerp(0.1, 0.5, k); lean = lerp(8, 0, k); armB = lerp(-0.9, -0.2, k); }
  }
  const hip = [0, -27 * tall + bob], neck = [lean, -55 * tall + bob], head = [lean * 1.25, -55 * tall - 15 + bob];
  const legs = [1, -1].map(s => {
    const p = ph + (s < 0 ? Math.PI : 0);
    const fx = mv ? Math.sin(p) * 10 : s * 5, fy = mv ? -Math.max(0, Math.cos(p)) * 6 : 0;
    const kx = (hip[0] + fx) / 2 + 4, ky = (hip[1] + fy) / 2 - 1;
    return { k: [kx, ky], f: [fx, fy] };
  });
  const sh = [neck[0], neck[1] + 4];
  const arm = (ang, elb) => {
    const L = 12.5 * tall;
    const [ex, ey] = rot(0, L, -ang), [hx, hy] = rot(0, L, -ang - elb);
    return { e: [sh[0] + ex, sh[1] + ey], h: [sh[0] + ex + hx, sh[1] + ey + hy], ang: -ang - elb };
  };
  return { hip, neck, head, legs, sh, aF: arm(armF, elbF), aB: arm(armB, elbB), lean };
}

export function drawRag(g, look, P, sc = 1, facing = 1, o = {}) {
  const form = o.form || 0, fl = o.flash || 0;
  const tint = c => { if (o.frozen) c = mixHex(c, '#bfefff', 0.55); if (o.cursed) c = mixHex(c, '#5d3a78', 0.35); if (fl > 0) c = mixHex(c, '#ffffff', fl * 0.8); if (o.gold) c = mixHex(c, '#ffc933', 0.5); return c; };
  const acc = tint(look.acc || '#c8ff2e');
  const bodyBase = look.metal ? '#c9d2de' : look.gold ? '#f2d27a' : mixHex(look.body, look.acc || '#888888', 0.1);
  const body = tint(bodyBase), shade = tint(mixHex(bodyBase, '#4a4038', 0.32)), stitch = tint(mixHex(bodyBase, '#5a4a3a', 0.55));
  const bulk = look.bulk || 1, size = (look.size || 1) * (form === 2 ? 1.06 : 1);
  const p = ragPose(look, P);
  g.save();
  g.translate(o.x || 0, o.y || 0);
  if (o.rot) g.rotate(o.rot * facing);
  g.scale(sc * size * facing, sc * size);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // cape (third form) and wings / tail behind everything
  if (form === 2 || look.cape) {
    const sw = Math.sin(P.t * 4) * 3;
    g.fillStyle = mixHex(acc, '#000000', 0.25);
    g.beginPath(); g.moveTo(p.neck[0] - 4, p.neck[1] + 2); g.quadraticCurveTo(-16 + sw, p.hip[1], -18 + sw * 1.6, p.hip[1] + 18); g.lineTo(-4, p.hip[1] + 12); g.closePath(); g.fill();
  }
  if (look.wings) { const f = Math.sin(P.t * 7) * 0.25; g.fillStyle = rgba('#ffffff', 0.85); for (const s of [1, 0.7]) { g.save(); g.translate(p.neck[0] - 4, p.neck[1] + 6); g.rotate(-0.6 - f * s); g.beginPath(); g.ellipse(-14 * s, -6, 18 * s, 7, -0.4, 0, TAU); g.fill(); g.restore(); } }
  if (look.tail) { g.strokeStyle = shade; g.lineWidth = 7; g.beginPath(); g.moveTo(p.hip[0] - 4, p.hip[1]); g.quadraticCurveTo(-22, p.hip[1] + 6 + Math.sin(P.t * 3) * 4, -30, p.hip[1] - 6); g.stroke(); }
  const W = (w) => w * bulk;
  // back limbs in the shade tone
  const L0 = p.legs[1], L1 = p.legs[0];
  limb(g, p.hip[0], p.hip[1], L0.k[0], L0.k[1], W(9.5), shade); limb(g, L0.k[0], L0.k[1], L0.f[0], L0.f[1], W(8.5), shade);
  limb(g, p.sh[0], p.sh[1], p.aB.e[0], p.aB.e[1], W(8), shade); limb(g, p.aB.e[0], p.aB.e[1], p.aB.h[0], p.aB.h[1], W(7), shade);
  disc(g, p.aB.h[0], p.aB.h[1], W(4.2), shade);
  // torso: a thick capsule, round bodies get a pillow
  if (look.body === 'round') { ell(g, (p.neck[0] + p.hip[0]) / 2, (p.neck[1] + p.hip[1]) / 2 + 2, 16 * bulk, 19, body); }
  else limb(g, p.neck[0], p.neck[1] + 2, p.hip[0], p.hip[1] - 2, W(17), body);
  // stitches down the chest and a cross stitch (the cloth-doll seam)
  stitchLine(g, p.neck[0] + 3, p.neck[1] + 6, p.hip[0] + 3, p.hip[1] - 4, stitch, 4);
  if (form >= 1) { g.strokeStyle = acc; g.lineWidth = 2; g.beginPath(); g.moveTo(p.neck[0] - 4, p.neck[1] + 9); g.lineTo(p.neck[0] + 2, p.neck[1] + 15); g.moveTo(p.neck[0] + 2, p.neck[1] + 9); g.lineTo(p.neck[0] - 4, p.neck[1] + 15); g.stroke(); }
  // belt
  limb(g, p.hip[0] - 7 * bulk, p.hip[1] - 3, p.hip[0] + 7 * bulk, p.hip[1] - 3, 4, tint('#5e4230'));
  // front leg
  limb(g, p.hip[0], p.hip[1], L1.k[0], L1.k[1], W(10), body); limb(g, L1.k[0], L1.k[1], L1.f[0], L1.f[1], W(9), body);
  disc(g, L1.f[0] + 1.5, L1.f[1], W(4.4), tint('#6b4a32')); disc(g, L0.f[0] + 1.5, L0.f[1], W(4), tint('#4f3624'));
  // scarf from the second form on
  if (form >= 1 || look.scarf) {
    const wv = Math.sin(P.t * 6) * 3;
    limb(g, p.neck[0] - 6, p.neck[1] + 1, p.neck[0] + 6, p.neck[1] + 1, 6, acc);
    g.strokeStyle = acc; g.lineWidth = 4; g.beginPath(); g.moveTo(p.neck[0] - 4, p.neck[1] + 2); g.quadraticCurveTo(-14, p.neck[1] + 4 + wv, -22, p.neck[1] + 10 + wv); g.stroke();
  }
  // head: a cloth sphere with a soft highlight
  const hx = p.head[0], hy = p.head[1], hr = 12.5 * (look.headScale || 1);
  disc(g, hx, hy, hr, body);
  g.fillStyle = rgba('#ffffff', 0.18); g.beginPath(); g.arc(hx - 3, hy - 4, hr * 0.6, 0, TAU); g.fill();
  g.fillStyle = rgba('#000000', 0.12); g.beginPath(); g.arc(hx, hy, hr, 0.2, Math.PI - 0.2); g.arc(hx, hy + 1, hr * 0.8, Math.PI - 0.2, 0.2, true); g.fill();
  // head seam
  g.strokeStyle = stitch; g.lineWidth = 1.4; g.beginPath(); g.arc(hx - 1, hy, hr * 0.85, -1.9, -1.2); g.stroke();
  // eyes: two glowing ovals
  const eye = o.frozen ? '#e9fbff' : look.eye || '#9ff3ff';
  const ex = hx + 4, ey = hy - 1;
  if (o.down) { limb(g, ex - 3, ey - 2, ex + 1, ey + 2, 1.6, '#2b2633'); limb(g, ex + 4, ey - 2, ex + 8, ey + 2, 1.6, '#2b2633'); }
  else {
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, ex + 2, ey, 9, eye, form === 2 ? 0.8 : 0.45); g.restore();
    ell(g, ex, ey, 2.1, 3.1, '#1b1a22'); ell(g, ex + 5, ey, 2.1, 3.1, '#1b1a22');
    ell(g, ex, ey - 0.4, 1.4, 2.3, eye); ell(g, ex + 5, ey - 0.4, 1.4, 2.3, eye);
  }
  drawHat(g, look.hat, hx, hy, hr, acc, shade, P.t, form);
  // front arm, weapon, cuffs
  limb(g, p.sh[0], p.sh[1], p.aF.e[0], p.aF.e[1], W(8.5), body);
  limb(g, p.aF.e[0], p.aF.e[1], p.aF.h[0], p.aF.h[1], W(7.5), body);
  const cuff = (e, h) => limb(g, lerp(e[0], h[0], 0.55), lerp(e[1], h[1], 0.55), lerp(e[0], h[0], 0.85), lerp(e[1], h[1], 0.85), W(8.6), acc);
  cuff(p.aB.e, p.aB.h); cuff(p.aF.e, p.aF.h);
  drawWeapon(g, look.weapon, p.aF.h[0], p.aF.h[1], p.aF.ang, acc, P, look);
  disc(g, p.aF.h[0], p.aF.h[1], W(4.6), body);
  if (look.fire || look.glitch) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, p.aF.h[0], p.aF.h[1], 14, look.glitch ? '#5fd8ff' : '#ff8a3d', 0.6 + Math.sin(P.t * 9) * 0.2); g.restore(); }
  g.restore();
}

function drawHat(g, hat, x, y, r, acc, shade, t, form) {
  switch (hat) {
    case 'band': {
      g.fillStyle = acc; g.fillRect(x - r, y - r * 0.55, r * 2, 4.5);
      const wv = Math.sin(t * 6) * 2.5;
      g.strokeStyle = acc; g.lineWidth = 3.2; g.beginPath(); g.moveTo(x - r, y - r * 0.4);
      g.quadraticCurveTo(x - r - 9, y - r * 0.5 + wv, x - r - 17, y - r * 0.1 + wv); g.moveTo(x - r, y - r * 0.35);
      g.quadraticCurveTo(x - r - 7, y + wv * 0.6, x - r - 13, y + r * 0.35 + wv); g.stroke(); break;
    }
    case 'beanie': g.fillStyle = acc; g.beginPath(); g.arc(x, y - 2, r + 1, Math.PI, 0); g.fill(); g.fillRect(x - r - 1, y - 4, r * 2 + 2, 4); disc(g, x, y - r - 3, 3.5, mixHex(acc, '#ffffff', 0.4)); break;
    case 'bucket': g.fillStyle = mixHex(acc, '#555555', 0.3); g.fillRect(x - r + 1, y - r - 6, r * 2 - 2, 10); g.fillRect(x - r - 3, y - r + 3, r * 2 + 6, 3); break;
    case 'ears': g.fillStyle = acc; g.beginPath(); g.ellipse(x - 4, y - r - 9, 3.5, 10, -0.2, 0, TAU); g.ellipse(x + 4, y - r - 8, 3.5, 10, 0.25, 0, TAU); g.fill(); break;
    case 'antenna': limb(g, x, y - r, x + 3, y - r - 10, 2, shade); disc(g, x + 3, y - r - 12, 3.4, acc); break;
    case 'wig': g.fillStyle = acc; for (let i = 0; i < 6; i++) disc(g, x - r + i * r * 0.4, y - r + Math.sin(i) * 2 - 2, r * 0.5, acc); disc(g, x, y - r - 5, r * 0.75, acc); break;
    case 'visor': g.fillStyle = acc; g.fillRect(x - r * 0.2, y - 5, r * 1.3, 5); g.fillRect(x - r, y - r * 0.6, r * 2, 3); break;
    case 'helm': g.fillStyle = mixHex(acc, '#8c96a6', 0.35); g.beginPath(); g.arc(x, y - 1, r + 2, Math.PI, 0); g.fill(); g.fillRect(x - r - 2, y - 2, 6, r * 0.9); g.fillStyle = acc; g.fillRect(x - r - 2, y - 3, r * 2 + 4, 3); break;
    case 'pins': for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.5; limb(g, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8), 1.5, '#d7dbe4'); disc(g, x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8), 2.2, acc); } break;
    case 'bow': g.fillStyle = acc; g.beginPath(); g.moveTo(x - 2, y - r); g.lineTo(x - 11, y - r - 7); g.lineTo(x - 11, y - r + 5); g.closePath(); g.moveTo(x - 2, y - r); g.lineTo(x + 7, y - r - 7); g.lineTo(x + 7, y - r + 5); g.closePath(); g.fill(); disc(g, x - 2, y - r, 2.6, mixHex(acc, '#000000', 0.2)); break;
    case 'straw': g.fillStyle = '#e8c96a'; g.beginPath(); g.ellipse(x, y - r * 0.5, r * 1.7, 3.5, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x, y - r * 0.5, r * 0.85, Math.PI, 0); g.fill(); g.fillStyle = acc; g.fillRect(x - r * 0.85, y - r * 0.65, r * 1.7, 2.5); break;
    case 'cowl': g.fillStyle = mixHex(acc, '#000000', 0.35); g.beginPath(); g.arc(x - 1, y, r + 3, Math.PI * 0.85, Math.PI * 0.15 + TAU / 2 * 0 + 0.3, false); g.lineTo(x - r - 5, y + r * 0.6); g.closePath(); g.fill(); break;
    case 'hood': g.fillStyle = mixHex(acc, '#3a2a1a', 0.45); g.beginPath(); g.arc(x - 2, y, r + 3.5, Math.PI * 0.75, Math.PI * 2.1); g.lineTo(x - r - 6, y + r); g.closePath(); g.fill(); break;
    case 'horns': g.fillStyle = mixHex(acc, '#f6f0e0', 0.5); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * 5, y - r + 2); g.quadraticCurveTo(x + s * 14, y - r - 2, x + s * 10, y - r - 13); g.quadraticCurveTo(x + s * 9, y - r - 3, x + s * 1, y - r + 5); g.fill(); } break;
    case 'wizard': g.fillStyle = acc; g.beginPath(); g.moveTo(x - r - 4, y - r * 0.4); g.lineTo(x + r + 4, y - r * 0.4); g.lineTo(x - 6 + Math.sin(t * 2) * 2, y - r - 24); g.closePath(); g.fill(); disc(g, x - 6, y - r - 24, 2.8, '#ffe14a'); break;
    case 'wrap': g.strokeStyle = '#f2efe8'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - r, y - 6 + i * 6); g.lineTo(x + r, y - 8 + i * 6); g.stroke(); } break;
    case 'mask': g.fillStyle = mixHex(acc, '#000000', 0.45); g.fillRect(x - r * 0.3, y - 5, r * 1.35, 6); break;
    case 'leaf': g.fillStyle = acc; g.beginPath(); g.ellipse(x + 2, y - r - 4, 4, 9, 0.6, 0, TAU); g.fill(); break;
    case 'halo': g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffe9a3'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y - r - 6 + Math.sin(t * 3), r * 0.85, 3, 0, 0, TAU); g.stroke(); g.restore(); break;
    case 'tophat': g.fillStyle = '#2b2633'; g.fillRect(x - r * 0.7, y - r - 14, r * 1.4, 14); g.fillRect(x - r - 2, y - r - 1, r * 2 + 4, 3); g.fillStyle = acc; g.fillRect(x - r * 0.7, y - r - 5, r * 1.4, 3); break;
    case 'crown': g.fillStyle = '#ffc933'; g.beginPath(); g.moveTo(x - r * 0.8, y - r + 2); g.lineTo(x - r * 0.8, y - r - 8); g.lineTo(x - r * 0.3, y - r - 3); g.lineTo(x, y - r - 10); g.lineTo(x + r * 0.3, y - r - 3); g.lineTo(x + r * 0.8, y - r - 8); g.lineTo(x + r * 0.8, y - r + 2); g.closePath(); g.fill(); disc(g, x, y - r - 3, 1.8, acc); break;
    default: break;
  }
  if (form === 2 && hat !== 'crown' && hat !== 'halo') { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(acc, 0.9); g.beginPath(); g.arc(x - r * 0.9, y - r * 0.9, 1.8, 0, TAU); g.arc(x + r * 0.9, y - r * 0.9, 1.4, 0, TAU); g.fill(); g.restore(); }
}

function drawWeapon(g, w, x, y, ang, acc, P, look) {
  g.save(); g.translate(x, y); g.rotate(ang + Math.PI / 2);
  switch (w) {
    case 'mallet': limb(g, 0, 0, 18, 0, 3.5, '#8b6b4f'); g.fillStyle = mixHex(acc, '#666666', 0.2); g.beginPath(); g.roundRect(15, -8, 12, 16, 3); g.fill(); break;
    case 'glove': disc(g, 3, 0, 7.5, '#e2434b'); disc(g, 5, -2, 2.5, '#ff8a94'); break;
    case 'needle': limb(g, -6, 0, 34, 0, 2.8, '#d7dbe4'); disc(g, -6, 0, 2.2, acc); g.strokeStyle = acc; g.lineWidth = 1; g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(-14, 6, -18, -2); g.stroke(); break;
    case 'blade': limb(g, 0, 0, 6, 0, 3.5, '#5e4230'); limb(g, 6, 0, 28, 0, 4, '#e9ecf4'); limb(g, 5, -5, 5, 5, 2.5, acc); break;
    case 'shield': g.fillStyle = mixHex(acc, '#7a8290', 0.3); g.beginPath(); g.arc(4, 0, 11, 0, TAU); g.fill(); disc(g, 4, 0, 4, acc); for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) disc(g, 4 + a * 6, b * 6, 1.4, '#2b2633'); break;
    case 'staff': limb(g, -10, 0, 26, 0, 3, '#8b6b4f'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 27, 0, 9, acc, 0.9); g.restore(); disc(g, 27, 0, 3, acc); break;
    case 'bow': g.strokeStyle = '#8b6b4f'; g.lineWidth = 3; g.beginPath(); g.arc(2, 0, 14, -1.3, 1.3); g.stroke(); limb(g, 2 + Math.cos(-1.3) * 14, Math.sin(-1.3) * 14, 2 + Math.cos(1.3) * 14, Math.sin(1.3) * 14, 1, '#f6f0e0'); break;
    case 'cannon': g.fillStyle = '#4a4f5c'; g.beginPath(); g.roundRect(-4, -6, 26, 12, 4); g.fill(); g.fillStyle = acc; g.fillRect(17, -7, 5, 14); break;
    case 'scissors': limb(g, 0, -2, 22, -5, 2.6, '#e9ecf4'); limb(g, 0, 2, 22, 5, 2.6, '#e9ecf4'); g.strokeStyle = acc; g.lineWidth = 2; g.beginPath(); g.arc(-3, -3, 3, 0, TAU); g.arc(-3, 3, 3, 0, TAU); g.stroke(); break;
    case 'ribbon': g.strokeStyle = acc; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); for (let i = 1; i < 8; i++) g.lineTo(i * 5, Math.sin(P.t * 10 + i) * 6); g.stroke(); break;
    case 'lantern': limb(g, 0, 0, 10, 0, 1.6, '#5e4230'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 16, 0, 14, '#ffb13d', 0.9); g.restore(); g.fillStyle = '#ffd88a'; g.beginPath(); g.roundRect(11, -5, 10, 10, 3); g.fill(); break;
    case 'spool': disc(g, 8, 0, 7, acc); g.fillStyle = '#8b6b4f'; g.fillRect(2, -8, 12, 3); g.fillRect(2, 5, 12, 3); break;
    case 'sail': g.fillStyle = acc; g.beginPath(); g.moveTo(0, 0); g.lineTo(20, -14); g.lineTo(26, 6); g.closePath(); g.fill(); limb(g, 0, 0, 26, 6, 1.4, '#f6f0e0'); break;
    case 'pinwheel': limb(g, 0, 0, 16, 0, 2, '#8b6b4f'); g.save(); g.translate(18, 0); g.rotate(P.t * 8); g.fillStyle = acc; for (let i = 0; i < 4; i++) { g.rotate(TAU / 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(9, -3); g.lineTo(9, 4); g.fill(); } g.restore(); break;
    default: break;
  }
  g.restore();
}

/* ---------------------------------------------------------------- foes */
// foe figures face left by default when facing = -1 (they walk toward your keep)
export function drawFoe(g, def, P, sc = 1, facing = -1, o = {}) {
  const look = def.look, k = def.kind, fl = o.flash || 0;
  const tr = def.traits || [];
  const tint = c => { if (o.frozen) c = mixHex(c, '#bfefff', 0.55); if (fl > 0) c = mixHex(c, '#ffffff', fl * 0.8); return c; };
  const col = tint(look.col), dark = tint(mixHex(look.col, '#0c0e15', 0.45)), lite = tint(mixHex(look.col, '#ffffff', 0.3));
  const eye = o.frozen ? '#e9fbff' : look.eye;
  const t = P.t, mv = P.move, a = P.atk;
  const strike = a >= 0 ? (a < 0.55 ? -a / 0.55 : a < 0.75 ? (a - 0.55) / 0.2 : 1 - (a - 0.75) / 0.25) : 0;
  const size = (def.size || 1);
  g.save(); g.translate(o.x || 0, o.y || 0);
  if (o.rot) g.rotate(o.rot * facing);
  // foes are drawn facing right in local space; flip for facing
  g.scale(sc * size * facing, sc * size);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const steel = tr.includes('steel'), gilded = tr.includes('gilded'), star = tr.includes('starborn'), rev = tr.includes('revenant'), anc = tr.includes('ancient'), vd = tr.includes('void');
  const eyes = (x, y, r = 2.4, n = 2) => {
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x + 2, y, 8, eye, 0.5); g.restore();
    for (let i = 0; i < n; i++) { ell(g, x + i * 5, y, r * 0.9, r * 1.3, '#120f18'); ell(g, x + i * 5, y - 0.3, r * 0.6, r, eye); }
  };
  const ph = t * (P.cadence || 8);
  if (k === 'blob') {
    const bob = mv ? Math.abs(Math.sin(ph)) * -5 : Math.sin(t * 2) * 1;
    const sq = 1 + (mv ? Math.sin(ph * 2) * 0.06 : 0) + strike * 0.12;
    const yy = (look.balloon ? -38 + Math.sin(t * 2) * 4 : 0) + bob;
    if (look.balloon) { limb(g, 0, yy - 14, 2, yy - 46, 1, '#f6f0e0'); ell(g, 2, yy - 54, 11, 13, tint('#ff5ea8')); }
    disc(g, -4, -2 + (look.balloon ? -38 : 0), 3, dark); disc(g, 5, -2 + (look.balloon ? -38 : 0), 3, dark);
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i < 9; i++) { const an = i / 9 * TAU, rr = 15 * (1 + 0.12 * Math.sin(i * 2.3 + t * 3)); g.arc(Math.cos(an) * 6 * sq + strike * 4, yy - 14 + Math.sin(an) * 6 / sq, rr * 0.62, 0, TAU); }
    g.fill();
    g.fillStyle = rgba('#ffffff', 0.16); g.beginPath(); g.arc(-4, yy - 19, 6, 0, TAU); g.fill();
    eyes(3 + strike * 4, yy - 15);
  } else if (k === 'hound' || k === 'beetle' || k === 'crab') {
    const legsN = k === 'hound' ? 4 : 6, h = k === 'hound' ? 18 : 10;
    const by = -h - 8 + (mv ? Math.abs(Math.sin(ph)) * -2 : 0);
    for (let i = 0; i < legsN; i++) {
      const lx = -14 + i * (28 / (legsN - 1)), p2 = ph + i * (k === 'hound' ? Math.PI / 2 : 1.1);
      const fx = lx + (mv ? Math.sin(p2) * 5 : 0), fy = mv ? -Math.max(0, Math.cos(p2)) * 4 : 0;
      limb(g, lx, by + 4, fx, fy, k === 'hound' ? 5.5 : 3, i % 2 ? dark : col);
    }
    if (k === 'hound') {
      limb(g, -18, by, -26, by - 10 + Math.sin(t * 8) * 3, 4.5, col); // tail
      limb(g, -14, by, 12, by, 17, col);
      for (let i = 0; i < 3; i++) limb(g, -8 + i * 7, by - 7, -8 + i * 7, by + 7, 2, dark); // sock stripes
      const hx = 20 + strike * 8, hy = by - 8 - strike * 2;
      disc(g, hx, hy, 9.5, col); ell(g, hx + 8, hy + 3, 6, 4, lite);
      ell(g, hx - 4, hy - 8, 3, 6, dark, -0.3);
      if (look.horns) { g.strokeStyle = '#f0e4c8'; g.lineWidth = 3.5; g.beginPath(); g.arc(hx - 2, hy - 6, 7, Math.PI, Math.PI * 1.9); g.stroke(); }
      if (look.spines) for (let i = 0; i < 6; i++) limb(g, -12 + i * 4, by - 7, -16 + i * 4, by - 17, 2, '#d7dbe4');
      eyes(hx + 1, hy - 2, 2.1);
    } else if (k === 'beetle') {
      g.fillStyle = col; g.beginPath(); g.ellipse(0, by, 19, 15, 0, Math.PI, 0); g.fill(); g.fillRect(-19, by - 1, 38, 4);
      for (const [x, y] of [[-5, -5], [5, -5], [-5, 3], [5, 3]]) disc(g, x, by - 6 + y * 0.8, 2.3, dark); // button holes
      disc(g, 19 + strike * 6, by - 2, 7, dark); eyes(19 + strike * 6, by - 4, 1.8);
    } else {
      g.fillStyle = col; g.beginPath(); g.roundRect(-16, by - 18, 32, 22, 9); g.fill();
      for (let i = 0; i < 6; i++) disc(g, -10 + (i % 3) * 10, by - 12 + Math.floor(i / 3) * 8, 1.8, dark); // thimble dimples
      const cl = strike * 10;
      for (const s of [1, -0.6]) { limb(g, 12 * s, by - 6, 22 * s + cl * (s > 0 ? 1 : 0), by - 14, 4, dark); disc(g, 24 * s + cl * (s > 0 ? 1 : 0), by - 16, 6.5, col); limb(g, 24 * s + cl * (s > 0 ? 1 : 0), by - 16, 30 * s + cl * (s > 0 ? 1 : 0), by - 20 - strike * 4, 3, dark); }
      eyes(2, by - 22, 2);
    }
  } else if (k === 'bird') {
    const fy = -46 + Math.sin(t * 3) * 5, fl2 = Math.sin(t * 14) * 0.9;
    g.fillStyle = rgba('#000000', 0.12); g.beginPath(); g.ellipse(0, -1, 14, 3, 0, 0, TAU); g.fill();
    g.fillStyle = dark; g.save(); g.translate(-2, fy - 4); g.rotate(-0.5 - fl2 * 0.5); g.beginPath(); g.ellipse(-12, 0, 18, 7, 0, 0, TAU); g.fill(); g.restore();
    ell(g, 0, fy, 15, 10, col);
    for (let i = 0; i < 3; i++) limb(g, -8 + i * 6, fy - 6, -8 + i * 6, fy + 6, 1.6, dark);
    g.fillStyle = lite; g.save(); g.translate(0, fy - 5); g.rotate(-0.3 + fl2 * 0.6); g.beginPath(); g.ellipse(-10, 0, 17, 6, 0, 0, TAU); g.fill(); g.restore();
    const hx = 15 + strike * 7; disc(g, hx, fy - 5, 7.5, col);
    g.fillStyle = look.beak ? '#d7dbe4' : '#ffb13d'; g.beginPath(); g.moveTo(hx + 5, fy - 7); g.lineTo(hx + 15 + strike * 4, fy - 4); g.lineTo(hx + 5, fy - 2); g.fill();
    eyes(hx, fy - 7, 1.8);
  } else if (k === 'worm') {
    for (let i = 7; i >= 0; i--) { const x = -28 + i * 7 + strike * 8 * (i / 7), y = -9 - Math.abs(Math.sin(ph * 0.7 - i * 0.7)) * 8; disc(g, x, y, 8 - (7 - i) * 0.35, i % 2 ? col : dark); }
    eyes(22 + strike * 8, -14, 2);
  } else {
    // doll / golem: the Hollow rig
    const golem = k === 'golem';
    const bulk = golem ? 1.6 : 1;
    const ph2 = ph * (golem ? 0.6 : 1);
    const hipY = -27 + (mv ? Math.abs(Math.sin(ph2)) * -2 : 0), nY = -56 + (mv ? Math.abs(Math.sin(ph2)) * -2 : 0);
    const lean = strike * 8;
    if (look.cape) { g.fillStyle = dark; g.beginPath(); g.moveTo(lean - 4, nY); g.quadraticCurveTo(-26 + Math.sin(t * 3) * 4, hipY, -30 + Math.sin(t * 3) * 6, 4); g.lineTo(6, 2); g.closePath(); g.fill(); }
    for (const s of [-1, 1]) {
      const p2 = ph2 + (s < 0 ? Math.PI : 0), fx = mv ? Math.sin(p2) * 9 : s * 5, fy = mv ? -Math.max(0, Math.cos(p2)) * 5 : 0;
      limb(g, 0, hipY, fx + 3, (hipY + fy) / 2, 10 * bulk, s < 0 ? dark : col); limb(g, fx + 3, (hipY + fy) / 2, fx, fy, 9 * bulk, s < 0 ? dark : col);
    }
    // robe / body
    g.fillStyle = col; g.beginPath(); g.moveTo(lean - 9 * bulk, nY + 2); g.lineTo(lean + 9 * bulk, nY + 2); g.lineTo(12 * bulk, hipY + 6); g.lineTo(-12 * bulk, hipY + 6); g.closePath(); g.fill();
    stitchLine(g, lean + 1, nY + 6, 1, hipY + 2, dark, 4);
    const armA = a >= 0 ? (a < 0.55 ? lerp(0.3, -2.4, a / 0.55) : a < 0.75 ? lerp(-2.4, 1.4, (a - 0.55) / 0.2) : lerp(1.4, 0.3, (a - 0.75) / 0.25)) : (mv ? Math.sin(ph2) * 0.6 : 0.2);
    const sx = lean, sy = nY + 4, [ex, ey] = rot(0, 13, -armA), [hx2, hy2] = rot(0, 13, -armA - 0.5);
    limb(g, sx, sy, sx - ex * 0.6 - 4, sy + 20, 8 * bulk, dark);
    const hx = lean * 1.2, hy = nY - 14, hr = golem ? 15 : 12.5;
    if (look.spool) { g.fillStyle = '#8b6b4f'; g.fillRect(hx - hr - 3, hy - hr - 2, hr * 2 + 6, 5); g.fillRect(hx - hr - 3, hy + hr - 3, hr * 2 + 6, 5); g.fillStyle = col; g.fillRect(hx - hr + 2, hy - hr + 3, hr * 2 - 4, hr * 2 - 6); for (let i = 0; i < 4; i++) limb(g, hx - hr + 3, hy - hr + 6 + i * 6, hx + hr - 3, hy - hr + 4 + i * 6, 1.4, dark); eyes(hx + 2, hy - 1, 2.6); }
    else if (look.mask) {
      g.fillStyle = dark; g.beginPath(); g.arc(hx - 1, hy, hr + 4, Math.PI * 0.75, Math.PI * 2.15); g.lineTo(hx - hr - 6, hy + hr + 2); g.closePath(); g.fill(); // hood
      g.fillStyle = tint(look.mask); g.beginPath(); g.ellipse(hx + 3, hy + 1, hr * 0.72, hr * 0.92, 0, 0, TAU); g.fill();
      // single dark eye with a pinpoint of colour
      ell(g, hx + 6, hy - 2, 2.6, 3.6, '#120f18'); g.save(); g.globalCompositeOperation = 'lighter'; glow(g, hx + 6, hy - 2, 7, eye, 0.6); g.restore(); disc(g, hx + 6.3, hy - 2.4, 1, eye);
    } else { disc(g, hx, hy, hr, col); eyes(hx + 2, hy - 1, 2.4); }
    if (look.crown) drawHat(g, 'crown', hx, hy - 2, hr, eye, dark, t, 0);
    limb(g, sx, sy, sx + ex, sy + ey, 8.5 * bulk, col); limb(g, sx + ex, sy + ey, sx + ex + hx2, sy + ey + hy2, 7.5 * bulk, col);
    disc(g, sx + ex + hx2, sy + ey + hy2, 5 * bulk, lite);
  }
  // trait marks
  if (steel) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba('#ffffff', 0.5); g.lineWidth = 3; g.beginPath(); g.moveTo(-8, -30); g.lineTo(4, -12); g.stroke(); g.restore(); }
  if (gilded || look.halo) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffe9a3'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(6, (k === 'bird' ? -66 : k === 'doll' || k === 'golem' ? -90 : -44) + Math.sin(t * 3) * 1.5, 10, 3, 0, 0, TAU); g.stroke(); g.restore(); }
  if (star) { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const an = t * 1.5 + i * 2.1; glow(g, Math.cos(an) * 18, -30 + Math.sin(an) * 12, 5, '#9ff3ff', 0.8); } g.restore(); }
  if (rev) { g.fillStyle = rgba('#8fd16a', 0.7); for (let i = 0; i < 3; i++) { const yy = -20 - i * 9 + ((t * 18 + i * 7) % 12); disc(g, -6 + i * 6, yy, 1.8, '#8fd16a'); } }
  if (anc) { g.strokeStyle = rgba('#2b1d10', 0.55); g.lineWidth = 1.4; g.beginPath(); g.moveTo(-6, -38); g.lineTo(-1, -30); g.lineTo(-5, -22); g.moveTo(5, -34); g.lineTo(9, -26); g.stroke(); }
  if (vd) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -30, 34, '#b46bff', 0.22 + Math.sin(t * 4) * 0.05); g.restore(); }
  g.restore();
}

/* --------------------------------------------------------------- bases */
export function drawKeep(g, x, gy, z, hpF, flash, t, cannonCharge) {
  g.save(); g.translate(x, gy); g.scale(z, z);
  const patch = ['#ece6dc', '#c8ff2e', '#7fb0e2', '#ff9ad0', '#ffc933', '#45e08a'];
  const fl = c => (flash > 0 ? mixHex(c, '#ffffff', flash * 0.6) : c);
  g.fillStyle = rgba('#000000', 0.18); g.beginPath(); g.ellipse(0, 2, 90, 10, 0, 0, TAU); g.fill();
  const tiers = [[-80, -60, 160, 60], [-66, -118, 132, 62], [-52, -170, 104, 56]];
  tiers.forEach(([x0, y0, w, h], i) => {
    g.fillStyle = fl(i === 1 ? '#d8d0c2' : '#ece6dc'); g.beginPath(); g.roundRect(x0, y0, w, h, 18); g.fill();
    for (let j = 0; j < 3; j++) { g.fillStyle = fl(patch[(i * 3 + j + 1) % patch.length]); g.beginPath(); g.roundRect(x0 + 12 + j * (w - 24) / 3, y0 + 10 + (j % 2) * 8, (w - 36) / 3, h - 26, 6); g.fill(); }
    stitchLine(g, x0 + 10, y0 + h - 6, x0 + w - 10, y0 + h - 6, '#8a7f73', 8, 1.4);
  });
  // door
  g.fillStyle = '#5e4230'; g.beginPath(); g.roundRect(-14, -40, 28, 40, [14, 14, 0, 0]); g.fill();
  // spool cannon on top
  g.save(); g.translate(0, -182);
  g.fillStyle = '#8b6b4f'; g.fillRect(-20, -6, 40, 6); g.fillRect(-20, -30, 40, 6);
  g.fillStyle = '#c8ff2e'; g.fillRect(-16, -24, 32, 18);
  for (let i = 0; i < 4; i++) limb(g, -15, -21 + i * 4.5, 15, -19 + i * 4.5, 1.2, '#7fa21a');
  g.fillStyle = '#3a3f4c'; g.beginPath(); g.roundRect(8, -22, 38, 14, 5); g.fill();
  if (cannonCharge >= 1) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 46, -15, 18 + Math.sin(t * 8) * 4, '#c8ff2e', 0.9); g.restore(); }
  g.restore();
  // flag
  limb(g, -40, -170, -40, -230, 3, '#5e4230');
  g.fillStyle = '#c8ff2e'; g.beginPath(); g.moveTo(-40, -230); g.quadraticCurveTo(-14, -224 + Math.sin(t * 4) * 4, 6, -222 + Math.sin(t * 4 + 1) * 6); g.lineTo(-40, -206); g.closePath(); g.fill();
  g.restore();
}
const SPIRE_COL = ['#3a3442', '#4a2a5a', '#2a1a3e'];
export function drawSpire(g, x, gy, z, hpF, flash, t, theme, boss) {
  g.save(); g.translate(x, gy); g.scale(z, z);
  const c = SPIRE_COL[theme] || SPIRE_COL[0], fl = col => (flash > 0 ? mixHex(col, '#ffffff', flash * 0.5) : col);
  g.fillStyle = rgba('#000000', 0.2); g.beginPath(); g.ellipse(0, 2, 90, 10, 0, 0, TAU); g.fill();
  // tangled thread tower
  g.fillStyle = fl(c); g.beginPath(); g.moveTo(-78, 0); g.quadraticCurveTo(-60, -120, -26, -210); g.lineTo(-8, -250); g.lineTo(12, -214); g.quadraticCurveTo(58, -120, 78, 0); g.closePath(); g.fill();
  const r = RNG(7);
  g.strokeStyle = fl(mixHex(c, '#ffffff', 0.18)); g.lineWidth = 3;
  for (let i = 0; i < 10; i++) { const y = -20 - i * 22, w = 70 - i * 6; g.beginPath(); g.moveTo(-w, y + r.range(-6, 6)); g.quadraticCurveTo(0, y - 16 + Math.sin(t + i) * 2, w, y + r.range(-6, 6)); g.stroke(); }
  // loose threads
  g.strokeStyle = fl(mixHex(c, '#ff5ea8', 0.25)); g.lineWidth = 2;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-20 + i * 10, -200 + i * 30); g.quadraticCurveTo(-60 - i * 6, -160 + i * 30 + Math.sin(t * 2 + i) * 8, -70 - i * 4, -120 + i * 30); g.stroke(); }
  // eye
  const pulse = 0.7 + Math.sin(t * 3) * 0.15 + (1 - hpF) * 0.3;
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 0, -150, 38 * pulse, boss ? '#ff4d5a' : '#ff5ea8', 0.8); g.restore();
  ell(g, 0, -150, 16, 10, '#efe7da'); ell(g, 0, -150, 6, 8, '#120f18'); disc(g, 1, -152, 2, boss ? '#ff4d5a' : '#ff5ea8');
  g.restore();
}

/* ---------------------------------------------------------- background */
export const THEMES = [
  { sky: [['#5fb6e8', '#bfe6f6'], ['#6fc0ea', '#e8f3d6'], ['#4f9fd8', '#ffd9a0'], ['#7fc4e8', '#d6f0ff']], ground: '#6fbf4a', grass: '#8fd66a', soil: '#8b6b4f', soil2: '#5e4230', isl: '#9ad07a', far: '#9fd0ea', cloud: '#ffffff' },
  { sky: [['#3a2a6a', '#ff9a6a'], ['#4a2a5a', '#ffb87a'], ['#2a2a5a', '#ff7a8a'], ['#5a3a7a', '#ffd08a']], ground: '#c4724a', grass: '#e0965a', soil: '#6a3a3a', soil2: '#3e2230', isl: '#b0603e', far: '#7a4a7a', cloud: '#ffd0c0' },
  { sky: [['#0c0a1e', '#3a1f5a'], ['#100c24', '#2a1f4a'], ['#0a0a18', '#4a1a4a'], ['#120e2a', '#2a2a5a']], ground: '#4a3a6a', grass: '#7a5aa8', soil: '#2a1f3a', soil2: '#160f22', isl: '#3a2a5a', far: '#2a1f4a', cloud: '#5a4a8a' },
];
const bgCache = new Map();
function skyLayer(W, H, th, sky) {
  const key = `${W}x${H}:${th}:${sky}`;
  if (bgCache.has(key)) return bgCache.get(key);
  if (bgCache.size > 12) bgCache.clear();
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), T = THEMES[th], [top, bot] = T.sky[sky];
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (th === 2 || (th === 1 && sky === 2)) { const r = RNG(5); for (let i = 0; i < 160; i++) { g.fillStyle = rgba('#ffffff', r.range(0.2, 0.9)); g.fillRect(r() * W, r() * H * 0.7, r.range(1, 2.4), r.range(1, 2.4)); } }
  // sun / moon
  g.globalCompositeOperation = 'lighter'; glow(g, W * 0.78, H * 0.22, H * 0.25, th === 2 ? '#b46bff' : th === 1 ? '#ffb87a' : '#fff6d6', 0.6); g.globalCompositeOperation = 'source-over';
  disc(g, W * 0.78, H * 0.22, H * 0.05, th === 2 ? '#e8d0ff' : '#fffbe8');
  bgCache.set(key, c); return c;
}
function island(g, x, y, w, h, top, under, r) {
  g.fillStyle = under; g.beginPath(); g.moveTo(x - w / 2, y);
  for (let i = 0; i <= 6; i++) { const t = i / 6; g.lineTo(x - w / 2 + w * t, y + h * (0.5 + 0.5 * Math.sin(t * Math.PI)) * (0.7 + 0.3 * r())); }
  g.lineTo(x + w / 2, y); g.closePath(); g.fill();
  g.fillStyle = top; g.beginPath(); g.roundRect(x - w / 2 - 4, y - h * 0.12, w + 8, h * 0.2, h * 0.1); g.fill();
}
// draws sky, parallax islands/clouds and the lane island. camX in world units, z = px per unit, gy = ground y on screen
export function drawWorld(g, W, H, th, sky, camX, z, gy, L, t) {
  const T = THEMES[th];
  g.drawImage(skyLayer(W, H, th, sky), 0, 0);
  // far islands (parallax 0.15)
  const r = RNG(th * 31 + sky);
  for (let i = 0; i < 9; i++) {
    const wx = i * 520 + r.range(0, 300), px = (wx - camX * 0.15 * z) % (W + 600);
    const sx = px < -300 ? px + W + 600 : px, sy = gy - H * (0.28 + r() * 0.22), w = r.range(120, 260) * Math.min(1.4, z + 0.3);
    island(g, sx, sy, w, w * 0.45, mixHex(T.isl, T.far, 0.55), mixHex(T.soil, T.far, 0.6), r);
  }
  // clouds (parallax 0.3, drifting)
  g.fillStyle = rgba(T.cloud, th === 2 ? 0.12 : 0.55);
  for (let i = 0; i < 7; i++) {
    const wx = i * 480 + 100 + t * 8, px = ((wx - camX * 0.3 * z) % (W + 500) + W + 500) % (W + 500) - 250, py = H * (0.08 + (i % 3) * 0.09);
    for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(px + j * 34, py + Math.sin(j) * 6, 42, 16, 0, 0, TAU); g.fill(); }
  }
  // the lane: a long floating island
  const x0 = (0 - camX) * z, x1 = (L - camX) * z;
  const top = gy - 6 * z;
  g.fillStyle = T.soil2; g.beginPath(); g.moveTo(x0 - 40 * z, top);
  for (let i = 0; i <= 24; i++) { const k = i / 24, xx = lerp(x0 - 40 * z, x1 + 40 * z, k); g.lineTo(xx, gy + (60 + 70 * Math.sin(k * Math.PI) + 18 * Math.sin(k * 23)) * z); }
  g.lineTo(x1 + 40 * z, top); g.closePath(); g.fill();
  g.fillStyle = T.soil; g.fillRect(x0 - 40 * z, top, x1 - x0 + 80 * z, 40 * z);
  // hanging roots
  g.strokeStyle = mixHex(T.soil2, '#000000', 0.2); g.lineWidth = 2 * z;
  for (let wx = Math.max(0, Math.floor(camX / 90) * 90); wx < Math.min(L, camX + W / z + 90); wx += 90) { const sx = (wx - camX) * z, len = (20 + (wx * 7 % 40)) * z; g.beginPath(); g.moveTo(sx, gy + 30 * z); g.quadraticCurveTo(sx + 8 * z, gy + 30 * z + len * 0.6, sx - 4 * z, gy + 30 * z + len); g.stroke(); }
  g.fillStyle = T.ground; g.fillRect(x0 - 40 * z, top, x1 - x0 + 80 * z, 12 * z);
  g.fillStyle = T.grass;
  for (let wx = Math.max(0, Math.floor(camX / 26) * 26); wx < Math.min(L, camX + W / z + 26); wx += 26) {
    const sx = (wx - camX) * z, hh = (5 + (wx * 13 % 7)) * z;
    g.beginPath(); g.moveTo(sx - 4 * z, top + 2 * z); g.lineTo(sx, top - hh); g.lineTo(sx + 4 * z, top + 2 * z); g.fill();
  }
}

/* ------------------------------------------------------------ portraits */
const portraitCache = new Map();
export function ragPortrait(look, form = 0, size = 96) {
  const key = 'r' + JSON.stringify(look) + form + size;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const sc = size / 96 * 1.05 / Math.max(1, (look.size || 1) * 0.9 * (look.tall || 1));
  drawRag(g, look, { t: 0.4, move: 0, atk: -1 }, sc, 1, { x: size * 0.47, y: size * 0.92, form });
  portraitCache.set(key, c); return c;
}
export function foePortrait(def, size = 96) {
  const key = 'f' + def.id + size;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const yy = def.kind === 'bird' || def.look.balloon ? 0.97 : 0.9;
  const sc = size / 96 * (def.kind === 'bird' || def.look.balloon ? 0.9 : 1.05) / Math.max(1, (def.size || 1) * 0.85);
  drawFoe(g, def, { t: 0.4, move: 0, atk: -1 }, sc, -1, { x: size * 0.5, y: size * yy });
  portraitCache.set(key, c); return c;
}
export function canvasToImg(c) { const i = new Image(); i.src = c.toDataURL(); return i; }
