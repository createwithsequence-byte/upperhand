// check.mjs: the proposal's render contract. build.mjs refuses to render a PDF if any rule fails.
//   node check.mjs             check index.html + data.js
//   node check.mjs --selftest  prove every rule catches a planted fault
import { readFileSync } from 'node:fs';
import { QUOTE, PHASES, NAV, RUNNING, monthlyTotal } from './data.js';

const NAMES = ['Songfinch', 'Tangible Formats', 'Moo V Night', 'FisherFit', "Mr. D's", 'Dear Medley', 'Troglia', 'Solo Stove', 'Pedersen', 'Houpt'];
// The Echelon's standing rules: no BBB, never call the member benefit illegal, nothing from the internal
// research deck, none of the rules the early prototypes invented (a member cap, fee splits)
const ECHELON = [/\bBBB\b/, /illegal|unlawful/i, /deep[- ]dive/i, /100[- ]member/i, /\b(12|25)%/];

export function rules({ quote, phases, nav, running, html }) {
  const f = [];
  const sum = a => a.reduce((s, x) => s + x.amount, 0);
  if (sum(quote.lines) !== quote.total) f.push(`line items sum to ${sum(quote.lines)}, total is ${quote.total}`);
  if (sum(quote.payments) !== quote.total) f.push(`payments sum to ${sum(quote.payments)}, total is ${quote.total}`);
  if (quote.payments.reduce((s, p) => s + p.pct, 0) !== 100) f.push('payment percentages do not sum to 100');
  for (const p of quote.payments) if (Math.round(quote.total * p.pct / 100) !== p.amount) f.push(`payment ${p.id}: ${p.pct}% is not ${p.amount}`);
  for (const n of nav) if (!html.includes(`id="${n.id}"`)) f.push(`nav link #${n.id} has no section`);
  for (const p of phases) if (p.end < p.start) f.push(`phase ${p.id} ends before it starts`);
  for (const m of quote.payments) {
    const ph = phases.find(p => p.milestone === m.id);
    if (!ph) f.push(`payment ${m.id} sits on no phase`);
    else if (m.week !== (m.id === 'sign' ? ph.start : ph.end)) f.push(`payment ${m.id} is week ${m.week}, its phase says otherwise`);
  }
  // every in-page link lands somewhere
  for (const [, id] of html.matchAll(/href="#([\w-]+)"/g)) if (!html.includes(`id="${id}"`)) f.push(`link #${id} has no target`);
  // numbers typed into the page must match the data they stand in for (app.js overwrites them, the PDF fallback does not)
  const total = '$' + quote.total.toLocaleString('en-US'), mo = '$' + running.reduce((s, r) => s + (r.monthly || 0), 0);
  for (const [, v] of html.matchAll(/data-total>([^<]*)</g)) if (v !== total) f.push(`data-total says ${v}, data says ${total}`);
  for (const [, v] of html.matchAll(/data-monthly>([^<]*)</g)) if (v !== mo) f.push(`data-monthly says ${v}, data says ${mo}`);
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
  const base = NAV.map(n => `<section id="${n.id}">`).join('') + `<b data-total>$${QUOTE.total.toLocaleString('en-US')}</b><b data-monthly>$${monthlyTotal()}</b>`;
  const ok = { ...live, html: base };
  const bad = {
    'total off by one': { ...ok, quote: { ...QUOTE, total: QUOTE.total + 1 } },
    'dead nav link': { ...ok, html: '' },
    'dead in-page link': { ...ok, html: base + '<a href="#nowhere">' },
    'stale typed total': { ...ok, html: base + '<b data-total>$50,000</b>' },
    'stale typed monthly': { ...ok, html: base + '<b data-monthly>$60</b>' },
    'em dash': { ...ok, html: base + 'a — b' },
    'client name': { ...ok, html: base + 'Pedersen' },
    'BBB': { ...ok, html: base + 'BBB ratings' },
    'illegal': { ...ok, html: base + 'the cash-back is illegal' },
    'invented split': { ...ok, html: base + 'a 25% share' },
    'AI': { ...ok, html: base + 'we use AI' },
    'placeholder': { ...ok, html: base + 'TODO' },
    'payment off its phase': { ...ok, quote: { ...QUOTE, payments: QUOTE.payments.map(p => p.id === 'm1' ? { ...p, week: 4 } : p) } },
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
