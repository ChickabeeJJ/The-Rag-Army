// Meta-game data: upgrades, cannons, battle items, combos, talents, treasures, missions, badges,
// login stamps, ragbag banners, scavenger areas and rank rewards.

export const POWERUPS = [
  { id: 'cannonPow', n: 'Cannon Power', d: '+10% cannon damage per level', per: 0.1 },
  { id: 'cannonRange', n: 'Cannon Reach', d: '+40 cannon reach per level', per: 40 },
  { id: 'cannonCharge', n: 'Cannon Charge', d: '-3% cannon charge time per level', per: 0.03 },
  { id: 'loomRate', n: 'Loom Speed', d: '+5% scrap per second per level', per: 0.05 },
  { id: 'loomCap', n: 'Loom Wallet', d: '+5% wallet size per level', per: 0.05 },
  { id: 'baseHp', n: 'Keep Fortitude', d: '+10% keep health per level', per: 0.1 },
  { id: 'research', n: 'Research', d: '-2% rag recharge per level', per: 0.02 },
  { id: 'accounting', n: 'Accounting', d: '+6% scrap from foes per level', per: 0.06 },
  { id: 'study', n: 'Study', d: '+6% thread from battles per level', per: 0.06 },
  { id: 'energy', n: 'Pack Size', d: '+3 max energy per level', per: 3 },
];
export const POWERUP_MAX = 20;
export const powerupCost = lv => Math.round(400 * Math.pow(lv, 1.7) / 50) * 50;

export const CANNONS = [
  { id: 'spool', n: 'Spool Cannon', d: 'A thread beam that hurts and shoves every foe it touches.', unlock: 0 },
  { id: 'frost', n: 'Frost Cannon', d: 'Freezes every foe in reach. Weak damage.', unlock: 30 },
  { id: 'snare', n: 'Snare Cannon', d: 'Snags every foe in reach for a long time.', unlock: 60 },
  { id: 'wall', n: 'Rag Wall', d: 'Drops a huge stuffed wall that holds the line.', unlock: 90 },
  { id: 'breaker', n: 'Breaker Cannon', d: 'Shatters barriers and husks, then hurts.', unlock: 120 },
  { id: 'quake', n: 'Quake Cannon', d: 'A rolling shock that shoves foes again and again.', unlock: 150 },
  { id: 'lance', n: 'Thread Lance', d: 'A piercing lance. Revenants it fells stay down.', unlock: 200 },
];
export const CANNON_MAX = 10;
export const cannonCost = lv => ({ cotton: 3 + lv * 2, wool: 2 + lv, silk: lv >= 4 ? lv - 2 : 0, velvet: lv >= 7 ? lv - 5 : 0 });

export const ITEMS = {
  quick:   { n: 'Quickstep',     d: 'Unlocks 3x battle speed for one battle.', ic: 'fast' },
  sack:    { n: 'Scrap Sack',    d: 'Start the battle with the loom at max level.', ic: 'sack' },
  auto:    { n: 'Autopilot',     d: 'Your rags deploy and fire on their own.', ic: 'cpu' },
  lookout: { n: 'Lookout',       d: 'A lookout on the keep shoots and shoves the front foe every few seconds.', ic: 'eye' },
  seeker:  { n: 'Treasure Lamp', d: 'A treasure drop is guaranteed and always Gold.', ic: 'lamp' },
  lamp:    { n: 'Study Lamp',    d: '+50% thread from this battle.', ic: 'book' },
};

export const MATERIALS = {
  cotton: { n: 'Cotton', col: '#f6f7fb' }, wool: { n: 'Wool', col: '#e8d6b0' }, silk: { n: 'Silk', col: '#ffd5f0' },
  linen: { n: 'Linen', col: '#e9e2cf' }, felt: { n: 'Felt', col: '#c49a62' }, velvet: { n: 'Velvet', col: '#b4306b' }, denim: { n: 'Denim', col: '#5f8fe0' },
};
export const DYES = { red: { n: 'Red Dye', col: '#ff4d5a' }, blue: { n: 'Blue Dye', col: '#2fa8ff' }, green: { n: 'Green Dye', col: '#45e08a' }, gold: { n: 'Gold Dye', col: '#ffc933' }, violet: { n: 'Violet Dye', col: '#b46bff' }, prism: { n: 'Prism Dye', col: '#ffffff' } };

