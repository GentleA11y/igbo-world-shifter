# Rebuild plan: Echoes of the Ancestors

## Where the game is today

The game is a short, roughly 5-minute vertical slice. It's one long level (3,840 px wide) with three areas:

| Area | What happens |
|---|---|
| **Village of Umueze** | Talk to Mbe the tortoise, look at the hut, yam barn, hearth and totem, and collect the cowrie and ofo relics |
| **Forest path** | Touch the Okpesi stone to wake **Spirit Sight**, cross the chasm on spirit roots, collect the kola seed, ring the ogene bell to open the barrier |
| **Alusi shrine** | Touch the altar, the Red Mask speaks, the Hollow Man appears, and the "What you have forgotten is waking" ending plays |

**What's strong:** the core idea (one world you can see two ways), the folklore (Mbe, the Ofo, the Ogene, Alusi, Mmanwu), the warm and cool colour palettes, and the glossary.

**What holds it back:**
- **One big file.** All the level layout, story triggers and game rules sit in one ~770-line scene (`src/game/main.ts`), with positions hard-coded. Adding a second level today means copying and pasting.
- **Spirit Sight is used only twice:** the roots over the chasm and the bell.
- **Relics do nothing** once you pick them up.
- **No saving**, no checkpoints apart from respawning, and no sense of progress.
- **Art is drawn in code** (`src/sprites/textures.ts`). It's charming, but it limits detail and animation (Chima has only 4 walk frames).
- **No sound files.**

## Phases

Each phase ends with something playable that can go on GitHub.

### Phase 1: Foundations ✅ done
_Also fixed bugs that made the chapter impossible to finish (talk points could not be used, the dialogue box was stuck on its first line)._

- Split the scene into small parts: player movement, Spirit Sight, dialogue, relics and story triggers.
- Move each level into a **data file** (`src/levels/chapter1.ts`) that lists props, platforms, relics, talk points and triggers, so new areas are mostly data.
- Separate scenes: Boot → Menu → Chapter → Ending.
- **Save progress** in the browser: relics, chapter, checkpoint.
- Better jump feel: a short grace period after running off an edge, buffered jump presses, and checkpoints before hard sections.

### Phase 2: Chapter 1 remastered (same story, much better to play)
- **Give relics a purpose.** For example, the kola seed is offered at the shrine, and the ofo staff opens doors that answer only to truth.
- **Use Spirit Sight more:** hidden paths, ancestors who only speak in the spirit world, and things that look different in each world.
- A small **ogene rhythm puzzle** in place of a single bell strike.
- **Art pass:** pick one style (see the decisions below) and redo Chima, Mbe, the Red Mask and the backgrounds.
- **Sound:** a short score built on ekwe, ogene and ọjà flute, plus ambient village and forest sounds.

### Phase 3: Chapter 2 (new story)
Follow on from the Hollow Man vision: *"He who threw away his name is stirring."* A possible outline:
- **Ama (village square) at night:** a masquerade festival, where Mmanwu spirits move between the two worlds.
- **The river:** in the spirit world it flows backwards, which gives a new movement puzzle.
- **Meeting the Hollow Man:** a story confrontation, not a combat boss. Chima wins by remembering, using the relics and names gathered across both chapters.
- Dialogue choices that change what the ancestors tell you.

### Phase 4: Release
- Publish free on **itch.io** or **GitHub Pages** so anyone can play from a link.
- A proper phone layout and controls, a loading screen and a sharing image.
- Optional: more chapters, Igbo-language voice lines, an English/Igbo text toggle.

## Decisions needed before Phase 2

1. **Who is it for?** Children and families, or teens and adults? This sets the tone of the Hollow Man and how hard the puzzles are.
2. **Art direction:**
   - **(a)** keep drawing in code but push it further;
   - **(b)** hand-made pixel art;
   - **(c)** painted illustration.
   Option (a) is free and fast. Options (b) and (c) need an artist or sourced assets.
3. **Igbo language:** English only with Igbo terms (as now), or real Igbo lines with subtitles? Real Igbo lines need a fluent speaker to check them.
4. **Cultural review:** get someone who knows Igbo traditions well to check proverbs, masquerade details and shrine practice before release.
5. **Business:** free (portfolio or community project) or paid on itch.io or Steam later?

## Suggested order

Phase 1 first. It's about 1–2 working sessions, and it makes Phases 2 and 3 much cheaper. Phase 2 and the art decision can then run side by side.
