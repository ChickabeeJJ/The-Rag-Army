// Foes: the Frayed. Unravelled toys, moths and hollow dolls from the edge of the seam.
// Base stats are at 100% strength; stages multiply hp/atk by their magnification.
// kind picks the body drawn in art.js: blob, hound, beetle, crab, bird, worm, golem, doll.
const L = [];
function E(id, name, trait, kind, tier, s, ab = {}, look = {}, desc = '') {
  L.push({ id, name, traits: Array.isArray(trait) ? trait : [trait], kind, tier, ...s, ab, look, desc });
}
// stat block helper: hp, atk, range, speed, freq, kb, drop, extra
const S = (hp, atk, range, speed, freq, kb, drop, x = {}) => ({ hp, atk, range, speed, freq, fs: x.fs ?? Math.min(0.6, freq * 0.3), kb, drop, area: x.area ?? 0, size: x.size ?? 1 });

/* plain */
E('lint', 'Lintling', 'plain', 'blob', 1, S(90, 8, 110, 52, 1.2, 1, 14), {}, { col: '#d9d4cc' }, 'A puff of loose lint with a grudge.');
E('sockhound', 'Sock Hound', 'plain', 'hound', 1, S(160, 14, 115, 88, 1.0, 2, 30), {}, { col: '#c9c2b6' }, 'A lost sock that learned to bark.');
E('beetle', 'Button Beetle', 'plain', 'beetle', 2, S(480, 32, 125, 40, 1.6, 2, 60), {}, { col: '#8a7f73' }, 'Four holes, six legs, no manners.');
E('crab', 'Thimble Crab', 'plain', 'crab', 2, S(1100, 48, 130, 30, 2.0, 3, 120, { area: 1 }), {}, { col: '#a7a39c' }, 'Wears a thimble. Pinches hard.');
E('pinback', 'Pinback', 'plain', 'hound', 3, S(700, 130, 260, 44, 2.6, 2, 140), {}, { col: '#9d958a', spines: 1 }, 'Fires its pins from afar.');
E('serpent', 'Yarn Serpent', 'plain', 'worm', 3, S(1500, 70, 140, 66, 1.4, 3, 160, { area: 1 }), {}, { col: '#c9a27a' }, 'A runaway skein.');
E('hollow', 'Hollow Doll', 'plain', 'doll', 3, S(1800, 120, 150, 46, 1.8, 3, 220, { area: 1 }), {}, { col: '#3a3442', mask: '#efe7da' }, 'An empty doll in a pale mask.');
E('patchbear', 'Patchbear', 'plain', 'golem', 4, S(6000, 280, 160, 34, 2.6, 3, 450, { area: 1, size: 1.4 }), {}, { col: '#8b6b4f' }, 'A mountain of patches.');
E('spoolgolem', 'Spool Golem', 'plain', 'golem', 5, S(10000, 450, 200, 28, 3.4, 4, 1500, { area: 1, size: 1.9 }), { boss: 1 }, { col: '#9a8a70', spool: 1 }, 'A golem wound from a giant spool.');

/* crimson */
E('emberlint', 'Ember Lint', 'crimson', 'blob', 1, S(140, 14, 110, 56, 1.2, 1, 25), {}, { col: '#ff6a5a' }, 'Lint that caught a spark.');
E('rusthound', 'Rust Hound', 'crimson', 'hound', 2, S(420, 40, 120, 92, 1.1, 2, 70), {}, { col: '#d9483e' }, 'Red, fast, rude.');
E('rugram', 'Rug Ram', 'crimson', 'hound', 3, S(2600, 160, 140, 54, 2.0, 3, 300, { size: 1.25 }), { kb: 0.25 }, { col: '#c43a3a', horns: 1 }, 'Rolls foes up like a rug.');
E('brickcrab', 'Brick Crab', 'crimson', 'crab', 4, S(5200, 220, 140, 32, 2.4, 3, 380, { area: 1, size: 1.3 }), {}, { col: '#b8433a' }, 'Built from hot bricks.');
E('matron', 'Crimson Matron', 'crimson', 'doll', 5, S(13750, 600, 220, 36, 3.0, 4, 2000, { area: 1, size: 1.8 }), { boss: 1, wave: [0.25, 1] }, { col: '#a3262f', mask: '#ffd5c8', crown: 1 }, 'Queen of the red rags. Sends ripples.');

