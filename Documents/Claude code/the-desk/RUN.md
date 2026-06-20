# Run the Desk

The "brain" is a Claude Code session following this routine. No API key, no `brain.ts` — it runs as normal Claude Code usage. To run a session, tell Claude: **"Run the desk"** (with the Robinhood MCP connected). Claude then does exactly this:

## Steps

1. **Read the rules.** Load `playbook.md`. Every cap, trigger, and honesty rule below comes from it.
2. **Pull live data + ground it** (Robinhood MCP):
   - `get_portfolio` + `get_equity_positions` per account → holdings, avg cost, cash, buying power.
   - `get_equity_quotes` for every held symbol **plus SPY** → current price + prev close.
   - **`get_equity_fundamentals` for every meaningful holding → P/E (trailing + forward if available), 52-wk range, market cap.** This is what makes "sell on thesis change" real instead of vibes. Cut the _expensive, extended_ names before the reasonably-valued ones.
   - **`get_earnings_calendar` / `get_earnings_results` → next earnings date per holding** (a catalyst/risk-timing input). Plus a quick `web_search` per major name for any thesis-changing news.
   - `get_equity_orders` → ~10 most recent **filled** orders → that account's `activity[]` as `{d,side,sym,qty,px,by}` (`by="you"` if `placed_agent=="user"` else `"auto"`). Result is huge — extract with jq, don't dump it.
   - Write it all to `data/portfolio.json` (shape: see the existing file).
3. **Compute TRUE concentration.** Group holdings by what _moves together_ (sector/theme as a proxy), not by single name. If one correlated block is >~45% of an account, that is the headline risk — record it as `trueConcentration {factor, pct, allTech, effectiveBets, note}` in proposals.json. Single-name caps lie; this is the number that matters.
4. **Run the five roles (one model, five lenses):** Scout → Bull → Bear → Risk → PM. Useful structure, but remember: this is **one mind**, not a panel. Do NOT report "N/5 agree" as if it were independent.
5. **Independent check (REQUIRED).** Dispatch a separate-context subagent (Agent tool, `general-purpose`) — or a different model — to review the book **cold**, do its own research, and argue _against_ the desk's conclusions. Give it the holdings, prices, fundamentals, and the playbook, but NOT the desk's reasoning. Record its verdict as `independentCheck {verdict, gist}` and per-proposal `consensus {label, detail}`. Show real agreement/disagreement. This is the cure for "the brain grades its own homework."
6. **Write the output:**
   - `data/proposals.json` — each proposal carries: `action, symbol, sizing, kind, tradeoff, grounded` (the data thesis), `tax` (after-tax math), `consensus` (the independent check), `eli5`, and the five role notes. Plus `headline`, `independentCheck`, `trueConcentration`, and a `noAction` list. Overrides go in `noAction` with `override:true` + a `kind`.
   - Append to `data/decisions.jsonl` — one line per decision **including no-actions and overrides**, with price + reason, before the outcome is known.
7. **Review in `index.html`.** Approve/Pass. Place approved orders by hand (or via the funded agentic sleeve only, after one explicit confirm). The desk never executes silently.

## Rules of the run (the honesty contract)

- **Draft-only.** Never place an order or move money on your own. Propose; Greg executes.
- **State the cost of every move.** Each proposal MUST carry a `tradeoff` (what Greg gives up) and a `kind` label: SAFETY/risk-reduction or MONEY/return. Never frame risk-reduction as "more money." Trimming a winner that keeps winning loses money — say so. Greg should never have to ask whether a call actually helps his returns.
- **No manufactured consensus.** The five roles are one model. "5/5 unanimous" is banned. Report agreement only when the **independent check** actually agrees.
- **Ground every thesis in data.** Point to the changed fact (valuation, earnings, guidance, a real event). No data → say "sizing/risk call only, no thesis read."
- **After-tax in taxable accounts.** Estimate `gain × ~25% (long-term blended, state the assumption)`. Show net cash, not gross. Sequence cheapest-tax-per-risk-cut first. Roth/tax-advantaged: trim freely, ignore tax.
- **Measure overrides, don't rubber-stamp them.** When Greg overrides a rule, log `type:"override"` and keep flagging it each run while it breaches the playbook. The tool's job is to measure his instincts, not flatter them.
- **Sell on thesis change, not price.** A drop alone is never a sell reason (a parabolic _rise_ in an overvalued name, however, is a real risk event worth sizing on).
- **Log the no-actions too.** "We chose not to act, here's why" is half the value.
- **Weekly or on-demand.** Not daily.

## Next run should

- Re-pull data + re-ground (prices and multiples move).
- **Score the prior run honestly.** The Scorecard grades each past `proposal` live vs current price. Make it permanent with an `outcome` row per resolved proposal:
  `{"type":"outcome","runId":"<run>","symbol":"QBTS","action":"TRIM","priceThen":24.69,"priceNow":<now>,"sincePct":<n>,"verdict":"...","status":"scored"}`
  Remember: a risk-trim that "costs upside" is NOT a failed call. Score against the goal (risk reduced?), not just next-day direction. And keep saying the sample is too small to mean anything until ~10+ calls.
- **Append a snapshot row** so vs-SPY builds a real series: `{"type":"snapshot","runId":"<run>","ts":"<iso>","portfolioValue":<computed total>,"spy":<spy price>}`. Keep `baseline.portfolioValue` = sum-of-positions total (NOT broker mark) or vs-SPY drifts off zero on day zero.
- Pick up flagged items (GRAB/ONDS thesis review) and, once cash is in hand, screen one diversifier that does NOT move with the account's biggest factor.

## Later (not yet)

- **Risk-adjusted scoring:** once there are ~10+ runs with snapshot rows, report vs-SPY on a risk-adjusted basis (return per unit of volatility), not raw. Beating SPY at 3× the vol is leverage, not skill.
- **Unattended runs:** a scheduled Claude agent could run this weekly. Open question: does the Robinhood OAuth token survive a headless/cron run? Test first. (Fidelity has no API — its holdings always need a manual paste regardless.)
- **Real product:** only if this needs to run 24/7 or ship to someone else, rebuild the brain as a standalone script on the metered API.
