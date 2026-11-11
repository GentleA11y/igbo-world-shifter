# Echoes of the Ancestors (igbo-world-shifter)

A 2D narrative adventure. You play as **Chima**, walking through the village of **Umueze** and the sacred **Iroko grove**. Talk to Mbe, gather relics, and switch on **Spirit Sight** to cross between the living world and the spirit world.

Built with [Phaser 4](https://phaser.io/), React 19, TypeScript and Vite.

## Run it

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the built `dist/` folder |
| `npm run typecheck` | Type-check only |

## Controls

| Key | Action |
|---|---|
| `A` `D` / arrows | Walk |
| `W` / `Space` | Jump |
| `E` | Interact |
| `Q` | Spirit Sight |
| `Esc` | Pause |

Touch buttons appear on phones.

## Project layout

```
src/
  main.tsx                 React entry point
  App.tsx                  Menus, HUD, dialogue box, journal, ending (React overlay)
  game/
    main.ts                Phaser setup: Boot scene, then Chapter scene
    events.ts              EventBus shared by React and Phaser
    utils.ts               Types, event names (EV), physics and world constants
    content/story.ts       Dialogue, relics, glossary, ending text
    levels/types.ts        The level data format
    levels/chapter1.ts     Chapter 1 layout: props, platforms, gates, relics, story triggers
    levels/buildLevel.ts   Turns level data into game objects
    scenes/BootScene.ts    Draws textures, loads optional audio
    scenes/ChapterScene.ts Game phases, story flags, saving, cutscenes
    systems/               Player movement, Spirit Sight, interactions, audio, save
  sprites/textures.ts      All sprites drawn in code (no image files needed)
  assets/audio/            Optional sound files (see the README there)
docs/REBUILD_PLAN.md       The rebuild roadmap
```

### Adding to a level

Most changes are data only, in `src/game/levels/chapter1.ts`:

- **New prop:** add `{ texture, x, y: above(h) }` to `props`.
- **New conversation:** add the lines to `DIALOGUES` in `content/story.ts`, then an entry in `interactables`.
- **Story trigger:** give a dialogue an `onComplete` flag, then list what it does under `story` (`unlock-spirit`, `open-gate`, `climax`, `ending`).

### Saving

Progress (checkpoint, relics, story flags) is saved in the browser's localStorage when you reach a checkpoint, pick up a relic, or finish a story beat. Finishing the chapter clears the save.