/* drifting */
E('moth', 'Lint Moth', 'drifting', 'bird', 1, S(220, 18, 120, 70, 1.3, 2, 40), {}, { col: '#e8d68a' }, 'Eats wool, picks fights.');
E('scissorbeak', 'Scissorbeak', 'drifting', 'bird', 2, S(600, 70, 130, 80, 1.4, 2, 110), {}, { col: '#d9c27a', beak: 1 }, 'Its beak is a pair of shears.');
E('balloonbug', 'Balloon Bug', 'drifting', 'blob', 3, S(2400, 90, 220, 40, 2.4, 3, 260, { area: 1 }), { weaken: [0.3, 3, 0.5] }, { col: '#ffd84a', balloon: 1 }, 'Floats over and frays your rags.');
E('greatmoth', 'Great Moth', 'drifting', 'bird', 5, S(10500, 525, 240, 44, 2.6, 4, 1800, { area: 1, size: 1.9 }), { boss: 1, slow: [0.3, 3] }, { col: '#e8c95a' }, 'Wings like old curtains. Snags rags.');

/* shadow */
E('inkblot', 'Ink Blot', 'shadow', 'blob', 2, S(520, 50, 120, 48, 1.4, 2, 70), {}, { col: '#2d2b3d' }, 'A spill that walks.');
E('soothound', 'Soot Hound', 'shadow', 'hound', 2, S(900, 80, 125, 90, 1.2, 2, 120), {}, { col: '#24222f' }, 'Leaves black paw prints.');
E('nighthollow', 'Night Hollow', 'shadow', 'doll', 4, S(7000, 260, 170, 44, 2.2, 3, 500, { area: 1, size: 1.2 }), { crit: 0.15 }, { col: '#1d1b26', mask: '#8d88a8' }, 'A hollow doll from the dark side of the drawer.');
E('inkwell', 'The Inkwell', 'shadow', 'golem', 5, S(15000, 500, 260, 30, 3.6, 4, 2400, { area: 1, size: 2 }), { boss: 1, ld: [80, 200] }, { col: '#181622', spool: 1 }, 'Spits ink far ahead (long distance).');

/* steel */
E('ironthimble', 'Iron Thimble', 'steel', 'blob', 3, S(8, 18, 115, 30, 1.6, 1, 300), {}, { col: '#9aa4b4' }, 'Tiny, steel, and nearly unbreakable.');
E('chromebeetle', 'Chrome Beetle', 'steel', 'beetle', 4, S(20, 90, 130, 34, 2.0, 2, 900, { size: 1.2 }), { crit: 0.2 }, { col: '#c2ccda' }, 'Bounces off almost everything.');
E('tinhound', 'Tin Hound', 'steel', 'hound', 4, S(14, 60, 120, 70, 1.4, 1, 700), {}, { col: '#aab4c4' }, 'A wind-up dog with a steel coat.');
E('ironclad', 'Ironclad Spool', 'steel', 'golem', 5, S(70, 900, 200, 26, 4, 3, 5000, { area: 1, size: 1.9 }), { boss: 1 }, { col: '#8e9aae', spool: 1 }, 'A steel golem. Bring Critical hits.');

