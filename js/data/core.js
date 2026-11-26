// Core rules data: foe traits, rarities, ability text. All names and numbers are original to The Rag Army.

export const TRAITS = {
  plain:    { name: 'Plain',    col: '#c9cdd8', desc: 'No special nature.' },
  crimson:  { name: 'Crimson',  col: '#ff4d5a', desc: 'Hot-headed red foes.' },
  drifting: { name: 'Drifting', col: '#ffd84a', desc: 'Float on the wind.' },
  shadow:   { name: 'Shadow',   col: '#5d5a78', desc: 'Ink-dark foes.' },
  steel:    { name: 'Steel',    col: '#b8c4d4', desc: 'Take only 1 damage per hit. Critical hits and Steel Shred ignore this.' },
  gilded:   { name: 'Gilded',   col: '#ffe9a3', desc: 'Golden foes from the upper loft.' },
  starborn: { name: 'Starborn', col: '#5fd8ff', desc: 'Star-shrouded: shrug off half of all damage unless Starward treasures are collected.' },
  revenant: { name: 'Revenant', col: '#8fd16a', desc: 'Get back up after falling unless the last blow came from an Unraveller. Often burrow.' },
  ancient:  { name: 'Ancient',  col: '#c49a62', desc: 'Old relics. Their blows often Hex rags (strip their abilities).' },
  void:     { name: 'Void',     col: '#b46bff', desc: 'Wrapped in regrowing Husks and often leave a void Surge when they fall.' },
};
export const TRAIT_KEYS = Object.keys(TRAITS).filter(k => k !== 'plain');

export const RARITY = {
  basic:   { name: 'Basic',   col: '#b9c0cf', cap: 20, capMax: 30, stat: 1,    cost: 1,    cd: 1,   np: 0,  lvlCost: 1 },
  special: { name: 'Special', col: '#7fd6ff', cap: 20, capMax: 30, stat: 1.08, cost: 1.1,  cd: 1,   np: 1,  lvlCost: 1.3 },
  rare:    { name: 'Rare',    col: '#c8ff2e', cap: 20, capMax: 40, stat: 1.2,  cost: 1.2,  cd: 1.05, np: 1, lvlCost: 1.6 },
  sr:      { name: 'Epic',    col: '#ffb13d', cap: 20, capMax: 40, stat: 1.45, cost: 1.35, cd: 1.15, np: 3, lvlCost: 2.2 },
  uber:    { name: 'Mythic',  col: '#ff5ea8', cap: 20, capMax: 50, stat: 2.05, cost: 1.55, cd: 1.4, np: 5,  lvlCost: 3 },
  legend:  { name: 'Legend',  col: '#ffffff', cap: 20, capMax: 50, stat: 2.7,  cost: 1.7,  cd: 1.6, np: 8,  lvlCost: 4 },
};

// Proc/ability glossary for the UI (keys match fields in a unit's `ab` object).
export const ABIL = {
  strong:   { n: 'Strong vs',      d: 'Deals 1.5x and takes 0.5x damage from these traits.' },
  resist:   { n: 'Resistant to',   d: 'Takes 1/4 damage from these traits.' },
  tough:    { n: 'Unbreakable vs', d: 'Takes 1/6 damage from these traits.' },
  massive:  { n: 'Massive vs',     d: 'Deals 3x damage to these traits.' },
  insane:   { n: 'Ruinous vs',     d: 'Deals 5x damage to these traits.' },
  only:     { n: 'Targets only',   d: 'Ignores everything except these traits (and bases).' },
  kb:       { n: 'Shove',          d: 'Chance to knock the target back.' },
  freeze:   { n: 'Freeze',         d: 'Chance to freeze the target solid (no moving, no attacking).' },
  slow:     { n: 'Snag',           d: 'Chance to slow the target to a crawl.' },
  weaken:   { n: 'Fray',           d: 'Chance to cut the target\'s attack power.' },
  curse:    { n: 'Hex',            d: 'Chance to strip the target of its abilities for a while.' },
  crit:     { n: 'Critical',       d: 'Chance to deal double damage. Ignores Steel.' },
  savage:   { n: 'Savage Seam',    d: 'Chance to deal massively boosted damage.' },
  wave:     { n: 'Ripple',         d: 'Chance to send a ripple down the lane that hits everything it passes.' },
  miniwave: { n: 'Mini Ripple',    d: 'Chance to send a weak (20%) ripple.' },
  surge:    { n: 'Surge',          d: 'Chance to raise a thread pillar somewhere ahead that hits repeatedly.' },
  strengthen:{ n: 'Second Wind',   d: 'Attack rises sharply once health is low.' },
  survive:  { n: 'Hang On',        d: 'Chance to survive a lethal blow with 1 health.' },
  base:     { n: 'Base Breaker',   d: 'Deals 4x damage to bases.' },
  steelKill:{ n: 'Steel Shred',    d: 'Hits shred a percent of a Steel foe\'s remaining health.' },
  breaker:  { n: 'Barrier Breaker',d: 'Chance to shatter a foe\'s barrier in one hit.' },
  pierce:   { n: 'Husk Pierce',    d: 'Chance to tear away a foe\'s husk in one hit.' },
  unravel:  { n: 'Unraveller',     d: 'Revenants it finishes off stay down.' },
  scrap:    { n: 'Scavenger',      d: 'Foes it finishes drop double scrap.' },
  dodge:    { n: 'Sidestep',       d: 'Chance to dodge attacks from these traits for a moment.' },
  waveBlock:{ n: 'Ripple Wall',    d: 'Stops foe ripples where it stands.' },
  bossSlay: { n: 'Giantbane',      d: 'Deals 1.6x and takes 0.7x damage from bosses.' },
  immune:   { n: 'Immune to',      d: 'Unaffected by these effects.' },
  // foe-only
  barrier:  { n: 'Barrier',        d: 'Blocks every hit weaker than its strength until broken.' },
  husk:     { n: 'Husk',           d: 'Extra health that must be torn away first. Regrows when shoved.' },
  revive:   { n: 'Get Back Up',    d: 'Rises again after falling.' },
  burrow:   { n: 'Burrow',         d: 'Digs under the front line and pops up further ahead.' },
  warp:     { n: 'Warp',           d: 'Chance to blink the target backwards or forwards.' },
  toxic:    { n: 'Toxic',          d: 'Chance to eat away a share of a rag\'s maximum health.' },
  deathSurge:{ n: 'Death Surge',   d: 'Leaves a surge where it falls.' },
  boss:     { n: 'Boss',           d: 'Arrives with a shockwave that shoves every rag back.' },
};

