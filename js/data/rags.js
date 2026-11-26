// The rag roster: 51 original rags, three forms each. Stats come from an archetype template
// (data/core.js ARCH) times rarity, per-rag tweaks and a per-form step. Abilities merge form by form.
import { ARCH, RARITY, TRAIT_KEYS } from './core.js';

const ALL = 'all';
const FORM_MULT = [1, 1.22, 1.55];
const FORM_RANGE = [0, 10, 25];

const LIST = [];
function R(id, names, rarity, arch, t, ab, look, opt = {}) {
  LIST.push({ id, names, rarity, arch, t, ab, look, ...opt });
}

/* ---------------------------------------------------------------- BASIC */
R('stitch', ['Stitch', 'Double Stitch', 'Cross Stitch'], 'basic', 'wall', {}, [{}, {}, {}],
  { acc: '#c8ff2e', hat: 'band' }, { unlock: 0, talents: ['hp', 'cd', 'cost', 'speed', 'resWeaken'],
    desc: ['A single stitch of a rag. Cheap, quick, and always first through the door.', 'Twice the thread, twice the nerve.', 'Crossed and doubled. Holds the line like a knot.'] });
R('bolster', ['Bolster', 'Feather Bolster', 'Iron Bolster'], 'basic', 'tank', { atk: 0.75 }, [{}, {}, { resist: 1, vs: ['crimson'] }],
  { acc: '#7fb0e2', hat: 'beanie', bulk: 1.35, body: 'round' }, { unlock: 1, talents: ['hp', 'cd', 'resKb', 'cost'],
    desc: ['A pillow with opinions. Soaks up blows.', 'Stuffed with feathers and stubbornness.', 'Iron-lined. Crimson foes barely dent it.'] });
R('scrapper', ['Scrapper', 'Scrap Brawler', 'Scrap Champion'], 'basic', 'brawler', {}, [{}, {}, { kb: 0.08 }],
  { acc: '#ff8a3d', hat: 'bucket', weapon: 'mallet' }, { unlock: 2, talents: ['atk', 'hp', 'kbUp', 'speed'],
    desc: ['Swings a mallet at everything in reach.', 'Hits harder, hits more.', 'Scrap-yard legend. Sometimes swats foes away.'] });
R('jab', ['Jab', 'Quick Jab', 'Lightning Jab'], 'basic', 'rusher', {}, [{}, {}, { crit: 0.08 }],
  { acc: '#ffd84a', hat: 'band', weapon: 'glove' }, { unlock: 4, talents: ['atk', 'speed', 'crit', 'cd'],
    desc: ['Runs in, throws one huge punch, and usually pops.', 'Faster feet, harder fist.', 'A punch that sometimes lands twice as hard.'] });
R('longarm', ['Longarm', 'Reacharm', 'Farreach'], 'basic', 'ranger', { range: 20, hp: 1.1 }, [{}, {}, {}],
  { acc: '#45e08a', hat: 'none', tall: 1.25 }, { unlock: 6, talents: ['atk', 'hp', 'range', 'cd'],
    desc: ['Arms like pulled taffy. Slaps a crowd from afar.', 'Reaches further than seems fair.', 'Hits whole crowds from across the lane.'] });
R('hopper', ['Hopper', 'Hare-Rag', 'Hopscotch'], 'basic', 'fast', {}, [{}, {}, { speedAdd: 18 }],
  { acc: '#ff9ad0', hat: 'ears' }, { unlock: 9, talents: ['atk', 'speed', 'hp', 'dodge'],
    desc: ['Bounces into the fight with a flurry of kicks.', 'Long ears, longer legs.', 'Never touches the ground for long.'] });
R('kite', ['Kite', 'Box Kite', 'Storm Kite'], 'basic', 'support', { atk: 1.3 }, [{ vs: ['drifting'], strong: 1 }, {}, { kb: 0.2 }],
  { acc: '#5fd8ff', hat: 'antenna', weapon: 'sail' }, { unlock: 13, talents: ['atk', 'hp', 'kbUp', 'procCh'],
    desc: ['Rides the wind. Strong against Drifting foes.', 'Boxier, sturdier, braver.', 'Sometimes shoves Drifting foes off the lane.'] });
