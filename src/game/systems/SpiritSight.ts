// ---------------------------------------------------------------------------
// Spirit Sight: switches the whole level between the Living World and the
// Spirit World (textures, spirit-only objects, platforms, gates).
// ---------------------------------------------------------------------------
import type { BuiltLevel } from '../levels/buildLevel';

const BARRIER_LIVING_ALPHA = 0.25;

export class SpiritSight {
    active = false;
    /** Spirit Sight can't be used until the story unlocks it. */
    unlocked = false;

    constructor(private level: BuiltLevel) {}

    set(active: boolean) {
        this.active = active && this.unlocked;
        this.apply();
    }

    toggle() {
        this.set(!this.active);
    }

    /** Re-apply visuals and collisions for the current state. */
    apply() {
        const on = this.active;
        const { level } = this;
        for (const s of level.swaps) s.obj.setTexture(on ? s.spirit : s.living);
        for (const o of level.spiritOnly) o.setVisible(on);
        for (const o of level.livingOnly) o.setVisible(!on);

        for (const c of level.spiritPlatforms.getChildren()) {
            const img = c as Phaser.Physics.Arcade.Image;
            img.setVisible(on);
            (img.body as Phaser.Physics.Arcade.StaticBody).enable = on;
        }

        for (const gate of level.gates.values()) {
            (gate.solid.body as Phaser.Physics.Arcade.StaticBody).enable = !gate.open;
            for (const v of gate.visuals) {
                if (gate.open) { v.setVisible(false); continue; }
                v.setVisible(true);
                if (gate.def.kind === 'spirit-barrier') v.setAlpha(on ? 1 : BARRIER_LIVING_ALPHA);
            }
        }
    }
}
