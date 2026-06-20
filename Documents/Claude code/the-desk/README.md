# THE DESK

An AI-run investment process that's smarter than just connecting a brokerage MCP. It researches before it buys, argues both sides, enforces hard risk limits, remembers every call, and **never moves money on its own** — it proposes, you approve, you place the order by hand.

This is the local MVP: a test sleeve to find out whether the process beats just buying SPY. Built to be deleted with no side effects.

## What's here

| File                   | What it is                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `playbook.md`          | The rules the desk obeys. Plain text. Edit it; the desk reads it every run.                                                                                     |
| `index.html`           | The hub. A dashboard showing your real positions, pending proposals (Approve/Pass), a playbook check, and the decision log. Static — reads the JSON in `data/`. |
| `RUN.md`               | The routine a Claude Code session follows to run the desk.                                                                                                      |
| `data/portfolio.json`  | Your real holdings + live quotes from the last run.                                                                                                             |
| `data/proposals.json`  | The last run's pending proposals + the 5-agent reasoning.                                                                                                       |
| `data/decisions.jsonl` | Append-only log of every decision (including no-actions). The scoreboard.                                                                                       |

## How to use it

**View the hub:** serve this folder over http (fetch won't work from `file://`):

```
npx serve the-desk          # then open the printed localhost URL
```

**Run the desk** (refresh data + generate new proposals): in a Claude Code session with the Robinhood MCP connected, say **"Run the desk."** Claude follows `RUN.md`.

## The cost

The brain runs inside Claude Code — no separate API bill, just normal Claude Code usage. The hub and data files are free static assets. Run weekly or on-demand.

## Hard rules

- Draft-only. The desk never executes a trade or moves money. You approve every order and place it yourself in Robinhood.
- Sell on thesis change, not price.
- Benchmark is SPY. If the process can't beat the index over a real window, it's a hobby and we stop.

## First run (2026-06-17)

Found three playbook breaches on the existing •6940 book and proposed de-risking before any new buy: trim IREN (over the 12% single-name cap), trim CIFR (miners over the 35% theme cap), clean up dead ARBK — raising an ~8.7% cash floor from $0. No new buys until cash settles. Baseline vs SPY set at day zero.

## Status / next

- [ ] Greg reviews `playbook.md` and confirms the caps + which account to run.
- [ ] Approve/Pass the first run's proposals in the hub; place any approved trims by hand.
- [ ] Next run: score the open proposals, review the GRAB/ONDS flags, screen one diversifier.
- [ ] Later: test unattended scheduled runs (Robinhood-auth-in-headless is the open question).