R('bigwig', ['Bigwig', 'Big Bundle', 'Colossal Bundle'], 'basic', 'titan', { hp: 0.85, atk: 0.85 }, [{}, {}, {}],
  { acc: '#c49a62', hat: 'wig', size: 1.45, bulk: 1.2 }, { unlock: 17, talents: ['atk', 'hp', 'cd', 'cost', 'resKb'],
    desc: ['A towering bundle of rags with a towering wig.', 'Even more bundle.', 'The lane shakes when it walks.'] });
R('hemline', ['Hem', 'Long Hem', 'Hemline Sniper'], 'basic', 'sniper', {}, [{}, {}, { crit: 0.05 }],
  { acc: '#e2434b', hat: 'visor', weapon: 'needle' }, { unlock: 22, talents: ['atk', 'range', 'cd', 'crit'],
    desc: ['Throws a needle from very far away.', 'Longer needle, longer reach.', 'Picks off foes from the far side of the lane.'] });

/* -------------------------------------------------------------- SPECIAL */
R('thimble', ['Thimble', 'Thimble Guard', 'Thimble Bastion'], 'special', 'wall', { hp: 1.7, cost: 2, cd: 1.6, speed: 0.78, atk: 0.6 }, [{}, {}, { resist: 1, vs: ['drifting', 'shadow'] }],
  { acc: '#b8c4d4', hat: 'helm', weapon: 'shield', bulk: 1.15 }, { buy: 300, talents: ['hp', 'cd', 'resKb', 'resWeaken'],
    desc: ['Hides under a thimble. Takes hits all day.', 'Heavier helmet, braver heart.', 'Drifting and Shadow blows glance off.'] });
R('button_knight', ['Button Knight', 'Brass Knight', 'Gilt Knight'], 'special', 'brawler', { hp: 1.2 }, [{ vs: ['crimson'], kb: 0.25 }, { kb: 0.3 }, { strong: 1 }],
  { acc: '#ffc933', hat: 'helm', weapon: 'blade' }, { buy: 500, talents: ['atk', 'hp', 'kbUp', 'procCh'],
    desc: ['A knight with a button for a shield. Shoves Crimson foes.', 'Polished to a shine.', 'Strong against Crimson foes.'] });
R('pinwheel', ['Pinwheel', 'Twin Pinwheel', 'Gale Pinwheel'], 'special', 'support', { atk: 1.2 }, [{ miniwave: [0.35, 1] }, { miniwave: [0.5, 1] }, { wave: [0.25, 1], miniwave: null }],
  { acc: '#7fd6ff', hat: 'beanie', weapon: 'pinwheel' }, { buy: 700, talents: ['atk', 'procCh', 'cd', 'immWave'],
    desc: ['Spins up little ripples.', 'Two wheels, more wind.', 'Its gusts become full ripples.'] });
R('spike_cushion', ['Pincushion', 'Spiked Cushion', 'Bramble Cushion'], 'special', 'tank', { hp: 1.15, atk: 1.2 }, [{ vs: ['crimson', 'drifting'], resist: 1 }, {}, { immune: ['kb'] }],
  { acc: '#ff4d5a', hat: 'pins', body: 'round', bulk: 1.3 }, { buy: 900, talents: ['hp', 'atk', 'resWeaken', 'cd'],
    desc: ['Covered in pins. Crimson and Drifting foes hate it.', 'More pins.', 'Too spiky to shove.'] });
