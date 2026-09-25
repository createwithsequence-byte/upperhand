// app.js: draws every number on the page from data.js (fee, payments, running costs, timeline),
// then runs the motion. Everything readable still renders with motion off.
import { QUOTE, PHASES, RUNNING, RUNNING_LATER, NAV, LAUNCH, money, monthlyTotal, weeks } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const printing = new URLSearchParams(location.search).has('print');
const SPAN = LAUNCH + 1; // the axis runs from signing (0) to a week past launch

/* ─── render from data ─── */
function renderFigures() {
  for (const el of $$('[data-total]')) el.textContent = money(QUOTE.total);
  for (const el of $$('[data-monthly]')) el.textContent = money(monthlyTotal());
  for (const el of $$('[data-opt]')) el.textContent = money(QUOTE.optional.find(o => o.id === el.dataset.opt).price);
  for (const el of $$('[data-weeks]')) el.textContent = weeks(PHASES.find(p => p.id === el.dataset.weeks));
  for (const el of $$('[data-launch]')) el.textContent = el.dataset.launch.replace('N', LAUNCH);
  const app = QUOTE.optional.find(o => o.id === 'app');
  for (const el of $$('[data-app]')) el.textContent = `${money(app.price)} to ${money(app.to)}`;
}

// the timeline, and only the timeline, runs through Upperhand's four colors
const PC = [
  // white on UH pink measures 3.5:1, too low for small labels, so pink bars carry ink like lime and orange
  { c: '#0047ff', t: '#fff' }, { c: '#ff2e7a', t: '#131313' }, { c: '#d7ff3f', t: '#131313' },
  { c: '#ff6b00', t: '#131313' }, { c: '#0047ff', t: '#fff' }, { c: '#ff2e7a', t: '#131313' },
];
function renderGantt() {
  const g = $('.gantt');
  g.style.setProperty('--lanes', PHASES.length);
  const ticks = Array.from({ length: SPAN }, (_, w) => {
    const big = QUOTE.payments.some(p => p.week === w);
    const lab = w === 0 ? 'Day 1' : `Wk ${w}`;
    return `<span class="g-tick${big ? ' big' : ''}" style="--s:${w / SPAN}">${lab}</span>`;
  }).join('');
  const grid = Array.from({ length: SPAN }, (_, w) => `<i class="g-grid" style="--s:${w / SPAN}"></i>`).join('');
  const bars = PHASES.map((p, i) => {
    const start = p.start === p.end ? p.end - 1 : p.start; // launch is a moment at the end of its week; draw it as that week
    return `<div class="g-bar" style="--c:${PC[i].c};--tc:${PC[i].t};--lane:${i};--s:${start / SPAN};--e:${p.end / SPAN}"><b>${p.n}</b><em>${p.short}</em></div>`;
  }).join('');
  const pays = QUOTE.payments.map((p, i) =>
    `<div class="g-pay${p.week === LAUNCH ? ' end' : ''}" style="--s:${p.week / SPAN}"><span>Payment ${i + 1} · ${money(p.amount)}</span></div>`).join('');
  g.innerHTML = `<div class="g-axis">${ticks}</div><div class="g-lanes">${grid}${bars}${pays}</div>`;
  $$('.phase').forEach(el => {
    const i = PHASES.findIndex(p => p.id === el.dataset.phase);
    el.style.setProperty('--c', PC[i].c);
  });
}

