"""Build CANTOR maps from a spec instead of counting characters by hand.
Design rules, derived from the physics rather than guessed:
  · apex 2.28 tiles, running gap 3.06 tiles
  · the GROUND FLOOR is a continuous spine from spawn to exit — completion
    never depends on a platforming puzzle, which is wrong for horror anyway
  · decks are optional loops holding terminals and pickups
  · every ladder runs from a floor tile up THROUGH its deck (a 'H' hole in
    the deck row), so it can be grabbed from the ground and stepped off at
    the top
  · pits are 2 tiles max
"""
ROWS = 15

def blank(w): return [['.'] * w for _ in range(ROWS)]

def fill(g, r, a, b, ch='#'):
    for x in range(a, b + 1): g[r][x] = ch

def ladder(g, col, top, bottom):
    for r in range(top, bottom + 1): g[r][col] = 'H'

def put(g, r, c, ch): g[r][c] = ch

def emit(g, name):
    print(f'  // {name}')
    for row in g: print('  "' + ''.join(row) + '",')
    print()

# ─────────────── CH0 · ANECHOIC (76 wide) ───────────────
W0 = 76
g = blank(W0)
fill(g, 0, 0, W0 - 1)                 # ceiling
for r in range(1, ROWS): g[r][0] = '#'; g[r][W0 - 1] = '#'
fill(g, 14, 0, W0 - 1)                # ground
fill(g, 14, 30, 31, '.')              # one telegraphed 2-tile pit
fill(g, 8, 14, 54)                    # mid deck  -> walkable r7
fill(g, 3, 34, 50)                    # upper deck -> walkable r2
ladder(g, 20, 7, 13)                  # ground -> mid, punching through r8
ladder(g, 40, 2, 7)                   # mid -> upper, punching through r3
put(g, 13, 4, 'P')
put(g, 13, 71, '>')
put(g, 13, 44, 'T')                   # terminal 0, on the spine
put(g, 2, 38, 'T')                    # terminal 1, rewards the climb
put(g, 7, 30, '+')
put(g, 13, 24, 'f')
put(g, 13, 18, 'r'); put(g, 13, 58, 'r'); put(g, 7, 46, 'r')
for c in range(5, 8): put(g, 3, c, '~')
emit(g, 'CH0 ANECHOIC')

# ─────────────── CH1 · THE HOLD (94 wide) ───────────────
W1 = 94
g = blank(W1)
fill(g, 0, 0, W1 - 1)
for r in range(1, ROWS): g[r][0] = '#'; g[r][W1 - 1] = '#'
fill(g, 14, 0, W1 - 1)
fill(g, 14, 36, 37, '.')
fill(g, 14, 68, 69, '.')
fill(g, 9, 8, 40)                     # low deck  -> r8
fill(g, 9, 54, 86)
fill(g, 4, 26, 66)                    # high deck -> r3
ladder(g, 14, 8, 13)
ladder(g, 60, 8, 13)
ladder(g, 34, 3, 8)                   # low deck -> high deck
put(g, 13, 4, 'P')
put(g, 13, 89, '>')
put(g, 8, 20, 'T')
put(g, 3, 48, 'T')
put(g, 8, 76, '+')
put(g, 13, 26, 'f')
put(g, 13, 46, 'r'); put(g, 13, 78, 'r'); put(g, 8, 30, 'r')
put(g, 8, 66, 'b')
put(g, 13, 58, 'c')                   # the Cantor walks the spine
for c in range(70, 74): put(g, 4, c, '~')
emit(g, 'CH1 THE HOLD')

# ─────────────── CH2 · THE ARRAY (96 wide) ───────────────
W2 = 96
g = blank(W2)
fill(g, 0, 0, W2 - 1)
for r in range(1, ROWS): g[r][0] = '#'; g[r][W2 - 1] = '#'
fill(g, 14, 0, W2 - 1)
fill(g, 14, 30, 31, '.')
fill(g, 14, 62, 63, '.')
fill(g, 10, 6, 44)                    # -> r9
fill(g, 10, 58, 90)
fill(g, 6, 20, 74)                    # -> r5
fill(g, 3, 40, 70)                    # -> r2 (r2 deck would bury her head in the ceiling)
ladder(g, 12, 9, 13)
ladder(g, 68, 9, 13)
ladder(g, 28, 5, 9)
ladder(g, 52, 2, 5)
put(g, 13, 4, 'P')
put(g, 13, 91, '>')
put(g, 9, 18, 'T')
put(g, 2, 58, 'T')
put(g, 5, 34, '+')
put(g, 13, 20, 'f')
put(g, 13, 40, 'r'); put(g, 13, 76, 'r'); put(g, 9, 36, 'r'); put(g, 5, 60, 'r')
put(g, 9, 64, 'b'); put(g, 5, 26, 'b')
put(g, 13, 54, 'c')
for c in range(78, 83): put(g, 6, c, '~')
emit(g, 'CH2 THE ARRAY')
