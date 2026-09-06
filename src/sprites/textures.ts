// ---------------------------------------------------------------------------
// Procedural texture factory — all sprites for Echoes of the Ancestors are
// drawn with Phaser Graphics and baked into textures in preload-time order.
// ---------------------------------------------------------------------------
import { Scene } from "phaser";

// Phaser 4 Graphics has no quadraticCurveTo — approximate with line segments.
// Tracks the last path point via a WeakMap-style property on the Graphics.
function moveToQ(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.moveTo(x, y);
    (g as any).__qx = x; (g as any).__qy = y;
}
function lineToQ(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.lineTo(x, y);
    (g as any).__qx = x; (g as any).__qy = y;
}
function quadTo(g: Phaser.GameObjects.Graphics, cx: number, cy: number, ex: number, ey: number) {
    const gg = g as any;
    const sx: number = gg.__qx ?? ex;
    const sy: number = gg.__qy ?? ey;
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        gg.lineTo(mt * mt * sx + 2 * mt * t * cx + t * t * ex, mt * mt * sy + 2 * mt * t * cy + t * t * ey);
    }
    gg.__qx = ex; gg.__qy = ey;
}
import { LIVING, SPIRIT } from "../game/utils";

function px(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w: number, h: number, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillRect(x, y, w, h);
}
function circle(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, r: number, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillCircle(x, y, r);
}
function tri(g: Phaser.GameObjects.Graphics, color: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillTriangle(x1, y1, x2, y2, x3, y3);
}
function commit(scene: Scene, g: Phaser.GameObjects.Graphics, key: string, w: number, h: number) {
    g.generateTexture(key, w, h);
    g.destroy();
}

const SKIN = 0x5A3317;
const SKIN_HI = 0x6E4122;
const CLOTH = 0xC0392B;
const CLOTH_HI = 0xE05B38;
const BEAD = 0xE8B23A;

// ---------------------------------------------------------------------------
// CHIMA — young Igbo boy, side profile, akwete wrap + coral beads
// frames: chima_idle, chima_walk0..3, chima_jump
// ---------------------------------------------------------------------------
function drawChima(scene: Scene, frame: { key: string }, legSwing: number, armSwing: number) {
    const g = scene.add.graphics();
    // shadow-free 44x64 sprite, feet at y=64, facing right
    const hipY = 42;
    // legs
    const skin = SKIN;
    if (legSwing === 0) {
        px(g, skin, 16, hipY, 6, 20); px(g, skin, 24, hipY, 6, 20);
        px(g, 0x3A2410, 15, 60, 9, 4); px(g, 0x3A2410, 23, 60, 9, 4); // sandals
    } else if (legSwing === 1) {
        g.fillStyle(skin); g.fillPoints(([{ x: 18, y: hipY }, { x: 12, y: 62 }, { x: 18, y: 62 }, { x: 24, y: hipY }] as unknown as Phaser.Math.Vector2[]), true);
        g.fillStyle(skin); g.fillPoints(([{ x: 24, y: hipY }, { x: 32, y: 60 }, { x: 26, y: 62 }, { x: 20, y: hipY }] as unknown as Phaser.Math.Vector2[]), true);
    } else {
        g.fillStyle(skin); g.fillPoints(([{ x: 18, y: hipY }, { x: 26, y: 62 }, { x: 20, y: 62 }, { x: 14, y: hipY }] as unknown as Phaser.Math.Vector2[]), true);
        g.fillStyle(skin); g.fillPoints(([{ x: 26, y: hipY }, { x: 16, y: 60 }, { x: 22, y: 62 }, { x: 30, y: hipY }] as unknown as Phaser.Math.Vector2[]), true);
    }
    // akwete cloth wrap (hips -> knees) with pattern
    px(g, CLOTH, 12, 36, 22, 14);
    px(g, CLOTH_HI, 12, 38, 22, 2);
    px(g, BEAD, 16, 42, 3, 3); px(g, BEAD, 24, 45, 3, 3);
    px(g, CLOTH_HI, 12, 47, 22, 2);
    // torso
    px(g, skin, 15, 20, 16, 18);
    px(g, SKIN_HI, 15, 20, 16, 3);
    // sash across chest
    g.fillStyle(0x8E2A1C); g.fillPoints(([{ x: 15, y: 22 }, { x: 31, y: 30 }, { x: 31, y: 34 }, { x: 15, y: 26 }] as unknown as Phaser.Math.Vector2[]), true);
    // coral bead necklace
    circle(g, BEAD, 21, 20, 2); circle(g, BEAD, 25, 21, 2); circle(g, BEAD, 29, 20, 2);
    // arm (swings)
    if (armSwing === 1) {
        g.fillStyle(skin); g.fillPoints(([{ x: 22, y: 23 }, { x: 30, y: 34 }, { x: 26, y: 36 }, { x: 19, y: 26 }] as unknown as Phaser.Math.Vector2[]), true);
    } else if (armSwing === -1) {
        g.fillStyle(skin); g.fillPoints(([{ x: 22, y: 23 }, { x: 13, y: 33 }, { x: 17, y: 36 }, { x: 25, y: 26 }] as unknown as Phaser.Math.Vector2[]), true);
    } else {
        px(g, skin, 20, 23, 5, 14);
    }
    // head
    circle(g, skin, 24, 12, 9);
    px(g, skin, 24, 12, 8, 8); // jaw toward facing side
    // hair
    g.fillStyle(0x1C1108);
    g.fillCircle(23, 10, 8);
    px(g, 0x1C1108, 15, 8, 8, 6);
    // ear
    circle(g, SKIN_HI, 20, 13, 2);
    // side-profile eye + brow + smile
    circle(g, 0xF5EFE0, 29, 11, 2.6);
    circle(g, 0x140B05, 30, 11, 1.3);
    px(g, 0x140B05, 27, 7, 6, 1.4);
    px(g, 0x2A1608, 28, 16, 5, 1.4);
    commit(scene, g, frame.key, 44, 64);
}

