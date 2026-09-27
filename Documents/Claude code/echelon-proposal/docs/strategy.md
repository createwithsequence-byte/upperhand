# The Echelon V0: proposal strategy (v2)

This is the working brief for the rewrite. Agree on it first, then rebuild the page around it, then lock the price.

**Sources:**
- Joe's functionality document, *The Echelon Website and Member Portal Functionality* (Sep 21)
- The Echelon Executive Overview and logo
- The notes in `~/code/echelon-upperhand/notes/2026-09-21-joe-v0-wishlist.md`
- Greg on Sep 25: Joe "can probably swing somewhere in the 15 - 30 range" and "bigger builds can be their own thing"
- Greg on Sep 27: the final number is $7,500
- The Pedersen & Houpt lessons in `upperhand-skills/processes/law-firm-proposals.md`

## What this is, and where we stand

This is a V0 build: the public website and the private Member Portal for The Echelon, launched together. It is not a strategy engagement or a marketing plan. It is also not the bigger platform (Shared Value, the Ambassador dashboard, an app). Those come later, as their own projects.

**Where we stand.** Joe asked for this. On Sep 21 he sent John a detailed V0 document asking for our thoughts, the costs, a timeline, a Progressive Web App recommendation, a native app estimate and a W-9 plan. Nobody else's quote is known to us. He names WordPress and BuddyPress twice, as the look he doesn't want, so he may have seen one.

**The price is $7,500.** That is small next to the work he describes. It makes the proposal cheap to say yes to, and it is the small first step into a bigger relationship.

**The tone that follows from that:** confident and plain. We answer his questions and show him the plan; we don't sell him on having one. Joe is a transactional lawyer with 34 years of practice and wrote the idea himself. So we don't explain referrals or relationships to him, we don't rule on his business model, and we don't editorialize his document back at him.

**Standing rules for this client:**
- Never say or imply the Member Benefit is illegal.
- No mention of the BBB.
- Nothing from the internal deep dive.
- None of the early prototypes' invented rules.

## Who the site is for

1. **Members, first, on a phone.** His bottom line: "Members should be able to log in, browse Company Partners by ecosystem/category, view Company Partner profiles, and initiate contact with a Company Partner." Everything in the portal serves that path.
2. **Prospective Members, second.** They arrive from an Ambassador or a referral. They need to understand The Echelon, trust its Standards and request Founding Membership in a minute.
3. **IntenseGBD's team, third.** They approve Members, build the Partner profiles, see every connection and run it all without a developer.

## How we build (one general statement, not a scorecard)

Every build starts on the same foundations, so the proposal can state them once and stop. We lead it ourselves, with a team behind every phase.

- **Mobile first.** Designed on a phone, fully responsive, and the portal installs to the home screen.
- **Fast.** Under 2 seconds on mobile.
- **Secure.** Encrypted, a role for each kind of user, two-factor sign-in for admins, daily backups.
- **Accessible.**
- **Easy to run.** An admin your team uses without us.
- **Yours.** IntenseGBD owns the code, data, design files and accounts, and can move them to another host or developer.

These are table stakes. They are never success measures, never a selling point, never a before-and-after.

## What it consists of

We build on our own component library and Supabase's standard sign-in, so sign-in, roles and admin are assembled rather than invented. Design extends the brand Joe already has; it is not a blank page. That is what makes the hours below possible.

1. **Discovery & planning** (week 1, 4 hrs). One working session on the Member journey, from the request form to the first Connect. We also settle:
   - the Company Partner profile template, built around his existing profile and questionnaire
   - roles
   - the Connect email
   - the sitemap
2. **Design** (weeks 1 to 2, 10 hrs). One direction, extending his logo and brand standards: navy, gold, the crest. Every page and portal screen is designed on a phone first. We refine with him until he's happy, on one consolidated set of comments at a time.
3. **Public website** (weeks 2 to 4, 8 hrs). His navigation, as written:
   - Home
   - The Echelon
   - Explore
   - Our Standards
   - Membership, with the Request Founding Membership form, which captures the source and the Ambassador on the way in
   - Sign In
   - The footer pages: About, Contact, Privacy, Terms, Company Partner Disclaimer, plus the copyright notice