R('steel_spindle', ['Steel Spindle', 'Chrome Spindle', 'Mercury Spindle'], 'special', 'killer', { hp: 0.7, atk: 0.5, speed: 1.5, cost: 0.8, cd: 2.4 }, [{ crit: 0.35, vs: ['steel'], only: 1 }, { crit: 0.45 }, { crit: 0.6, steelKill: 0.15 }],
  { acc: '#e9ecf4', hat: 'antenna', weapon: 'spool', metal: 1 }, { drop: 'steelring', talents: ['crit', 'speed', 'cd', 'hp'],
    desc: ['Only fights Steel foes, and often lands Critical hits.', 'Shinier, spinnier.', 'Shreds Steel foes apart.'] });
R('lantern', ['Lantern', 'Paper Lantern', 'Harvest Lantern'], 'special', 'support', { atk: 0.6, cost: 0.7 }, [{ scrap: 1 }, {}, { strengthen: [0.5, 2] }],
  { acc: '#ffb13d', hat: 'hood', weapon: 'lantern' }, { buy: 400, talents: ['hp', 'cost', 'cd', 'speed'],
    desc: ['Foes it finishes drop double scrap.', 'Glows warmer.', 'Burns brighter when hurt.'] });

/* ----------------------------------------------------------------- RARE */
R('mitten', ['Mitten', 'Wool Mitten', 'Fur Mitten'], 'rare', 'wall', { hp: 1.35, cost: 1.3, cd: 1.2 }, [{ vs: ['drifting'], resist: 1 }, {}, { resist: 1, vs: ['drifting', 'gilded'] }],
  { acc: '#ff9ad0', hat: 'bow', bulk: 1.2 }, { talents: ['hp', 'cd', 'resKb', 'resSlow'],
    desc: ['A warm mitten that will not budge.', 'Double knit.', 'Drifting and Gilded foes barely scratch it.'] });
R('scarecrow', ['Scarecrow', 'Straw Sentry', 'Harvest Warden'], 'rare', 'brawler', { hp: 1.15 }, [{ vs: ['crimson', 'drifting'], kb: 0.3 }, {}, { strong: 1 }],
  { acc: '#ffd84a', hat: 'straw', weapon: 'staff' }, { talents: ['kbUp', 'atk', 'hp', 'procCh'],
    desc: ['Shoves Crimson and Drifting foes.', 'Sterner straw.', 'Strong against Crimson and Drifting foes.'] });
R('sockpuppet', ['Sockpuppet', 'Sock Jester', 'Sock Sorcerer'], 'rare', 'support', {}, [{ vs: ['shadow'], slow: [0.5, 3] }, {}, { slow: [0.7, 3.5] }],
  { acc: '#b46bff', hat: 'cowl' }, { talents: ['procDur', 'procCh', 'hp', 'cd'],
    desc: ['Snags Shadow foes in its sock.', 'Juggles the snag.', 'Shadow foes crawl.'] });
R('ribbon', ['Ribbon', 'Ribbon Dancer', 'Ribbon Tempest'], 'rare', 'fast', { atk: 0.7 }, [{ multi: 3, areaF: 1 }, {}, { speedAdd: 10 }],
  { acc: '#ff5ea8', hat: 'bow', weapon: 'ribbon' }, { talents: ['atk', 'speed', 'hp', 'dodge'],
    desc: ['Three ribbon lashes per attack, hitting everyone in reach.', 'Spins faster.', 'A whirlwind of silk.'] });
R('quilt', ['Quilt', 'Quilt Golem', 'Quilt Colossus'], 'rare', 'tank', { hp: 1.3 }, [{ vs: ['gilded'], resist: 1 }, {}, { tough: 1 }],
  { acc: '#45e08a', hat: 'none', body: 'round', bulk: 1.45, size: 1.15 }, { talents: ['hp', 'resKb', 'cd', 'atk'],
    desc: ['Patchwork bulk. Resistant to Gilded foes.', 'Stitched into a golem.', 'Gilded foes can hardly hurt it.'] });