// ---------------------------------------------------------------------------
// MBE THE TORTOISE — sage with carved shell, staff, cap
// ---------------------------------------------------------------------------
function drawMbe(scene: Scene) {
    const g = scene.add.graphics();
    // legs
    px(g, 0x6B4A22, 14, 40, 7, 10); px(g, 0x6B4A22, 42, 40, 7, 10);
    // tail
    tri(g, 0x6B4A22, 8, 38, 2, 44, 12, 42);
    // shell dome
    g.fillStyle(0x3E2B14); g.fillCircle(31, 32, 24);
    g.fillCircle(31, 32, 24);
    g.fillStyle(0x7A5223); g.fillCircle(31, 30, 21);
    // carved geometric shell plates (Igbo spiral motif approximations)
    g.lineStyle(2, 0x2A1B0C, 1);
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.strokeCircle(31 + Math.cos(a) * 11, 30 + Math.sin(a) * 10, 6);
    }
    g.strokeCircle(31, 30, 17);
    g.fillStyle(0xC9A24B);
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        circle(g, 0xC9A24B, 31 + Math.cos(a) * 11, 30 + Math.sin(a) * 10, 1.8);
    }
    // shell rim
    px(g, 0x2A1B0C, 8, 36, 46, 5);
    // head
    circle(g, 0x8A6A33, 54, 26, 8);
    px(g, 0x8A6A33, 54, 26, 10, 7);
    circle(g, 0xF5EFE0, 58, 24, 2.4);
    circle(g, 0x140B05, 59, 24, 1.2);
    px(g, 0x140B05, 56, 20, 6, 1.2); // brow
    px(g, 0x5E451F, 60, 29, 5, 2);   // mouth line
    // sage cap
    g.fillStyle(0xEDE4CE); g.fillCircle(53, 19, 7);
    g.fillStyle(0xEDE4CE); g.fillCircle(53, 19, 7);
    px(g, 0xB02A1E, 46, 18, 14, 2);
    // walking staff
    px(g, 0x4A2E12, 64, 8, 3, 42);
    circle(g, 0xC9A24B, 65, 8, 4);
    commit(scene, g, "mbe", 72, 52);
}

// ---------------------------------------------------------------------------
// RED MASK — towering masquerade visage
// ---------------------------------------------------------------------------
function drawRedMask(scene: Scene) {
    const g = scene.add.graphics();
    const W = 140, H = 220;
    // raffia mane
    for (let i = 0; i < 26; i++) {
        const a = Math.PI + (i / 25) * Math.PI;
        const x = W / 2 + Math.cos(a) * 66;
        const y = H / 2 + Math.sin(a) * 104;
        g.fillStyle(i % 2 ? 0xD9C9A3 : 0xC9B68A, 0.9);
        g.fillTriangle(x, y, x + (x - W / 2) * 0.22, y + (y - H / 2) * 0.22, x + 6, y + 10);
    }
    // face
    g.fillStyle(0x8E1414);
    g.fillEllipse(W / 2, H / 2 + 8, 96, 176);
    g.fillStyle(0xB0201A);
    g.fillEllipse(W / 2, H / 2 + 4, 84, 162);
    // nzu chalk markings
    g.lineStyle(3, 0xF2EFE6, 1);
    g.lineBetween(W / 2, 40, W / 2, 90);
    for (let i = 0; i < 4; i++) {
        g.lineBetween(40 + i * 4, 150 + i * 8, W / 2, 132 + i * 6);
        g.lineBetween(W - 40 - i * 4, 150 + i * 8, W / 2, 132 + i * 6);
    }
    g.strokeCircle(W / 2, 96, 26);
    // eyes
    g.fillStyle(0xF7B32B);
    g.fillEllipse(W / 2 - 20, 92, 26, 14);
    g.fillEllipse(W / 2 + 20, 92, 26, 14);
    g.fillStyle(0xFFE9A8);
    g.fillEllipse(W / 2 - 20, 92, 12, 8);
    g.fillEllipse(W / 2 + 20, 92, 12, 8);
    g.fillStyle(0x140B05);
    g.fillCircle(W / 2 - 20, 92, 3);
    g.fillCircle(W / 2 + 20, 92, 3);
    // mouth
    g.fillStyle(0x3A0A0A);
    g.fillEllipse(W / 2, 158, 44, 20);
    g.fillStyle(0xF2EFE6);
    for (let i = 0; i < 5; i++) px(g, 0xF2EFE6, W / 2 - 18 + i * 9, 150, 4, 6);
    commit(scene, g, "red_mask", W, H);
}

