// ---------------------------------------------------------------------------
// Turns LevelData into Phaser game objects.
// ---------------------------------------------------------------------------
import type { Scene } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GROUND_TOP, SPIRIT, WORLD_H } from '../utils';
import type { GateDef, LevelData, SolidDef } from './types';

const GROUND_H = 70;

export interface Gate {
    def: GateDef;
    solid: Phaser.Physics.Arcade.Image;
    visuals: (Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle)[];
    open: boolean;
}

/** An image whose texture changes between the two worlds. */
export interface WorldSwap { obj: Phaser.GameObjects.Image; living: string; spirit: string; }

export interface BuiltLevel {
    platforms: Phaser.Physics.Arcade.StaticGroup;
    spiritPlatforms: Phaser.Physics.Arcade.StaticGroup;
    gates: Map<string, Gate>;
    relics: Phaser.Physics.Arcade.Group;
    /** Visible only in the Spirit World. */
    spiritOnly: Phaser.GameObjects.Components.Visible[];
    /** Visible only in the Living World. */
    livingOnly: Phaser.GameObjects.Components.Visible[];
    swaps: WorldSwap[];
    parallax: { obj: Phaser.GameObjects.Image; factor: number }[];
    mask: Phaser.GameObjects.Image;
    hollowMan: Phaser.GameObjects.Image;
}

