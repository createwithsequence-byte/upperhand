# PendulumPro — Playbook

The rules the desk obeys. Plain words. Edit freely — the desk reads this file every run and is not allowed to break it.

**Owner:** Greg · **Version:** v2 (2026-06-19) · **Risk tolerance:** medium / high

---

## What this actually is (read this first)

A disciplined, AI-run **process** for managing real money. Be honest about what that means:

- **What it IS:** a risk-control + journaling + bias-mirror layer that now reasons from **real data** (valuation, earnings, news), gets checked by an **independent second opinion**, and logs every call so we can later tell skill from luck.
- **What it is NOT (yet):** an alpha engine. It does not have a proven edge at picking winners. Most of its value so far is _not losing_ — staying disciplined, not over-concentrating, not selling in a panic, not letting a winner become the whole account.
- **The benchmark is SPY, but reported risk-adjusted.** Beating SPY while holding 3x its volatility is not skill, it's leverage. The desk must say so. Real verdict needs ~10+ runs over months — until then, every score is provisional and must be labeled noise.

## The honesty rules (non-negotiable — these exist because the owner asked for them)

1. **State the cost of every move, never just the case for it.** Each proposal carries a `tradeoff` (what you give up by acting) and a `kind` label: is this a **SAFETY** move (reduces risk, may cost return) or a **MONEY** move (aims to grow returns)? Never frame risk-reduction as "more money." Greg should never have to ask whether a recommendation actually helps his returns.
2. **No manufactured consensus.** The five roles are one model wearing five hats — that is NOT five independent opinions, so "5/5 agree" is meaningless and is banned. Report genuine agreement only when an **independent check** (separate-context subagent or a different model) actually agrees. Show disagreement loudly when it exists.
3. **Ground every thesis in real data.** "Sell on thesis change" is only allowed if you can point to the changed fact (earnings miss, guidance cut, valuation, a real news event). No vibes. If you have no data, say "no thesis read available — this is a sizing/risk call only."
4. **Measure the owner's overrides.** When Greg overrides a rule (e.g. holds a winner past the cap), log it as an `override` and score it like any other call. The tool's job is to _measure_ his instincts, not rubber-stamp them. Keep gently disagreeing each run if the override still breaches the playbook — don't fold after one "your call."

## Money & accounts

- **Each account has a `goal` and a `horizon`** (set in portfolio.json). Advice is goal-relative. A retirement account and a house-down-payment account get opposite advice from the same holding.
- **Account tax behavior:**
  - **Roth IRA / tax-advantaged:** gains are tax-free — trim freely for risk, never let taxes stop a good trim, and prefer holding compounders here.
  - **Taxable (brokerage/joint):** every sale is a taxable event. Size and sequence trims **after-tax** (see below). Long-held winners carry a real tax bill that can outweigh a marginal risk trim.
- **The desk never moves money on its own.** It proposes; Greg approves; orders are placed by hand (or, in the funded agentic sleeve only, fired after one explicit confirm). No silent execution.

## Position sizing (the risk control)

- **Core (compounders, held for years): 60–70% of the account.**
- **Satellite (bold, high-upside bets): 30–40%.**
- **Max single satellite bet: 3%.** Sized so a total loss costs ~1–2%.
- **Max single position (any kind): 12%.**
- **Max single theme: 35%.**
- **TRUE concentration cap — the one that matters most: no more than ~45% in names that move together.** Single-name caps lie. AMD + NVDA + AVGO + QBTS are not four bets, they're roughly **one** bet on AI/semis. Measure correlated exposure (by sector/theme as a proxy until there's enough price history for a real correlation number) and treat _that_ block as the real concentration.
- **Cash floor: 5–10%** in cash or SGOV.

## After-tax sizing (taxable accounts only)

- Estimate the tax on every proposed sale: `realized gain × blended rate`.
- **Default assumption (state it every time):** long-term holding (>1yr) → ~25% blended (≈15–20% federal LTCG + 3.8% NIIT + state). Flag if holding period is unknown.
- A "good trim" that triggers a large tax bill may be worth _less_ than it looks. Show the after-tax cash raised, not just gross. Prefer phasing big trims across tax years when risk allows.

## Valuation awareness

- A position's **multiple vs its own history and its peers** is a real input. Trimming the 176x-P/E name near its all-time high is different from trimming the 32x-P/E leader off its highs — even if both breach a % cap. Cut the _expensive, extended_ names before the _reasonably-valued_ ones.

## When to sell

A trade triggers on a **thesis change** (grounded in data) or a **risk breach**, not a price move and not a headline. Sell/trim when:

- The reason you bought is no longer true (name a changed fact).
- A position breaks its thesis **and** is down more than 25%.
- A position (or correlated block) grows past the caps — trim back toward target, after-tax.
- A speculative/satellite name has ballooned far past 3% — take the original stake off the table ("house money"), let the rest ride.
- It's dead weight — clean it up.

Do **not** sell just because something dropped. Do **not** add just because something is running.

## When to buy

- Only when the cash floor allows it.
- A buy must survive the desk's bear case **and the independent check**. Generating ideas is easy; surviving the red team is the bar.
- Prefer asymmetric setups: capped downside (small size), uncapped upside.
- New money lowers concentration; selling-to-fund does not. Prefer fresh cash for diversification when available.

## How the desk runs (the process)

Every run, in one Claude Code session:

1. **Pull real data** — positions, prices, **fundamentals (P/E, 52-wk range), earnings dates, recent news** for every meaningful holding.
2. **Five roles (one model)** — Scout / Bull / Bear / Risk / PM. Useful for structured thinking, but remember rule 2: this is one mind, not a panel.
3. **Independent check** — a separate-context subagent (or a different model) reviews the book cold and argues against the desk's conclusions. Its verdict and any disagreement are recorded and shown.
4. **Write proposals** — each with `kind`, `tradeoff`, grounded thesis, after-tax math, and the independent verdict. Plus a `noAction` list (holds/flags/overrides) and a one-line headline.
5. **Log everything** — including no-actions and overrides, with price + reason, before the outcome is known.

## Cadence

- **Weekly** or on-demand. Not daily. The tool does not auto-update — it's only as fresh as the last run.

## Open assumptions to confirm

- [ ] Goals/horizons per account — defaults are set in portfolio.json and flagged; confirm or correct them.
- [ ] Risk tolerance medium/high, sizing caps — adjust to taste.
- [ ] After-tax default rate (~25% LTCG blended) — refine once we know holding periods + state of residence.
- [ ] Benchmark: SPY, or switch to a risk-matched benchmark (e.g. QQQ) given the growth/semis tilt?