// ---------------------------------------------------------------------------
// HOLLOW MAN — shadow silhouette with void eyes
// ---------------------------------------------------------------------------
function drawHollowMan(scene: Scene) {
    const g = scene.add.graphics();
    const W = 120, H = 260;
    g.fillStyle(0x0A0614, 0.96);
    // body
    g.fillPoints(([{ x: 60, y: 10 }, { x: 84, y: 40 }, { x: 96, y: 150 }, { x: 88, y: 258 }, { x: 66, y: 258 }, { x: 62, y: 160 }, { x: 58, y: 160 }, { x: 54, y: 258 }, { x: 32, y: 258 }, { x: 24, y: 150 }, { x: 36, y: 40 }] as unknown as Phaser.Math.Vector2[]), true);
    // head horn crest
    tri(g, 0x0A0614, 48, 18, 60, -2, 72, 18);
    // faint violet rim
    g.lineStyle(2, 0x8A3FFC, 0.5);
    g.lineBetween(36, 40, 24, 150);
    g.lineBetween(84, 40, 96, 150);
    // void eyes
    circle(g, 0x000000, 52, 26, 4);
    circle(g, 0x000000, 68, 26, 4);
    g.fillStyle(0x4DF2D6, 0.7);
    g.fillCircle(52, 26, 1.4);
    g.fillCircle(68, 26, 1.4);
    commit(scene, g, "hollow_man", W, H);
}

// ---------------------------------------------------------------------------
// HUT — mud-brick round hut with thatched palm roof + Uli mural
// ---------------------------------------------------------------------------
function drawHut(scene: Scene) {
    const g = scene.add.graphics();
    const W = 200, H = 180;
    // clay wall
    px(g, LIVING.hut, 24, 88, 152, 92);
    px(g, 0x6A3B22, 24, 88, 152, 6);
    // wall shading
    g.fillStyle(0x8F5633, 0.5); g.fillRect(24, 94, 152, 40);
    // Uli mural: spirals + zigzags in white/ochre
    g.lineStyle(3, 0xEDE4CE, 0.95);
    g.strokeCircle(58, 130, 12);
    g.strokeCircle(58, 130, 6);
    g.strokeCircle(142, 130, 12);
    g.strokeCircle(142, 130, 6);
    g.lineBetween(80, 122, 90, 138); g.lineBetween(90, 138, 100, 122); g.lineBetween(100, 122, 110, 138); g.lineBetween(110, 138, 120, 122);
    // doorway
    g.fillStyle(0x2A1608);
    g.fillRect(86, 116, 30, 64);
    g.fillCircle(101, 116, 15);
    g.fillStyle(0x1A0D05); g.fillRect(88, 120, 26, 60);
    // thatch roof
    tri(g, LIVING.thatch, 100, 4, 6, 96, 194, 96);
    tri(g, 0xB57C2E, 100, 4, 60, 96, 140, 96);
    // thatch texture strokes
    g.lineStyle(2, 0x8F5F1E, 0.8);
    for (let i = 0; i < 9; i++) {
        const x = 22 + i * 19;
        g.lineBetween(100, 8, x, 94);
    }
    // roof band
    px(g, 0x5A3218, 6, 90, 188, 8);
    commit(scene, g, "hut", W, H);
}

