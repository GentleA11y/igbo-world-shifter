// ---------------------------------------------------------------------------
// BootScene: loads audio and draws every texture once, then starts Chapter 1.
// ---------------------------------------------------------------------------
import { Scene } from 'phaser';
import { generateAllTextures } from '../../sprites/textures';
import { preloadAudio } from '../systems/audio';

export class BootScene extends Scene {
    constructor() { super('Boot'); }

    preload() {
        preloadAudio(this);
    }

    create() {
        generateAllTextures(this);
        this.makeFxTextures();
        this.scene.start('Chapter', { level: 'chapter1' });
    }

    private makeFxTextures() {
        const make = (key: string, size: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
            if (this.textures.exists(key)) return;
            const g = this.make.graphics({ x: 0, y: 0 });
            draw(g);
            g.generateTexture(key, size, size);
            g.destroy();
        };
        make('fx_glow', 24, g => {
            g.fillStyle(0xE0F7FA, 0.7); g.fillCircle(12, 12, 10);
            g.fillStyle(0xffffff, 0.9); g.fillCircle(12, 12, 5);
        });
        make('fx_spark', 8, g => { g.fillStyle(0xF7B32B, 0.9); g.fillCircle(4, 4, 3); });
        make('fx_smoke', 32, g => { g.fillStyle(0x888888, 0.4); g.fillCircle(16, 16, 14); });
    }
}
