// Loads the game headlessly and prints any console / page errors. Run: node tools/errs.mjs
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
page.on('requestfailed', r => errors.push('reqfail: ' + r.url()));
await page.route('http://rag.test/**', route => {
  const u = new URL(route.request().url()), f = path.join(ROOT, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f)) { errors.push('404 ' + u.pathname); return route.fulfill({ status: 404, body: 'nf' }); }
  route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
});
await page.goto('http://rag.test/index.html');
await page.waitForTimeout(1200);
console.log(errors.join('\n') || 'no errors');
await browser.close();
