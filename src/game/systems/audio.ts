// ---------------------------------------------------------------------------
// Optional audio. Drop matching .mp3 files into src/assets/audio/ to enable
// sound; any missing file is skipped and the game plays silently.
// ---------------------------------------------------------------------------
import type { Scene } from 'phaser';

/** Sound key -> file name inside src/assets/audio/. */
const AUDIO_FILES: Record<string, string> = {
    bgm: 'bgm_chill.mp3',
    sfx_button: 'sfx_button.mp3',
    sfx_jump: 'sfx_jump.mp3',
    sfx_powerup: 'sfx_powerup.mp3',
    sfx_collect: 'sfx_collect.mp3',
    sfx_win: 'sfx_win.mp3',
};

// Vite finds whichever files exist at build time, so missing ones are never
// requested (no 404s or decode errors).
const AUDIO_URLS = import.meta.glob('../../assets/audio/*.mp3', {
    eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

export function preloadAudio(scene: Scene) {
    for (const [key, file] of Object.entries(AUDIO_FILES)) {
        const url = AUDIO_URLS[`../../assets/audio/${file}`];
        if (url) scene.load.audio(key, url);
    }
}

/** Play a sound effect if it was loaded. */
export function playSfx(scene: Scene, key: string) {
    if (scene.cache.audio.exists(key)) scene.sound.play(key, { volume: 0.6 });
}

/** Looping background music that is a no-op when the file is missing. */
export class Music {
    private track?: Phaser.Sound.BaseSound;
    constructor(private scene: Scene, private key = 'bgm') {}

    start() {
        this.stop();
        if (!this.scene.cache.audio.exists(this.key)) return;
        this.track = this.scene.sound.add(this.key, { loop: true, volume: 0.35 });
        this.track.play();
    }
    pause() { this.track?.pause(); }
    resume() { this.track?.resume(); }
    stop() {
        if (!this.track) return;
        this.track.stop();
        this.track.destroy();
        this.track = undefined;
    }
}