4. **Member Portal** (weeks 3 to 5, 16 hrs):
   - password sign-in
   - the Member home
   - Explore by ecosystem and category
   - Company Partner profiles, with the Echelon Member Advantage set apart at the top
   - Connect: the press is logged (Member, Partner, date and time) and his email introduction goes out, with the Partner, the Member and IntenseGBD on it
   - My Echelon, with connection history
   - YouTube embeds
   - installs to the home screen as a Progressive Web App
5. **Admin** (weeks 3 to 5, 10 hrs):
   - add, edit and remove Members, Partners, profiles, categories, Advantages and page content
   - the membership queue: approve a request, then send enrollment, where the Member sets a password and accepts the Terms
   - the connection report, with a CSV export
   - source and Ambassador on every Member record
   - Ambassadors stored as records of their own, so a later Ambassador dashboard is a new screen, not a rework
6. **Integrations & security** (week 5, 4 hrs):
   - approved Members added to Constant Contact
   - email sent from his domain
   - two-factor sign-in for admins
   - backups and rate limits configured
7. **Content population** (weeks 4 to 5, 2 hrs of ours). We load the first Partner profile with his team as the pattern. His team loads the rest. The page copy is his.
8. **Testing, acceptance & launch** (weeks 5 to 6, 4 hrs):
   - testing on iPhone, Android and desktop
   - user acceptance testing with his team
   - launch at theechelonsignature.com
   - admin training and a short written guide
   - two weeks of monitoring and fixes
9. **Project management** (weeks 1 to 6, 2 hrs). A weekly staging link.

**Total: 60 hours over 6 weeks.**

**Tight:** the portal and admin, at 26 hours between them. What holds them in budget:
- the component library
- Supabase's built-in sign-in
- his team loading the profiles

It's a fixed fee, so an overrun is ours. Hours are the pricing unit, not a forecast for each line.

### His structure, as he wrote it

| Public site (his nav) | Member Portal (his list) | Out of V0 (his list) |
|---|---|---|
| Home, The Echelon, Explore, Our Standards, Membership, Sign In, footer | Home, Explore, profiles with Member Advantage, Connect, Member Source and Ambassador attribution, My Echelon, admin, Constant Contact, video embeds | Revenue and transaction tracking, an Ambassador portal or login, Partners editing their own profiles, marketing automation, social features, proprietary video |

## What it looks like

A short section.

**His brand, carried into the site:** the crest, navy and gold, and the Executive Overview's voice.

**Four wireframes of the portal path**, marked "For illustration only":
- Explore
- a profile
- the Connect confirmation
- My Echelon

They show the path he described, not a design. The design comes out of week 1 and his brand standards.

## Timeline

Six weeks from kickoff, and kickoff within five business days of signing. No far-off date anchors it.

His six milestones are all named:
- design approval (end of week 2)
- development
- testing
- content population
- user acceptance testing
- launch (end of week 6)

**We need from you:**
- the brand standards and the questionnaire
- one decision-maker for design
- the Constant Contact account
- the legal pages' final text
- the launch Partners' information
- sign-off at acceptance

The dates assume comments come back within two business days. There are no payments on the timeline.

## Cost

One fixed fee, built from hours, shown as the hours table. There's no headline fee and there are no tiers.

| Phase | Hours | At $125 |
|---|---|---|
| Discovery & planning | 4 | $500 |
| Design | 10 | $1,250 |
| Public website | 8 | $1,000 |
| Member Portal | 16 | $2,000 |
| Admin | 10 | $1,250 |
| Integrations & security | 4 | $500 |
| Content population | 2 | $250 |
| Testing, acceptance & launch | 4 | $500 |
| Project management | 2 | $250 |
| **V0, fixed** | **60** | **$7,500** |

**Three equal payments of $2,500:**
1. at signing
2. at design approval (end of week 2)
3. at launch (end of week 6)

The price holds through October 31, 2026.

**What would change it:**
- W-9s in V0 (see below)
- a second design direction
- Upperhand loading all the Partner profiles instead of his team

### Against the current page ($24,000)