// ---------------------------------------------------------------------------
// YAM BARN — raised rack of yams
// ---------------------------------------------------------------------------
function drawYamBarn(scene: Scene) {
    const g = scene.add.graphics();
    const W = 120, H = 110;
    // posts
    px(g, 0x4A2E12, 10, 20, 8, 90); px(g, 0x4A2E12, 102, 20, 8, 90);
    px(g, 0x4A2E12, 56, 26, 8, 84);
    // crossbars
    px(g, 0x5A3A18, 6, 30, 108, 5); px(g, 0x5A3A18, 6, 58, 108, 5); px(g, 0x5A3A18, 6, 86, 108, 5);
    // hanging yams
    for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 5; i++) {
            const x = 16 + i * 20 + (r % 2) * 4;
            const y = 36 + r * 28;
            g.fillStyle(0xB98A4E);
            g.fillEllipse(x, y + 8, 12, 22);
            g.fillStyle(0x8A6234);
            g.fillEllipse(x, y + 8, 12, 22);
            g.fillStyle(0xB98A4E);
            g.fillEllipse(x - 1, y + 7, 9, 18);
        }
    }
    // thatched cap
    tri(g, LIVING.thatch, 60, 0, 0, 26, 120, 26);
    commit(scene, g, "yam_barn", W, H);
}

// ---------------------------------------------------------------------------
// HEARTH — clay fire pit with pot + embers
// ---------------------------------------------------------------------------
function drawHearth(scene: Scene) {
    const g = scene.add.graphics();
    const W = 72, H = 52;
    // stone ring
    for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        circle(g, 0x6E6E6E, 36 + Math.cos(a) * 30, 44 + Math.sin(a) * 8, 6);
    }
    // embers
    circle(g, 0xE5691E, 36, 42, 14);
    circle(g, 0xF7B32B, 32, 42, 8);
    circle(g, 0xFFD97A, 40, 43, 5);
    // clay pot
    g.fillStyle(0x7C482B); g.fillEllipse(36, 26, 34, 26);
    g.fillStyle(0x5E3320); g.fillRect(22, 14, 28, 6);
    g.fillStyle(0x8F5633); g.fillEllipse(36, 26, 24, 16);
    // steam
    g.lineStyle(2, 0xEDE4CE, 0.5);
    g.beginPath();
    moveToQ(g, 30, 10); lineToQ(g, 26, 2);
    moveToQ(g, 42, 10); lineToQ(g, 46, 2);
    g.strokePath();
    commit(scene, g, "hearth", W, H);
}

// ---------------------------------------------------------------------------
// PALM TREE / BANANA CLUMP / IROKO TRUNK
// ---------------------------------------------------------------------------
function drawPalm(scene: Scene) {
    const g = scene.add.graphics();
    const W = 140, H = 200;
    // curved trunk
    g.lineStyle(10, 0x6B4A22, 1);
    g.beginPath();
    moveToQ(g, 20, 200);
    quadTo(g, 34, 110, 62, 44);
    g.strokePath();
    g.lineStyle(4, 0x55381A, 1);
    g.beginPath();
    moveToQ(g, 20, 200);
    quadTo(g, 34, 110, 62, 44);
    g.strokePath();
    // fronds
    for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.15 + (i / 6) * Math.PI * 0.9;
        const ex = 62 + Math.cos(a) * 62;
        const ey = 40 - Math.sin(a) * 34 + 14;
        g.lineStyle(6, LIVING.leaf, 1);
        g.beginPath();
        moveToQ(g, 62, 40);
        quadTo(g, 62 + Math.cos(a) * 34, 40 - Math.sin(a) * 30, ex, ey);
        g.strokePath();
        g.lineStyle(2, 0x1F401B, 1);
        g.beginPath();
        moveToQ(g, 62, 40);
        quadTo(g, 62 + Math.cos(a) * 34, 40 - Math.sin(a) * 30, ex, ey);
        g.strokePath();
    }
    // dates
    circle(g, 0x8A6234, 58, 48, 4); circle(g, 0x8A6234, 66, 50, 4);
    commit(scene, g, "palm", W, H);
}

function drawBanana(scene: Scene) {
    const g = scene.add.graphics();
    const W = 110, H = 150;
    px(g, 0x4A6B2A, 50, 60, 12, 90);
    for (let i = 0; i < 6; i++) {
        const a = Math.PI * 0.2 + (i / 5) * Math.PI * 0.8;
        g.lineStyle(12, i % 2 ? LIVING.leaf : 0x3E7A2E, 1);
        g.beginPath();
        moveToQ(g, 56, 62);
        quadTo(g, 56 + Math.cos(a) * 30, 62 - Math.sin(a) * 40, 56 + Math.cos(a) * 50, 40 - Math.sin(a) * 26);
        g.strokePath();
    }
    // banana bunch
    g.fillStyle(0xE5C23A);
    g.fillEllipse(44, 70, 16, 26);
    g.fillStyle(0xC9A22E);
    g.fillEllipse(44, 70, 10, 18);
    commit(scene, g, "banana", W, H);
}