R('needle', ['Needle', 'Needle Lancer', 'Needle Comet'], 'rare', 'rusher', { atk: 1.1 }, [{ crit: 0.1 }, {}, { savage: [0.3, 2.2] }],
  { acc: '#c8ff2e', hat: 'visor', weapon: 'needle' }, { talents: ['atk', 'speed', 'crit', 'survive'],
    desc: ['Charges with a huge needle.', 'A lance of steel.', 'Its blows sometimes tear clean through.'] });
R('twine', ['Twine', 'Twine Archer', 'Twine Marksman'], 'rare', 'ranger', { atk: 1.15 }, [{ vs: ['drifting'], strong: 1 }, {}, { range: 40 }],
  { acc: '#45e08a', hat: 'leaf', weapon: 'bow' }, { talents: ['atk', 'range', 'cd', 'hp'],
    desc: ['Twine bow. Strong against Drifting foes.', 'Better bow, better aim.', 'Hits from even further away.'] });
R('patch_cannon', ['Patch Cannon', 'Patch Gunner', 'Patch Artillery'], 'rare', 'ranger', { atk: 1.25, hp: 0.9 }, [{ ld: [180, 260] }, {}, { ld: [200, 320] }],
  { acc: '#ff8a3d', hat: 'helm', weapon: 'cannon' }, { talents: ['atk', 'cd', 'cost', 'hp'],
    desc: ['Lobs shots at a zone well ahead of it (long distance).', 'Bigger barrel.', 'The zone grows wider.'] });
R('felt_monk', ['Felt Monk', 'Felt Abbot', 'Felt Sage'], 'rare', 'support', {}, [{ vs: ['shadow', 'crimson'], weaken: [0.6, 3, 0.5] }, {}, { weaken: [0.8, 4, 0.5] }],
  { acc: '#ffb13d', hat: 'hood', weapon: 'staff' }, { talents: ['procCh', 'procDur', 'hp', 'cd'],
    desc: ['Frays Shadow and Crimson foes, halving their attacks.', 'Calmer, wiser.', 'Rarely misses the fray.'] });
R('cord_ram', ['Cord Ram', 'Cord Charger', 'Cord Juggernaut'], 'rare', 'brawler', { hp: 1.2, speed: 1.2 }, [{ kb: 0.22 }, {}, { kb: 0.3, immune: ['weaken'] }],
  { acc: '#c49a62', hat: 'horns' }, { talents: ['kbUp', 'hp', 'atk', 'speed'],
    desc: ['Rams anything, sometimes sending it flying.', 'Harder horns.', 'Cannot be frayed.'] });
R('wool_mage', ['Wool Mage', 'Wool Wizard', 'Wool Archmage'], 'rare', 'support', { atk: 1.25 }, [{ wave: [0.3, 1] }, {}, { wave: [0.4, 2] }],
  { acc: '#7fb0e2', hat: 'wizard', weapon: 'staff' }, { talents: ['procCh', 'atk', 'cd', 'immWave'],
    desc: ['Casts ripples down the lane.', 'Bigger ripples, more often.', 'Its ripples run twice as far.'] });
R('gauze', ['Gauze', 'Gauze Wrap', 'Gauze Keeper'], 'rare', 'killer', {}, [{ vs: ['revenant'], strong: 1, unravel: 1 }, {}, { massive: 1, strong: null }],
  { acc: '#e9ecf4', hat: 'wrap', weapon: 'none' }, { talents: ['atk', 'hp', 'cd', 'resToxic'],
    desc: ['Unraveller: Revenants it finishes stay down. Strong against Revenants.', 'Wrapped tighter.', 'Deals massive damage to Revenants.'] });
R('velvet_rogue', ['Velvet Rogue', 'Velvet Cutpurse', 'Velvet Phantom'], 'rare', 'fast', { atk: 1.2 }, [{ crit: 0.2 }, {}, { crit: 0.25, dodge: [0.25, 1], dodgeVs: 'all' }],
  { acc: '#e2434b', hat: 'mask', weapon: 'scissors' }, { talents: ['crit', 'atk', 'speed', 'dodge'],
    desc: ['Snips with sharp shears. Often Critical.', 'Quieter steps.', 'Sometimes simply is not there.'] });

