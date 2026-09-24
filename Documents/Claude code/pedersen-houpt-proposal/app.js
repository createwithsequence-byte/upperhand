// app.js: draws the data-driven parts (Gantt, quote, payments, options) from data.js,
// then runs the page's motion. Everything readable still renders with motion off.
import { QUOTE, PHASES, money, weeks } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const printing = new URLSearchParams(location.search).has('print');
const SPAN = 12; // the Gantt's axis runs from signing (0) to two weeks past launch (12)

/* ─── render from data ─── */
function renderWeeks() {
  for (const el of $$('[data-weeks]')) {
    const p = PHASES.find(x => x.id === el.dataset.weeks);
    if (p) el.textContent = weeks(p);
  }
  for (const el of $$('[data-pay]')) {
    const p = QUOTE.payments.find(x => x.id === el.dataset.pay);
    if (p) el.innerHTML = `<i>Payment ${QUOTE.payments.indexOf(p) + 1}</i><span>${p.label}, ${p.when.toLowerCase()}</span><b>${money(p.amount)}</b>`;
  }
}

function renderGantt() {
  const g = $('.gantt');
  if (!g) return;
  const lanes = PHASES.length;
  g.style.setProperty('--lanes', lanes);
  const ticks = [];
  for (let w = 0; w <= SPAN; w++) {
    const big = [0, 5, 10].includes(w);
    const lab = w === 0 ? 'Day 1' : w === 10 ? 'Wk 10 · Launch' : w === SPAN ? 'After' : `Wk ${w}`;
    ticks.push(`<span class="g-tick${big ? ' big' : ''}" style="--s:${w / SPAN}">${lab}</span>`);
  }
  const grid = Array.from({ length: SPAN + 1 }, (_, w) => `<i class="g-grid" style="--s:${w / SPAN}"></i>`).join('');
  const bars = PHASES.map((p, i) =>
    `<div class="g-bar${p.optional ? ' opt' : ''}" data-bar="${p.id}" style="--lane:${i};--s:${p.start / SPAN};--e:${Math.max(p.end, p.start + 0.6) / SPAN}"><b>${p.n}</b><em>${p.short}</em></div>`).join('');
  const pays = QUOTE.payments.map((p, i) =>
    `<div class="g-pay" style="--s:${p.week / SPAN}"><i>$</i><span>Payment ${i + 1} · ${money(p.amount)}</span></div>`).join('');
  g.innerHTML = `<div class="g-head">${PHASES.map(p => `<span data-head="${p.id}">${p.short}</span>`).join('')}</div>
    <div class="g-axis">${ticks.join('')}</div>
    <div class="g-lanes">${grid}${bars}${pays}<div class="g-play"><span>Day 1</span></div></div>`;
}

function renderQuote() {
  const q = $('#quote');
  if (!q) return;
  const max = Math.max(...QUOTE.lines.map(l => l.amount));
  q.innerHTML = `<div class="q-head"><span>Line item</span><span>Fixed</span></div>` +
    QUOTE.lines.map((l, i) => `
    <div class="q-line" data-line="${l.id}">
      <button type="button" aria-expanded="false" aria-controls="qd-${l.id}">
        <span class="q-n">${String(i + 1).padStart(2, '0')}</span><span class="q-name">${l.name}</span><span class="q-amt">${money(l.amount)}</span><span class="q-tog" aria-hidden="true">+</span>
      </button>
      <div class="q-bar" aria-hidden="true"><i style="--w:${(l.amount / max) * 100}%"></i></div>
      <div class="q-detail" id="qd-${l.id}"><div><ul>${l.detail.map(d => `<li>${d}</li>`).join('')}</ul></div></div>
    </div>`).join('') +
    `<div class="q-total"><span>Total, fixed fee</span><b>${money(QUOTE.total)}</b></div>`;
  $('#pays').innerHTML = QUOTE.payments.map((p, i) => `
    <div class="pay"><span class="pay-pct">${p.pct}%</span><p class="pay-when">Payment ${i + 1} · ${p.when}</p><p class="pay-amt">${money(p.amount)}</p><p class="pay-lab">${p.label}</p></div>`).join('');
  $('#opts').innerHTML = QUOTE.optional.map(o => {
    const quoted = o.unit === 'quote';
    const price = quoted ? 'Quoted<small>fixed fee</small>' : `${money(o.price)}<small>per ${o.unit === 'mo' ? 'month' : o.unit}</small>`;
    return `<label class="opt-row${quoted ? ' quoted' : ''}">
      ${quoted ? '<span class="sw" aria-hidden="true"></span>' : `<input type="checkbox" data-opt="${o.id}"><span class="sw" aria-hidden="true"></span>`}
      <span><span class="opt-name">${o.name}</span><span class="opt-det">${o.detail}</span></span>
      <span class="opt-price">${price}</span></label>`;
  }).join('');
  $('#onetime').textContent = money(QUOTE.total);
}

