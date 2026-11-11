// ---------------------------------------------------------------------------
// Shared types + constants for "Echoes of the Ancestors".
// ---------------------------------------------------------------------------

export type GamePhase =
    | "BOOT"
    | "MENU"
    | "PLAYING"
    | "DIALOGUE"
    | "CUTSCENE"
    | "PAUSED"
    | "VISION_ENDING"
    | "FINISHED";

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

/** Sent with EV.SPIRIT_TOGGLED. */
export interface SpiritPayload { active: boolean; unlocked: boolean; hint?: string; }

/** Sent with EV.BEGIN_JOURNEY: start fresh or resume the saved game. */
export interface BeginPayload { mode: 'new' | 'continue'; }

/** Held-button state from the on-screen touch controls. */
export interface TouchPayload { left?: boolean; right?: boolean; jump?: boolean; }

// ---------------------------------------------------------------------------
// EventBus event names (single source of truth — scene + App.tsx import these)
// ---------------------------------------------------------------------------
export const EV = {
    // scene -> React
    PHASE_CHANGED: "phase-changed",
    SCENE_READY: "current-scene-ready",
    DIALOGUE_START: "dialogue-start",
    /** Payload: index of the dialogue line now showing. */
    DIALOGUE_STEP: "dialogue-step",
    SPIRIT_TOGGLED: "spirit-sight-toggled",
    ITEM_COLLECTED: "item-collected",
    LOCATION_ENTERED: "location-entered",
    OBJECTIVE_CHANGED: "objective-changed",
    GAME_COMPLETED: "game-completed",
    // React -> scene
    BEGIN_JOURNEY: "begin-journey",
    DIALOGUE_ADVANCE: "dialogue-advance",
    TOGGLE_PAUSE: "toggle-pause",
    RESTART_GAME: "restart-game",
    SPIRIT_TOGGLE_REQUEST: "spirit-toggle",
    INTERACT_REQUEST: "interact",
    TOUCH_INPUT: "touch-input",
} as const;

// ---------------------------------------------------------------------------
// World constants
// ---------------------------------------------------------------------------
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
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

