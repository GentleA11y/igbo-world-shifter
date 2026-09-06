// ---------------------------------------------------------------------------
// Shared types + constants for "Echoes of the Ancestors".
// ---------------------------------------------------------------------------

export type GamePhase =
    | "BOOT"
    | "MENU"
    | "PLAYING"
    | "DIALOGUE"
    | "PAUSED"
    | "VISION_ENDING"
    | "FINISHED";

export interface LeaderboardEntry { name: string; score: number; date: string; }

export interface DialoguePayload {
    speaker: string;
    avatarKey: string;
    text: string[];
    onComplete?: string;
}

export interface ItemPayload {
    id: string;
    name: string;
    icon: string;
    description: string;
}

export interface LocationPayload { name: string; subtitle: string; }

// ---------------------------------------------------------------------------
// EventBus event names (single source of truth — scene + App.tsx import these)
// ---------------------------------------------------------------------------
export const EV = {
    PHASE_CHANGED: "phase-changed",
    SCENE_READY: "current-scene-ready",
    DIALOGUE_START: "dialogue-start",
    DIALOGUE_ADVANCE: "dialogue-advance",
    SPIRIT_TOGGLED: "spirit-sight-toggled",
    ITEM_COLLECTED: "item-collected",
    LOCATION_ENTERED: "location-entered",
    GAME_COMPLETED: "game-completed",
    TOGGLE_PAUSE: "toggle-pause",
    RESTART_GAME: "restart-game",
} as const;

// ---------------------------------------------------------------------------
// World constants
// ---------------------------------------------------------------------------
export const WORLD_W = 3840;
export const WORLD_H = 540;
export const GRAVITY_Y = 800;
export const MOVE_SPEED = 210;
export const JUMP_VELOCITY = -420;
export const GROUND_TOP = 470;   // top surface of the ground strip

// Living / Spirit palettes
export const LIVING = {
    skyTop: "#F9C587", skyBottom: "#E5A93C",
    hillFar: "#C97B2D", hillMid: "#8F4A20",
    ground: 0xA63A22, grass: 0x3E7A2E,
    hut: 0x7C482B, thatch: 0xC98F3A,
    trunk: 0x5A3218, leaf: 0x2D5A27,
    banner: 0xB02A1E,
} as const;

export const SPIRIT = {
    skyTop: "#1E1035", skyBottom: "#3A1B5E",
    hillFar: "#2A1650", hillMid: "#1A0E38",
    ground: 0x2A1B4A, grass: 0x4DF2D6,
    cyan: 0x4DF2D6, violet: 0x8A3FFC, pearl: 0xE0F7FA,
    banner: 0x8A3FFC,
} as const;

export const COLORS = {
    BACKGROUND: 0x120a1e,
    TEXT: "#ffffff",
} as const;

// ---------------------------------------------------------------------------
// Dialogue scripts
// ---------------------------------------------------------------------------
export const DIALOGUES: Record<string, DialoguePayload> = {
    mbe: {
        speaker: "Mbe the Tortoise",
        avatarKey: "mbe",
        onComplete: "mbe-met",
        text: [
            "Ah, little Chima! You wander far from your mother's hearth.",
            "The crickets have stopped their evening songs in the Sacred Iroko Grove. Do you hear it? Even the river has forgotten its rhythm.",
            "The boundary between what breathes and what remembers has grown thin.",
            "Go, see what sleeps beneath the ancient stones. And Chima — carry your eyes open. Some paths only appear to those who look twice.",
        ],
    },
    pillar: {
        speaker: "Whispering Okpesi Stone",
        avatarKey: "spirit",
        onComplete: "pillar-touched",
        text: [
            "The carved pillar is cold... then warm... then it hums against your palm.",
            "Ancestral voices rise like incense: 'See with the eyes of those who came before.'",
            "SPIRIT SIGHT awakened — press Q (or the Talisman button) to shift between the Living World and the Spirit World.",
        ],
    },
    bell: {
        speaker: "Ogene Spirit Bell",
        avatarKey: "spirit",
        onComplete: "bell-rang",
        text: [
            "The bronze ogene bell hangs in the twilight, green with age and glowing with nzu-white light.",
            "You strike it. The note rolls through the grove like a river finding the sea.",
            "The spirit barrier unravels... the path to the Alusi Shrine is open.",
        ],
    },
    shrine: {
        speaker: "Chima",
        avatarKey: "chima",
        onComplete: "shrine-touched",
        text: [
            "The altar stones are older than the village, older than the Iroko itself.",
            "Something is waking beneath them...",
        ],
    },
    redmask: {
        speaker: "The Red Mask",
        avatarKey: "mask",
        onComplete: "mask-spoke",
        text: [
            "CHILD OF THE RED EARTH... you walk where footsteps were long erased.",
            "He who threw away his name is stirring in the deep dark.",
            "Remember, child. What is remembered lives.",
        ],
    },
    cowrie: {
        speaker: "Narration",
        avatarKey: "spirit",
        text: [
            "An ancient cowrie shell — currency of the old markets, eye of the sea. You tuck it into your wrap.",
        ],
    },
    ofo: {
        speaker: "Narration",
        avatarKey: "spirit",
        text: [
            "A carved fragment of an Ofo staff — the sacred sign of truth and authority. It thrums faintly in your hand.",
        ],
    },
    seed: {
        speaker: "Narration",
        avatarKey: "spirit",
        text: [
            "A sacred kola seed, five-lobed like an open hand. The ancestors always break kola before hard journeys.",
        ],
    },
    barn: {
        speaker: "Narration",
        avatarKey: "chima",
        text: [
            "The yam barn stands heavy with harvest. Good yams mean good fortunes — and good stories.",
        ],
    },
    hearth: {
        speaker: "Narration",
        avatarKey: "chima",
        text: [
            "The communal hearth still glows. Smoke carries palm-soup scent into the evening air.",
        ],
    },
    totem: {
        speaker: "Narration",
        avatarKey: "chima",
        text: [
            "A carved totem post watches the village path — three stacked heads, a bird crest raised against the sky.",
        ],
    },
};

export const ENDING_NOTE = "What you have forgotten is waking.";

export const GLOSSARY: { term: string; def: string }[] = [
    { term: "Mbe", def: "The tortoise — trickster and sage of Igbo folklore, keeper of clever tales." },
    { term: "Mmanwu", def: "Ancestral masquerade; a spirit made visible to the living through mask and raffia." },
    { term: "Nzu", def: "Sacred white chalk of purity, welcome and spiritual power." },
    { term: "Ofo", def: "A staff symbolizing truth, justice and the authority of the ancestors." },
    { term: "Ogene", def: "A bronze gong whose voice calls the community — and the spirits — to attention." },
    { term: "Alusi", def: "Shrines and deities of the land, guardians of groves, rivers and crossroads." },
    { term: "Uli", def: "Traditional geometric body and wall mural art, drawn in swift confident curves." },
];