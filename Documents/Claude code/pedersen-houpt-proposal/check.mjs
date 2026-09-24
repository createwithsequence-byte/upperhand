// check.mjs: the proposal's render contract. build.mjs refuses to render a PDF if any rule fails.
//   node check.mjs             check index.html + data.js
//   node check.mjs --selftest  prove every rule catches a planted fault
import { readFileSync } from 'node:fs';
import { QUOTE, PHASES, NAV } from './data.js';

const NAMES = ['Songfinch', 'Tangible Formats', 'Moo V Night', 'FisherFit', "Mr. D's", 'Dear Medley', 'Troglia', 'Solo Stove'];

export function rules({ quote, phases, nav, html }) {
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
  // copy rules run on visible text: the page (minus code) plus every string in the data
  const visible = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
    + ' ' + JSON.stringify({ quote, phases, nav });
  if (visible.includes('—')) f.push('em dash in copy');
  for (const n of NAMES) if (visible.includes(n)) f.push(`another client's name in copy: ${n}`);
  if (/\bAI\b/.test(visible)) f.push('"AI" in copy');
  if (/lorem|TODO|TBD|\[client/i.test(visible)) f.push('placeholder text in copy');
  return f;
}

if (process.argv.includes('--selftest')) {
  const ok = { quote: QUOTE, phases: PHASES, nav: NAV, html: NAV.map(n => `<section id="${n.id}">`).join('') };
  const bad = {
    'total off by one': { ...ok, quote: { ...QUOTE, total: QUOTE.total + 1 } },
    'dead nav link': { ...ok, html: '' },
    'em dash': { ...ok, html: ok.html + 'a — b' },
    'client name': { ...ok, html: ok.html + 'Songfinch' },
    'AI': { ...ok, html: ok.html + 'we use AI' },
    'placeholder': { ...ok, html: ok.html + 'TODO' },
    'payment off its phase': { ...ok, quote: { ...QUOTE, payments: QUOTE.payments.map(p => p.id === 'm1' ? { ...p, week: 4 } : p) } },
  };
  const clean = rules(ok);
  if (clean.length) throw new Error('selftest: clean input failed: ' + clean.join('; '));
  for (const [name, b] of Object.entries(bad)) if (!rules(b).length) throw new Error(`selftest: "${name}" passed and should not`);
  // the word test must not trip on ordinary words that contain the letters
  if (rules({ ...ok, html: ok.html + 'PAID, MAIN, again, Ai' }).length) throw new Error('selftest: "AI" rule trips on ordinary words');
  console.log(`[CHECK] selftest ${Object.keys(bad).length + 2}/${Object.keys(bad).length + 2}`);
} else {
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  const f = rules({ quote: QUOTE, phases: PHASES, nav: NAV, html });
  if (f.length) { console.error('[CHECK] FAIL\n- ' + f.join('\n- ')); process.exit(1); }
  console.log('[CHECK] pass');
}
