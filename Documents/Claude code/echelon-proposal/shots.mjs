// shots.mjs: viewport screenshots at real sizes (the Browser pane's emulation returns stale frames).
//   node shots.mjs [url] [outdir]      desktop 1440x900 + phone 390x844, one frame per screen of scroll
//   node shots.mjs --card [--back]     capture img/card.webp (or card-back.webp), the stills used for print, no-WebGL and About
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/gugumax/code/proposal-engine/node_modules/playwright');

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http')) || 'http://localhost:4497/';
const out = args.find(a => a.startsWith('/')) || '/private/tmp/claude-501/-Users-gugumax-Documents-Claude-code/5c3069ce-adf2-4a75-a83c-e1f039a472e0/scratchpad/ech-shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });

if (args.includes('--card')) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 1.2 });
  const back = args.includes('--back');
  await page.goto(url + (back ? '?snap&back' : '?snap'), { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.cover{display:block!important;padding:0!important;max-width:none!important}.cover-txt,.topnav,.stage-tag,.cover-photo{display:none!important}.cover-img::before{display:none!important}.stage{width:1000px!important;height:1000px!important;max-height:none!important;border-radius:0!important;background:none!important;box-shadow:none!important}' });
  await page.waitForFunction(() => window.__card, null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => window.__card.snap());
  const name = back ? 'card-back.webp' : 'card.webp';
  writeFileSync(new URL('./img/' + name, import.meta.url), Buffer.from(data.split(',')[1], 'base64'));
  console.log('[SHOTS] img/' + name + ' written');
  await browser.close();
  process.exit(0);
}

const only = args.find(a => a.startsWith('--only='))?.slice(7);
for (const [name, vp, mobile] of [['d', { width: 1440, height: 900 }, false], ['m', { width: 390, height: 844 }, true]]) {
  if (only && only !== name) continue;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  let i = 0;
  for (let y = 0; y < H; y += Math.round(vp.height * 0.9)) {
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${name}-${String(i++).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
  }
  console.log(`[SHOTS] ${name}: ${i} frames, height ${H}, scrollWidth ${sw} vs ${vp.width}${errs.length ? ', errors: ' + errs.join(' | ') : ''}`);
  await ctx.close();
}
await browser.close();
