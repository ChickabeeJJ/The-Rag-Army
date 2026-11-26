// Small regression checks for rules that are easy to break. Run: node tools/checks.mjs
import { Battle, STEP } from '../js/battle.js';
import { S, draw, unitStats } from '../js/save.js';
import { finish } from '../js/game.js';
import { storyStage, legendStage } from '../js/data/stages.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };

// drawing zero is refused and costs nothing
const t0 = S.ticket; S.ticket = 0;
ok(draw(0, 'ticket') === null && S.ticket === 0, 'zero ticket draw is refused');
S.ticket = t0;

// a stage rule time limit ends the battle
const leg = legendStage(0, 2, 3, 0); leg.rules = { timeLimit: 5 };
const lb = new Battle(leg, [unitStats('stitch', {}, { lv: 1 })], { seed: 1 });
for (let t = 0; t < 6; t += STEP) lb.update(STEP);
ok(lb.result === 'lose', 'rule time limit ends the battle as a loss');

// settling a continued battle twice does not double count
const st = storyStage(0, 0, 0);
const b = new Battle(st, [unitStats('stitch', {}, { lv: 1 })], { seed: 1 });
b.stats.kills = 10; b.stats.deploys = 4; b.stats.cannons = 1; b.result = 'lose';
const k0 = S.stats.kills, d0 = S.missions.prog.d_deploy || 0;
finish(st, b, { items: {}, B: {}, o: {} });
b.stats.kills = 15; b.stats.deploys = 6; b.result = 'lose';
finish(st, b, { items: {}, B: {}, o: {} });
ok(S.stats.kills - k0 === 15, 'kills counted once across a continue (' + (S.stats.kills - k0) + ')');
ok((S.missions.prog.d_deploy || 0) - d0 === 6, 'deploy mission progresses (' + ((S.missions.prog.d_deploy || 0) - d0) + ')');
ok((S.missions.prog.d_cannon || 0) >= 1, 'cannon mission progresses');

// a win advances the story and grants thread
const th = S.thread; b.result = 'win';
const sum = finish(st, b, { items: {}, B: {}, o: {} });
ok(S.story[0] === 1 && S.thread > th && sum.win, 'win advances the story and grants thread');
ok(sum.unlocked.includes('bolster'), 'clearing stage 1 unlocks Bolster');
console.log(fails ? fails + ' failed' : 'all checks passed');
process.exit(fails ? 1 : 0);
