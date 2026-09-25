// THE NUMBERS. Every price, week, payment and running cost on the page and in the PDF comes
// from here, and check.mjs fails the build if they stop adding up.
// ponytail: plain objects, no schema lib; check.mjs is the schema.

export const QUOTE = {
  total: 24000,
  lines: [
    { id: 'discovery', name: 'Discovery & planning', amount: 1500,
      detail: ['A working session with you on the Member journey, from the request form to the first Connect',
        'The Company Partner profile template, shaped around your Company Partner Profile questionnaire',
        'Sitemap, roles and the Connect email, signed off before design starts'] },
    { id: 'design', name: 'Brand extension & design', amount: 5500,
      detail: ['Your logo and brand standards carried into a digital system: type, color, spacing',
        'Every public page and portal screen, designed on a phone first, then on a desktop',
        'One design direction, one round of revisions and a final polish pass',
        'Vector versions of the logo, redrawn if they do not exist yet'] },
    { id: 'site', name: 'Public website', amount: 3500,
      detail: ['Home, The Echelon, Explore, Our Standards, Membership and Sign In, plus the footer pages',
        'The Request Founding Membership form, with the source and Ambassador captured on the way in',
        'Search basics, social previews, video embeds, and pages for your Terms, Privacy and Company Partner Disclaimer'] },
    { id: 'portal', name: 'Member Portal', amount: 6500,
      detail: ['Password sign-in, the Member home, Explore by ecosystem and category, and Company Partner profiles',
        'Profiles with logo, overview, services, reach, contact, the Member Benefit and a prominent Echelon Member Advantage',
        'Connect: the email introduction, logged at the button with the Member, the Partner, the date and the time',
        'My Echelon, with account details and connection history',
        'Installs to the home screen on iPhone and Android, as a Progressive Web App'] },
    { id: 'admin', name: 'Administration', amount: 3000,
      detail: ['Add, edit and remove Members, Company Partners, profiles, categories, Member Advantages and page content',
        'The membership queue: approve a request and send the enrollment link; the Member sets a password and accepts your Terms',
        'The connection report, a CSV export of Members, Partners and connections, and the source and Ambassador on every Member record'] },
    { id: 'systems', name: 'Integrations & security', amount: 2000,
      detail: ['Constant Contact: approved Members added to your list automatically',
        'Email for Connect introductions, sign-in links and approvals, sent from your domain',
        'Two-factor sign-in for administrators, an audit log of admin changes, daily backups, rate limits on every form'] },
    { id: 'launch', name: 'Testing & launch', amount: 2000,
      detail: ['The first three Company Partner profiles loaded with you, then your team carries on',
        'Testing on iPhone, Android and desktop, then user acceptance testing with your team',
        'Launch, an hour of admin training, a written guide, and thirty days of fixes for anything that does not work as scoped'] },
  ],
  payments: [
    { id: 'sign', label: 'At signing', when: 'Before kickoff', amount: 9600, week: 0, pct: 40 },
    { id: 'm1', label: 'Milestone 1: design approved', when: 'End of week 4', amount: 7200, week: 4, pct: 30 },
    { id: 'm2', label: 'Milestone 2: launch', when: 'Week 10', amount: 7200, week: 10, pct: 30 },
  ],
  // small additions to V0, priced now; group 'later' are bigger builds, each its own project
  optional: [
    { id: 'w9a', name: 'W-9s, through a specialist service', price: 1000, unit: 'once',
      detail: 'Our recommendation. We connect the service and show each Member’s W-9 status in admin. The service’s own fees are separate.' },
    { id: 'hours', name: 'Block of hours', price: 1500, unit: 'block',
      detail: 'Ten hours for changes, new pages and updates after the thirty days of fixes. Prepaid, used as needed, no retainer.' },
    { id: 'w9b', group: 'later', name: 'W-9s, stored in the platform', price: 4000, unit: 'once',
      detail: 'Encrypted, segregated storage with administrator-only access, two-factor sign-in, an audit log and a retention schedule.' },
    { id: 'app', group: 'later', name: 'Native iOS and Android app', price: 20000, unit: 'range', to: 35000,
      detail: 'Preliminary, on the same foundation as V0. We would quote it properly after a few months of real use.' },
    { id: 'v1', group: 'later', name: 'Ambassador dashboard, Partner logins, Shared Value tracking', price: 0, unit: 'quote',
      detail: 'Each one scoped and quoted on its own, when you are ready for it. V0 keeps the records they build on: Ambassadors, Partners and every connection.' },
  ],
};

// Running costs, checked Sep 25, 2026 on each vendor's pricing page. Every account opens in IntenseGBD's name.
export const RUNNING = [
  { id: 'hosting', item: 'Hosting and security certificates', vendor: 'Vercel Pro', monthly: 20, note: 'Includes SSL, a global network, DDoS mitigation and a web firewall. Includes one developer seat, which is enough; more are $20 each' },
  { id: 'db', item: 'Database, sign-in, file storage and daily backups', vendor: 'Supabase Pro', monthly: 25, note: 'Backups kept for 7 days' },
  { id: 'email', item: 'Connect introductions and sign-in email', vendor: 'Resend', monthly: 0, note: 'Free to 3,000 emails a month (100 a day), then $20' },
  { id: 'forms', item: 'Forms and plugins', vendor: 'Built in', monthly: 0, note: 'Nothing to license' },
  { id: 'cc', item: 'Member email', vendor: 'Constant Contact', monthly: null, note: 'Your plan, priced by list size. Connecting it adds nothing' },
  { id: 'domain', item: 'Domain', vendor: 'theechelonsignature.com', monthly: null, note: 'You already own it; the renewal stays yours' },
];
export const RUNNING_LATER = [
  { item: 'More than 3,000 emails a month', cost: '+$20 a month' },
  { item: 'Restore to any minute, not just the last daily backup', cost: '+$100 a month' },
  { item: 'App store accounts, once there is an app', cost: '$99 a year + $25 once' },
];

// start/end are weeks. Week 0 is kickoff, within five business days of the first payment; V0 launches at the end of week 10.
export const PHASES = [
  { id: 'discovery', n: '01', name: 'Discovery & planning', short: 'Discovery', start: 0, end: 1, milestone: 'sign' },
  { id: 'design', n: '02', name: 'Design', short: 'Design', start: 1, end: 4, milestone: 'm1' },
  { id: 'build', n: '03', name: 'Development', short: 'Build', start: 4, end: 8 },
  { id: 'content', n: '04', name: 'Content population', short: 'Content', start: 6, end: 9 },
  { id: 'test', n: '05', name: 'Testing & user acceptance', short: 'Testing', start: 8, end: 10 },
  { id: 'launch', n: '06', name: 'Launch', short: 'Launch', start: 10, end: 10, milestone: 'm2' },
];

export const NAV = [
  { id: 'goals', label: 'Goals' },
  { id: 'v0', label: 'V0' },
  { id: 'approach', label: 'Approach' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'investment', label: 'Investment' },
  { id: 'about', label: 'About' },
];

export const money = n => '$' + n.toLocaleString('en-US');
export const monthlyTotal = () => RUNNING.reduce((s, r) => s + (r.monthly || 0), 0);
export const LAUNCH = PHASES.find(p => p.milestone === 'm2').end;
export const weeks = p => p.start === 0 ? (p.end === 1 ? 'Week 1' : `Kickoff to week ${p.end}`) : p.start === p.end ? `Week ${p.end}` : `Weeks ${p.start} to ${p.end}`;