/* gilded */
E('giltseraph', 'Gilt Seraph', 'gilded', 'bird', 3, S(1800, 120, 140, 76, 1.5, 2, 260), {}, { col: '#ffe39a', halo: 1 }, 'Gold-trimmed wings.');
E('halohound', 'Halo Hound', 'gilded', 'hound', 3, S(1500, 110, 120, 100, 1.2, 2, 240), {}, { col: '#ffe9b8', halo: 1 }, 'A good boy. Too good.');
E('gilthollow', 'Gilt Hollow', 'gilded', 'doll', 4, S(9000, 380, 160, 50, 2.2, 3, 700, { area: 1, size: 1.2 }), { kb: 0.2 }, { col: '#c8a24a', mask: '#fff3c4', halo: 1 }, 'A hollow in a golden mask.');
E('giltmother', 'The Gilded Mother', 'gilded', 'doll', 5, S(22500, 900, 260, 34, 3.2, 4, 3000, { area: 1, size: 2 }), { boss: 1, freeze: [0.2, 2] }, { col: '#b8902e', mask: '#fff3c4', halo: 1, crown: 1 }, 'Freezes rags with a golden glare.');

/* starborn */
E('starmote', 'Star Mote', 'starborn', 'blob', 2, S(900, 60, 120, 56, 1.3, 2, 120), {}, { col: '#5fd8ff' }, 'A speck of a fallen star.');
E('cometcrab', 'Comet Crab', 'starborn', 'crab', 3, S(4500, 220, 140, 40, 2.2, 3, 420, { area: 1 }), {}, { col: '#3cb4e8' }, 'Its shell still glows.');
E('nebulahound', 'Nebula Hound', 'starborn', 'hound', 4, S(5200, 260, 130, 90, 1.4, 3, 520), { warp: [0.2, 260, 1.2] }, { col: '#4a7de8' }, 'Bites holes in space. Can warp rags.');
E('starfold', 'Starfold Doll', 'starborn', 'doll', 4, S(14000, 600, 180, 46, 2.4, 3, 800, { area: 1, size: 1.25 }), { surge: [0.2, 1, 150, 400] }, { col: '#2b4fa8', mask: '#bfefff' }, 'Folds starlight into surges.');
E('astral', 'Astral Serpent', 'starborn', 'worm', 4, S(11000, 380, 160, 70, 1.6, 3, 700, { area: 1 }), {}, { col: '#5fd8ff' }, 'A comet tail that bites.');
E('stareater', 'The Star-Eater', 'starborn', 'golem', 6, S(40000, 1650, 280, 32, 3.2, 4, 5000, { area: 1, size: 2.1 }), { boss: 1, wave: [0.35, 2] }, { col: '#1f3a8a', spool: 1 }, 'Swallowed a constellation.');

/* revenant */
E('rotlint', 'Rot Lint', 'revenant', 'blob', 2, S(700, 60, 110, 50, 1.3, 1, 90), { revive: [1, 3, 0.5], burrow: [1, 260] }, { col: '#8fd16a' }, 'Gets back up. Digs.');
E('gravesock', 'Grave Sock', 'revenant', 'hound', 3, S(2400, 160, 120, 80, 1.3, 2, 260), { revive: [1, 3, 0.5], burrow: [1, 300] }, { col: '#6fae4a' }, 'Buried once. Did not stay.');
E('moldering', 'Moldering Doll', 'revenant', 'doll', 4, S(10000, 420, 160, 40, 2.2, 3, 700, { area: 1, size: 1.2 }), { revive: [1, 4, 0.6], toxic: [0.3, 0.2] }, { col: '#4f7a3a', mask: '#d8f0c0' }, 'Toxic: eats away rags\' health.');
E('bonebear', 'Bone Bear', 'revenant', 'golem', 4, S(18000, 700, 170, 36, 2.6, 3, 900, { area: 1, size: 1.45 }), { revive: [2, 4, 0.5], burrow: [1, 340] }, { col: '#7f9a60' }, 'Falls apart. Puts itself back.');
E('unburied', 'The Unburied', 'revenant', 'doll', 6, S(37500, 1425, 240, 30, 3.0, 5, 4500, { area: 1, size: 2 }), { boss: 1, revive: [1, 5, 1], toxic: [0.3, 0.25] }, { col: '#3e6a2c', mask: '#e6ffd6', crown: 1 }, 'Rises once more at full strength.');