export const COMBOS = [
  { id: 'first', n: 'First Thread', rags: ['stitch', 'bolster'], fx: 'startScrap', v: 150, d: 'Start with +150 scrap' },
  { id: 'fort', n: 'Pillow Fort', rags: ['bolster', 'quilt', 'mitten'], fx: 'ragHp', v: 0.1, d: 'Rag health +10%' },
  { id: 'gang', n: 'Scrap Gang', rags: ['scrapper', 'denim_brute'], fx: 'ragAtk', v: 0.1, d: 'Rag attack +10%' },
  { id: 'speedsew', n: 'Speed Sewing', rags: ['jab', 'hopper', 'needle'], fx: 'ragSpeed', v: 0.1, d: 'Rag speed +10%' },
  { id: 'reach', n: 'Long Reach', rags: ['longarm', 'twine', 'hemline'], fx: 'cannonCharge', v: 0.1, d: 'Cannon charges 10% faster' },
  { id: 'windy', n: 'Windy Day', rags: ['kite', 'pinwheel'], fx: 'vs_drifting', v: 0.5, d: 'Better trait mastery vs Drifting' },
  { id: 'knights', n: 'Knights of the Button', rags: ['button_knight', 'thimble'], fx: 'baseHp', v: 0.2, d: 'Keep health +20%' },
  { id: 'night', n: 'Night Watch', rags: ['sockpuppet', 'felt_monk', 'silk_blade'], fx: 'vs_shadow', v: 0.6, d: 'Better trait mastery vs Shadow' },
  { id: 'harvest', n: 'Harvest', rags: ['scarecrow', 'lantern'], fx: 'loomRate', v: 0.1, d: 'Loom speed +10%' },
  { id: 'elemA', n: 'Fire, Water, Wind', rags: ['ember', 'tide', 'gale'], fx: 'ragAtk', v: 0.15, d: 'Rag attack +15%' },
  { id: 'elemB', n: 'Stone, Frost, Thorn', rags: ['stone', 'rime', 'thorn'], fx: 'ragHp', v: 0.15, d: 'Rag health +15%' },
  { id: 'tempest', n: 'Tempest', rags: ['storm', 'echo'], fx: 'procDur', v: 0.15, d: 'Effect durations +15%' },
  { id: 'lightdark', n: 'Light and Dark', rags: ['radiance', 'voidrag'], fx: 'ragAtk', v: 0.1, d: 'Rag attack +10%' },
  { id: 'timespace', n: 'Time and Space', rags: ['chrono', 'gravity'], fx: 'cdDown', v: 0.1, d: 'Recharge 10% faster' },
  { id: 'hoard', n: 'Golden Hoard', rags: ['midas', 'lantern'], fx: 'killScrap', v: 0.25, d: '+25% scrap from foes' },
  { id: 'dragonhoard', n: 'Dragon Fire', rags: ['dragon', 'ember'], fx: 'cannonPow', v: 0.25, d: 'Cannon power +25%' },
  { id: 'glitchseam', n: 'Glitch in the Seam', rags: ['glitch', 'echo', 'storm'], fx: 'loomCap', v: 0.2, d: 'Wallet +20%' },
  { id: 'bandaged', n: 'Bandaged', rags: ['gauze', 'voidrag'], fx: 'vs_revenant', v: 0.6, d: 'Better trait mastery vs Revenant' },
  { id: 'paisleyshield', n: 'Paisley Shield', rags: ['paisley', 'quilt'], fx: 'vs_void', v: 0.6, d: 'Better trait mastery vs Void' },
  { id: 'velvet', n: 'Velvet Underground', rags: ['velvet_rogue', 'silk_blade'], fx: 'cannonCharge', v: 0.1, d: 'Cannon charges 10% faster' },
  { id: 'steelwool', n: 'Steel Wool', rags: ['steel_spindle', 'mitten'], fx: 'threadUp', v: 0.15, d: '+15% thread' },
  { id: 'cushions', n: 'Cushion Crew', rags: ['spike_cushion', 'bolster'], fx: 'baseHp', v: 0.1, d: 'Keep health +10%' },
  { id: 'wizards', n: 'Knitting Circle', rags: ['wool_mage', 'tweed_prof'], fx: 'procDur', v: 0.1, d: 'Effect durations +10%' },
];