| Line | Now | At $125, now | V2 hours | V2 | Where the hours went |
|---|---|---|---|---|---|
| Discovery & planning | $1,500 | 12 hrs | 4 | $500 | One session, not a planning phase |
| Brand extension & design | $5,500 | 44 hrs | 10 | $1,250 | One direction on his existing brand, no separate clickable prototype (the weekly staging link is the prototype), no logo redraw |
| Public website | $3,500 | 28 hrs | 8 | $1,000 | Built from our blocks |
| Member Portal | $6,500 | 52 hrs | 16 | $2,000 | Same features, from our blocks and Supabase sign-in |
| Administration | $3,000 | 24 hrs | 10 | $1,250 | Standard admin blocks, no connection statuses |
| Integrations & security | $2,000 | 16 hrs | 4 | $500 | Same list, configured rather than built |
| Testing & launch | $2,000 | 16 hrs | 6 | $750 | Content population split out. First profile, not three. Two weeks of fixes, not thirty days |
| Project management | (none) | (none) | 2 | $250 | Now its own line |
| **Total** | **$24,000** | **192 hrs** | **60** | **$7,500** | |

Joe's V0 list stays whole. What comes out is ours:
- Ambassador personal links
- connection statuses
- the separate prototype
- the logo redraw
- two of the three profiles we'd load
- the longer fix window

## After launch

1. **Keeping it running.**
   - Maintenance in 10-hour blocks at $150 an hour, $1,500 a block.
   - Hours never expire. Nothing is on a retainer.
   - Hosting is paid by IntenseGBD directly to the providers, on accounts in its name from day one.
2. **Running costs, his question 2.** About $45 a month:
   - Vercel Pro, $20, one developer seat included
   - Supabase Pro, $25, with daily backups kept 7 days
   - Resend, free to 3,000 emails a month (100 a day), then $20
   - Constant Contact on his own plan
   - the domain, his
   - (vendor prices checked Sep 25)
3. **Bigger builds, each its own project, at the build rate:**
   - **W-9s, Path A:** a specialist service, connected, with W-9 status in admin. 6 hrs, $750, plus the service's per-form fees. This is our recommendation, and his two requirements (submitted through the platform, not stored in the V0 portal) are both met by it.
   - **W-9s, Path B:** secure storage inside the platform. About 30 hrs, $3,750.
   - **Native iOS and Android app:** preliminary 100 to 160 hrs, $12,500 to $20,000, on the same foundation. Quoted properly after a few months of real use.
   - **The Ambassador dashboard, Partner logins and Shared Value:** each scoped in hours when he's ready.

## Coming out of the current page

Each item is checked against the three tests:
- **Critique:** it critiques Joe's current state
- **Table stakes:** it sells a table stake as a feature
- **Complexity:** it adds complexity this strategy doesn't need

