// bench.mjs: the instrument. Measures the page instead of eyeballing it.
//   node bench.mjs [url]   (default http://localhost:4496/)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/gugumax/code/proposal-engine/node_modules/playwright');
const url = process.argv.find(a => a.startsWith('http')) || 'http://localhost:4496/';
const browser = await chromium.launch();

const probe = () => {
  const vis = e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const textEls = [...document.querySelectorAll('main h1,main h2,main h3,main h4,main p,main li,main dt,main dd,main th,main td,main a,main button,main span,main b,main small,figcaption')]
    .filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  const fam = {}, sizes = new Set();
  for (const e of textEls) { const s = getComputedStyle(e); const f = s.fontFamily.split(',')[0].replace(/"/g, ''); fam[f] = (fam[f] || 0) + 1; sizes.add(Math.round(parseFloat(s.fontSize))); }
  // text sticking out past the viewport, or clipped inside its box
  const W = document.documentElement.clientWidth;
  const outside = textEls.filter(e => { const r = e.getBoundingClientRect(); return r.right > W + 1 || r.left < -1; }).map(e => e.tagName + ':' + e.textContent.trim().slice(0, 40));
  // colliding leaf blocks: two text blocks whose boxes overlap and neither contains the other
  const blocks = [...document.querySelectorAll('main h1,main h2,main h3,main h4,main p,main li,figcaption,main img,.btn,.ph-pay')].filter(vis);
  const rects = blocks.map(e => [e, e.getBoundingClientRect()]);
  const hits = [];
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [b, rb] = rects[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 6 && oy > 6) {
      // images deliberately layered (stage, before/after, wall, duo) are allowed
      const layered = [a, b].some(e => e.closest('.stage,.ba-frame,.wall-grid,.duo,.sheet'));
      if (!layered) hits.push(`${a.tagName}.${a.className || ''}[${a.textContent.trim().slice(0, 24)}] × ${b.tagName}.${b.className || ''}[${b.textContent.trim().slice(0, 24)}]`);
    }
  }
  // heading orphans: last line holds one short word
  const orphans = [];
  for (const h of [...document.querySelectorAll('main h1,main h2,main h3,main h4')].filter(vis)) {
    const range = document.createRange(); range.selectNodeContents(h);
    const lines = [...range.getClientRects()].reduce((m, r) => { const k = Math.round(r.top); m[k] = (m[k] || 0) + r.width; return m; }, {});
    const ws = Object.values(lines); const hw = h.getBoundingClientRect().width;
    if (ws.length > 1 && ws[ws.length - 1] < hw * 0.18) orphans.push(h.textContent.trim().slice(0, 50));
  }
  // small text contrast
  const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  // only an rgba() alpha of 0 is transparent; rgb(255, 107, 0) is opaque orange
  const bgOf = e => { while (e) { const c = getComputedStyle(e).backgroundColor; if (c && !/^rgba\(.*,\s*0\)$/.test(c)) return c; e = e.parentElement; } return 'rgb(244, 242, 236)'; };
  const low = [];
  for (const e of textEls) {
    const s = getComputedStyle(e); if (parseFloat(s.fontSize) > 15) continue;
    if (s.color.split(',').length > 3 && parseFloat(s.color.split(',')[3]) < 0.5) continue;
    const L1 = lum(s.color), L2 = lum(bgOf(e)); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (cr < 4.5) low.push(`${cr.toFixed(2)} ${Math.round(parseFloat(s.fontSize))}px "${e.textContent.trim().slice(0, 30)}"`);
  }
  // images drawn larger than their pixels
  const dpr = devicePixelRatio;
  const soft = [...document.images].filter(vis).filter(i => i.naturalWidth && i.getBoundingClientRect().width * dpr > i.naturalWidth * 1.15 && !i.src.endsWith('.svg')).map(i => `${i.src.split('/').pop()} drawn ${Math.round(i.getBoundingClientRect().width * dpr)} of ${i.naturalWidth}`);
  const words = document.querySelector('main').innerText.split(/\s+/).filter(Boolean).length;
  return { fam, sizes: [...sizes].sort((a, b) => a - b), outside, hits: [...new Set(hits)].slice(0, 30), orphans, low: [...new Set(low)].slice(0, 30), soft, words };
};

for (const [name, vp, mobile] of [['desktop 1440', { width: 1440, height: 900 }, false], ['tablet 1024', { width: 1024, height: 768 }, false], ['phone 390', { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  // walk the page the way a reader does, so every reveal gets its chance to fire
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= H; y += 300) { await page.mouse.wheel(0, 300); await page.waitForTimeout(60); }
  await page.waitForTimeout(1200);
  const stuck = await page.evaluate(() => [...document.querySelectorAll('.rv:not(.in)')].map(e => e.className + ' ' + e.textContent.trim().slice(0, 30)));
  // every nav link: is the section heading hidden under the sticky nav after the jump?
  const covered = [];
  for (const id of ['goals', 'services', 'content', 'timeline', 'investment', 'about']) {
    await page.evaluate(i => { document.documentElement.style.scrollBehavior = 'auto'; location.hash = ''; document.getElementById(i).scrollIntoView(); }, id);
    await page.waitForTimeout(150);
    const r = await page.evaluate(i => { const h = document.querySelector('#' + i + ' .h2, #' + i + ' h2'); const n = document.querySelector('.pillnav').getBoundingClientRect(); return [Math.round(h.getBoundingClientRect().top), Math.round(n.bottom)]; }, id);
    if (r[0] < r[1]) covered.push(`#${id} heading at ${r[0]} under nav bottom ${r[1]}`);
  }
  await page.evaluate(() => scrollTo(0, 0));
  const m = await page.evaluate(probe);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(`\n══ ${name} ══  height ${H}px (${(H / vp.height).toFixed(1)} screens), scrollWidth ${sw}, words ${m.words} (~${Math.round(m.words / 238)} min read)`);
  console.log('fonts by element count:', JSON.stringify(m.fam));
  console.log('distinct font sizes:', m.sizes.length, m.sizes.join(' '));
  if (m.outside.length) console.log('OFF-SCREEN TEXT:', m.outside.join(' | '));
  if (m.hits.length) console.log('COLLISIONS:', '\n  ' + m.hits.join('\n  '));
  if (m.orphans.length) console.log('HEADING ORPHANS:', m.orphans.join(' | '));
  if (m.low.length) console.log('LOW CONTRAST (<4.5, ≤15px):', '\n  ' + m.low.join('\n  '));
  if (m.soft.length) console.log('UPSCALED IMAGES:', m.soft.join(' | '));
  if (stuck.length) console.log('REVEALS THAT NEVER FIRED:', stuck.length, stuck.slice(0, 6).join(' | '));
  if (covered.length) console.log('NAV COVERS:', covered.join(' | '));
  if (errs.length) console.log('CONSOLE:', [...new Set(errs)].join(' | '));
  await ctx.close();
}
await browser.close();
