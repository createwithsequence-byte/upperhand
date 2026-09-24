// THE NUMBERS. Every price, week and payment on the page and in the PDF comes
// from here, and check.mjs fails the build if they stop adding up.
// ponytail: plain objects, no schema lib; check.mjs is the schema.

export const QUOTE = {
  total: 50000,
  lines: [
    { id: 'discovery', name: 'Discovery & planning', amount: 4000,
      detail: ['Kickoff at 161 North Clark and interviews with the Managing Partner and every practice leader',
        'An audit of every page in your sitemap, your analytics and your directory listings',
        'Sitemap, content model, redirect map and shoot plan, signed off before design starts'] },
    { id: 'design', name: 'Design', amount: 11000,
      detail: ['A design system built from the Matter of record direction: type, color, the tombstone as a component',
        'Seven templates: home, practice, attorney, matter, article, about and careers, contact',
        'Desktop and phone, a prototype you can click, two rounds of revisions'] },
    { id: 'build', name: 'Development', amount: 15500,
      detail: ['The build, on a CMS your team edits without calling anyone',
        'Every bio, practice, news item and archived publication moved over',
        'A redirect for every old address, plus LawPay, client login, newsletter and forms'] },
    { id: 'photo', name: 'Photography', amount: 7500,
      detail: ['One shoot day at 161 North Clark with a two-person crew',
        'Every attorney on one light and one crop, plus the office, the building and the Loop',
        'About 150 retouched selects, sized for web, print and LinkedIn, with usage rights for the firm'] },
    { id: 'copy', name: 'Copy & SEO', amount: 6500,
      detail: ['Copy for the home, practice, about and careers pages, and an edit of every bio',
        'A written title and description for every page, and schema for the firm, each attorney and each practice',
        'Google Business Profile claimed and filled out, directory listings corrected, a keyword map per practice'] },
    { id: 'articles', name: 'Six launch articles', amount: 3000,
      detail: ['Written from work the firm has already done and made public',
        'Each one starts with a 30-minute interview with the partner who did the work',
        'Nothing publishes without that partner’s sign-off'] },
    { id: 'launch', name: 'Optimization, QA & launch', amount: 2500,
      detail: ['Page speed under 2.5 seconds on a phone, WCAG 2.2 AA on every template',
        'Every device, every redirect, tested',
        'An hour of CMS training, a written guide, and two weeks of watching it after launch'] },
  ],
  payments: [
    { id: 'sign', label: 'At signing', when: 'Day 1', amount: 20000, week: 0, pct: 40 },
    { id: 'm1', label: 'Milestone 1: design approved', when: 'End of week 5', amount: 15000, week: 5, pct: 30 },
    { id: 'm2', label: 'Milestone 2: launch', when: 'Week 10', amount: 15000, week: 10, pct: 30 },
  ],
  optional: [
    { id: 'care', name: 'Care plan', price: 750, unit: 'mo',
      detail: 'Hosting, security updates, uptime monitoring and backups, a short monthly report, and four hours of changes every month.' },
    { id: 'content', name: 'Content program', price: 3600, unit: 'mo',
      detail: 'Six new articles a month, drawn from the questions clients ask and the matters you close. Partner interview, search brief, and a LinkedIn cut of each.' },
    { id: 'portraits', name: 'New-hire portraits', price: 900, unit: 'session',
      detail: 'A half-day session matched to the launch look, so every new attorney arrives on the site looking like the rest of the firm.' },
    { id: 'features', name: 'Feature development', price: 0, unit: 'quote',
      detail: 'A client portal, a searchable matter database, a recruiting section. Scoped and quoted as a fixed fee before we start, never after.' },
  ],
};

// start/end are weeks. Week 0 is the signing day; the site launches at the end of week 10.
export const PHASES = [
  { id: 'discovery', n: '01', name: 'Discovery & planning', short: 'Discovery', start: 0, end: 2, milestone: 'sign' },
  { id: 'design', n: '02', name: 'Design', short: 'Design', start: 2, end: 5, milestone: 'm1' },
  { id: 'content', n: '03', name: 'Content', short: 'Content', start: 4, end: 6 },
  { id: 'build', n: '04', name: 'Development', short: 'Build', start: 5, end: 9 },
  { id: 'launch', n: '05', name: 'Optimize, test & launch', short: 'Launch', start: 9, end: 10, milestone: 'm2' },
  { id: 'beyond', n: '06', name: 'Beyond launch', short: 'Beyond', start: 10, end: 12, optional: true },
];

export const NAV = [
  { id: 'goals', label: 'Goals' },
  { id: 'services', label: 'Services' },
  { id: 'content', label: 'Content' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'investment', label: 'Investment' },
  { id: 'about', label: 'About' },
];

export const money = n => '$' + n.toLocaleString('en-US');
export const weeks = p => p.start === 0 ? `Day 1 to week ${p.end}` : p.optional ? `After week ${p.start}` : `Weeks ${p.start} to ${p.end}`;
