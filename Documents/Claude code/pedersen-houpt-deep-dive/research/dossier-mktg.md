# Pedersen & Houpt, P.C. — Marketing, Brand & Digital Presence Dossier

Prepared 2026-09-09. "NO EVIDENCE" = searched, nothing found. **unverified** = single snippet, page unreadable.

## 1. Website history (Wayback CDX, pulled 2026-09-09)

199 distinct homepage versions captured 2000-08-23 → 2026-06-12 (http://web.archive.org/cdx/search/cdx?url=pedersenhoupt.com&collapse=digest).

| Era | Evidence |
|---|---|
| 2000–2005 placeholder | ~550-byte captures (CDX per-year lengths) |
| 2006-04 → ≥2012-04-22: Flash/table site | Title "PEDERSEN&HOUPT", `flash-detect.js`, 4 `.swf` refs, 14 `<table>`s (web.archive.org/web/20060413224906 and /20120422160146) |
| 2012-09-25 → 2021-04-18: Firmseek v1 | "Site by Firmseek", © 2012, Piwik (…/20120925082238). No viewport meta until `fs-mobile.js` appears (…/20160508024259). Nav: "Download Our Firm Brochure", "eAccess". Google+ icon added by 2016, still live 2021-04-18, two years after Google+ closed (…/20210418235338) |
| 2021-05-05 → today: Firmseek v2 (current) | First capture with `<h1>Grow Your Business</h1>` on 7 hero slides (…/20210505141159). Typekit added by 2024-02-26. Current design: 5 years 4 months old |

Vendor: footer "Site by Firmseek" (live 2026-09-09; Washington DC legal-web shop, firmseek.com/portfolio does not list P&H). Tells: `PHPSESSID` cookie and `cache-control: no-store` on every hit, robots.txt disallowing obfuscated CMS paths (`/gazebo17`, `/trellis19`…), GA4 `G-NP8X2E101W`.

Hero (live 2026-09-09): h1 "Grow Your Business"; slide lines "Provide Enhanced Solutions", "Pull Together to Gain Momentum", "The Right Connections to Build Solutions". `<title>` "Pedersen & Houpt: Elite Chicago Law Firm", unchanged since 2012. Nav: Client Focus, Services, Professionals, News & Alerts, About Us, Careers, Connect With Us. Footer: LawPay link and a 2011-era `twitter.com/#!/PedersenHoupt` URL.

Change frequency: homepage digest changed on 15 captures in 2025 and 6 in 2026, but the rotating hero makes that a weak signal. Real signal: 5 newsroom items in 14 months (§5); about.html still says "more than fifty-five years" for a 69-year-old firm.

## 2. Performance, mobile, HTTPS, sitemap

- HTTPS: `http://pedersenhoupt.com` and `http://www.` both 302 (not 301) → https; no HSTS, no CSP; `x-frame-options` and `nosniff` present (curl 2026-09-09).
- PageSpeed Insights API refused (anonymous quota exhausted 2026-09-09); CrUX field data NO EVIDENCE. Local Lighthouse 12.8.2, 2026-09-09 17:23 UTC, homepage:

| | Mobile | Desktop |
|---|---|---|
| Performance / A11y / Best Practices / SEO | 82 / 96 / 93 / 92 | 65 / 93 / 93 / 92 |
| LCP · CLS · Speed Index | 2.8 s · 0.158 · 4.8 s | 1.9 s · **0.396** · 2.4 s |
| Flags | 2.4 MB page; ~1.5 MB saveable (no WebP/AVIF, no responsive images); render-blocking 1.5 s; console errors; desktop contrast fail | |

- Mobile: viewport meta present; Lighthouse viewport and font-size audits pass.
- Sitemap (2026-09-09): 157 URLs, all `changefreq weekly`. lastmod by section: professionals 27 (12 at 2026-08-05, rest 2024-04-10 → 2026-02-11); services 34 (22 at 2021-03-01, none after 2023-02-16); newsroom-publications 46 (10 at 2012-11-13, 6 at 2016-06-06, 11 at 2025-12/2026-01); newsroom-alerts 24 (2020-04-29 → 2026-07-21); newsroom-news 10 (2023-02-15 → 2026-08-20). "Weekly" is a template default.

## 3. Search presence

- Brand SERP (google.com, 2026-09-09): site, Yelp, LinkedIn, US News, MapQuest, RocketReach, LawInfo, Super Lawyers, Lexology.
- Google Business Profile: "Pedersen & Houpt Law Offices", **2.8 stars, 4 reviews**, category Law firm, "Located in: Grant Thornton"; panel shows "Own this business?", the prompt Google displays on unclaimed listings → appears unclaimed (inference, 2026-09-09).
- Yelp: 5.0 (1 review) per Google's Yelp snippet 2026-09-09; yelp.com/biz/pedersen-and-houpt-chicago blocked (403 / device check); claimed status NO EVIDENCE.
- Non-brand rankings: no rank tool → NO EVIDENCE of Google positions. WebSearch 2026-09-09 surfaced pedersenhoupt.com for "business law firm Chicago middle market companies attorneys" and the real-estate page for "Chicago commercial real estate law firm developers financing attorneys", each ~5th of ~10.

| Directory | Status 2026-09-09 |
|---|---|
| Super Lawyers | Enhanced; 5 selected: L. Byrne, B. Collins, J. Delnero, A. Holtzman, J. D. Ledesma (profiles.superlawyers.com/…/pedersen-and-houpt-pc/…) |
| Martindale / Lawyers.com | Pages 403. Snippets conflict: "Distinguished 2025" (martindale.com) vs "got this award in 2021" (lawyers.com); "21 lawyers" — all **unverified** |
| FindLaw (lawyers.findlaw.com/illinois/chicago/2332123_1/) | Enhanced/paid; "Updated: 12/15/2014"; 29 attorneys; **Suite 3100** (site says Suite 2700). Lexology also shows Suite 3100 |
| LawInfo | Basic, placeholder image, no reviews |
| Avvo | Attorney-level only (e.g., avvo.com/attorneys/60601-il-michael-sullivan-1130415.html), flagged "not active"; no firm page found |
| Best Lawyers / Best Law Firms | No firm listing found; K. Kearney "Ones to Watch 2026" via LinkedIn snippet **unverified**; law.usnews.com/law-firms/pedersen-&-houpt-870 exists, 403 |
| Chambers | USA Spotlight 2026, Real Estate (chambers.com/law-firm/pedersen-houpt-usa-spotlight-120:22864256) |
| BBB | "not enough information to rate" — snippet, **unverified** |

## 4. Social (checked 2026-09-09)

- LinkedIn (linkedin.com/company/pedersen-&-houpt): **502 followers, 56 employees**, verified on the public page; Google snippet "500+"; an undated snippet said 420. Visible posts: "1 month ago" (Chambers), "8 months ago" (IICLE) → ~2 posts in 9 months.
- X (x.com/PedersenHoupt): **214 followers, 61 posts, joined April 2012**, verified in browser. Posts 2026-01-08, 2025-07-21, 2025-04-30, 2025-02-19 → 4 in 12 months, none in 8 months.
- Facebook (facebook.com/PedersenHoupt): exists; login wall → last post NO EVIDENCE. Birdeye/ChamberofCommerce show "Pedersen & Houpt Law Offices" 2.4 stars / 5 reviews, likely Facebook-sourced, **unverified**.
- Instagram, YouTube: NO EVIDENCE (searched "Pedersen & Houpt" Instagram / YouTube; only unrelated hits).

## 5. Content marketing (pedersenhoupt.com, 2026-09-09)

- News (newsroom-news.html + archive): 4 live — Aug 2026 Chambers, Mar 2026 "In Memory of Pedersen & Houpt Partner, John J. Hayes", Nov 2025 "Pedersen Represents JRTC Holdings in Thompson Center Agreement", Jul 2025 Garfinkle hire; archive 6 (Sep 2021 → Jan 2025). 10 total: hires, one deal, one ranking, one obituary. The JRTC item (news-110) shows Nov 2025, yet the firm's LinkedIn post on the same deal dates to 2022-08-01 (activity-ID timestamp) and its page ID precedes the 2023–25 items → displayed date is likely an edit date.
- Alerts: 1 live (Jan 2026, Byrne IICLE webcast) + 31 archived: 22 in 2020, then 1–3 a year. Cadence collapsed after COVID.
- Publications: 0 live; 29 archived, newest Apr 2022 "The MetaBirkin: To Be or Not to Be", 10 undated, oldest Jan 2001.
- Newsletter (newsroom-signup.html): 6 interest checkboxes, CAPTCHA, and a **required** "Comments or Questions" field; ESP not identifiable.
- Podcast, webinars, video: NO EVIDENCE. Speaking: Larry Byrne, IICLE webcast 2026-01-19 (newsroom-alerts-80.html).

## 6. Rankings and awards marketed

- Chambers USA Spotlight 2026, Real Estate; firm calls it "the Firm's first recognition" (newsroom-news-124.html, Aug 2026); Chambers lists 42 employees, 19 partners, leader Michael P. Sullivan.
- Super Lawyers: 5 attorneys (§3), years not shown. Best Lawyers: one **unverified** individual. Martindale Distinguished: year conflict (§3).
- Headcount conflict: 26 attorney pages in sitemap; FindLaw 29 (2014); Lawyers.com 21; Chambers 42 employees; LinkedIn 56.

## 7. Competitive set (live reads + Wayback, 2026-09-09)

| Firm · URL | Redesigned in last 3 yrs? | Presents as |
|---|---|---|
| Levenfeld Pearlstein · lplegal.com | No — WordPress "pivot" theme live 2023-01-11 (LP rebrand), same theme today | Custom team photography; "Lead with Purpose. Logic with Passion. Lean into Potential."; insights 9/2, 9/1, 8/26/2026; payment link |
| Much Shelist · muchlaw.com | No — Content Pilot / Next.js build identical 2023-01-10 → today | Custom Chicago/people photography; "We're Much"; insights 9/2, 8/25, 8/18/2026; subscribe; LawPay + portal |
| Burke Warren · burkelaw.com | Edge — old Firmseek build (same `screen-style.css`/`fs-mobile.js` pattern as P&H today) 2022-01-18; new Firmseek build by 2023-01-31 | Custom team photography; "Service drives our clients' success."; profile cards; /payments |
| Golan Christie Taglia · gct.law | **Yes** — Bootstrap-3 static site still live 2025-01-27; WordPress `gctlaw-wp` today | Skyline photography; "Your Success. Our Focus."; bio-card grid; blog 9/1, 8/17, 8/12/2026; Payments |
| Chuhak & Tecson · chuhak.com | **Yes** — prototype.js-era site 2024-01-01; WordPress `chuhak` theme by 2025-06 | People photography; "Right there with you.®"; blog undated; no portal/payment seen |
| Neal Gerber Eisenberg · nge.com | **Yes** — Intelliun VE CMS 2024-01-04; WordPress (Genesis) today | Office/abstract photography; hero is Chambers USA 2026 news; insights 8/27, 8/17, 8/11/2026; alert subscribe |
| Horwood Marcus & Berk · hmblaw.com | N/A — merged into Kilpatrick 2024-03-01 (ktslaw.com news); hmblaw.com now 404 | — |
| Lavelle Law · lavellelaw.com | No clear evidence — Duda-platform build in 2019-01 and today; credits changed to Olive + Ash / Olive Street Design | Stock abstract imagery; "Trusted Legal Representation in Chicago & Schaumburg"; podcast/video sections undated; newsletter; online payments |

Where P&H sits: the only site in the set still on the pre-2022 Firmseek asset pattern its own vendor has since replaced for Burke Warren; the only one without a dated insight in the last 30 days; the only one with an apparently unclaimed Google profile.

## 8. Leadership quotes

NO EVIDENCE of any public leadership quote on growth, clients, marketing or identity, 2024–2026 (searched Google/WebSearch; Law360 firm page has 3 paywalled litigation mentions 2025-05-16 → 2026-07-07; Crain's and Chicago Daily Law Bulletin nothing; the firm's four latest announcements carry no attributed quotes). Managing Partner: Brian P. Collins (linkedin.com/in/brianpcollins1). Closest on-record voice is site copy: "All members of our firm share a single goal: to achieve client objectives while exceeding their expectations." (focus-results.html); founders "believed strongly in balancing community service and commercial success" (about.html). A 2014 office-redesign interview exists (icgconstruction.com/news/reinventing-part-2-interview-pedersen-houpt) but returned 403.
