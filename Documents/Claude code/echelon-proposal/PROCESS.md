# Plan · The Echelon V0 proposal (from "Law firm proposals")

Recalled Sep 25, 2026 from `upperhand-skills/processes/law-firm-proposals.md`.

**Same:** the pipeline and build kit (data.js as the single source, check.mjs, build.mjs, bench.mjs, shots.mjs, print.css), the review order, the deploy and git rules, no example sites, and Greg's tone rules.

**Different:**
- **No audit.** Joe's own document is the brief: *The Echelon Website & Member Portal Functionality* (Sep 21), plus the Executive Overview and the logo, in `~/Downloads/fwdtheechelon/`. His eight asks are the spine.
- **Research exists.** It lives in `~/code/echelon-deep-dive`, which is internal and never linked or quoted. Notes are in `~/code/echelon-upperhand/notes/`.
- **The look is black-first, with Upperhand colors** (Greg: "you can use some blacks as well mixed with the UH colors"). The Echelon's navy #00040F and gold #c99a4e appear only inside Echelon artifacts: the logo and the member card.
- **The proposal is wider**: approach and recommendations, not only scope (Greg: "this one is a bit wider with suggestions and approach").
- **The signature object is the Founding Member card**, a black metal card in three.js. It is not the deal toy.

## Before you start

**Known:**
- The V0 scope, the eight asks, and that the site is still "Launching Soon" (checked Sep 25).
- Joe's words: "intentionally simple and elegant", and it "cannot appear like an off-the-shelf WordPress/BuddyPress site".
- Running costs, checked Sep 25:
  - Vercel Pro: $20 a month
  - Supabase Pro: $25 a month, with 7-day daily backups; point-in-time recovery is $100 a month extra
  - Resend: free for 3,000 emails a month, or $20 a month

**Ask Greg or John:**
- The fee. ASSUME $52,000 for V0, with the same 40/30/30 payments.
- The native app range. ASSUME $55,000 to $80,000, preliminary.
- The W-9 build price. ASSUME $8,000 in the platform, or $1,500 to integrate a specialist service.
- The salutation. ASSUME "Joe,", signed by John and Greg.

## Standing rules for this client (from memory)

- Never state that the member cash-back is illegal. If it comes up, it's a structuring call, "more your field than ours".
- No mention of the BBB.
- Never link or quote the internal deep dive.
- The fixes to the prototypes' invented rules (the 100-member cap, the splits) stay out.

## Steps

1. Build from the kit in `Documents/Claude code/echelon-proposal/`. Keep the old watch-outs: nav width, `img` height, eager images in print, print image copies, PDF link rewrite, grid folding in print.
2. Make the member card object, with its etching on the face, lines fitted to the frame, and time-based easing.
3. Tone gate.
4. Reviews: the bench probe, two Playwright walks, a hostile copy agent against Joe's documents, then THE EYE and MIRROR.
5. Deploy: a noindex placeholder first, then previews and a share link. Production waits for Greg.
6. Git: private `Upperhand-LLC/echelon-proposal` through a subtree split and `npm run push`.
7. Hand back: send ledger HELD, memory, and the open items.

## Make fresh

The look, the object, the copy, the recommendations, the V0 flow wireframes, the data and the prices.