export function buildLevel(scene: Scene, level: LevelData): BuiltLevel {
    scene.physics.world.setBounds(0, 0, level.width, WORLD_H + 120);
    scene.cameras.main.setBounds(0, 0, level.width, WORLD_H);

    const spiritOnly: BuiltLevel['spiritOnly'] = [];
    const livingOnly: BuiltLevel['livingOnly'] = [];
    const swaps: WorldSwap[] = [];
    const parallax: BuiltLevel['parallax'] = [];

    // ---- Backdrop (screen-fixed, manual parallax) ----
    const sky = scene.add.image(0, 0, 'sky_living').setOrigin(0, 0).setScrollFactor(0).setDepth(-50);
    const hillsFar = scene.add.image(0, 280, 'hills_far').setOrigin(0, 1).setScrollFactor(0).setDepth(-40);
    const hillsMid = scene.add.image(0, 470, 'hills_mid').setOrigin(0, 1).setScrollFactor(0).setDepth(-30);
    swaps.push(
        { obj: sky, living: 'sky_living', spirit: 'sky_spirit' },
        { obj: hillsFar, living: 'hills_far', spirit: 'hills_far_s' },
        { obj: hillsMid, living: 'hills_mid', spirit: 'hills_mid_s' },
    );
    parallax.push({ obj: hillsFar, factor: 0.85 }, { obj: hillsMid, factor: 0.6 });

    // ---- Ground: one visual + one collider per span (gaps are chasms) ----
    const platforms = scene.physics.add.staticGroup();
    for (const [from, to] of level.ground) {
        const cx = (from + to) / 2;
        const w = to - from;
        const cy = GROUND_TOP + GROUND_H / 2;
        const living = scene.add.image(cx, cy, 'ground').setDepth(-20).setDisplaySize(w, GROUND_H);
        const spirit = scene.add.image(cx, cy, 'ground_spirit').setDepth(-19).setDisplaySize(w, GROUND_H).setVisible(false);
        livingOnly.push(living);
        spiritOnly.push(spirit);
        platforms.add(makeSolid(scene, { x: cx, y: cy, w, h: GROUND_H }));
    }
    for (const s of level.solids) platforms.add(makeSolid(scene, s));

    // ---- Props and labels ----
    for (const p of level.props) {
        const img = scene.add.image(p.x, p.y, p.texture).setDepth(p.depth ?? 5);
        if (p.spiritOnly) { img.setVisible(false); spiritOnly.push(img); }
    }
    for (const l of level.labels) {
        scene.add.text(l.x, l.y, l.text, {
            fontFamily: 'Georgia', fontSize: '14px', color: '#F7B32B', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(6);
    }
    for (const x of level.effects.poles) {
        scene.add.rectangle(x, GROUND_TOP - 160, 6, 120, 0xB02A1E).setDepth(5);
        scene.add.rectangle(x, GROUND_TOP - 100, 30, 4, 0xE5A93C).setDepth(5);
    }

    // ---- Spirit-only platforms ----
    const spiritPlatforms = scene.physics.add.staticGroup();
    for (const s of level.spiritSolids) {
        const img = scene.physics.add.staticImage(s.x, s.y, s.texture);
        sizeStaticBody(img, s.w, s.h);
        spiritPlatforms.add(img);
    }

    // ---- Gates ----
    const gates = new Map<string, Gate>();
    for (const g of level.gates) {
        const solid = makeSolid(scene, g);
        platforms.add(solid);
        const visuals: Gate['visuals'] = [];
        if (g.kind === 'thorns') {
            const n = Math.max(1, Math.round(g.h / 22));
            for (let i = 0; i < n; i++) {
                visuals.push(scene.add.rectangle(g.x, g.y - g.h / 2 + 10 + i * 22, g.w, 20, 0x2A1608).setDepth(5));
            }
        } else {
            visuals.push(scene.add.image(g.x, g.y, 'barrier').setDepth(6));
        }
        gates.set(g.id, { def: g, solid, visuals, open: false });
    }

    // ---- Relics ----
    const relics = scene.physics.add.group({ allowGravity: false, immovable: true });
    for (const r of level.relics) {
        const s = scene.physics.add.sprite(r.x, r.y, r.texture).setDepth(7);
        s.setData('id', r.id);
        relics.add(s);
        (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        scene.tweens.add({ targets: s, y: r.y - 14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ---- Ambient effects ----
    for (let i = 0; i < level.effects.fireflies; i++) {
        const x = Math.random() * level.width;
        const y = 120 + Math.random() * 320;
        const spark = scene.add.image(x, y, 'fx_spark').setAlpha(0.6).setDepth(8);
        scene.tweens.add({
            targets: spark, y: y - 30 - Math.random() * 40, alpha: { from: 0.2, to: 0.9 },
            duration: 2000 + Math.random() * 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
    }
    for (const sm of level.effects.smoke) {
        for (let i = 0; i < 3; i++) {
            const smoke = scene.add.image(sm.x, sm.y, 'fx_smoke').setAlpha(0.35).setDepth(7);
            scene.tweens.add({
                targets: smoke, y: sm.y - 70, alpha: 0, scale: 1.6,
                duration: 3200 + i * 600, repeat: -1, delay: i * 900, ease: 'Sine.easeOut',
            });
        }
    }

    // ---- Climax figures (hidden until the shrine) ----
    const { climax } = level;
    const mask = scene.add.image(climax.mask.x, climax.mask.y - 20, 'red_mask').setDepth(9).setVisible(false).setAlpha(0);
    const hollowMan = scene.add.image(climax.hollowMan.x, climax.hollowMan.y, 'hollow_man').setDepth(8).setVisible(false).setAlpha(0);

    // ---- Foreground overlays (screen-fixed) ----
    const fronds = scene.add.image(0, 0, 'fronds').setOrigin(0, 0).setScrollFactor(0).setDepth(14).setAlpha(0.85);
    parallax.push({ obj: fronds, factor: 0.05 });
    scene.add.image(0, 0, 'vignette').setOrigin(0, 0).setScrollFactor(0).setDepth(15).setAlpha(0.55);
    const tint = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, SPIRIT.violet, 0.18)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(13).setVisible(false);
    spiritOnly.push(tint);

    return { platforms, spiritPlatforms, gates, relics, spiritOnly, livingOnly, swaps, parallax, mask, hollowMan };
}

/** Invisible static collider. */
function makeSolid(scene: Scene, s: SolidDef) {
    const img = scene.physics.add.staticImage(s.x, s.y, '__body').setVisible(false);
    sizeStaticBody(img, s.w, s.h);
    return img;
}

/**
 * Size a static body directly. (GameObject.setSize + refreshBody takes the
 * size from the texture, so an 8x8 '__body' collider stayed 8x8.)
 */
function sizeStaticBody(obj: Phaser.Physics.Arcade.Image, w: number, h: number) {
    (obj.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h, true);
}