// talents: unlocked on third forms with Needle Points
export const TALENTS = {
  hp:        { n: 'Thick Stuffing', max: 10, d: '+4% health / level' },
  atk:       { n: 'Hard Seams', max: 10, d: '+4% attack / level' },
  cost:      { n: 'Thrifty', max: 5, d: '-3% scrap cost / level' },
  cd:        { n: 'Quick Sewing', max: 10, d: '-4% recharge / level' },
  speed:     { n: 'Light Feet', max: 10, d: '+3 speed / level' },
  range:     { n: 'Long Thread', max: 5, d: '+8 reach / level' },
  kbUp:      { n: 'Big Shove', max: 5, d: '+4% shove chance / level' },
  procCh:    { n: 'Focus', max: 5, d: '+4% chance on every effect / level' },
  procDur:   { n: 'Lasting Knots', max: 5, d: '+8% effect duration / level' },
  crit:      { n: 'Sharp Eye', max: 5, d: '+3% critical chance / level' },
  survive:   { n: 'Tough Knot', max: 5, d: '+8% chance to hang on / level' },
  dodge:     { n: 'Nimble', max: 5, d: '+3% chance to sidestep anything / level' },
  resWeaken: { n: 'Unfrayable', max: 5, d: '-15% fray duration / level' },
  resKb:     { n: 'Rooted', max: 5, d: '+15% chance to ignore a shove / level' },
  resSlow:   { n: 'Untangled', max: 5, d: '-15% snag duration / level' },
  resToxic:  { n: 'Antidote', max: 5, d: '-15% toxic damage / level' },
  immWave:   { n: 'Ripple Proof', max: 1, d: 'Immune to ripples' },
  immSurge:  { n: 'Surge Proof', max: 1, d: 'Immune to surges' },
  immWarp:   { n: 'Anchored', max: 1, d: 'Immune to warp' },
};
export const talentCost = (rar, lvl) => ({ basic: 4, special: 5, rare: 6, sr: 8, uber: 10, legend: 12 }[rar]) * (lvl + 1);