function drawIroko(scene: Scene, spirit: boolean) {
    const g = scene.add.graphics();
    const W = 260, H = 420;
    // massive trunk
    g.fillStyle(0x4A2E12);
    g.fillPoints(([{ x: 90, y: 420 }, { x: 78, y: 220 }, { x: 96, y: 120 }, { x: 164, y: 120 }, { x: 182, y: 220 }, { x: 170, y: 420 }] as unknown as Phaser.Math.Vector2[]), true);
    // bark lines
    g.lineStyle(3, 0x33200C, 1);
    g.lineBetween(100, 410, 96, 150);
    g.lineBetween(130, 415, 130, 140);
    g.lineBetween(158, 410, 164, 150);
    // roots
    g.fillStyle(0x3E2610);
    g.fillPoints(([{ x: 60, y: 420 }, { x: 92, y: 330 }, { x: 104, y: 420 }] as unknown as Phaser.Math.Vector2[]), true);
    g.fillPoints(([{ x: 200, y: 420 }, { x: 168, y: 330 }, { x: 156, y: 420 }] as unknown as Phaser.Math.Vector2[]), true);
    // lianas
    g.lineStyle(3, spirit ? SPIRIT.violet : 0x2D5A27, 0.9);
    g.beginPath(); moveToQ(g, 96, 124); quadTo(g, 70, 200, 84, 260); g.strokePath();
    g.beginPath(); moveToQ(g, 164, 124); quadTo(g, 196, 210, 182, 270); g.strokePath();
    // canopy
    const leaf = spirit ? 0x241344 : LIVING.leaf;
    const leaf2 = spirit ? 0x33195E : 0x3E7A2E;
    circle(g, leaf, 130, 90, 78);
    circle(g, leaf2, 62, 110, 52);
    circle(g, leaf2, 198, 110, 52);
    circle(g, leaf, 130, 52, 56);
    circle(g, leaf2, 96, 66, 44);
    circle(g, leaf2, 166, 66, 44);
    if (spirit) {
        // glowing spirit fungus on trunk
        for (let i = 0; i < 5; i++) {
            circle(g, SPIRIT.cyan, 100 + (i % 2) * 60, 180 + i * 44, 5);
            circle(g, 0xE0F7FA, 100 + (i % 2) * 60, 180 + i * 44, 2);
        }
    }
    commit(scene, g, spirit ? "iroko_spirit" : "iroko", W, H);
}

// ---------------------------------------------------------------------------
// OKPESI PILLAR (awakens spirit sight) + OGENE BELL + ALUSI SHRINE + TOTEM
// ---------------------------------------------------------------------------
function drawPillar(scene: Scene) {
    const g = scene.add.graphics();
    const W = 46, H = 150;
    px(g, 0x6E6E6E, 6, 12, 34, 138);
    px(g, 0x8A8A8A, 6, 12, 10, 138);
    px(g, 0x565656, 2, 140, 42, 10);
    // carved ancestral faces + glyphs
    g.lineStyle(2, 0x2A2A2A, 1);
    g.strokeCircle(23, 34, 8);
    g.lineBetween(19, 32, 21, 32); g.lineBetween(25, 32, 27, 32);
    g.lineBetween(19, 38, 27, 38);
    g.strokeCircle(23, 66, 8);
    g.lineBetween(19, 64, 21, 64); g.lineBetween(25, 64, 27, 64);
    g.lineBetween(19, 70, 27, 70);
    g.lineBetween(12, 90, 34, 96); g.lineBetween(34, 90, 12, 96);
    g.lineBetween(12, 110, 34, 110);
    g.lineBetween(23, 106, 23, 128);
    // faint glow hint
    g.fillStyle(0x4DF2D6, 0.25); g.fillCircle(23, 50, 16);
    commit(scene, g, "pillar", W, H);
}

function drawBell(scene: Scene) {
    const g = scene.add.graphics();
    const W = 44, H = 64;
    // hanger
    px(g, 0x4A2E12, 4, 2, 36, 5);
    px(g, 0x4A2E12, 20, 4, 4, 10);
    // bronze ogene (two-lobe bell)
    g.fillStyle(0x8A6A1E);
    g.fillEllipse(22, 38, 30, 40);
    g.fillStyle(0xC9A24B);
    g.fillEllipse(22, 36, 22, 32);
    g.fillStyle(0x6E5214);
    g.fillEllipse(22, 50, 18, 8);
    g.fillStyle(0x2A1B0C);
    g.fillRect(14, 48, 16, 4);
    // clapper
    circle(g, 0x3A3A3A, 22, 56, 3);
    commit(scene, g, "bell", W, H);
}

