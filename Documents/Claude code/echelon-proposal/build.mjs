// build.mjs: check the contract, then render echelon-v0-proposal.pdf from the page's print stylesheet.
//   node build.mjs
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT = 'echelon-v0-proposal.pdf';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/gugumax/code/proposal-engine/node_modules/playwright');

execFileSync('node', ['check.mjs', '--selftest'], { cwd: ROOT, stdio: 'inherit' });
execFileSync('node', ['check.mjs'], { cwd: ROOT, stdio: 'inherit' });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
  if (path.startsWith('..')) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join(ROOT, path))); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/?print`;

const browser = await chromium.launch();
try {
  // 1200 wide at 80% fills a landscape Letter page, so print lays out on the desktop grid
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('requestfailed', r => errs.push('failed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errs.push(`${r.status()}: ${r.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__proposal?.ready);
  // every image decoded before printing, or the PDF carries blank frames
  await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'Letter', landscape: true, printBackground: true, scale: 0.8, preferCSSPageSize: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (errs.length) throw new Error('[BUILD] page errors: ' + errs.join(' | '));
  // render contract: a link to the build machine inside the PDF is a dead link for the client
  if (/\/URI\s*\((https?:\/\/(127\.0\.0\.1|localhost)[^)]*)\)/.test(pdf.toString('latin1'))) throw new Error('[BUILD] PDF contains links to the local build server');
  if (pages < 10 || pages > 30) throw new Error(`[BUILD] PDF has ${pages} pages; expected 10 to 30`);
  await writeFile(join(ROOT, OUT), pdf);
  console.log(`[BUILD] ${OUT}: ${pages} pages, ${(pdf.length / 1024 / 1024).toFixed(1)} MB`);
} finally {
  await browser.close();
  server.close();
}
