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
  main.tsx           React entry point
  App.tsx            Menus, HUD, dialogue box, journal (React overlay)
  game/main.ts       Phaser scene: world, player, physics, story events
  game/utils.ts      Constants, event names, dialogue, glossary
  sprites/textures.ts  All sprites drawn in code (no image files needed)
  assets/audio/      Optional sound files (see the README there)
public/
  style.css          Game and HUD styles

```

React and Phaser talk through the `EventBus` in `src/game/main.ts`; event names live in `EV` in `src/game/utils.ts`.