function drawShrine(scene: Scene) {
    const g = scene.add.graphics();
    const W = 320, H = 260;
    // back monoliths
    for (let i = 0; i < 5; i++) {
        const x = 18 + i * 70;
        const h = 150 + (i % 2) * 46;
        px(g, 0x565656, x, H - h, 44, h);
        px(g, 0x6E6E6E, x, H - h, 12, h);
        g.lineStyle(2, 0x2A2A2A, 1);
        g.lineBetween(x + 8, H - h + 24, x + 36, H - h + 24);
        g.lineBetween(x + 8, H - h + 40, x + 36, H - h + 40);
        g.strokeCircle(x + 22, H - h + 66, 9);
    }
    // altar platform
    px(g, 0x6E6E6E, 70, H - 70, 180, 26);
    px(g, 0x565656, 84, H - 44, 152, 44);
    px(g, 0x7E7E7E, 70, H - 70, 180, 6);
    // red cloth banners draped on altar
    px(g, LIVING.banner, 96, H - 44, 22, 40);
    px(g, LIVING.banner, 202, H - 44, 22, 40);
    g.lineStyle(2, 0xE5A93C, 1);
    g.lineBetween(96, H - 30, 118, H - 30);
    g.lineBetween(202, H - 30, 224, H - 30);
    // offering bowl + kola
    g.fillStyle(0x7C482B); g.fillEllipse(160, H - 78, 40, 16);
    g.fillStyle(0x5E3320); g.fillEllipse(160, H - 80, 30, 10);
    circle(g, 0xB98A4E, 152, H - 84, 5); circle(g, 0xC9A24B, 164, H - 84, 5); circle(g, 0xB98A4E, 160, H - 90, 5);
    // skull-ish ancestor effigy
    g.fillStyle(0xEDE4CE); g.fillCircle(160, H - 116, 12);
    g.fillStyle(0x2A1B0C); g.fillCircle(155, H - 118, 2.6); g.fillCircle(165, H - 118, 2.6);
    commit(scene, g, "shrine", W, H);
}

function drawTotem(scene: Scene) {
    const g = scene.add.graphics();
    const W = 40, H = 170;
    px(g, 0x4A2E12, 12, 10, 16, 160);
    // stacked carved heads
    for (let i = 0; i < 3; i++) {
        const y = 26 + i * 52;
        g.fillStyle(0x6B4423); g.fillEllipse(20, y, 30, 26);
        g.fillStyle(0x2A1608); g.fillCircle(13, y - 2, 2.6); g.fillCircle(27, y - 2, 2.6);
        g.fillStyle(0xEDE4CE); g.fillRect(12, y + 6, 16, 3);
        g.lineStyle(2, 0xB02A1E, 1);
        g.lineBetween(6, y + 14, 34, y + 14);
    }
    // bird crest
    tri(g, 0x2A1608, 20, 0, 10, 16, 30, 16);
    commit(scene, g, "totem", W, H);
}

// ---------------------------------------------------------------------------
// SPIRIT ROOTS (platforms) + BARRIER + MUSHROOM + RELIC GLOW
// ---------------------------------------------------------------------------
function drawSpiritRoot(scene: Scene) {
    const g = scene.add.graphics();
    const W = 160, H = 26;
    g.fillStyle(SPIRIT.violet, 0.9);
    g.fillRoundedRect(0, 4, W, 18, 9);
    g.fillStyle(SPIRIT.cyan, 0.9);
    g.fillRoundedRect(4, 6, W - 8, 6, 3);
    g.fillStyle(SPIRIT.pearl, 0.9);
    for (let i = 0; i < 6; i++) circle(g, SPIRIT.pearl, 14 + i * 26, 13, 2.4);
    // root tendrils
    g.lineStyle(3, SPIRIT.violet, 0.8);
    g.lineBetween(20, 22, 12, 26); g.lineBetween(80, 22, 86, 26); g.lineBetween(140, 22, 148, 26);
    commit(scene, g, "spirit_root", W, H);
}

function drawBarrier(scene: Scene) {
    const g = scene.add.graphics();
    const W = 26, H = 220;
    g.fillStyle(SPIRIT.violet, 0.35);
    g.fillRect(0, 0, W, H);
    g.lineStyle(2, SPIRIT.cyan, 0.8);
    for (let i = 0; i < 7; i++) {
        g.beginPath();
        moveToQ(g, 4, i * 32);
        quadTo(g, W - 4, i * 32 + 16, 4, i * 32 + 32);
        g.strokePath();
    }
    g.fillStyle(SPIRIT.pearl, 0.5);
    for (let i = 0; i < 5; i++) circle(g, SPIRIT.pearl, 6 + (i % 3) * 7, 20 + i * 42, 2);
    commit(scene, g, "barrier", W, H);
}

