// ---------------------------------------------------------------------------
// Story content: dialogue, items, glossary.
// ---------------------------------------------------------------------------
import type { DialoguePayload, ItemPayload } from '../utils';

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
    bellLocked: {
        speaker: "Chima",
        avatarKey: "chima",
        text: [
            "The bell is there... but I cannot reach it. Only the Spirit World reveals the true path.",
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
/** Relics Chima can carry. Keyed by relic id (same id as its pickup dialogue). */
export const ITEMS: Record<string, ItemPayload> = {
    cowrie: { id: "cowrie", name: "Ancient Cowrie", icon: "shell", description: "Shell-currency of the old markets." },
    ofo: { id: "ofo", name: "Ofo Fragment", icon: "staff", description: "Carved piece of the sacred truth-staff." },
    seed: { id: "seed", name: "Sacred Kola", icon: "kola", description: "Five-lobed kola seed of ancestor rites." },
};