/* ------------------------------------------------------------------ EPIC */
R('denim_brute', ['Denim Brute', 'Denim Bruiser', 'Denim Titan'], 'sr', 'brawler', { hp: 1.3, atk: 1.1 }, [{ savage: [0.3, 2] }, {}, { savage: [0.35, 2.5], immune: ['kb'] }],
  { acc: '#5f8fe0', hat: 'bucket', weapon: 'mallet', bulk: 1.4 }, { talents: ['atk', 'hp', 'cd', 'resWeaken'],
    desc: ['Tough denim and a savage swing.', 'Even more rivets.', 'Cannot be shoved.'] });
R('silk_blade', ['Silk Blade', 'Silk Duelist', 'Silk Ronin'], 'sr', 'killer', { atk: 1.1 }, [{ vs: ['shadow'], massive: 1 }, {}, { resist: 1 }],
  { acc: '#b46bff', hat: 'cowl', weapon: 'blade' }, { talents: ['atk', 'speed', 'cd', 'hp'],
    desc: ['Massive damage to Shadow foes.', 'A sharper edge.', 'Also resists Shadow blows.'] });
R('lace_seraph', ['Lace', 'Lace Seraph', 'Lace Archangel'], 'sr', 'ranger', { hp: 1.1 }, [{ vs: ['gilded', 'drifting'], strong: 1 }, {}, { kb: 0.25 }],
  { acc: '#ffe9a3', hat: 'halo', weapon: 'bow', wings: 1 }, { talents: ['atk', 'hp', 'range', 'kbUp'],
    desc: ['Strong against Gilded and Drifting foes.', 'Unfurls lace wings.', 'Shoves Gilded and Drifting foes.'] });
R('tweed_prof', ['Tweed', 'Tweed Professor', 'Tweed Dean'], 'sr', 'support', { range: 40 }, [{ vs: ['drifting', 'starborn'], freeze: [0.3, 2.5] }, {}, { freeze: [0.4, 3] }],
  { acc: '#5fd8ff', hat: 'tophat', weapon: 'staff' }, { talents: ['procCh', 'procDur', 'cd', 'hp'],
    desc: ['Freezes Drifting and Starborn foes.', 'Tenured.', 'Freezes more often, for longer.'] });
R('chenille_wyrm', ['Chenille', 'Chenille Wyrm', 'Chenille Dragon'], 'sr', 'titan', { hp: 0.8, atk: 0.7, cost: 0.75, cd: 0.8 }, [{ wave: [0.4, 1] }, {}, { wave: [0.5, 2] }],
  { acc: '#45e08a', hat: 'horns', size: 1.35, tail: 1 }, { talents: ['procCh', 'atk', 'hp', 'cost'],
    desc: ['A fuzzy wyrm that sends ripples.', 'Longer, fuzzier.', 'Ripples run twice as far.'] });
R('burlap', ['Burlap', 'Burlap Berserker', 'Burlap Warlord'], 'sr', 'brawler', { hp: 1.1, atk: 1.15 }, [{ strengthen: [0.5, 2], survive: 0.5 }, {}, { survive: 0.8 }],
  { acc: '#ff4d5a', hat: 'mask', weapon: 'mallet' }, { talents: ['atk', 'hp', 'survive', 'speed'],
    desc: ['Gets angrier when hurt and often hangs on.', 'More stitches, more fury.', 'Almost always hangs on.'] });
R('paisley', ['Paisley', 'Paisley Paladin', 'Paisley Templar'], 'sr', 'killer', { hp: 1.2 }, [{ vs: ['void'], strong: 1, pierce: 1 }, { breaker: 0.5 }, { massive: 1, strong: null }],
  { acc: '#b46bff', hat: 'crown', weapon: 'shield' }, { talents: ['atk', 'hp', 'cd', 'procCh'],
    desc: ['Tears away Husks and is strong against Void foes.', 'Learns to shatter barriers.', 'Massive damage to Void foes.'] });
