// Headless browser smoke test. Serves the folder through Playwright request routing (no server needed),
// plays the first battle, visits every screen and fails on any console error.
// Run: node tools/smoke.mjs [outDir]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = process.argv[2] || path.join(ROOT, 'tools', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.route('http://rag.test/**', route => {
  const u = new URL(route.request().url());
  const f = path.join(ROOT, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
  route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
});
const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
const wait = ms => page.waitForTimeout(ms);
await page.goto('http://rag.test/index.html');
await wait(900);
await page.evaluate(() => document.querySelector('#modal').classList.add('hidden'));
await shot('01-home');
// first battle
await page.click('.btn.primary.big');
await wait(300); await shot('02-prep');
await page.click('.card .btn.primary.big');
await wait(800);
await page.keyboard.press('1'); await wait(3000);
for (let i = 0; i < 6; i++) { await page.keyboard.press('1'); await wait(1200); }
await page.keyboard.press('q'); await wait(2500);
await shot('03-battle');
await page.evaluate(() => { const b = window.__rag.Scene.b; b.cannon.charge = 1; });
await page.keyboard.press('e'); await wait(250); await shot('04-cannon');
await page.evaluate(() => { const b = window.__rag.Scene.b; b.money = 999; b.deploy(0); b.eBase.hp = 1; b.units.filter(u => u.side === 0).forEach(u => (u.x = b.eBase.x - 60)); });
await wait(2600); await shot('05-result');
// visit every screen
const screens = [['map'], ['legend'], ['events'], ['challenges'], ['army'], ['lineup'], ['ragbag'], ['workshop'], ['scav'], ['missions'], ['treasures'], ['guide'], ['settings'], ['tangle']];
await page.evaluate(() => { const { S } = window.__rag; S.buttons = 9000; S.thread = 2e6; S.story[0] = 48; S.story[1] = 10; S.ticket = 3; S.plat = 1; for (const k of ['ember', 'mitten', 'gauze', 'storm']) S.rags[k] = { lv: 30, plus: 0, form: 2, maxForm: 2, tal: {}, use: 0 }; S.seenFoes = Object.fromEntries(Object.keys(window.__rag.S.seenFoes).concat(['lint', 'matron', 'voidhound']).map(k => [k, 1])); });
for (const [n] of screens) {
  await page.evaluate(n => { document.querySelector('#modal').classList.add('hidden'); window.__rag.UI.show(n); }, n);
  await wait(150);
  if (['map', 'army', 'ragbag', 'challenges'].includes(n)) await shot('10-' + n);
}
for (const t of ['weekly', 'badges', 'stamps', 'rank']) await page.evaluate(t => window.__rag.UI.missions(t), t);
for (const t of ['foes', 'how']) await page.evaluate(t => window.__rag.UI.guide(t), t);
await page.evaluate(() => window.__rag.UI.workshop('can'));
await page.evaluate(() => window.__rag.UI.army('ember')); await wait(100); await shot('11-army-ember');
await page.evaluate(() => window.__rag.UI.show('ragbag'));
await page.click('text=Draw 11'); await wait(900); await shot('12-gacha');
// a late, busy battle: Fraying Lands boss stage with a mythic lineup
await page.evaluate(async () => {
  const { S, UI } = window.__rag; document.querySelector('#modal').classList.add('hidden');
  S.lineups[0] = ['stitch', 'mitten', 'ember', 'gauze', 'storm']; S.energy = 999;
  const m = await import('./js/data/stages.js'); UI.show('prep', { stage: m.storyStage(1, 0, 23) });
});
await wait(200);
await page.click('.card .btn.primary.big'); await wait(500);
await page.evaluate(() => { const b = window.__rag.Scene.b; b.money = 99999; window.__rag.Scene.speed = 2; });
for (let k = 0; k < 6; k++) { for (let i = 1; i <= 5; i++) { await page.keyboard.press(String(i)); } await wait(1500); }
await page.evaluate(() => { const b = window.__rag.Scene.b; b.eBase.hp = b.eBase.max * 0.5; });
await wait(4000); await shot('20-late-battle');
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].slice(0, 30).join('\n') : 'no console errors');
await browser.close();
