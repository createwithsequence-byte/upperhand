# Pedersen & Houpt Proposal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-page web proposal (plus a downloadable PDF of it) that sells Pedersen & Houpt a $50,000, ten-week website rebuild.

**Architecture:** Static site. `data.js` is the single source of every number (line items, payments, phases, goals) and is read by both the page script and the check script, so the quote, the timeline and the PDF can never disagree. `check.mjs` is the render contract: it fails the build on a bad sum, a dead nav link, an em dash or a client name. `build.mjs` runs the check, then renders the PDF with Playwright.

**Tech Stack:** HTML, CSS, vanilla ES modules, three.js r170 (vendored), Playwright (from `~/code/proposal-engine/node_modules`), Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-09-24-pedersen-houpt-proposal-design.md`

## Global Constraints

- Fixed fee is exactly $50,000; line items and the three payments each sum to it.
- Payments: $20,000 at signing, $15,000 at Milestone 1 (design approved, end of week 5), $15,000 at Milestone 2 (launch, week 10).
- Phases: Discovery weeks 1-2, Design 2-5, Content 4-6, Development 5-9, Launch 9-10, Beyond launch after week 10.
- Nav order: Goals, Services, Content, Timeline, Investment, About, then Download PDF.
- No em dashes anywhere visible. No Upperhand client names (Songfinch, Tangible Formats, Moo V Night, FisherFit, Mr. D's, Dear Medley, Troglia). No "AI". No competitor quote.
- Upperhand tokens: ink #131313, paper #f4f2ec, bone #ebe8df, blue #0047ff. Display Archivo Black caps; body Hanken Grotesk; labels JetBrains Mono. The firm's red #AB1E23 and Newsreader appear only inside firm artifacts.
- Every response carries `X-Robots-Tag: noindex, nofollow`.
- `prefers-reduced-motion: reduce` gets a fully readable static page.

## Review Focus

1. A reader on a phone (375px): the sticky Gantt must collapse to a horizontal strip above the phase cards, never overlap them, and the page must never scroll sideways.
2. WebGL unavailable or failing mid-init: the static deal-toy PNG must show, with no console error left uncaught.
3. Someone toggles every optional item on and off: the monthly total returns to $0 and the one-time total never changes from $50,000.
4. Print or PDF: no nav, no spine, no canvas, no half-cut cards; each major section starts on its own page.
5. A deep link straight to `#investment`: the sticky nav must not cover the section heading (scroll-margin).

---

### Task 1: Data and the render contract

**Files:**
- Create: `pedersen-houpt-proposal/data.js`
- Create: `pedersen-houpt-proposal/check.mjs`

**Interfaces:**
- Produces: `export const QUOTE = { total, lines:[{id,name,amount,detail[]}], payments:[{id,label,when,amount,week}], optional:[{id,name,price,unit,detail}] }`, `export const PHASES = [{id,n,name,start,end,expect[],need[],get[],milestone?}]`, `export const GOALS = [{label,today,target,note}]`, `export const NAV = [{id,label}]`.
- Produces: `node check.mjs` exits 1 with a list of failures; `node check.mjs --selftest` proves each rule fails on a planted bad input.

- [ ] **Step 1: Write check.mjs with the rules and a selftest**

```js
// check.mjs: the proposal's render contract. Build fails if any rule fails.
import { readFileSync } from 'node:fs';
import { QUOTE, PHASES, NAV } from './data.js';
const NAMES = ['Songfinch','Tangible Formats','Moo V Night','FisherFit',"Mr. D's",'Dear Medley','Troglia'];
export function rules({ quote, phases, nav, html }) {
  const f = [];
  const sum = a => a.reduce((s, x) => s + x.amount, 0);
  if (sum(quote.lines) !== quote.total) f.push(`line items sum to ${sum(quote.lines)}, total is ${quote.total}`);
  if (sum(quote.payments) !== quote.total) f.push(`payments sum to ${sum(quote.payments)}, total is ${quote.total}`);
  for (const n of nav) if (!html.includes(`id="${n.id}"`)) f.push(`nav link #${n.id} has no section`);
  for (const p of phases) if (p.end < p.start) f.push(`phase ${p.id} ends before it starts`);
  for (const m of quote.payments) if (m.week != null && !phases.some(p => p.milestone === m.id)) f.push(`payment ${m.id} is on no phase`);
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  if (text.includes('—')) f.push('em dash in page copy');
  for (const n of NAMES) if (text.includes(n)) f.push(`client name in copy: ${n}`);
  if (/\bAI\b/.test(text.replace(/<[^>]+>/g, ' '))) f.push('"AI" in page copy');
  return f;
}
if (process.argv.includes('--selftest')) {
  const ok = { quote: QUOTE, phases: PHASES, nav: NAV, html: NAV.map(n => `<section id="${n.id}">`).join('') };
  const bad = [
    { ...ok, quote: { ...QUOTE, total: QUOTE.total + 1 } },
    { ...ok, html: '' },
    { ...ok, html: ok.html + 'a — b' },
    { ...ok, html: ok.html + 'Songfinch' },
    { ...ok, html: ok.html + 'we use AI' },
  ];
  if (rules(ok).length) throw new Error('selftest: clean input failed: ' + rules(ok).join('; '));
  bad.forEach((b, i) => { if (!rules(b).length) throw new Error(`selftest: planted fault ${i} passed`); });
  console.log('check selftest: 6/6');
} else {
  const f = rules({ quote: QUOTE, phases: PHASES, nav: NAV, html: readFileSync(new URL('./index.html', import.meta.url), 'utf8') });
  if (f.length) { console.error('[CHECK] FAIL\n- ' + f.join('\n- ')); process.exit(1); }
  console.log('[CHECK] pass');
}
```

- [ ] **Step 2: Run the selftest, expect it to fail** (no data.js yet)

Run: `node check.mjs --selftest` → Expected: `ERR_MODULE_NOT_FOUND ... data.js`

- [ ] **Step 3: Write data.js with the spec's numbers** (spec §5, §6, §7 verbatim)

- [ ] **Step 4: Run the selftest, expect `check selftest: 6/6`**

- [ ] **Step 5: Commit** `git add pedersen-houpt-proposal/{data.js,check.mjs} && git commit -m "proposal: data + render contract"`

### Task 2: The page, readable with no script

**Files:**
- Create: `pedersen-houpt-proposal/index.html`, `styles.css`, `vercel.json`, `fonts/`, `img/`

**Interfaces:**
- Consumes: section ids from `NAV`.
- Produces: markup hooks used by Task 3-5: `#toy` (canvas host, contains `img.toy-fallback`), `.gantt` with `.bar[data-phase]` and `.pay[data-pay]`, `.phase[data-phase]`, `.line[data-line]`, `input[data-opt]`, `#monthly`, `.count[data-to]`, `.ba` (before/after), `.wall` (portrait wall).

