# CANTOR — sprite spec

Measured from the live game geometry, not estimated. Drop PNGs in this folder,
rename `manifest.example.json` → `manifest.json`, and the game switches over on
reload. Delete the manifest and it falls back to procedural art. Nothing else
in the codebase changes.

## The one rule that matters

**Limbs are separate sprites, drawn rotated about their joint.** Not baked into
a body sheet. The whole combat system rests on the player reading a limb's
current _angle_ to decide whether a horizontal or vertical cut will sever it —
so the engine has to own that rotation. A pre-animated sheet cannot express
"this arm is at 12° right now."

Each limb sprite must therefore be drawn **pointing straight right (0°), joint
at the left edge**, and the anchor must sit exactly on the joint.

## Palette

Locked, indexed, max 24 colours. The game's contrast rests on three bands:

| band | hex                           | use                                     |
| ---- | ----------------------------- | --------------------------------------- |
| void | `#07090c` `#0d0709`           | body mass — the creature is mostly this |
| bone | `#e6dcc6` `#a89c86`           | rim light on the upper edge ONLY        |
| wet  | `#6d2226` `#40151a` `#8e1f24` | joints, stumps, interior                |

**Do not paint the organs.** The engine draws them additively on top, from the
same coordinates the hit-test uses. A painted organ would sit in the wrong
place the moment the limb swings. Leave a dark socket where one belongs.

Cold cyan `#8fd9ff` is reserved for Wren. Nothing on a creature may use it —
that opposition is how the player reads friend from thing at a glance.

## Assets

| id                  | file                  | size (px) | anchor      | notes                                                                                  |
| ------------------- | --------------------- | --------- | ----------- | -------------------------------------------------------------------------------------- |
| `reed_torso`        | reed_torso.png        | 66 × 73   | `[24, 55]`  | hunched, head thrust forward + down. Facing RIGHT. Anchor = hips.                      |
| `reed_torso_cut`    | reed_torso_cut.png    | 66 × 73   | `[24, 55]`  | same body, throat torn out — dark ragged socket at the neck                            |
| `reed_arm`          | reed_arm.png          | 54 × 12   | `[2, 6]`    | points RIGHT, joint at left edge                                                       |
| `reed_leg`          | reed_leg.png          | 63 × 14   | `[2, 7]`    | points RIGHT, joint at left edge                                                       |
| `bellows_torso`     | bellows_torso.png     | 140 × 148 | `[52, 113]` | 2.1× the Reed. Opened ribcage, staves held apart.                                      |
| `bellows_torso_cut` | bellows_torso_cut.png | 140 × 148 | `[52, 113]` | throat destroyed                                                                       |
| `bellows_arm`       | bellows_arm.png       | 104 × 21  | `[3, 10]`   | points RIGHT                                                                           |
| `bellows_leg`       | bellows_leg.png       | 112 × 25  | `[3, 12]`   | points RIGHT                                                                           |
| `cantor_body`       | cantor_body.png       | 110 × 400 | `[55, 200]` | 8 frames, slow sway. A column of fused ribcages under a bell-shaped head with no face. |
| `wren_idle`         | wren_idle.png         | 26 × 74   | `[13, 37]`  | 4 frames                                                                               |
| `wren_walk`         | wren_walk.png         | 26 × 74   | `[13, 37]`  | 8 frames                                                                               |

Sheets are horizontal strips: `frameW × frameH`, frames laid left to right.

## PixelLab prompt scaffold

Generate the Reed torso first and use it as the style reference for
everything else — consistency across the set is the hard part, not any one
sprite.

> Side-view pixel art, 66×73, hunched eyeless humanoid facing right, head
> thrust forward and downward as if listening to the floor, chest cavity split
> open with ribs held apart, body almost entirely in near-black silhouette
> (`#0d0709`) with pale bone rim light only along the top edge (`#e6dcc6`),
> wet dark red at the joints (`#6d2226`), no eyes, jaw hinged permanently open,
> limited palette 24 colours, no anti-aliasing, transparent background

For the limbs, pass the torso as reference and ask for the matching arm/leg
**laid horizontally, joint at the left edge**.

For `cantor_body`, the note to hit: it is not a monster shape, it is an
_instrument_ shape. A pipe organ that used to be six people.

## Checking your work

Load the game with `?test=1`. The suite verifies anchors and scale against the
code. If a sprite is the wrong size the game still runs — it just draws it at
the wrong size, so eyeball it against the procedural version by temporarily
renaming `manifest.json`.
