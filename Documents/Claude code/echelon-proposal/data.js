// THE NUMBERS. Every rate, hour, price, week and payment on the page and in the PDF comes from here,
// and check.mjs fails the build if they stop adding up (sums, hours × rate, equal payments).
// ponytail: plain objects, no schema lib; check.mjs is the schema.

export const QUOTE = {
  rate: 125,        // project rate for the build, blended across every phase
  hourly: 150,      // on-demand rate for hours after launch
  total: 7500,
  lines: [
    { id: 'discovery', name: 'Discovery & planning', hours: 4, amount: 500,
      detail: ['One working session on the Member journey, from the request form to the first Connect',
        'The Company Partner profile template, shaped around your profile and questionnaire',
        'Roles, the Connect email and the sitemap, signed off before design starts'] },
    { id: 'design', name: 'Design', hours: 10, amount: 1250,
      detail: ['One direction, carried from your logo and brand standards into every page and screen',
        'Designed on a phone first, then the desktop',
        'Refined with you until it is approved'] },
    { id: 'site', name: 'Public website', hours: 7, amount: 875,
      detail: ['Home, The Echelon, Explore, Our Standards, Membership and Sign In, plus the footer pages',
        'The Request Founding Membership form, with the source and Ambassador captured'] },
    { id: 'portal', name: 'Member Portal', hours: 14, amount: 1750,
      detail: ['Password sign-in, the Member home, Explore and Company Partner profiles',
        'Connect: logged at the button, then your introduction email, with IntenseGBD copied',
        'My Echelon, YouTube embeds, and a Progressive Web App for the home screen'] },
    { id: 'admin', name: 'Administration', hours: 9, amount: 1125,
      detail: ['Members, Company Partners, profiles, categories, Member Advantages and page content',
        'The membership queue and enrollment, and the connection report with a CSV export',
        'Source and Ambassador on every Member record'] },
    { id: 'systems', name: 'Integrations & security', hours: 4, amount: 500,
      detail: ['Constant Contact, and email sent from your domain',
        'Two-factor sign-in for administrators, backups and rate limits'] },
    { id: 'w9', name: 'W-9s, through a specialist service', hours: 4, amount: 500,
      detail: ['Members submit from My Echelon; Ambassadors get a secure link by email',
        'The service holds the form and admin shows its status. The service’s per-form fees are separate'] },
    { id: 'content', name: 'Content population', hours: 2, amount: 250,
      detail: ['The first Company Partner profile, loaded with your team as the pattern'] },
    { id: 'launch', name: 'Testing, acceptance & launch', hours: 4, amount: 500,
      detail: ['Testing on iPhone, Android and desktop, then user acceptance testing with your team',
        'Launch, admin training with a short written guide, and two weeks of monitoring'] },
    { id: 'pm', name: 'Project management', hours: 2, amount: 250,
      detail: ['A staging link that updates every week, and one point of contact'] },
  ],
  payments: [
    { id: 'sign', label: 'At signing', amount: 2500, week: 0 },
    { id: 'm1', label: 'Design approved', amount: 2500, week: 3 },
    { id: 'm2', label: 'Launch', amount: 2500, week: 6 },
  ],
  // after launch: nothing on a retainer. More hours are optional; bigger builds are their own projects.
  optional: [
    { id: 'hours', group: 'care', name: 'Maintenance hours', price: 1500, unit: 'block',
      detail: 'Optional. Ten hours at $150 an hour for updates, changes and new pages. Hours never expire.' },
    { id: 'w9b', group: 'later', name: 'W-9s stored in the platform', hours: 30, price: 3750, unit: 'build',
      detail: 'Encrypted, segregated storage inside the platform, with administrator-only access, two-factor sign-in, an audit log and a retention schedule.' },
    { id: 'app', group: 'later', name: 'Native iOS and Android app', hours: 100, toHours: 160, price: 12500, to: 20000, unit: 'range',
      detail: 'Preliminary, on the same database and sign-in as V0. We would quote it properly after a few months of real use.' },
    { id: 'v1', group: 'later', name: 'Ambassador dashboard, Partner logins, Shared Value', price: 0, unit: 'quote',
      detail: 'Each one scoped in hours when you are ready for it. V0 already keeps the records they build on.' },
  ],
};

// Running costs, checked Sep 25, 2026 on each vendor's pricing page. Paid by IntenseGBD directly, on accounts in its name.
export const RUNNING = [
  { id: 'hosting', item: 'Hosting', vendor: 'Vercel Pro', monthly: 20, note: 'Includes one developer seat, which is enough' },
  { id: 'db', item: 'Database, sign-in and daily backups', vendor: 'Supabase Pro', monthly: 25, note: 'Backups kept for 7 days' },
  { id: 'email', item: 'Connect and sign-in email', vendor: 'Resend', monthly: 0, note: 'Free to 3,000 a month (100 a day), then $20' },
  { id: 'cc', item: 'Member email', vendor: 'Constant Contact', monthly: null, note: 'Your plan; connecting it adds nothing' },
  { id: 'w9', item: 'W-9 service', vendor: 'Chosen in discovery', monthly: null, note: 'Its own fee per form' },
];

// start/end are weeks from kickoff (week 0). Kickoff is within five business days of signing.
export const PHASES = [
  { id: 'discovery', n: '01', name: 'Discovery & planning', short: 'Discovery', start: 0, end: 1, milestone: 'sign' },
  { id: 'design', n: '02', name: 'Design', short: 'Design', start: 1, end: 3, milestone: 'm1' },
  { id: 'build', n: '03', name: 'Development', short: 'Build', start: 2, end: 5 },
  { id: 'content', n: '04', name: 'Content population', short: 'Content', start: 4, end: 5 },
  { id: 'test', n: '05', name: 'Testing & user acceptance', short: 'Testing', start: 5, end: 6 },
  { id: 'launch', n: '06', name: 'Launch', short: 'Launch', start: 6, end: 6, milestone: 'm2' },
  { id: 'beyond', n: '07', name: 'Monitoring', short: 'Monitoring', start: 6, end: 8 },
];

export const NAV = [
  { id: 'project', label: 'Project' },
  { id: 'scope', label: 'Scope' },
  { id: 'look', label: 'Look' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'investment', label: 'Investment' },
  { id: 'after', label: 'After launch' },
  { id: 'about', label: 'About' },
];

export const money = n => '$' + n.toLocaleString('en-US');
export const hoursTotal = () => QUOTE.lines.reduce((s, l) => s + l.hours, 0);
export const monthlyTotal = () => RUNNING.reduce((s, r) => s + (r.monthly || 0), 0);
export const LAUNCH = PHASES.find(p => p.milestone === 'm2').end;
export const weeks = p => p.start === p.end || p.start === 0 ? `Week ${p.end}` : `Weeks ${p.start} to ${p.end}`;