- [ ] **Step 1:** Write all eight sections with final copy; every price, week and payment rendered from the same values as `data.js` (the page script re-renders the quote from data at load; the static HTML carries the same numbers for no-script readers and for the checker).
- [ ] **Step 2:** `vercel.json` headers: `X-Robots-Tag: noindex, nofollow` on `/(.*)`.
- [ ] **Step 3:** Run `node check.mjs` → Expected `[CHECK] pass`.
- [ ] **Step 4:** Open in the Browser pane at 1440 and 375; measure `document.documentElement.scrollWidth <= innerWidth`.
- [ ] **Step 5:** Commit.

### Task 3: The deal toy (three.js)

**Files:** Create `pedersen-houpt-proposal/toy.js`, `vendor/three.module.min.js`, `img/toy.png`

**Interfaces:** Consumes `#toy`. Produces `mountToy(host): () => void` (returns a dispose function). On any throw, leaves `img.toy-fallback` visible.

- [ ] **Step 1:** MeshPhysicalMaterial block (transmission 1, ior 1.49, thickness 1.2, roughness 0.06, clearcoat), rounded edges via RoundedBoxGeometry, engraved faces from a canvas texture on an inner plane, a Clark Street backdrop plane for the refraction, RoomEnvironment through PMREM. Pointer tilts it; idle drift; paused off-screen by IntersectionObserver; DPR capped at 1.75.
- [ ] **Step 2:** Reduced motion: render one frame, no loop.
- [ ] **Step 3:** Capture `img/toy.png` from the canvas for print and fallback.
- [ ] **Step 4:** Verify in the pane: no console errors; `WebGLRenderingContext` absent (force via `?nogl`) shows the PNG.
- [ ] **Step 5:** Commit.

### Task 4: Motion and interaction

**Files:** Create `pedersen-houpt-proposal/app.js`

- [ ] **Step 1:** Reveal on view (IntersectionObserver, `.rv` → `.in`), counters (`.count[data-to]`), hero parallax (transform only, rAF, off under reduced motion).
- [ ] **Step 2:** Gantt playhead: progress of `#timeline` through the viewport maps to week 0-11; the phase card nearest the viewport centre sets `.on` on its bar.
- [ ] **Step 3:** Quote: line rows expand; optional toggles recompute `#monthly`; one-time total stays fixed. Test in the pane: toggle all on, all off, read `#monthly` = `$0`.
- [ ] **Step 4:** Before/after slider (pointer + keyboard arrows, `role="slider"`), portrait wall toggle (`aria-pressed`).
- [ ] **Step 5:** Commit.

### Task 5: Print and PDF

**Files:** Create `pedersen-houpt-proposal/print.css`, `build.mjs`

- [ ] **Step 1:** `@media print`: Letter, 0.5in margins, hide nav/spine/canvas/controls, show `img/toy.png`, `break-before: page` on each section, `break-inside: avoid` on cards and line items, Gantt drawn static with all bars on.
- [ ] **Step 2:** `build.mjs`: run `check.mjs --selftest` and `check.mjs`, serve the folder on a free port, Playwright `page.pdf({format:'Letter', printBackground:true})` to `pedersen-houpt-proposal.pdf`, then assert the PDF has 8 to 16 pages.
- [ ] **Step 3:** Open the PDF and look at every page.
- [ ] **Step 4:** Commit.

### Task 6: Deploy to a preview

- [ ] **Step 1:** `vercel project add pedersen-houpt-proposal --scope getupperhand`; first deploy is a one-line noindex placeholder (it lands on the public alias).
- [ ] **Step 2:** Real build with plain `vercel deploy` (preview). Verify `curl -sI` shows `x-robots-tag: noindex, nofollow` and the PDF answers 200.
- [ ] **Step 3:** Post the preview URL.

### Task 7: Gates

- [ ] insane-design pass on hero and timeline. THE EYE with an honest score. THE SEAM on what is missing. MIRROR against John's notes. SEND ledger: HELD with Greg.
