// check.mjs: the proposal's render contract. build.mjs refuses to render a PDF if any rule fails.
//   node check.mjs             check index.html + data.js
//   node check.mjs --selftest  prove every rule catches a planted fault
import { readFileSync } from 'node:fs';
import { QUOTE, PHASES, NAV, RUNNING } from './data.js';

const NAMES = ['Songfinch', 'Tangible Formats', 'Moo V Night', 'FisherFit', "Mr. D's", 'Dear Medley', 'Troglia', 'Solo Stove', 'Pedersen', 'Houpt'];
// The Echelon's standing rules: no BBB, never call the member benefit illegal, nothing from the internal
// research deck, none of the rules the early prototypes invented (a member cap, fee splits)
const ECHELON = [/\bBBB\b/, /illegal|unlawful/i, /deep[- ]dive/i, /100[- ]member/i, /\b(12|25)%/];

export function rules({ quote, phases, nav, running, html }) {
  const f = [];
  const sum = a => a.reduce((s, x) => s + x.amount, 0);
  const $ = n => '$' + n.toLocaleString('en-US');
  if (sum(quote.lines) !== quote.total) f.push(`line items sum to ${sum(quote.lines)}, total is ${quote.total}`);
  if (sum(quote.payments) !== quote.total) f.push(`payments sum to ${sum(quote.payments)}, total is ${quote.total}`);
  const amts = quote.payments.map(p => p.amount);
  if (quote.payments.length !== 3 || Math.max(...amts) - Math.min(...amts) > 1) f.push('payments are not three equal payments');
  // every price is hours × rate: the build lines, and any option that states its hours
  for (const l of quote.lines) if (l.hours * (l.rate ?? quote.rate) !== l.amount) f.push(`line ${l.id}: ${l.hours} hrs × rate is not ${l.amount}`);
  for (const o of quote.optional) {
    if (o.hours && o.hours * quote.rate !== o.price) f.push(`option ${o.id}: ${o.hours} hrs × rate is not ${o.price}`);
    if (o.toHours && o.toHours * quote.rate !== o.to) f.push(`option ${o.id}: ${o.toHours} hrs × rate is not ${o.to}`);
    if (o.unit === 'block' && o.price !== 10 * quote.hourly) f.push(`option ${o.id}: a block is 10 hrs × ${quote.hourly}`);
  }
  for (const n of nav) if (!html.includes(`id="${n.id}"`)) f.push(`nav link #${n.id} has no section`);
  for (const [, id] of html.matchAll(/href="#([\w-]+)"/g)) if (!html.includes(`id="${id}"`)) f.push(`link #${id} has no target`);
  for (const p of phases) if (p.end < p.start) f.push(`phase ${p.id} ends before it starts`);
  for (const m of quote.payments) {
    const ph = phases.find(p => p.milestone === m.id);
    if (!ph) f.push(`payment ${m.id} sits on no phase`);
    else if (m.week !== (m.id === 'sign' ? ph.start : ph.end)) f.push(`payment ${m.id} is week ${m.week}, its phase says otherwise`);
  }
  // numbers typed into the page must match the data they stand in for (app.js overwrites them; the no-script fallback does not)
  const mo = '$' + running.reduce((s, r) => s + (r.monthly || 0), 0), hrs = String(quote.lines.reduce((s, l) => s + l.hours, 0));
  for (const [, v] of html.matchAll(/data-total>([^<]*)</g)) if (v !== $(quote.total)) f.push(`data-total says ${v}, data says ${$(quote.total)}`);
  for (const [, v] of html.matchAll(/data-monthly>([^<]*)</g)) if (v !== mo) f.push(`data-monthly says ${v}, data says ${mo}`);
  for (const [, v] of html.matchAll(/data-hours>([^<]*)</g)) if (v !== hrs) f.push(`data-hours says ${v}, data says ${hrs}`);
  // copy rules run on visible text: the page (minus code) plus every string in the data
  const visible = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
    + ' ' + JSON.stringify({ quote, phases, nav, running });
  if (visible.includes('—')) f.push('em dash in copy');
  for (const n of NAMES) if (visible.includes(n)) f.push(`another client's name in copy: ${n}`);
  for (const r of ECHELON) if (r.test(visible)) f.push(`breaks an Echelon rule: ${r}`);
  if (/\bAI\b/.test(visible)) f.push('"AI" in copy');
  if (/lorem|TODO|TBD|\[client/i.test(visible)) f.push('placeholder text in copy');
  return f;
}

const live = { quote: QUOTE, phases: PHASES, nav: NAV, running: RUNNING };
if (process.argv.includes('--selftest')) {
  const hrs = QUOTE.lines.reduce((s, l) => s + l.hours, 0), mo = RUNNING.reduce((s, r) => s + (r.monthly || 0), 0);
  const base = NAV.map(n => `<section id="${n.id}">`).join('') + `<b data-total>$${QUOTE.total.toLocaleString('en-US')}</b><b data-monthly>$${mo}</b><b data-hours>${hrs}</b>`;
  const ok = { ...live, html: base };
  const edit = (id, patch) => ({ ...QUOTE, lines: QUOTE.lines.map(l => l.id === id ? { ...l, ...patch } : l) });
  const bad = {
    'total off by one': { ...ok, quote: { ...QUOTE, total: QUOTE.total + 1 } },
    'hours × rate off': { ...ok, quote: edit(QUOTE.lines[0].id, { hours: QUOTE.lines[0].hours + 1 }) },
    'option hours × rate off': { ...ok, quote: { ...QUOTE, optional: QUOTE.optional.map(o => o.hours ? { ...o, price: o.price + 125 } : o) } },
    'unequal payments': { ...ok, quote: { ...QUOTE, payments: QUOTE.payments.map((p, i) => ({ ...p, amount: p.amount + [10, -10, 0][i] })) } },
    'dead nav link': { ...ok, html: '' },
    'dead in-page link': { ...ok, html: base + '<a href="#nowhere">' },
    'stale typed total': { ...ok, html: base + '<b data-total>$24,000</b>' },
    'stale typed hours': { ...ok, html: base + '<b data-hours>192</b>' },
    'em dash': { ...ok, html: base + 'a — b' },
    'client name': { ...ok, html: base + 'Pedersen' },
    'BBB': { ...ok, html: base + 'BBB ratings' },
    'illegal': { ...ok, html: base + 'the cash-back is illegal' },
    'AI': { ...ok, html: base + 'we use AI' },
    'placeholder': { ...ok, html: base + 'TODO' },
    'payment off its phase': { ...ok, quote: { ...QUOTE, payments: QUOTE.payments.map(p => p.id === 'm1' ? { ...p, week: p.week + 1 } : p) } },
  };
  const clean = rules(ok);
  if (clean.length) throw new Error('selftest: clean input failed: ' + clean.join('; '));
  for (const [name, b] of Object.entries(bad)) if (!rules(b).length) throw new Error(`selftest: "${name}" passed and should not`);
  if (rules({ ...ok, html: base + 'PAID, MAIN, again, Ai, 125%' }).length) throw new Error('selftest: a word rule trips on ordinary text');
  console.log(`[CHECK] selftest ${Object.keys(bad).length + 2}/${Object.keys(bad).length + 2}`);
} else {
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  const f = rules({ ...live, html });
  if (f.length) { console.error('[CHECK] FAIL\n- ' + f.join('\n- ')); process.exit(1); }
  console.log('[CHECK] pass');
}