/* ancient */
E('relicbeetle', 'Relic Beetle', 'ancient', 'beetle', 3, S(4200, 200, 130, 36, 2.0, 2, 420), { curse: [0.4, 4] }, { col: '#a88452' }, 'Its bite hexes rags.');
E('oldidol', 'Old Idol', 'ancient', 'golem', 4, S(22000, 600, 190, 26, 3.0, 3, 1100, { area: 1, size: 1.5 }), { curse: [0.5, 5], barrier: 3000 }, { col: '#8a6a3a' }, 'A barrier guards it. Hexes rags.');
E('ancienthollow', 'Ancient Hollow', 'ancient', 'doll', 5, S(26000, 900, 200, 40, 2.4, 3, 1400, { area: 1, size: 1.3 }), { curse: [0.6, 5], surge: [0.25, 1, 200, 450] }, { col: '#6e5230', mask: '#f0d8a8' }, 'Hexes and surges.');

/* void */
E('voidmote', 'Void Mote', 'void', 'blob', 3, S(2200, 150, 120, 52, 1.4, 2, 300), { husk: 1500, deathSurge: [1] }, { col: '#b46bff' }, 'A husked speck of nothing.');
E('voidhound', 'Void Hound', 'void', 'hound', 4, S(7000, 400, 130, 84, 1.4, 3, 700), { husk: 5000, deathSurge: [1] }, { col: '#8a3ae8' }, 'Its husk grows back when shoved.');
E('voidwarden', 'Void Warden', 'void', 'doll', 5, S(30000, 1100, 200, 40, 2.6, 3, 1500, { area: 1, size: 1.35 }), { husk: 15000, deathSurge: [2] }, { col: '#5a1fa8', mask: '#e8d0ff' }, 'Guards the edge of the unmade.');

/* arc finales */
E('unraveller', 'The Unraveller', ['shadow'], 'doll', 6, S(30000, 1200, 260, 30, 3.0, 5, 4000, { area: 1, size: 2.2 }), { boss: 1, kb: 0.25, wave: [0.3, 2] }, { col: '#20182a', mask: '#efe7da', crown: 1, cape: 1 }, 'Pulls at the seam of the world.');
E('frayqueen', 'The Fray Queen', ['starborn', 'gilded'], 'doll', 7, S(65000, 2550, 280, 32, 2.8, 5, 8000, { area: 1, size: 2.3 }), { boss: 1, freeze: [0.2, 2], surge: [0.3, 2, 200, 500] }, { col: '#2a4fa8', mask: '#fff3c4', crown: 1, cape: 1 }, 'Wears the frayed edge of the sky.');
E('needleking', 'The Needle King', ['void', 'ancient'], 'golem', 8, S(125000, 4500, 300, 28, 3.2, 6, 12000, { area: 1, size: 2.4 }), { boss: 1, husk: 60000, curse: [0.4, 5], wave: [0.4, 3] }, { col: '#3a1a5a', spool: 1, crown: 1 }, 'The needle that stitched the dark.');

export const ENEMIES = {};
L.forEach((e, i) => { e.order = i; e.look = { col: '#ccc', eye: '#ffe14a', ...e.look }; if (e.traits.includes('shadow') || e.traits.includes('void')) e.look.eye = e.look.eye === '#ffe14a' ? '#ff5ea8' : e.look.eye; ENEMIES[e.id] = e; });
export const ENEMY_IDS = L.map(e => e.id);
// pools by trait and tier for stage generation
export function pool(traits, maxTier, minTier = 1) {
  return L.filter(e => !e.ab.boss && e.tier <= maxTier && e.tier >= minTier && e.traits.some(t => traits.includes(t)) && !['unraveller', 'frayqueen', 'needleking'].includes(e.id));
}
export const BOSSES = L.filter(e => e.ab.boss).map(e => e.id);