R('calico_comet', ['Calico', 'Calico Comet', 'Calico Nova'], 'sr', 'ranger', { atk: 0.9 }, [{ surge: [0.25, 1, 200, 450] }, {}, { surge: [0.35, 2, 200, 500] }],
  { acc: '#ffb13d', hat: 'ears', weapon: 'staff' }, { talents: ['procCh', 'atk', 'cd', 'immSurge'],
    desc: ['Raises thread surges ahead of itself.', 'Brighter spots.', 'Surges hit twice.'] });

/* ---------------------------------------------------------------- MYTHIC */
R('ember', ['Ember Rag', 'Ember Lord', 'Ember Sovereign'], 'uber', 'titan', { hp: 0.8, atk: 0.85, range: 60 }, [{ vs: ['crimson'], strong: 1, surge: [0.3, 1, 220, 480] }, {}, { surge: [0.45, 2, 220, 520] }],
  { acc: '#ff6a2a', hat: 'band', fire: 1 }, { banner: 'elements', talents: ['atk', 'procCh', 'cd', 'immSurge', 'hp'],
    desc: ['A rag of living flame. Raises fire surges; strong against Crimson.', 'Hotter.', 'Its surges hit twice.'] });
R('tide', ['Tide Rag', 'Tide Lord', 'Tide Sovereign'], 'uber', 'ranger', { range: 70, hp: 1.1 }, [{ kb: 0.45 }, {}, { kb: 0.55, wave: [0.2, 1] }],
  { acc: '#2fa8ff', hat: 'band' }, { banner: 'elements', talents: ['kbUp', 'atk', 'hp', 'cd'],
    desc: ['A water whip that shoves anything it hits.', 'Deeper currents.', 'Its lashes sometimes ripple.'] });
R('gale', ['Gale Rag', 'Gale Lord', 'Gale Sovereign'], 'uber', 'fast', { atk: 1.3, speed: 1.15 }, [{ vs: ['drifting'], kb: 1, strong: 1 }, { immune: ['wave'] }, { immune: ['wave', 'slow'] }],
  { acc: '#c8ff2e', hat: 'band' }, { banner: 'elements', talents: ['speed', 'atk', 'hp', 'dodge'],
    desc: ['Always shoves Drifting foes. Strong against them.', 'Ripples pass right through it.', 'Can\'t be snagged either.'] });
R('stone', ['Stone Rag', 'Stone Lord', 'Stone Sovereign'], 'uber', 'tank', { hp: 1.35 }, [{ resist: 1, vs: TRAIT_KEYS }, {}, { immune: ['kb', 'freeze'] }],
  { acc: '#c49a62', hat: 'band', bulk: 1.45, size: 1.2 }, { banner: 'elements', talents: ['hp', 'cd', 'atk', 'resToxic'],
    desc: ['Resistant to every trait.', 'Heavier.', 'Cannot be shoved or frozen.'] });
R('rime', ['Rime Rag', 'Rime Lord', 'Rime Sovereign'], 'uber', 'support', { atk: 1.3, range: 40 }, [{ freeze: [0.35, 2.6] }, {}, { freeze: [0.45, 3] }],
  { acc: '#9ff3ff', hat: 'band' }, { banner: 'elements', talents: ['procCh', 'procDur', 'hp', 'cd'],
    desc: ['Freezes anything it hits.', 'Colder.', 'Freezes more often.'] });
R('storm', ['Storm Rag', 'Storm Lord', 'Storm Sovereign'], 'uber', 'sniper', { atk: 0.55 }, [{ multi: 3, crit: 0.2, ld: [120, 520] }, {}, { crit: 0.3 }],
  { acc: '#ffe14a', hat: 'band' }, { banner: 'elements', talents: ['crit', 'atk', 'cd', 'hp'],
    desc: ['Three lightning strikes over a wide zone ahead.', 'Louder thunder.', 'More Critical strikes.'] });