// treasure set effects. 48 stages per chapter = 8 sets of 6; each treasure is Bronze(1)/Silver(2)/Gold(3).
// value of a set = max * points / 18
export const TREASURE_FX = {
  loomRate: 'Loom speed', loomCap: 'Wallet size', cannonCharge: 'Cannon charge speed', cannonPow: 'Cannon power', baseHp: 'Keep health',
  cdDown: 'Rag recharge speed', threadUp: 'Thread from battles', energyMax: 'Max energy', ragHp: 'Rag health', ragAtk: 'Rag attack',
  startScrap: 'Starting scrap', dropUp: 'Drop chance', procDur: 'Effect duration', killScrap: 'Scrap from foes',
  vs_crimson: 'Mastery vs Crimson', vs_drifting: 'Mastery vs Drifting', vs_shadow: 'Mastery vs Shadow', vs_gilded: 'Mastery vs Gilded',
  vs_steel: 'Mastery vs Steel', vs_starborn: 'Mastery vs Starborn', vs_revenant: 'Mastery vs Revenant', vs_ancient: 'Mastery vs Ancient', vs_void: 'Mastery vs Void',
  starward: 'Starward (cuts Starborn shrouds)',
};
export const FLAT_FX = new Set(['startScrap', 'energyMax']);
export const TREASURES = [
  [ // The Long Seam
    [['loomRate', 0.5], ['loomCap', 0.5], ['cannonCharge', 0.4], ['cannonPow', 1], ['baseHp', 1], ['cdDown', 0.2], ['threadUp', 1], ['energyMax', 30]],
    [['vs_crimson', 1], ['vs_drifting', 1], ['vs_shadow', 1], ['vs_gilded', 1], ['ragHp', 0.2], ['ragAtk', 0.2], ['startScrap', 600], ['dropUp', 0.3]],
    [['procDur', 0.2], ['vs_steel', 1], ['killScrap', 0.4], ['loomRate', 0.25], ['cannonPow', 0.5], ['ragHp', 0.2], ['ragAtk', 0.2], ['threadUp', 0.5]],
  ],
  [ // The Fraying Lands
    [['starward', 0.25], ['starward', 0.25], ['starward', 0.25], ['starward', 0.25], ['ragHp', 0.15], ['ragAtk', 0.15], ['vs_starborn', 1], ['threadUp', 0.5]],
    [['vs_crimson', 0.5], ['vs_drifting', 0.5], ['vs_shadow', 0.5], ['vs_gilded', 0.5], ['loomCap', 0.3], ['cannonCharge', 0.2], ['cdDown', 0.1], ['killScrap', 0.3]],
    [['vs_starborn', 0.5], ['ragHp', 0.2], ['ragAtk', 0.2], ['procDur', 0.2], ['baseHp', 1], ['loomRate', 0.25], ['startScrap', 600], ['dropUp', 0.2]],
  ],
  [ // The Unspun Void
    [['vs_revenant', 1], ['vs_void', 1], ['vs_ancient', 1], ['ragHp', 0.2], ['ragAtk', 0.2], ['cdDown', 0.1], ['loomCap', 0.3], ['threadUp', 0.5]],
    [['vs_revenant', 0.5], ['vs_void', 0.5], ['vs_ancient', 0.5], ['procDur', 0.2], ['cannonPow', 1], ['loomRate', 0.25], ['killScrap', 0.3], ['energyMax', 20]],
    [['ragHp', 0.3], ['ragAtk', 0.3], ['vs_steel', 0.5], ['baseHp', 1], ['cannonCharge', 0.2], ['startScrap', 900], ['vs_starborn', 0.5], ['dropUp', 0.3]],
  ],
];
export const TREASURE_Q = ['', 'Bronze', 'Silver', 'Gold'];

export const MISSIONS_DAILY = [
  { id: 'd_clear', n: 'Win 3 battles', stat: 'wins', goal: 3, r: { buttons: 20 } },
  { id: 'd_deploy', n: 'Deploy 60 rags', stat: 'deploys', goal: 60, r: { thread: 8000 } },
  { id: 'd_kill', n: 'Defeat 150 foes', stat: 'kills', goal: 150, r: { item: 'lamp' } },
  { id: 'd_cannon', n: 'Fire the cannon 5 times', stat: 'cannons', goal: 5, r: { buttons: 10 } },
  { id: 'd_event', n: 'Play an event stage', stat: 'events', goal: 1, r: { ticket: 1 } },
  { id: 'd_level', n: 'Level up rags 3 times', stat: 'levelups', goal: 3, r: { buttons: 10 } },
];
export const MISSIONS_WEEKLY = [
  { id: 'w_clear', n: 'Win 25 battles', stat: 'wins', goal: 25, r: { ticket: 2 } },
  { id: 'w_kill', n: 'Defeat 1,500 foes', stat: 'kills', goal: 1500, r: { buttons: 100 } },
  { id: 'w_draw', n: 'Open 5 ragbags', stat: 'draws', goal: 5, r: { item: 'seeker' } },
  { id: 'w_boss', n: 'Defeat 10 bosses', stat: 'bosses', goal: 10, r: { gem: 3 } },
  { id: 'w_scav', n: 'Finish 4 scavenger trips', stat: 'scavs', goal: 4, r: { thread: 50000 } },
];

