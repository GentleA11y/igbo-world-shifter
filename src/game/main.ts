// ---------------------------------------------------------------------------
// Phaser bootstrap. Scenes: Boot (textures + audio) -> Chapter (gameplay).
// Menus, HUD, dialogue box and the ending are React overlays in App.tsx.
// ---------------------------------------------------------------------------
import { AUTO, Game as PhaserGame, Scale } from 'phaser';
import { EventBus } from './events';
import { BootScene } from './scenes/BootScene';
import { ChapterScene } from './scenes/ChapterScene';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from './utils';

export { EventBus };

const StartGame = (parent: string) => {
    const game = new PhaserGame({
        type: AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent,
        backgroundColor: '#120a1e',
        scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
        physics: {
            default: 'arcade',
            arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false },
        },
        scene: [BootScene, ChapterScene],
    });
    if (typeof window !== 'undefined') {
        // Handy for debugging in the browser console.
        (window as any).__PHASER_GAME__ = game;
        (window as any).__PHASER_EVENT_BUS__ = EventBus;
    }
    return game;
};

export default StartGame;
