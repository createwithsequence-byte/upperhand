const { chromium } =
  await import("/Users/gugumax/code/uh-blocks/node_modules/playwright-core/index.mjs");
const [url, out] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 120));
});
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2200);
const n = await page.evaluate(
  () => document.querySelectorAll("#deck .slide").length,
);
for (let i = 0; i < n; i++) {
  await page.evaluate((i) => {
    go(i);
  }, i);
  await page.waitForTimeout(1100);
  const ov = await page.evaluate((i) => {
    const s = document.querySelectorAll("#deck .slide")[i];
    const inner = s.querySelector(".inner");
    return {
      sh: s.scrollHeight,
      ch: s.clientHeight,
      ih: inner ? inner.scrollHeight : 0,
    };
  }, i);
  await page.screenshot({
    path: `${out}/s${String(i + 1).padStart(2, "0")}.jpg`,
    type: "jpeg",
    quality: 72,
  });
  process.stdout.write(
    `${i + 1}/${n} slide ${ov.sh}/${ov.ch} inner ${ov.ih}${ov.ih > ov.ch + 4 ? "  SCROLLS" : ""}\n`,
  );
}
console.log("errors:", JSON.stringify(errors.slice(0, 8)));
await browser.close();