R('thorn', ['Thorn Rag', 'Thorn Lord', 'Thorn Sovereign'], 'uber', 'support', { range: 60, atk: 1.2 }, [{ slow: [0.4, 2.5], weaken: [0.3, 2.5, 0.6] }, {}, { slow: [0.55, 3] }],
  { acc: '#45e08a', hat: 'band' }, { banner: 'elements', talents: ['procCh', 'procDur', 'atk', 'hp'],
    desc: ['Vines that snag and fray anything.', 'Thornier.', 'Snags more often.'] });
R('voidrag', ['Void Rag', 'Void Lord', 'Void Sovereign'], 'uber', 'killer', { atk: 1.25 }, [{ vs: ['void', 'revenant'], massive: 1, unravel: 1, pierce: 1 }, {}, { insane: 1, massive: null }],
  { acc: '#b46bff', hat: 'band' }, { banner: 'elements', talents: ['atk', 'hp', 'cd', 'immWarp'],
    desc: ['Massive damage to Void and Revenant foes. Unraveller. Pierces Husks.', 'Darker.', 'Ruinous damage to them instead.'] });
R('radiance', ['Radiance Rag', 'Radiance Lord', 'Radiance Sovereign'], 'uber', 'killer', { atk: 0.6, speed: 1.3 }, [{ vs: ['shadow', 'gilded'], massive: 1, multi: 3 }, {}, { dodge: [0.3, 1] }],
  { acc: '#fff6d6', hat: 'band' }, { banner: 'elements', talents: ['atk', 'speed', 'dodge', 'cd'],
    desc: ['Fast blade combo. Massive damage to Shadow and Gilded foes.', 'Brighter.', 'Sidesteps their blows.'] });
R('chrono', ['Chrono Rag', 'Chrono Lord', 'Chrono Sovereign'], 'uber', 'support', { atk: 1.1, cd: 1.3 }, [{ freeze: [1, 1.2] }, {}, { freeze: [1, 1.6] }],
  { acc: '#ffc933', hat: 'band' }, { banner: 'elements', talents: ['procDur', 'cd', 'hp', 'atk'],
    desc: ['Every hit stops time for its target.', 'Longer stops.', 'Even longer.'] });
R('gravity', ['Gravity Rag', 'Gravity Lord', 'Gravity Sovereign'], 'uber', 'brawler', { hp: 1.3, atk: 1.3 }, [{ omni: 160, kb: 0.4 }, { immune: ['warp'] }, { kb: 0.5, immune: ['warp', 'kb'] }],
  { acc: '#7f6bff', hat: 'band' }, { banner: 'elements', talents: ['kbUp', 'atk', 'hp', 'cd'],
    desc: ['Pulls blows from both sides (omni strike) and often shoves.', 'Immune to Warp.', 'Can\'t be shoved either.'] });
R('echo', ['Echo Rag', 'Echo Lord', 'Echo Sovereign'], 'uber', 'ranger', { atk: 0.75 }, [{ wave: [1, 1], waveBlock: 1 }, {}, { wave: [1, 2] }],
  { acc: '#ff9ad0', hat: 'band' }, { banner: 'elements', talents: ['atk', 'cd', 'hp', 'immWave'],
    desc: ['Every clap sends a ripple. Stops foe ripples.', 'Louder.', 'Ripples run twice as far.'] });

/* ---------------------------------------------------------------- LEGEND */
R('dragon', ['Dragon Rag', 'Dragon Regent', 'Dragon Eternal'], 'legend', 'titan', { range: 80 }, [{ surge: [1, 2, 160, 560], vs: ['crimson'], insane: 1 }, {}, { surge: [1, 3, 160, 600] }],
  { acc: '#ffc933', hat: 'horns', size: 1.5, tail: 1, wings: 1, fire: 1 }, { banner: 'legend', talents: ['atk', 'hp', 'cd', 'immSurge'],
    desc: ['Every breath raises a fire surge. Ruinous to Crimson foes.', 'Greater wings.', 'Three-hit surges.'] });