function drawMushroom(scene: Scene) {
    const g = scene.add.graphics();
    const W = 34, H = 40;
    px(g, 0xE0F7FA, 13, 18, 8, 22);
    g.fillStyle(SPIRIT.cyan, 0.95);
    g.fillCircle(17, 18, 15);
    g.fillStyle(0x1E1035, 0.5);
    g.fillCircle(17, 18, 15);
    g.fillStyle(SPIRIT.cyan, 0.9);
    g.fillEllipse(17, 16, 30, 20);
    circle(g, 0xE0F7FA, 11, 14, 2.4); circle(g, 0xE0F7FA, 22, 16, 2); circle(g, 0xE0F7FA, 17, 10, 1.8);
    commit(scene, g, "mushroom", W, H);
}

function drawRelic(scene: Scene, kind: string) {
    const g = scene.add.graphics();
    const W = 34, H = 34;
    if (kind === "cowrie") {
        g.fillStyle(0xF2EFE6); g.fillEllipse(17, 17, 26, 18);
        g.fillStyle(0xD9C9A3); g.fillEllipse(17, 17, 18, 10);
        g.lineStyle(2, 0x8A6234, 1);
        g.lineBetween(13, 12, 13, 22); g.lineBetween(17, 11, 17, 23); g.lineBetween(21, 12, 21, 22);
    } else if (kind === "ofo") {
        g.fillStyle(0x4A2E12); g.fillRoundedRect(14, 4, 7, 26, 3);
        g.fillStyle(0xC9A24B); g.fillCircle(17, 8, 5);
        g.lineStyle(2, 0xEDE4CE, 1);
        g.lineBetween(12, 16, 22, 16); g.lineBetween(12, 22, 22, 22);
    } else {
        // kola seed — five lobes
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            g.fillStyle(0xB0552A);
            g.fillEllipse(17 + Math.cos(a) * 7, 17 + Math.sin(a) * 7, 11, 13);
        }
        g.fillStyle(0xE5C23A); g.fillCircle(17, 17, 4);
    }
    commit(scene, g, `relic_${kind}`, W, H);
}

// ---------------------------------------------------------------------------
// ENVIRONMENT PIECES
// ---------------------------------------------------------------------------
function drawGround(scene: Scene) {
    const g = scene.add.graphics();
    const W = 160, H = 70;
    px(g, LIVING.ground, 0, 6, W, 64);
    px(g, 0x8A2E18, 0, 30, W, 40);
    // laterite speckles
    for (let i = 0; i < 14; i++) circle(g, 0x7A2814, (i * 37) % W, 14 + (i * 53) % 50, 2);
    // grass cap
    px(g, LIVING.grass, 0, 0, W, 8);
    for (let i = 0; i < 20; i++) tri(g, 0x4E8F38, i * 8, 0, i * 8 + 4, -4, i * 8 + 8, 0);
    commit(scene, g, "ground", W, H);
}

function drawGroundSpirit(scene: Scene) {
    const g = scene.add.graphics();
    const W = 160, H = 70;
    px(g, SPIRIT.ground, 0, 6, W, 64);
    px(g, 0x1A0E38, 0, 30, W, 40);
    for (let i = 0; i < 10; i++) circle(g, SPIRIT.violet, (i * 53) % W, 16 + (i * 47) % 46, 2, 0.7);
    px(g, SPIRIT.grass, 0, 0, W, 6);
    for (let i = 0; i < 16; i++) tri(g, 0x6A3FF0, i * 10, 0, i * 10 + 5, -5, i * 10 + 10, 0);
    commit(scene, g, "ground_spirit", W, H);
}

function drawHills(scene: Scene, color: number, key: string) {
    const g = scene.add.graphics();
    const W = 960, H = 260;
    g.fillStyle(color, 1);
    g.beginPath();
    moveToQ(g, 0, H);
    lineToQ(g, 0, 160);
    const pts = [0, 120, 240, 360, 520, 660, 800, 960];
    const hs = [160, 96, 140, 70, 130, 84, 150, 120];
    for (let i = 1; i < pts.length; i++) {
        quadTo(g, (pts[i - 1] + pts[i]) / 2, Math.min(hs[i - 1], hs[i]) - 30, pts[i], hs[i]);
    }
    lineToQ(g, 960, H);
    g.closePath();
    g.fillPath();
    // distant palm silhouettes
    for (let i = 0; i < 5; i++) {
        const x = 80 + i * 190;
        const y = hs[Math.min(hs.length - 1, Math.floor(x / 130))] ?? 140;
        g.lineStyle(3, color, 1);
        g.lineBetween(x, y + 4, x + 3, y - 22);
        for (let f = 0; f < 5; f++) {
            const a = Math.PI * 0.15 + (f / 4) * Math.PI * 0.8;
            g.lineBetween(x + 3, y - 22, x + 3 + Math.cos(a) * 14, y - 22 - Math.sin(a) * 8);
        }
    }
    commit(scene, g, key, W, H);
}

