// ---------------------------------------------------------------------------
// Chapter 1: The Village, the Forest Path and the Alusi Shrine.
// ---------------------------------------------------------------------------
import { GROUND_TOP, WORLD_W } from '../utils';
import type { LevelData, PropDef } from './types';

/** y coordinate `h` pixels above the ground surface. */
export const above = (h: number) => GROUND_TOP - h;

// The chasm on the forest path. 280px is wider than a running jump can
// clear (~237px with coyote time), so the spirit roots are required.
const CHASM_FROM = 1880;
const CHASM_TO = 2160;

const mushrooms: PropDef[] = Array.from({ length: 14 }, (_, i) => ({
    texture: 'mushroom',
    x: 1280 + i * 180 + (i % 3) * 40,
    y: above(20 + (i % 2) * 60),
    depth: 5,
    spiritOnly: true,
}));

export const chapter1: LevelData = {
    id: 'chapter1',
    title: 'Chapter 1: Echoes in the Grove',
    width: WORLD_W,
    checkpoints: [120, 1150, 2450],
    ground: [[0, CHASM_FROM], [CHASM_TO, WORLD_W]],

    areas: [
        { fromX: 0, name: 'The Village of Umueze', subtitle: 'Red earth, thatch smoke, evening drums.' },
        { fromX: 1200, name: 'The Sacred Forest Path', subtitle: 'The Iroko grove. Even the crickets have gone quiet.' },
        { fromX: 2500, name: 'The Ancient Alusi Shrine', subtitle: 'Older than the village. Older than memory.' },
    ],

    props: [
        // Area 1: the village
        { texture: 'hut', x: 140, y: above(90) },
        { texture: 'yam_barn', x: 420, y: above(55) },
        { texture: 'hearth', x: 620, y: above(26) },
        { texture: 'palm', x: 260, y: above(100), depth: 4 },
        { texture: 'banana', x: 760, y: above(75), depth: 4 },
        { texture: 'palm', x: 920, y: above(100), depth: 4 },
        { texture: 'totem', x: 1040, y: above(85) },
        { texture: 'mbe', x: 340, y: above(30), depth: 6 },
        // Area 2: the forest path
        { texture: 'iroko', x: 1380, y: above(210), depth: 4 },
        { texture: 'iroko', x: 1720, y: above(210), depth: 4 },
        { texture: 'iroko_spirit', x: 2300, y: above(210), depth: 4 },
        { texture: 'palm', x: 1500, y: above(100), depth: 4 },
        { texture: 'banana', x: 1820, y: above(75), depth: 4 },
        { texture: 'pillar', x: 1600, y: above(75), depth: 6 },
        { texture: 'bell', x: 2280, y: above(140), depth: 6, spiritOnly: true },
        // Area 3: the shrine
        { texture: 'iroko_spirit', x: 2700, y: above(210), depth: 4 },
        { texture: 'iroko', x: 3100, y: above(210), depth: 4 },
        { texture: 'iroko_spirit', x: 3560, y: above(210), depth: 4 },
        { texture: 'shrine', x: 3400, y: above(130), depth: 6 },
        { texture: 'totem', x: 2620, y: above(85) },
        { texture: 'totem', x: 3680, y: above(85) },
        ...mushrooms,
    ],

    labels: [{ text: 'Mbe', x: 340, y: above(72) }],

    // Mbe's carved log
    solids: [{ x: 340, y: above(10), w: 90, h: 20 }],

    // Roots across the chasm, solid only in the Spirit World
    spiritSolids: [
        { texture: 'spirit_root', x: 1920, y: above(20), w: 160, h: 26 },
        { texture: 'spirit_root', x: 2060, y: above(55), w: 160, h: 26 },
        { texture: 'spirit_root', x: 2185, y: above(20), w: 140, h: 26 },
    ],

    gates: [
        { id: 'thorns', kind: 'thorns', x: 2200, y: above(60), w: 20, h: 120, openedBy: 'bell-rang' },
        { id: 'barrier', kind: 'spirit-barrier', x: 2400, y: above(110), w: 26, h: 220, openedBy: 'bell-rang' },
    ],

    interactables: [
        { id: 'mbe', label: 'Speak with Mbe', x: 340, y: above(30), dialogue: 'mbe' },
        { id: 'barn', label: 'Inspect the yam barn', x: 420, y: above(30), dialogue: 'barn' },
        { id: 'hearth', label: 'Inspect the communal hearth', x: 620, y: above(30), dialogue: 'hearth' },
        { id: 'totem', label: 'Inspect the totem post', x: 1040, y: above(40), dialogue: 'totem' },
        { id: 'pillar', label: 'Touch the whispering Okpesi stone', x: 1600, y: above(60), dialogue: 'pillar' },
        {
            id: 'bell', label: 'Strike the Ogene Spirit Bell', x: 2280, y: above(140), dialogue: 'bell',
            requiresSpirit: true, lockedDialogue: 'bellLocked', hideWhenFlag: 'bell-rang',
        },
        { id: 'shrine', label: 'Approach the Alusi altar', x: 3400, y: above(60), dialogue: 'shrine', hideWhenFlag: 'shrine-touched' },
    ],

    relics: [
        { id: 'cowrie', x: 520, y: above(40), texture: 'relic_cowrie' },
        { id: 'ofo', x: 880, y: above(40), texture: 'relic_ofo' },
        { id: 'seed', x: 2060, y: above(150), texture: 'relic_seed' },
    ],

    objectives: [
        { untilFlag: 'mbe-met', text: 'Speak with Mbe the tortoise in the village.' },
        { untilFlag: 'pillar-touched', text: 'Find the whispering Okpesi stone on the forest path.' },
        { untilFlag: 'bell-rang', text: 'Use Spirit Sight to cross the chasm and strike the Ogene bell.' },
        { untilFlag: 'shrine-touched', text: 'Reach the Ancient Alusi Shrine beyond the grove.' },
    ],
    finalObjective: 'Listen to what the shrine remembers.',

    story: {
        'pillar-touched': [{ type: 'unlock-spirit', hint: 'Press Q or the Talisman button to see the Spirit World.' }],
        'bell-rang': [{ type: 'open-gate', gate: 'thorns' }, { type: 'open-gate', gate: 'barrier' }],
        'shrine-touched': [{ type: 'climax' }],
        'mask-spoke': [{ type: 'ending' }],
    },

    effects: {
        fireflies: 30,
        smoke: [{ x: 620, y: above(50) }],
        poles: [2800, 3010, 3220, 3430],
    },

    climax: {
        mask: { x: 3400, y: above(280) },
        hollowMan: { x: 3120, y: above(140) },
        embersFromX: 3100,
        embersToX: 3600,
    },
};
