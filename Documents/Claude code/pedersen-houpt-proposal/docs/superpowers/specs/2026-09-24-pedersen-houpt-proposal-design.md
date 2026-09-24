# Pedersen & Houpt · website proposal · design spec

Date: 2026-09-24. Author: Claude (Opus 5.5) for Greg McDonald. Status: written autonomously while Greg was away; every assumption is marked **ASSUME** so it can be corrected in one pass.

## 1. Intent

**Outcome.** A one-page web proposal that wins a $50,000 website rebuild from Pedersen & Houpt, P.C. It has to survive being forwarded inside a 69-year-old law firm: Anthony Pesce carries it in, Brian Collins (Managing Partner) decides, John Muehlstein (Chairman) applies the cost test, Eric Knight (finance and admin) processes it.

**Bar.** Greg: "a 10/10 before sending." Clear and simple to read, with Upperhand flare: animation, interaction, something visual happening, parallax.

**What Greg and John said (from John's call notes, 2026-09-24):**
- Qwilr's website-proposal template is the structural reference.
- Services shown: website development, design, optimization. Plus content.
- Key priorities and goals. "What success looks like" lives inside goals.
- Timeline, visual, on the left, in phases, day one to week 8 or 10, estimated launch. Each phase says what to expect. Each section has room for imagery, video or copy.
- Content is a real section and a real phase: an in-person creative photoshoot, SEO, copy, and a first batch of articles built from work the firm has done but never published. Content runs about two weeks and overlaps design into development. Extending the timeline is fine.
- Cut from the template: team, testimonials ("chop quotes"), recent client wins. About us goes at the end.
- Pricing is one strong quote broken into line items, not packages. Copy explains it. Payment terms in that copy: three payments, at contract, milestone 1, milestone 2. The same payments appear on the timeline.
- Beyond launch, at the end of the timeline: a normal content cadence, a block of hours for changes, hosting, security updates. Listed as optional line items at pricing (example: six new articles a month from inbound).
- Sticky nav at the top with quick links. One page. A button that downloads it as a PDF.

**Success criteria for the artifact.**
1. A managing partner reads it top to bottom in under ten minutes and can say what he gets, when, and for how much.
2. Every claim about the firm is traceable to the September research (`pedersen-houpt-deep-dive/research/`), never invented.
3. THE EYE scores it 9 or higher, honestly, with the cap named.
4. The PDF is a designed document, not a browser printout.
5. Nothing reaches the firm until Greg says so.

## 2. Where it lives and why not the proposal engine

Standalone static page at `Documents/Claude code/pedersen-houpt-proposal/`, beside the audit and deep-dive decks, deployed as its own Vercel project.

The 9/23 decision was "extend our own template, don't adopt Qwilr." This honors the first half, not the second. The engine's renderer is a single six-beat page (`app/p/[slug]/page.tsx`): problem, cost, fix, phases, close. This proposal needs a sticky Gantt, an itemized quote with toggles, a WebGL hero and a print pipeline. Forcing that into the engine means rewriting the renderer inside a repo that other sessions push to all day. **Porting this layout back as a `website` template in the engine is a clean follow-up once the structure is proven on a real send.**

## 3. The concept: put the work on the record

The firm's world has one object that does exactly what this proposal does: the **deal tombstone**. Law firms and banks announce closed deals with a framed notice ("This announcement appears as a matter of record only") and commemorate them with a Lucite deal toy on the partner's shelf. The September audit's winning direction, *Matter of record*, is built from it.

So the proposal speaks in two voices:
- **Upperhand's voice** for everything we say: the live site's system (ink #131313, paper #f4f2ec, bone #ebe8df, Upperhand blue #0047ff, Archivo Black display in caps, Hanken Grotesk body, JetBrains Mono labels, the left spine, the dark pill nav).
- **The firm's record** for everything about them: tombstone frames in Newsreader serif, their red #AB1E23 only inside their own artifacts.

The signature moment is a **WebGL Lucite deal toy** in the hero: an acrylic block engraved with this project as if it had already closed ("Pedersen & Houpt, P.C. · a new pedersenhoupt.com · Launch, week 10 · Upperhand"), refracting a Clark Street photograph behind it, turning with the pointer. It is the object a partner would keep on the shelf. The timeline ends on the same tombstone, flat, at launch.

Headline: **PUT THE WORK ON THE RECORD.** It names the site problem and the content problem in one line.

## 4. Page map (one page, top to bottom)

Sticky pill nav: firm lockup · Goals · Services · Content · Timeline · Investment · About · `Download PDF` (primary). Left spine (Upperhand, as on the live site) carries "PREPARED FOR PEDERSEN & HOUPT, P.C." vertically and a reading-progress fill.

| # | Section | What it holds | Interactive / visual |
|---|---|---|---|
| 0 | Cover | Kicker, headline, one-line offer, prepared-for line, validity date, two buttons | 3D deal toy; Clark Street photo dipped in Upperhand blue with scroll parallax |
| 1 | Letter | Four short paragraphs, operator to operator, signed Greg and John. The firm is better than its site; one ten-week project; one fixed price | Handwritten signatures in Caveat |
| 2 | Priorities & goals | Three priorities. "What success looks like": seven measures, each **today → at launch** from the audit | Counters that run from today's number to the target |
| 3 | Services | Design · Development · Optimization · Content, each with what is included. A four-row "Built on" table (the Qwilr tech-stack section, compressed) | Before/after drag slider: today's homepage vs the Matter of record direction |
| 4 | Content | "The work is done. It isn't on the record." Real work the site doesn't carry, each with where it lives today. The first batch: six launch articles. The photoshoot plan. The SEO foundation | Record cards (where it lives today → where it goes). Portrait wall: today's six headshots on four backdrops, toggle to one light |
| 5 | Timeline | Five phases plus Beyond launch. Sticky Gantt on the left (weeks 1-10, lanes that show the overlaps, payment markers). Phase cards on the right: weeks, what to expect, what we need from you, what you get, a media panel | Scroll-driven playhead and active-phase highlight |
| 6 | Investment | Itemized fixed quote ($50,000), copy that explains it, payment schedule, optional ongoing items with a running monthly total | Line items expand; optional items toggle |
| 7 | About us | Upperhand, the two founders, what each one does on this project. No client wins, no testimonials | Founder portraits in the site's treatment |
| 8 | Next steps | Four steps after yes, contact, the PDF again | Closing tombstone |

## 5. Timeline (ASSUME the dates are relative: week 1 starts the Monday after signing)

| Phase | Weeks | What to expect | Money |
|---|---|---|---|
| 01 Discovery & planning | Day 1 to week 2 | Kickoff at 161 N Clark; 30-minute interviews with the Managing Partner and each group leader; audit of all 157 live URLs and analytics; sitemap, content model, redirect map; success measures signed; shoot date booked | Payment 1 at signing |
| 02 Design | Weeks 2 to 5 | Starts from the Matter of record direction; design system; templates for home, practice, attorney bio, matter, article, about and careers, contact; desktop and phone; two revision rounds; clickable prototype | **Milestone 1: design approved, end of week 5.** Payment 2 |
| 03 Content | Weeks 4 to 6 (two weeks of production, overlapping design and development) | Shoot day at 161 N Clark; site copy; bio edits for all attorneys; keyword map and a written title and description for every page; six launch articles from attorney interviews | |
| 04 Development | Weeks 5 to 9 | Build; CMS; migration of bios, practices, news and the publications archive; 301 map so no inbound link breaks; LawPay, client login, newsletter, forms; a staging link every Friday | |
| 05 Optimize, test, launch | Weeks 9 to 10 | Speed, accessibility, every device; redirect test; CMS training; launch; Search Console and Business Profile verified; two weeks of watch | **Milestone 2: launch, week 10.** Payment 3 |
| Beyond launch | Month 3 on, optional | Care plan: hosting, security updates, monitoring, backups, a block of change hours. Content program: a steady article cadence from inbound questions and new matters | Monthly, optional |

## 6. Investment (ASSUME: this split and every optional price is Claude's recommendation, not John's number)

Fixed fee **$50,000**.

| Line | Amount |
|---|---|
| 01 Discovery & planning | $4,000 |
| 02 Design: system and seven templates, desktop and phone | $11,000 |
| 03 Development: build, CMS, migration, redirects, integrations | $15,500 |
| 04 Photography: one shoot day at 161 N Clark, every attorney plus the office and the Loop, retouched | $7,500 |
| 05 Copy & SEO: site copy, bio edits, titles and descriptions for every page, schema, Business Profile and listings cleanup | $6,500 |
| 06 Six launch articles from the firm's own work | $3,000 |
| 07 Optimization, QA & launch: speed, accessibility, testing, training, two-week watch | $2,500 |

Payments: **$20,000 at signing · $15,000 at design approval (Milestone 1) · $15,000 at launch (Milestone 2).** Net 15. ASSUME 40/30/30.

Optional after launch (monthly, 30 days' notice to stop):
- Care plan, $750/mo: hosting, SSL, security updates, uptime monitoring, backups, a monthly report, four hours of changes.
- Content program, $3,600/mo: six articles a month from inbound questions and new matters, attorney interview, SEO brief, a LinkedIn cut of each.
- New-hire portraits, $900 a session: matched to the launch look.
- Feature development: scoped and quoted as a fixed fee when needed (client portal, matter database, recruiting).

## 7. Claims (all from the September research; nothing new is asserted)

Today's numbers used in goals: phone LCP 2.8 to 7.8 s across two Lighthouse runs; 2.4 MB homepage; 167 of 169 pages without a meta description; Google Business Profile 2.8 stars on 4 reviews, apparently unclaimed; title tag "Elite Chicago Law Firm" since 2012; About copy "more than fifty-five years" for a 69-year-old firm; six partner headshots on four backdrops; 0 publications since April 2022; alerts 22 in 2020, then 1 to 3 a year; FindLaw and Lexology list Suite 3100, the site says 2700; six of seven peers rebuilt or refreshed since 2023.

Work the site doesn't carry (for the Content section): the Skolnik Industries sale to Pelican Energy Partners (announced by the buyer on PR Newswire, January 2025, absent from the firm's newsroom); the Thompson Center acquisition for JRTC Holdings (one news item, displayed as November 2025 though the deal is 2022); Chambers USA 2026, the firm's first ranking (one post); Larry Byrne's January 2026 IICLE webcast (one alert); the $218M office-to-hotel financing and the U.S. Supreme Court handgun-ordinance case (both undated on a results page).

Language rules: no em dashes. No client names from Upperhand's other work. No named competitor quote. No "AI" in the pitch.

## 8. Build

- Static `index.html`, `styles.css`, `app.js`, vendored `three.module.min.js`. No framework, no smooth-scroll library (native scroll is kinder to a long read and to screenshots).
- `build.mjs`: copies assets, renders `pedersen-houpt-proposal.pdf` with Playwright from the print stylesheet (US Letter, one section per page, static Gantt, deal toy as a pre-captured PNG), and checks copy (no em dashes, no client names, every section id in the nav exists).
- Reduced motion: no WebGL rotation, no counters, no parallax; everything readable at rest. No WebGL: the PNG stands in.
- `X-Robots-Tag: noindex, nofollow` on every response.

## 9. Deploy

New Vercel project `pedersen-houpt-proposal` (team getupperhand). A new project's first deploy lands on the public alias, so the first deploy is a blank noindex placeholder. Every real build after that goes out as a preview. Production waits for Greg's "ship."

## 10. Gates before hand-back

insane-design pass on the hero and timeline; THE EYE (cold read, one-word test, tells sweep, honest score); THE SEAM on what the proposal is missing; MIRROR against John's notes; SEND ledger entry (HELD with Greg).

## 11. Open questions for Greg and John

1. Who is it addressed to? ASSUME "the partners of Pedersen & Houpt", letter opens "Anthony, Brian, and the partners". Change if John's call was with someone else.
2. The $50,000 split and every optional price. ASSUME as in §6.
3. 40/30/30 payments. ASSUME. The proposal engine's "no deposit, pay when you love it" guarantee conflicts with John's "payment at contract"; John's notes win here.
4. Platform. ASSUME Next.js on Vercel with a headless CMS the firm edits (Sanity), confirmed in discovery.
5. Validity. ASSUME the proposal holds through October 31, 2026.