function drawSky(scene: Scene, top: string, bottom: string, key: string) {
    const g = scene.add.graphics();
    const W = 960, H = 540;
    const steps = 60;
    const c1 = parseInt(top.slice(1), 16);
    const c2 = parseInt(bottom.slice(1), 16);
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const r = ((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t;
        const gg = ((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t;
        const b = (c1 & 255) * (1 - t) + (c2 & 255) * t;
        g.fillStyle((r << 16) | (gg << 8) | b, 1);
        g.fillRect(0, (i * H) / steps, W, H / steps + 1);
    }
    commit(scene, g, key, W, H);
}

function drawFronds(scene: Scene) {
    const g = scene.add.graphics();
    const W = 960, H = 120;
    for (let i = 0; i < 7; i++) {
        const x = 40 + i * 150;
        g.lineStyle(14, 0x1F401B, 1);
        g.beginPath();
        moveToQ(g, x, 0);
        quadTo(g, x + 26, 40, x + 8, 96);
        g.strokePath();
        g.lineStyle(4, 0x2D5A27, 1);
        g.beginPath();
        moveToQ(g, x, 0);
        quadTo(g, x + 26, 40, x + 8, 96);
        g.strokePath();
        for (let f = 0; f < 5; f++) {
            const fy = 14 + f * 18;
            g.lineStyle(8, 0x27501F, 1);
            g.lineBetween(x + f * 2, fy, x + 30 - f, fy + 12);
            g.lineBetween(x + f * 2, fy, x - 24 + f, fy + 12);
        }
    }
    commit(scene, g, "fronds", W, H);
}

function drawVignette(scene: Scene) {
    const g = scene.add.graphics();
    const W = 960, H = 540;
    g.fillStyle(0x000000, 0.0);
    // soft dark edges via stacked rounded rects
    for (let i = 0; i < 10; i++) {
        g.lineStyle(26, 0x000000, 0.05 + i * 0.006);
        g.strokeRoundedRect(i * 6, i * 4, W - i * 12, H - i * 8, 40);
    }
    commit(scene, g, "vignette", W, H);
}

function drawMaskAura(scene: Scene) {
    const g = scene.add.graphics();
    const W = 300, H = 380;
    g.fillStyle(0xB0201A, 0.18);
    g.fillCircle(150, 190, 150);
    g.fillStyle(0xE5691E, 0.22);
    g.fillCircle(150, 190, 100);
    commit(scene, g, "mask_aura", W, H);
}

// ---------------------------------------------------------------------------
// PUBLIC ENTRY — generate every texture
// ---------------------------------------------------------------------------
export function generateAllTextures(scene: Scene) {
    // Utility textures (invisible placeholders for physics bodies / zones)
    const gZone = scene.add.graphics();
    gZone.fillStyle(0xffffff, 0);
    gZone.fillRect(0, 0, 8, 8);
    gZone.generateTexture('__zone', 8, 8);
    gZone.destroy();
    const gBody = scene.add.graphics();
    gBody.fillStyle(0xffffff, 0);
    gBody.fillRect(0, 0, 8, 8);
    gBody.generateTexture('__body', 8, 8);
    gBody.destroy();
    // sky gradients
    drawSky(scene, LIVING.skyTop, "#E58A3C", "sky_living");
    drawSky(scene, SPIRIT.skyTop, SPIRIT.skyBottom, "sky_spirit");
    // hills
    drawHills(scene, 0xC97B2D, "hills_far");
    drawHills(scene, 0x8F4A20, "hills_mid");
    drawHills(scene, 0x2A1650, "hills_far_s");
    drawHills(scene, 0x1A0E38, "hills_mid_s");
    // ground
    drawGround(scene);
    drawGroundSpirit(scene);
    // characters
    drawChima(scene, { key: "chima_idle" }, 0, 0);
    drawChima(scene, { key: "chima_walk0" }, 1, 1);
    drawChima(scene, { key: "chima_walk1" }, 0, 0);
    drawChima(scene, { key: "chima_walk2" }, 2, -1);
    drawChima(scene, { key: "chima_walk3" }, 0, 0);
    drawChima(scene, { key: "chima_jump" }, 1, -1);
    drawMbe(scene);
    drawRedMask(scene);
    drawHollowMan(scene);
    // props
    drawHut(scene);
    drawYamBarn(scene);
    drawHearth(scene);
    drawPalm(scene);
    drawBanana(scene);
    drawIroko(scene, false);
    drawIroko(scene, true);
    drawPillar(scene);
    drawBell(scene);
    drawShrine(scene);
    drawTotem(scene);
    drawSpiritRoot(scene);
    drawBarrier(scene);
    drawMushroom(scene);
    drawRelic(scene, "cowrie");
    drawRelic(scene, "ofo");
    drawRelic(scene, "seed");
    drawFronds(scene);
    drawVignette(scene);
    drawMaskAura(scene);
}