# Level library

`mapgen.py` is the source of truth for every chapter's geometry. Edit the
spec, run it, paste the output into the `rows:` arrays in `index.html`.

```bash
python3 tools/mapgen.py
```

## Why this exists

The maps were hand-authored as 90-character string literals and I counted
the columns by eye. All three chapters shipped **unfinishable** — chapter 2
gave the player 8 reachable tiles. Hand-counting is the bug.

## The design rules, derived from the physics not from feel

With `GRAV 0.82`, `JUMP -13.4`, `RUN 4.5` and `TS 48`:

- **apex 109px = 2.28 tiles** → a 2-tile ledge is the tallest unaided climb
- **running gap 147px = 3.06 tiles** → pits are 2 tiles, never more
- Wren is 74px tall, so **a deck one row under the ceiling is unstandable** —
  her head ends up inside it. Leave two rows.
- The **ground floor is a continuous spine** from spawn to exit. Completing a
  chapter never depends on a platforming puzzle; decks are optional loops
  holding terminals and pickups. This is also just correct for horror.
- Every **ladder runs from a floor tile up through a hole in its deck**, so it
  can be grabbed from the ground and stepped off at the top. A ladder whose
  bottom rung starts above her head is invisible to the grab check.

## Verification

`index.html?test=1` runs a solver that walks each chapter using Wren's real
movement code — same gravity, same jump arc, same tile collision — from the
spawn, and BFSes every reachable position. It fails the suite if the exit
isn't reachable on foot, or if any terminal or pickup is orphaned.

That gate is the thing that must never be removed.