R('midas', ['Midas Rag', 'Midas Regent', 'Midas Eternal'], 'legend', 'brawler', { hp: 1.3, atk: 1.25 }, [{ scrap: 1, savage: [0.5, 2.5], steelKill: 0.2 }, {}, { crit: 0.2 }],
  { acc: '#ffc933', hat: 'crown', weapon: 'mallet', gold: 1 }, { banner: 'legend', talents: ['atk', 'hp', 'cd', 'crit'],
    desc: ['Turns foes to scrap: double drops, savage swings, shreds Steel.', 'More gold.', 'Critical hits too.'] });
R('glitch', ['Glitch Rag', 'Glitch Regent', 'Glitch Eternal'], 'legend', 'fast', { atk: 1.3, hp: 1.2 }, [{ kb: 0.2, freeze: [0.2, 2], slow: [0.2, 2], weaken: [0.2, 2, 0.5] }, {}, { curse: [0.3, 3], immune: ['curse', 'warp'] }],
  { acc: '#5fd8ff', hat: 'band', glitch: 1 }, { banner: 'legend', talents: ['procCh', 'atk', 'speed', 'hp'],
    desc: ['Random errors: shoves, freezes, snags and frays anything.', 'More errors.', 'Hexes foes too.'] });

/* ---------------------------------------------------------------- build */
function merge(a, b) {
  const o = { ...a };
  for (const k in b) { if (b[k] === null) delete o[k]; else o[k] = b[k]; }
  return o;
}
// dye cost for the third form, by rarity
const DYES = ['red', 'blue', 'green', 'gold', 'violet'];
function dyeCost(d, i) {
  const n = { basic: 2, special: 3, rare: 4, sr: 5, uber: 6, legend: 8 }[d.rarity];
  const a = DYES[i % 5], b = DYES[(i + 2) % 5];
  const c = { [a]: n, [b]: Math.ceil(n / 2) };
  if (d.rarity === 'uber' || d.rarity === 'legend') c.prism = 1;
  return c;
}

export const RAGS = {};
LIST.forEach((d, i) => {
  const A = ARCH[d.arch], rr = RARITY[d.rarity], t = d.t;
  let ab = {};
  d.forms = d.names.map((name, f) => {
    ab = merge(ab, d.ab[f] || {});
    const m = FORM_MULT[f];
    const extraRange = (ab.range || 0);
    return {
      name, f,
      hp: Math.round(A.hp * rr.stat * (t.hp || 1) * m),
      atk: Math.round(A.atk * rr.stat * (t.atk || 1) * m),
      range: Math.round(A.range + (t.range || 0) + FORM_RANGE[f] + extraRange),
      speed: Math.round(A.speed * (t.speed || 1) + (ab.speedAdd || 0)),
      freq: A.freq * (t.freq || 1), fs: A.fs,
      kb: A.kb, area: ab.areaF ? 1 : A.area,
      cost: Math.round(A.cost * rr.cost * (t.cost || 1) / 5) * 5,
      cd: +(A.cd * rr.cd * (t.cd || 1)).toFixed(2),
      ab: { ...ab },
      desc: d.desc ? d.desc[f] : '',
    };
  });
  d.dyes = dyeCost(d, i);
  d.order = i;
  d.look = { body: '#ece6dc', shade: '#b9b1a4', eye: '#9ff3ff', size: 1, bulk: 1, hat: 'none', weapon: 'none', ...d.look };
  RAGS[d.id] = d;
});
export const RAG_IDS = LIST.map(d => d.id);
export const STARTER = 'stitch';
// basics unlock when the story stage with this index (chapter 1) is cleared (unlock: 0 = from the start)
export const BASIC_UNLOCKS = LIST.filter(d => d.unlock !== undefined).map(d => [d.unlock, d.id]);