export const BADGES = [
  { id: 'b_win1', n: 'First Stitch', d: 'Win your first battle', test: s => s.stats.wins >= 1 },
  { id: 'b_win100', n: 'Seasoned', d: 'Win 100 battles', test: s => s.stats.wins >= 100 },
  { id: 'b_kill1k', n: 'Lint Roller', d: 'Defeat 1,000 foes', test: s => s.stats.kills >= 1000 },
  { id: 'b_kill10k', n: 'Moth Bane', d: 'Defeat 10,000 foes', test: s => s.stats.kills >= 10000 },
  { id: 'b_ch1', n: 'Seamstress', d: 'Clear The Long Seam, chapter 1', test: s => (s.story[0] || 0) >= 48 },
  { id: 'b_ch3', n: 'Full Seam', d: 'Clear The Long Seam, chapter 3', test: s => (s.story[2] || 0) >= 48 },
  { id: 'b_fray', n: 'Frayed Edge', d: 'Clear The Fraying Lands, chapter 1', test: s => (s.story[3] || 0) >= 48 },
  { id: 'b_void', n: 'Into the Void', d: 'Clear The Unspun Void, chapter 1', test: s => (s.story[6] || 0) >= 48 },
  { id: 'b_end', n: 'The Needle Falls', d: 'Clear The Unspun Void, chapter 3', test: s => (s.story[8] || 0) >= 48 },
  { id: 'b_own10', n: 'Small Army', d: 'Own 10 rags', test: s => Object.keys(s.rags).length >= 10 },
  { id: 'b_own30', n: 'Big Army', d: 'Own 30 rags', test: s => Object.keys(s.rags).length >= 30 },
  { id: 'b_ownall', n: 'The Rag Army', d: 'Own every rag', test: (s, n) => Object.keys(s.rags).length >= n },
  { id: 'b_mythic', n: 'Mythic Find', d: 'Own a Mythic rag', test: (s, n, R) => Object.keys(s.rags).some(k => R[k] && R[k].rarity === 'uber') },
  { id: 'b_legend', n: 'Legendary', d: 'Own a Legend rag', test: (s, n, R) => Object.keys(s.rags).some(k => R[k] && R[k].rarity === 'legend') },
  { id: 'b_true', n: 'Third Form', d: 'Evolve a rag to its third form', test: s => Object.values(s.rags).some(r => r.form >= 2) },
  { id: 'b_lv30', n: 'Well Worn', d: 'Raise a rag to level 30', test: s => Object.values(s.rags).some(r => r.lv >= 30) },
  { id: 'b_spire10', n: 'Climber', d: 'Reach floor 10 of the Needle Spire', test: s => s.spire >= 10 },
  { id: 'b_spire50', n: 'Spire Top', d: 'Clear the Needle Spire', test: s => s.spire >= 50 },
  { id: 'b_yard', n: 'Yard Star', d: 'Score 1,000,000 in the Scrap Yard', test: s => s.yardBest >= 1e6 },
  { id: 'b_tangle', n: 'Untangled', d: 'Reach floor 30 of the Tangle', test: s => s.tangleBest >= 30 },
  { id: 'b_trek', n: 'Trekker', d: 'Finish the Legend Trek', test: s => s.trek >= 48 },
  { id: 'b_legend1', n: 'Storyteller', d: 'Clear 20 Legend Seam stages', test: s => Object.keys(s.legend).length >= 20 },
  { id: 'b_crown', n: 'Four Crowns', d: 'Clear any Legend Seam stage on 4 crowns', test: s => Object.values(s.legend).some(v => v >= 4) },
  { id: 'b_treasure', n: 'Hoarder', d: 'Collect 48 gold treasures', test: s => Object.values(s.treasure).filter(v => v >= 3).length >= 48 },
  { id: 'b_scav', n: 'Scavenger', d: 'Finish 25 scavenger trips', test: s => s.stats.scavs >= 25 },
  { id: 'b_outbreak', n: 'Cure', d: 'Clear 8 Rot Outbreak stages', test: s => Object.keys(s.outbreak).length >= 8 },
  { id: 'b_rival', n: 'Rival Beater', d: 'Win 5 Rival Dojo bouts', test: s => s.rival >= 5 },
];

