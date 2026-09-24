// THE NUMBERS. Every price, week and payment on the page and in the PDF comes
// from here, and check.mjs fails the build if they stop adding up.
// ponytail: plain objects, no schema lib; check.mjs is the schema.

export const QUOTE = {
  total: 50000,
  lines: [
    { id: 'discovery', name: 'Discovery & planning', amount: 4000,
      detail: ['Kickoff at 161 North Clark and interviews with the Managing Partner and a partner from each practice group',
        'An audit of every page in your sitemap, your analytics and your directory listings',
        'Sitemap, content model, redirect map and shoot plan, signed off before design starts'] },
    { id: 'design', name: 'Design', amount: 11000,
      detail: ['A design system that starts from the Clark Street preview: type, color, grid and components',
        'Seven templates: home, practice, attorney, matter, article, about and careers, contact',
        'A brand playbook, so later edits stay consistent',
        'Designed phone-first, with a prototype you can click and two rounds of revisions'] },
    { id: 'build', name: 'Development', amount: 15500,
      detail: ['The build, on a CMS your team can edit',
        'Every bio, practice, news item and archived publication moved over',
        'A redirect for every old address, plus LawPay, client login, newsletter and forms'] },
    { id: 'photo', name: 'Photography', amount: 7500,
      detail: ['One full day or two half-days at 161 North Clark, with a two-person crew',
        'Every attorney on one light and one crop, plus the office, the building and the Loop',
        'About 150 retouched selects, sized for web, print and LinkedIn, with usage rights for the firm'] },
    { id: 'copy', name: 'Copy & SEO', amount: 6500,
      detail: ['Every practice page rewritten to answer what clients search for, plus the home, about and careers pages and an edit of every bio',
        'A written title and description for every page, and schema for the firm, each attorney and each practice',
        'Google Business Profile claimed and filled out, directory listings corrected, a keyword map per practice'] },
    { id: 'articles', name: 'Six launch articles', amount: 3000,
      detail: ['Written from work the firm has already made public',
        'Each one starts with a thirty-minute interview with the partner who did the work',
        'Nothing publishes without that partner’s sign-off'] },
    { id: 'launch', name: 'Optimization, QA & launch', amount: 2500,
      detail: ['Under 2.5 seconds on a phone, cookie consent and ADA accessibility (WCAG 2.2 AA) built in',
        'Testing on every device and of every redirect',
        'An hour of CMS training, a written guide, and two weeks of monitoring after launch'] },
  ],
  payments: [
    { id: 'sign', label: 'At signing', when: 'Day 1', amount: 20000, week: 0, pct: 40 },
    { id: 'm1', label: 'Milestone 1: design approved', when: 'End of week 5', amount: 15000, week: 5, pct: 30 },
    { id: 'm2', label: 'Milestone 2: launch', when: 'Week 10', amount: 15000, week: 10, pct: 30 },
  ],
  // after launch nothing is on a retainer: hosting at cost, hours as a prepaid block, content by the piece (John's call, 9/22)
  optional: [
    { id: 'hosting', name: 'Hosting', price: 15, unit: 'mo',
      detail: 'Passed through at cost, about $15 a month, with no markup.' },
    { id: 'hours', name: 'Block of hours', price: 1500, unit: 'block',
      detail: 'Ten hours for updates, security patches, new pages and small changes, prepaid and used as needed. When it runs out, you decide whether to buy another.' },
    { id: 'articles', name: 'Articles', price: 600, unit: 'article',
      detail: 'Each from a thirty-minute partner interview, with a search brief and a LinkedIn version. Order them as you want them.' },
    { id: 'portraits', name: 'New-hire portraits', price: 900, unit: 'session',
      detail: 'A half-day session in the launch lighting, so new attorneys match the rest of the firm.' },
    { id: 'projects', name: 'Search and feature projects', price: 0, unit: 'quote',
      detail: 'A push on one practice in search, a client portal, a recruiting section. Scoped and quoted one at a time, before we start.' },
  ],
};

// start/end are weeks. Week 0 is the signing day; the site launches at the end of week 10.
export const PHASES = [
  { id: 'discovery', n: '01', name: 'Discovery & planning', short: 'Discovery', start: 0, end: 2, milestone: 'sign' },
  { id: 'design', n: '02', name: 'Design', short: 'Design', start: 2, end: 5, milestone: 'm1' },
  { id: 'content', n: '03', name: 'Content & photography', short: 'Content + photo', start: 4, end: 6 },
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