export const IMMUNE_KEYS = ['kb', 'freeze', 'slow', 'weaken', 'wave', 'surge', 'warp', 'curse', 'toxic', 'boss'];
export const IMMUNE_NAMES = { kb: 'Shove', freeze: 'Freeze', slow: 'Snag', weaken: 'Fray', wave: 'Ripple', surge: 'Surge', warp: 'Warp', curse: 'Hex', toxic: 'Toxic', boss: 'Boss Shockwave' };

// archetype templates at level 1, first form. time in seconds, distances in lane units.
// hp, atk, range, speed, freq (s between attack starts), fs (wind-up before the hit lands), kb (shoves per life), cost, cd, area
export const ARCH = {
  wall:    { hp: 230,  atk: 9,   range: 125, speed: 62, freq: 1.25, fs: 0.25, kb: 3, cost: 75,   cd: 2.2, area: 1 },
  tank:    { hp: 640,  atk: 22,  range: 135, speed: 46, freq: 2.0,  fs: 0.4,  kb: 3, cost: 230,  cd: 6.5, area: 1 },
  brawler: { hp: 330,  atk: 62,  range: 150, speed: 56, freq: 1.45, fs: 0.35, kb: 3, cost: 190,  cd: 4.5, area: 1 },
  rusher:  { hp: 190,  atk: 240, range: 130, speed: 125, freq: 2.6, fs: 0.12, kb: 1, cost: 320,  cd: 9,   area: 0 },
  ranger:  { hp: 260,  atk: 120, range: 330, speed: 45, freq: 2.7,  fs: 0.6,  kb: 3, cost: 360,  cd: 8.5, area: 1 },
  sniper:  { hp: 220,  atk: 280, range: 470, speed: 40, freq: 4.0,  fs: 0.9,  kb: 2, cost: 520,  cd: 14,  area: 0 },
  fast:    { hp: 230,  atk: 46,  range: 140, speed: 96, freq: 0.85, fs: 0.15, kb: 4, cost: 240,  cd: 6,   area: 0 },
  titan:   { hp: 1450, atk: 430, range: 200, speed: 40, freq: 3.3,  fs: 0.8,  kb: 3, cost: 1250, cd: 26,  area: 1 },
  support: { hp: 380,  atk: 42,  range: 260, speed: 50, freq: 1.9,  fs: 0.4,  kb: 3, cost: 300,  cd: 8,   area: 1 },
  killer:  { hp: 330,  atk: 95,  range: 200, speed: 56, freq: 1.85, fs: 0.4,  kb: 3, cost: 410,  cd: 9.5, area: 1 },
};

// level growth: +20% per level to 30, then +10% per level (plus levels stack on top of the level)
export const levelMult = L => 1 + 0.2 * (Math.min(L, 30) - 1) + 0.1 * Math.max(0, L - 30);
// thread cost to go from level L to L+1
export const levelCost = (L, rar) => Math.round((200 + 180 * L + 22 * L * L) * RARITY[rar].lvlCost / 10) * 10;
