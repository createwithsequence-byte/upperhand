import { createRequire } from 'node:module';
const require = createRequire(process.env.PW_CORE || '/Users/gugumax/code/uh-blocks/node_modules/playwright-core/package.json');
const { chromium } = require('playwright-core');
const peers = [
  ['gronda','https://gronda.com/'],
  ['staff-canteen','https://www.thestaffcanteen.com/'],
  ['code-hospitality','https://www.codehospitality.co.uk/'],
  ['majc','https://majc.ai/majc-community/'],
  ['culinary-agents','https://culinaryagents.com/'],
  ['chefs-roll','https://chefsroll.com/'],
  ['burnt-chef','https://www.theburntchefproject.com/'],
];
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const out = [];
for (const [slug, url] of peers) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36' });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3500);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' }).catch(()=>{});
    const title = await page.title();
    await page.screenshot({ path: `${slug}.jpg`, type: 'jpeg', quality: 80, animations: 'disabled', timeout: 20000 });
    out.push({ slug, url, title, ok: true });
  } catch (e) { out.push({ slug, url, ok: false, err: String(e).slice(0, 120) }); }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
