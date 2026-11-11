// ---------------------------------------------------------------------------
// Level data format. A chapter is plain data; levels/buildLevel.ts turns it
// into game objects. Add a new chapter by writing a new LevelData file.
//
// Coordinates: x is world pixels from the left edge. y is world pixels from
// the top; use `above(h)` from ./chapter1 helpers to place things h pixels
// above the ground surface.
// ---------------------------------------------------------------------------

/** A decorative image. */
export interface PropDef {
    texture: string;
    x: number;
    y: number;
    depth?: number;
    /** Only shown in the Spirit World. */
    spiritOnly?: boolean;
}

/** A floating text label (e.g. a character's name). */
export interface LabelDef { text: string; x: number; y: number; }

/** An invisible solid box (centre x/y, width, height). */
export interface SolidDef { x: number; y: number; w: number; h: number; }

/** A platform that is only solid (and visible) in the Spirit World. */
export interface SpiritSolidDef extends SolidDef { texture: string; }

/**
 * Something that blocks the path until a story flag is set.
 * - 'thorns': solid in both worlds, drawn as a thorn wall.
 * - 'spirit-barrier': solid in both worlds; glows in the Spirit World and is
 *   only a faint shimmer in the Living World.
 */
export interface GateDef extends SolidDef {
    id: string;
    kind: 'thorns' | 'spirit-barrier';
    /** Story flag that opens it. */
    openedBy: string;
}

/** Press E near this to start a dialogue. */
export interface InteractDef {
    id: string;
    /** Prompt text, e.g. "Speak with Mbe". */
    label: string;
    x: number;
    y: number;
    /** Key into DIALOGUES. */
    dialogue: string;
    /** Only usable in the Spirit World... */
    requiresSpirit?: boolean;
    /** ...otherwise this dialogue plays instead (key into DIALOGUES). */
    lockedDialogue?: string;
    /** Stop offering this interaction once the flag is set. */
    hideWhenFlag?: string;
}

/** A collectible relic. id must exist in ITEMS (and may have a DIALOGUES entry). */
export interface RelicDef { id: string; x: number; y: number; texture: string; }

/** A named region; the banner shows the first time the player enters it. */
export interface AreaDef { name: string; subtitle: string; fromX: number; }

/** Current-task text shown in the journal until `untilFlag` is set. */
export interface ObjectiveDef { untilFlag: string; text: string; }

/** What happens when a story flag is set (by a dialogue's onComplete). */
export type StoryAction =
    | { type: 'unlock-spirit'; hint?: string }
    | { type: 'open-gate'; gate: string }
    | { type: 'climax' }
    | { type: 'ending' };

export interface LevelData {
    id: string;
    title: string;
    width: number;
    /** Respawn points, left to right. Reaching one saves the game. */
    checkpoints: number[];
    /** Walkable ground, as [fromX, toX] spans. Gaps are chasms. */
    ground: [number, number][];
    props: PropDef[];
    labels: LabelDef[];
    solids: SolidDef[];
    spiritSolids: SpiritSolidDef[];
    gates: GateDef[];
    interactables: InteractDef[];
    relics: RelicDef[];
    areas: AreaDef[];
    objectives: ObjectiveDef[];
    /** Final objective text once every listed objective is done. */
    finalObjective: string;
    story: Record<string, StoryAction[]>;
    effects: {
        fireflies: number;
        smoke: { x: number; y: number }[];
        /** Red ritual poles: x positions. */
        poles: number[];
    };
    climax: {
        mask: { x: number; y: number };
        hollowMan: { x: number; y: number };
        embersFromX: number;
        embersToX: number;
    };
}