function renderCal() {
  const c = $('#cal');
  if (!c) return;
  const art = new Set([5, 8, 12, 15, 19, 22]); // two a week, three weeks, then a week to breathe
  let h = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span class="d">${d}</span>`).join('');
  for (let i = 0; i < 3; i++) h += '<span style="visibility:hidden"></span>';
  for (let d = 1; d <= 30; d++) h += `<span class="${art.has(d) ? 'a' : ''}">${d}</span>`;
  c.innerHTML = h;
}

/* ─── interactions ─── */
function wireQuote() {
  for (const line of $$('.q-line')) {
    const b = $('button', line);
    b.addEventListener('click', () => {
      const open = line.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    });
  }
  const monthly = $('#monthly');
  const sum = () => {
    let m = 0;
    for (const i of $$('input[data-opt]')) {
      const o = QUOTE.optional.find(x => x.id === i.dataset.opt);
      i.closest('.opt-row').classList.toggle('on', i.checked);
      if (i.checked && o.unit === 'mo') m += o.price;
    }
    const sess = $$('input[data-opt]').filter(i => i.checked && QUOTE.optional.find(x => x.id === i.dataset.opt).unit === 'session');
    monthly.textContent = money(m) + (sess.length ? ' + sessions' : '');
  };
  for (const i of $$('input[data-opt]')) i.addEventListener('change', sum);
  sum();
}

function wireBA() {
  const f = $('.ba-frame'), h = $('.ba-handle');
  if (!f) return;
  const set = pct => {
    pct = Math.max(2, Math.min(98, pct));
    f.style.setProperty('--pos', pct + '%');
    h.setAttribute('aria-valuenow', Math.round(pct));
  };
  let drag = false;
  const at = e => { const r = f.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
  f.addEventListener('pointerdown', e => { drag = true; f.setPointerCapture(e.pointerId); at(e); });
  f.addEventListener('pointermove', e => drag && at(e));
  f.addEventListener('pointerup', () => { drag = false; });
  f.addEventListener('pointercancel', () => { drag = false; });
  h.addEventListener('keydown', e => {
    const now = parseFloat(h.getAttribute('aria-valuenow'));
    const step = e.shiftKey ? 10 : 4;
    if (e.key === 'ArrowLeft') { set(now - step); e.preventDefault(); }
    if (e.key === 'ArrowRight') { set(now + step); e.preventDefault(); }
    if (e.key === 'Home') { set(0); e.preventDefault(); }
    if (e.key === 'End') { set(100); e.preventDefault(); }
  });
  // one slow sweep the first time it's seen, so the reader knows it moves
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const run = t => {
        if (drag) return;
        const k = Math.min(1, (t - t0) / 2200);
        set(52 + Math.sin(k * Math.PI * 2) * 22 * (1 - k));
        if (k < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }, { threshold: 0.6 });
    io.observe(f);
  }
}

function wireWall() {
  const w = $('.wall');
  if (!w) return;
  for (const b of $$('[data-set]', w)) b.addEventListener('click', () => {
    w.dataset.state = b.dataset.set;
    for (const o of $$('[data-set]', w)) o.setAttribute('aria-pressed', o === b);
  });
}

/* ─── motion ─── */
function reveals() {
  const els = $$('.rv, .hl, .measures tr, .svc-row, .quote, .phase');
  if (reduce || !('IntersectionObserver' in window)) { for (const e of els) e.classList.add('in', 'drawn'); return; }
  const io = new IntersectionObserver(ents => {
    for (const en of ents) if (en.isIntersecting) {
      en.target.classList.add('in', 'drawn');
      if (en.target.matches('.rv')) count(en.target);
      io.unobserve(en.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  for (const e of els) io.observe(e);
  // the four verbs light as each one reaches the middle of the screen
  const lit = new IntersectionObserver(ents => { for (const en of ents) en.target.classList.toggle('lit', en.isIntersecting); }, { rootMargin: '-35% 0px -45% 0px' });
  for (const r of $$('.svc-row')) lit.observe(r);
}

function count(scope) {
  for (const el of $$('.count', scope)) {
    if (el.dataset.done) continue;
    el.dataset.done = 1;
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const from = to * 3.1, t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + (from + (to - from) * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

function scrollWork() {
  const prog = $('.spine-prog');
  const links = $$('.pillnav .links a');
  const secs = links.map(a => $(a.getAttribute('href')));
  const tl = $('#timeline');
  const cards = $$('.phase');
  const bars = Object.fromEntries($$('.g-bar').map(b => [b.dataset.bar, b]));
  const heads = Object.fromEntries($$('[data-head]').map(b => [b.dataset.head, b]));
  const play = $('.g-play'), playLab = $('.g-play span'), gantt = $('.gantt');
  const bg = $('.stage-bg'), stage = $('.stage');
  let ticking = false;

  const label = t => t <= 0.15 ? 'Day 1' : t >= 10.9 ? 'After launch' : t >= 9.85 ? 'Launch' : `Week ${Math.ceil(t)}`;

  const update = () => {
    ticking = false;
    const vh = innerHeight, y = scrollY, H = document.documentElement.scrollHeight - vh;
    if (prog) prog.style.setProperty('--p', H > 0 ? Math.min(1, y / H) : 0);

    // which section owns the nav
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) cur = i; });
    links.forEach((a, i) => a.setAttribute('aria-current', i === cur));

    // the timeline playhead: a card crossing the reading line maps to its weeks
    if (tl && gantt) {
      const line = vh * 0.42;
      let t = 0, active = null;
      for (const c of cards) {
        const r = c.getBoundingClientRect();
        const p = PHASES.find(x => x.id === c.dataset.phase);
        if (r.top <= line) {
          const k = Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height)));
          t = p.start + (p.end - p.start) * k;
          active = p.id;
        }
      }
      gantt.style.setProperty('--t', Math.min(1, t / SPAN));
      if (play) play.style.setProperty('--t', Math.min(1, t / SPAN));
      if (playLab) playLab.textContent = label(t);
      for (const p of PHASES) {
        bars[p.id]?.classList.toggle('on', p.id === active);
        bars[p.id]?.classList.toggle('done', t >= p.end && p.id !== active);
        heads[p.id]?.classList.toggle('on', p.id === active);
      }
      for (const c of cards) c.classList.toggle('on', c.dataset.phase === active);
    }

    // hero backdrop drifts slower than the page
    if (bg && !reduce && y < vh * 1.2) bg.style.transform = `translate3d(${stage._px || 0}px, ${y * 0.12}px, 0) scale(1.02)`;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  if (stage && bg && !reduce) stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    stage._px = ((e.clientX - r.left) / r.width - 0.5) * -18;
    onScroll();
  });
  update();
}

async function toy() {
  const host = $('#toy');
  if (!host || printing || new URLSearchParams(location.search).has('nogl')) return;
  try {
    const { mountToy } = await import('./toy.js');
    await mountToy(host, { reduce });
  } catch (err) {
    console.warn('[TOY] fell back to the still image:', err);
    host.classList.remove('gl');
  }
}

/* ─── go ─── */
renderWeeks(); renderGantt(); renderQuote(); renderCal();
wireQuote(); wireBA(); wireWall();
if (printing) {
  for (const i of $$('img[loading="lazy"]')) i.loading = 'eager';
  for (const e of $$('.rv, .hl, .measures tr, .quote, .phase')) e.classList.add('in', 'drawn');
  for (const l of $$('.q-line')) l.classList.add('open');
  for (const b of $$('.g-bar')) b.classList.add('done');
} else {
  reveals(); scrollWork(); toy();
}
window.__proposal = { QUOTE, PHASES, ready: true };