function renderQuote() {
  $('#quote').innerHTML = `<div class="q-head"><span>Line item</span><span>Fixed</span></div>` +
    QUOTE.lines.map((l, i) => `
    <div class="q-line" data-line="${l.id}">
      <button type="button" aria-expanded="false" aria-controls="qd-${l.id}">
        <span class="q-n">${String(i + 1).padStart(2, '0')}</span><span class="q-name">${l.name}</span><span class="q-amt">${money(l.amount)}</span><span class="q-tog" aria-hidden="true">+</span>
      </button>
      <div class="q-detail" id="qd-${l.id}"><div><ul>${l.detail.map(d => `<li>${d}</li>`).join('')}</ul></div></div>
    </div>`).join('') +
    `<div class="q-total"><span>Total, fixed fee</span><b>${money(QUOTE.total)}</b></div>`;
  $('#pays').innerHTML = QUOTE.payments.map(p => `
    <div class="pay"><span class="pay-pct">${p.pct}%</span><p class="pay-lab">${p.label}<span class="pay-when">${p.week === 0 ? 'Day 1' : 'Week ' + p.week}</span></p><p class="pay-amt">${money(p.amount)}</p></div>`).join('');

  $('#run').innerHTML = `<thead><tr><th scope="col">What</th><th scope="col">Note</th><th scope="col" class="mo">Monthly</th></tr></thead><tbody>` +
    RUNNING.map(r => `<tr><td>${r.item}<span class="ven">${r.vendor}</span></td><td class="nt">${r.note}</td><td class="mo">${r.monthly === null ? '<small>Yours today</small>' : money(r.monthly)}</td></tr>`).join('') +
    `</tbody><tfoot><tr><td>At launch</td><td class="nt"></td><td class="mo">${money(monthlyTotal())}</td></tr></tfoot>`;
  $('#later').innerHTML = RUNNING_LATER.map(r => `<li><span>${r.item}</span><span>${r.cost}</span></li>`).join('');

  const unit = { once: 'one time', block: 'per 10-hour block', quote: 'one at a time', range: 'preliminary' };
  const row = o => `<div class="opt-row">
      <span><span class="opt-name">${o.name}</span><span class="opt-det">${o.detail}</span></span>
      <span class="opt-price">${o.unit === 'quote' ? 'Quoted' : o.unit === 'range' ? `${money(o.price)} to ${money(o.to)}` : money(o.price)}<small>${unit[o.unit]}</small></span></div>`;
  $('#opts').innerHTML = QUOTE.optional.filter(o => !o.group).map(row).join('');
  $('#opts-later').innerHTML = QUOTE.optional.filter(o => o.group === 'later').map(row).join('');
}

function wireQuote() {
  for (const line of $$('.q-line')) {
    const b = $('button', line);
    b.addEventListener('click', () => b.setAttribute('aria-expanded', line.classList.toggle('open')));
  }
}

/* ─── motion ─── */
function reveals() {
  const els = $$('.rv, .gantt');
  if (reduce || !('IntersectionObserver' in window)) { for (const e of els) e.classList.add('in'); return; }
  const io = new IntersectionObserver(ents => {
    for (const en of ents) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  for (const e of els) io.observe(e);
}

function scrollWork() {
  const nav = $('.topnav');
  const links = $$('.links a');
  const secs = NAV.map(n => document.getElementById(n.id));
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight, H = document.documentElement.scrollHeight - vh;
    nav.style.setProperty('--p', H > 0 ? Math.min(1, scrollY / H) : 0);
    let cur = -1;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.4) cur = i; });
    links.forEach((a, i) => a.setAttribute('aria-current', i === cur));
  };
  const on = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', on, { passive: true });
  addEventListener('resize', on);
  update();
}

async function card() {
  const host = $('#card');
  if (printing || new URLSearchParams(location.search).has('nogl')) return;
  try {
    const { mountCard } = await import('./card.js');
    await mountCard(host, { reduce });
  } catch (err) {
    console.warn('[CARD] fell back to the still image:', err);
    host.classList.remove('gl');
  }
}

/* ─── go ─── */
renderFigures(); renderGantt(); renderQuote(); wireQuote();
if (printing) {
  for (const i of $$('img[loading="lazy"]')) i.loading = 'eager'; // a lazy image below the fold never loads for the PDF
  // links in the PDF must point at the published proposal, not the machine that rendered it
  const BASE = 'https://echelon-v0-proposal.vercel.app/'; // ponytail: update if the proposal moves to another address
  for (const l of $$('a[href]')) { const h = l.getAttribute('href'); if (!/^(https?:|mailto:|#)/.test(h)) l.href = BASE + h; }
  for (const e of $$('.rv, .gantt')) e.classList.add('in');
  for (const l of $$('.q-line')) l.classList.add('open');
} else {
  reveals(); scrollWork(); card();
}
window.__proposal = { QUOTE, PHASES, ready: true };
