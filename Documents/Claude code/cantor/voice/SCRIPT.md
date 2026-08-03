# CANTOR — voice script

Generate these with ElevenLabs, drop the mp3s in this folder, rename
`manifest.example.json` → `manifest.json`. Any missing line falls back to the
synth, so you can do them one at a time and hear the difference immediately.

The engine plays everything except Wren through a bandpass and a slap delay —
**do not add reverb or distance in the generation.** Deliver clean and dry; the
station does the rest. Double-processing is what makes game VO sound like a
podcast played in a corridor.

---

## The Cantor — voice `vbft9J9LMpt65czIyxvw`

This is the one worth getting right. It is not a monster roar and it is not a
narrator. It is **Kofi Adeyemi's voice**, learned off eleven months of station
comms by something that does not understand what a name is for. It has heard
Wren called by her name several thousand times and has concluded that saying
it is what you do to a person.

**Direction:** flat. Unhurried. No menace performed anywhere — the horror is
that it sounds _kind_, like someone calling you in from another room. Slight
overlong vowels, as if the word is being held rather than spoken. Never a
question, never a shout.

| id              | line                                |
| --------------- | ----------------------------------- |
| `cantor_name_1` | "Wren."                             |
| `cantor_name_2` | "Wren. Adeyemi."                    |
| `cantor_name_3` | "Wren, it's me."                    |
| `cantor_name_4` | "Wren. Come and hear it."           |
| `cantor_name_5` | "It's only the one note, Wren."     |
| `cantor_name_6` | "You tuned it. You should hear it." |

Six variants matters more than six perfect takes. The line fires every ~200
frames when it is near you, and repetition is what kills dread.

---

## Wren Adeyemi — pick a second voice

Mid-thirties, acoustic engineer, talking to herself inside a helmet because
the alternative is silence. **Direction:** low volume, close mic, almost
subvocal. She is not narrating for an audience, she is keeping herself
company. Never frightened-sounding — she is _working_. The fear is underneath.

| id           | line                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| `wren_ch0_0` | "The chamber door was shut. That is the only reason."                            |
| `wren_ch0_1` | "They're blind. Whatever it did to them, it took the eyes first."                |
| `wren_ch0_2` | "Body shots do nothing. Cut the parts that are lit."                             |
| `wren_ch1_0` | "Something down here is holding a note. It hasn't stopped for eleven months."    |
| `wren_ch1_1` | "That's Kofi's voice. That's my name in Kofi's voice."                           |
| `wren_ch1_2` | "It doesn't want to catch me. It wants me to hold still and listen."             |
| `wren_ch2_0` | "Bearing two nine one point four. That's my alignment. That's the number I cut." |
| `wren_ch2_1` | "We didn't receive anything. We answered something."                             |
| `wren_ch2_2` | "Shutting the array down does nothing. It already knows where we are."           |

`wren_ch1_1` is the pivot of the whole story. If one line gets a second take,
that one.

---

## Deliberately NOT in this script

There is no station AI and no narrator. THE INVITATION had a calm omniscient
voice asking the player why they were still refusing, and it was the weakest
thing in it — an all-knowing voice explains the theme out loud and does the
player's thinking for them. Everything here is either a person talking to
herself or a dead man's voice being worn by something else.

If a third voice ever gets added it should be **Kofi alive**, in the archived
comms logs on the terminals, so the player hears what the Cantor is imitating
_before_ they hear the imitation.

## Format

Mono mp3 or wav, 44.1kHz. Filenames match the ids above (`cantor_name_1.mp3`).
Keep them short — the longest line here is under four seconds.
