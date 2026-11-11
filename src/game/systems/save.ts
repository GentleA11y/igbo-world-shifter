// ---------------------------------------------------------------------------
// Save game in the browser's localStorage. One slot. Every read/write is
// guarded: private windows or blocked storage just mean no saving.
// ---------------------------------------------------------------------------

export interface SaveData {
    version: 1;
    chapter: string;
    /** Index into the chapter's checkpoints. */
    checkpoint: number;
    relics: string[];
    flags: string[];
}

const KEY = 'echoes-of-the-ancestors.save';

export function loadSave(): SaveData | null {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (d?.version !== 1 || typeof d.chapter !== 'string') return null;
        return {
            version: 1,
            chapter: d.chapter,
            checkpoint: Number.isInteger(d.checkpoint) ? d.checkpoint : 0,
            relics: Array.isArray(d.relics) ? d.relics.filter((r: unknown) => typeof r === 'string') : [],
            flags: Array.isArray(d.flags) ? d.flags.filter((f: unknown) => typeof f === 'string') : [],
        };
    } catch {
        return null;
    }
}

export function writeSave(data: SaveData) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ }
}

export function clearSave() {
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

export function hasSave() {
    return loadSave() !== null;
}