| # | Section / element | Test | Call |
|---|---|---|---|
| 1 | Cover: the three.js Founding Member card, its stills (`card.webp`, `card-back.webp`), `card.js`, three.js vendor, the logo crops | Complexity | **Cut.** No 3D objects in a sales document. The card was ours, not his decision. It also puts "Designed and built by Upperhand" on his brand asset. |
| 2 | Cover: fixed fee and launch week in the meta strip | Complexity | **Cut.** Prepared for, by and date only. The fee arrives with its hours. |
| 3 | Letter aside: "The short version" card ($24,000 · 10 weeks · 1 launch · $45 · 0 · Yours) | Table stakes, complexity | **Cut.** It sells "0 plugins" and "Yours" as points, and repeats the fee as a headline. |
| 4 | "What you asked, answered": 8 cards | Complexity | **Keep, as a plain list.** He asked these questions, so it serves his decision. It becomes one line per answer and a link, with no card grid. |
| 5 | Goals: "We build V0 so that" (7 measures: under a minute, a few taps, under 2 seconds, "not like a template"…) | Table stakes | **Cut.** Table stakes posing as success measures. The verbs headline and his bottom-line quote become "Who it's for". |
| 6 | V0: the page and portal lists | (none) | **Keep.** His structure, as he wrote it. Trim the descriptions. |
| 7 | V0: four CSS phone wireframes | Complexity (light) | **Keep, marked "For illustration only".** The only picture of the path he's buying. It becomes "What it looks like". |
| 8 | V0: "When a Member presses Connect", a 4-step flow | Complexity | **Cut to one sentence** inside the portal scope. It explains his own idea back to him. |
| 9 | V0: "Left out of V0, on purpose" | (none) | **Keep, one line.** His exclusions set the boundary. |
| 10 | Approach, rec 01: "Design it custom, build it on tested parts" | Table stakes | **Fold into "How we build".** Stack wording leads with the benefit. |
| 11 | Approach, rec 02: PWA now | (none) | **Keep.** It answers his question. Two sentences. |
| 12 | Approach, rec 03: Connect statuses (made, in conversation, closed) | Complexity | **Cut the statuses.** He didn't ask for them. Keep "logged at the button". |
| 13 | Approach, rec 04: Ambassador personal links | Complexity | **Cut.** An addition. It goes to V1 ideas. |
| 14 | Approach, rec 05: Ambassadors and Partners as records | (none) | **Keep, one line in admin scope.** It answers "without requiring substantial rework". |
| 15 | Approach, rec 06: profile shaped around his questionnaire | (none) | **Keep, one line in discovery.** |
| 16 | Approach, rec 07: "Launch Explore with no empty shelves" | Critique (light), complexity | **Cut.** Advice on his launch content; a discovery conversation. |
| 17 | Approach, rec 08: "The fine print stays on your side of the table" | (none) | **Move to "We need from you".** |
| 18 | Approach: the architecture diagram, "One platform underneath all of it" | Complexity | **Cut to one sentence:** the app and the Ambassador dashboard build on the same database and sign-in. |
| 19 | Approach: web app vs native table (7 rows) | Complexity | **Cut to two sentences** plus the estimate. |
| 20 | W-9s: two quote panels, Path A / Path B cards, "Either way" | Complexity | **Keep, one short block.** The recommendation, Path A in hours, Path B as its own build. The quote panels come out. |
| 21 | Security & ownership: 12 checklist items and account chips | Table stakes | **Cut to "How we build"**, plus one short answer to his security, backup and ownership asks. |
| 22 | Timeline: payment markers on the Gantt, "You get" rows | Complexity | **Cut.** No payments on the timeline, and only "We need from you" per phase. |
| 23 | Investment: line-item accordion in dollars, "It stays lean for three reasons" | Table stakes, complexity | **Replace** with the hours table. The "three reasons" are selling points and come out. |
| 24 | Investment: running-costs table | (none) | **Keep, simpler.** It answers his question 2. |
| 25 | Investment: "Small additions" / "Bigger builds" | (none) | **Keep**, re-priced in hours: W-9 A $750, W-9 B $3,750, app $12,500 to $20,000, hours $150. |
| 26 | About: the card back image, "supported internally by our dedicated team" | Complexity | **Cut the image.** Use Upperhand's own About copy, as in the Pedersen final. |
| 27 | Next steps: "A short services agreement", the buttons | (none) | **Change:** "A master services agreement (MSA) and a scope of work". No buttons, same as the Pedersen final. |

Critique of Joe's current state is nearly absent. The cleanup is mostly table stakes sold as features and our own additions.

## Open decisions

1. **Maintenance.** Pedersen required the first block (10 hrs × $150) inside the fee. Here it would make $7,500 = 48 build hours + $1,500, and the build is already tight. The recommendation is optional blocks, with $7,500 all build.
2. **W-9s.** Path A adds $750, making $8,250. Does that ride inside the $7,500, or stay an add-on? The proposal keeps it as an add-on to hold the number.
3. **Cover photograph.** Pedersen's cover used their street. The Echelon has no photography. Options: his crest on navy, or a Chicago image. Which one?
4. **The live URL.** `echelon-v0-proposal.vercel.app` is public (noindex) and still shows $24,000. Leave it until v2 ships, or take it down now?
5. **PDF.** Keep it. Joe is a lawyer, and "most of the partners will want a pdf" held at Pedersen.

## Updates

- 2026-09-27: v2 brief written. $7,500 from 60 hrs × $125, three equal payments of $2,500, six weeks. The page is unchanged until Greg and John agree on this.