// 28-day login stamp card
export const LOGIN = Array.from({ length: 28 }, (_, i) => {
  const d = i + 1;
  if (d % 28 === 0) return { plat: 1 };
  if (d % 7 === 0) return { ticket: 2 };
  if (d % 7 === 3) return { buttons: 30 };
  if (d % 7 === 5) return { item: ['quick', 'sack', 'auto', 'lookout', 'seeker', 'lamp'][(d / 7) | 0] || 'lamp' };
  if (d % 2 === 0) return { thread: 6000 + d * 500 };
  return { ntix: 1 };
});

// featured banners rotate weekly; all Mythics are always in the Rare Ragbag, featured ones are more likely
export const BANNERS = [
  { id: 'fire', n: 'Flame & Flood', feat: ['ember', 'tide', 'storm', 'echo'], col: '#ff6a2a' },
  { id: 'earth', n: 'Stone & Thorn', feat: ['stone', 'thorn', 'gravity', 'gale'], col: '#45e08a' },
  { id: 'frost', n: 'Frost & Time', feat: ['rime', 'chrono', 'radiance', 'voidrag'], col: '#9ff3ff' },
];
export const RATES = { rare: 0.7, sr: 0.25, uber: 0.047, legend: 0.003 };
export const DRAW_COST = 150, DRAW11_COST = 1500;
export const DUPE = { basic: [1, 0], special: [1, 1], rare: [1, 3], sr: [1, 8], uber: [1, 25], legend: [1, 40] }; // [plus levels, NP]
export const PLUS_MAX = { basic: 20, special: 30, rare: 70, sr: 70, uber: 40, legend: 20 };

export const SCAV_AREAS = [
  { id: 'attic', n: 'The Attic', unlock: 0, mats: ['cotton', 'wool'] },
  { id: 'laundry', n: 'Laundry Basket', unlock: 12, mats: ['cotton', 'linen', 'wool'] },
  { id: 'shed', n: 'Garden Shed', unlock: 30, mats: ['felt', 'wool', 'denim'] },
  { id: 'sewing', n: 'Sewing Room', unlock: 60, mats: ['silk', 'cotton', 'velvet'] },
  { id: 'wardrobe', n: 'Old Wardrobe', unlock: 100, mats: ['velvet', 'silk', 'denim', 'felt'] },
  { id: 'roof', n: 'Starry Rooftop', unlock: 150, mats: ['silk', 'velvet', 'linen'] },
  { id: 'voiddrawer', n: 'The Void Drawer', unlock: 300, mats: ['velvet', 'silk', 'denim', 'felt', 'wool'] },
];
export const SCAV_TIMES = [5, 15, 30, 60]; // minutes of real time

export const RANK_REWARDS = [
  [30, { buttons: 50 }], [60, { ticket: 1 }], [100, { buttons: 100 }], [150, { item: 'auto' }], [200, { ticket: 2 }],
  [300, { buttons: 150 }], [400, { plat: 1 }], [500, { gem: 5 }], [650, { buttons: 200 }], [800, { ticket: 3 }],
  [1000, { plat: 1 }], [1300, { buttons: 300 }], [1600, { mythgem: 5 }], [2000, { plat: 1 }], [2500, { buttons: 500 }],
];
