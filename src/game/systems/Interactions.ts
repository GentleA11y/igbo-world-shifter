// ---------------------------------------------------------------------------
// "Press E" interaction points: finds the nearest one and shows the prompt.
// ---------------------------------------------------------------------------
import type { Scene } from 'phaser';
import type { InteractDef } from '../levels/types';

/** How close Chima must be: horizontally, and vertically (so things up in a tree still count). */
const REACH_X = 60;
const REACH_Y = 170;

export interface InteractContext { spirit: boolean; flags: ReadonlySet<string>; }

export class Interactions {
    private prompt: Phaser.GameObjects.Text;
    current: InteractDef | null = null;

    constructor(scene: Scene, private defs: InteractDef[]) {
        this.prompt = scene.add.text(0, 0, ' ', {
            fontFamily: 'Georgia', fontSize: '15px', color: '#F7E7B3',
            backgroundColor: 'rgba(20,10,5,0.85)', padding: { x: 10, y: 6 },
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(20).setVisible(false);
    }

    update(px: number, py: number, ctx: InteractContext) {
        let best: InteractDef | null = null;
        let bestDx = Infinity;
        for (const d of this.defs) {
            if (d.hideWhenFlag && ctx.flags.has(d.hideWhenFlag)) continue;
            const dx = Math.abs(px - d.x);
            if (dx < REACH_X && Math.abs(py - d.y) < REACH_Y && dx < bestDx) {
                best = d;
                bestDx = dx;
            }
        }
        this.current = best;
        if (!best) { this.hide(); return; }

        const locked = best.requiresSpirit && !ctx.spirit;
        this.prompt.setText(`[E] ${locked ? 'Something hums overhead...' : best.label}`);
        this.prompt.setPosition(px, py - 44);
        this.prompt.setVisible(true);
    }

    /** Dialogue key to play for the current target, or null. */
    dialogueFor(spirit: boolean): string | null {
        const d = this.current;
        if (!d) return null;
        if (d.requiresSpirit && !spirit) return d.lockedDialogue ?? null;
        return d.dialogue;
    }

    hide() {
        this.prompt.setVisible(false);
    }
}
