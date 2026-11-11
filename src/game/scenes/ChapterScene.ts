// ---------------------------------------------------------------------------
// ChapterScene: plays one LevelData. Owns the game phase, story flags, relics,
// checkpoints and saving; delegates movement, Spirit Sight and interaction
// prompts to the systems in ../systems.
// ---------------------------------------------------------------------------
import { Input, Scene } from 'phaser';
import { DIALOGUES, ENDING_NOTE, ITEMS } from '../content/story';
import { buildLevel, type BuiltLevel } from '../levels/buildLevel';
import { above, chapter1 } from '../levels/chapter1';
import type { LevelData, StoryAction } from '../levels/types';
import { EventBus } from '../events';
import { Music, playSfx } from '../systems/audio';
import { Interactions } from '../systems/Interactions';
import { PlayerController } from '../systems/PlayerController';
import { clearSave, loadSave, writeSave } from '../systems/save';
import { SpiritSight } from '../systems/SpiritSight';
import {
    EV, WORLD_H,
    type BeginPayload, type DialoguePayload, type GamePhase, type SpiritPayload, type TouchPayload,
} from '../utils';

const LEVELS: Record<string, LevelData> = { chapter1 };

export interface ChapterSceneData {
    level?: string;
    /** Set when restarting the scene to start playing straight away. */
    start?: BeginPayload['mode'];
}

export class ChapterScene extends Scene {
    private level!: LevelData;
    private built!: BuiltLevel;
    private player!: PlayerController;
    private spirit!: SpiritSight;
    private interactions!: Interactions;
    private music!: Music;
    private keys!: Record<'E' | 'Q' | 'SHIFT', Phaser.Input.Keyboard.Key>;

    private phase: GamePhase = 'MENU';
    private phaseBeforePause: GamePhase = 'PLAYING';
    private flags = new Set<string>();
    private relics = new Set<string>();
    private checkpoint = 0;
    private visitedAreas = new Set<string>();
    private dialogue: DialoguePayload | null = null;
    private dialogueIndex = 0;
    private endingStarted = false;

    constructor() { super('Chapter'); }

    init() {
        // Scene instances are reused by scene.restart(); reset all state.
        this.phase = 'MENU';
        this.flags = new Set();
        this.relics = new Set();
        this.checkpoint = 0;
        this.visitedAreas = new Set();
        this.dialogue = null;
        this.dialogueIndex = 0;
        this.endingStarted = false;
    }

    create(data: ChapterSceneData = {}) {
        this.level = LEVELS[data.level ?? 'chapter1'] ?? chapter1;
        this.built = buildLevel(this, this.level);
        this.spirit = new SpiritSight(this.built);
        this.music = new Music(this);

        const spawnX = this.level.checkpoints[0];
        this.player = new PlayerController(this, spawnX, above(40));
        this.player.onJump = () => playSfx(this, 'sfx_jump');

        const { sprite } = this.player;
        this.physics.add.collider(sprite, this.built.platforms);
        this.physics.add.collider(sprite, this.built.spiritPlatforms);
        this.physics.add.overlap(sprite, this.built.relics, (_p, r) => this.collectRelic(r as Phaser.Physics.Arcade.Sprite));

        this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(140, 80);

        this.interactions = new Interactions(this, this.level.interactables);
        this.setupInput();
        this.spirit.apply();

        if (data.start) this.begin(data.start);
        else this.setPhase('MENU');
        EventBus.emit(EV.SCENE_READY, this);
    }

    // ---------------------------------------------------------------
    // Input + React bridge
    // ---------------------------------------------------------------
    private setupInput() {
        const kb = this.input.keyboard!;
        this.keys = kb.addKeys('E,Q,SHIFT') as ChapterScene['keys'];
        kb.on('keydown-ESC', () => this.togglePause());
        kb.on('keydown-ENTER', () => { if (this.phase === 'PLAYING') this.tryInteract(); });
        this.input.on('pointerdown', () => { if (this.phase === 'PLAYING') this.tryInteract(); });

        const listeners: [string, (...args: any[]) => void][] = [
            [EV.BEGIN_JOURNEY, (p: BeginPayload) => this.scene.restart({ level: this.level.id, start: p?.mode ?? 'new' })],
            [EV.RESTART_GAME, () => this.scene.restart({ level: this.level.id, start: 'new' })],
            [EV.DIALOGUE_ADVANCE, () => this.advanceDialogue()],
            [EV.TOGGLE_PAUSE, () => this.togglePause()],
            [EV.SPIRIT_TOGGLE_REQUEST, () => this.toggleSpiritSight()],
            [EV.INTERACT_REQUEST, () => this.tryInteract()],
            [EV.TOUCH_INPUT, (p: TouchPayload) => Object.assign(this.player.touch, p)],
        ];
        for (const [ev, fn] of listeners) EventBus.on(ev, fn, this);

        // Remove listeners on shutdown (scene.restart) AND destroy (game.destroy,
        // e.g. React StrictMode remount / hot reload): a stale scene left on the
        // shared EventBus would crash on the next event.
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            for (const [ev, fn] of listeners) EventBus.off(ev, fn, this);
            this.music.stop();
        };
        this.events.once('shutdown', cleanup);
        this.events.once('destroy', cleanup);
    }

    // ---------------------------------------------------------------
    // Phases
    // ---------------------------------------------------------------
    private setPhase(p: GamePhase) {
        this.phase = p;
        EventBus.emit(EV.PHASE_CHANGED, p);
    }

    private begin(mode: BeginPayload['mode']) {
        if (mode === 'new') clearSave();
        const save = mode === 'continue' ? loadSave() : null;
        if (save && save.chapter === this.level.id) {
            this.checkpoint = Math.min(save.checkpoint, this.level.checkpoints.length - 1);
            for (const id of save.relics) this.restoreRelic(id);
            for (const flag of save.flags) {
                this.flags.add(flag);
                this.runStory(flag, false);
            }
        }

        const x = this.level.checkpoints[this.checkpoint];
        this.player.respawn(x, above(40));
        this.cameras.main.centerOn(x, WORLD_H / 2);
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.spirit.apply();
        this.emitSpirit();
        this.emitObjective();
        this.setPhase('PLAYING');
        this.music.start();
        playSfx(this, 'sfx_button');
        this.persist();
    }

    private togglePause() {
        if (this.phase === 'PLAYING' || this.phase === 'DIALOGUE') {
            this.phaseBeforePause = this.phase;
            this.setPhase('PAUSED');
            this.physics.world.pause();
            this.tweens.pauseAll();
            this.time.paused = true;
            this.music.pause();
        } else if (this.phase === 'PAUSED') {
            this.setPhase(this.phaseBeforePause);
            this.physics.world.resume();
            this.tweens.resumeAll();
            this.time.paused = false;
            this.music.resume();
        }
    }

    // ---------------------------------------------------------------
    // Story flags
    // ---------------------------------------------------------------
    private setFlag(flag: string) {
        if (this.flags.has(flag)) return;
        this.flags.add(flag);
        this.runStory(flag, true);
        this.persist();
        this.emitObjective();
    }

    /** Run a flag's story actions. `live` is false when restoring a save. */
    private runStory(flag: string, live: boolean) {
        for (const action of this.level.story[flag] ?? []) this.runAction(action, live);
    }

    private runAction(a: StoryAction, live: boolean) {
        switch (a.type) {
            case 'unlock-spirit':
                this.spirit.unlocked = true;
                this.emitSpirit(live ? a.hint : undefined);
                break;
            case 'open-gate': {
                const gate = this.built.gates.get(a.gate);
                if (!gate) break;
                gate.open = true;
                if (live) {
                    (gate.solid.body as Phaser.Physics.Arcade.StaticBody).enable = false;
                    this.tweens.add({ targets: gate.visuals, alpha: 0, duration: 600, onComplete: () => this.spirit.apply() });
                } else {
                    this.spirit.apply();
                }
                break;
            }
            case 'climax': if (live) this.triggerClimax(); break;
            case 'ending': if (live) this.triggerEnding(); break;
        }
    }

    /** Flags that trigger one-off scenes aren't saved, so they replay on Continue. */
    private isPersistentFlag(flag: string) {
        return !(this.level.story[flag] ?? []).some(a => a.type === 'climax' || a.type === 'ending');
    }

    private persist() {
        if (this.endingStarted) return;
        writeSave({
            version: 1,
            chapter: this.level.id,
            checkpoint: this.checkpoint,
            relics: [...this.relics],
            flags: [...this.flags].filter(f => this.isPersistentFlag(f)),
        });
    }

    // ---------------------------------------------------------------
    // Spirit Sight
    // ---------------------------------------------------------------
    private toggleSpiritSight() {
        if (this.phase !== 'PLAYING' || !this.spirit.unlocked) return;
        this.spirit.toggle();
        playSfx(this, 'sfx_powerup');
        this.emitSpirit();
    }

    private emitSpirit(hint?: string) {
        const payload: SpiritPayload = { active: this.spirit.active, unlocked: this.spirit.unlocked, hint };
        EventBus.emit(EV.SPIRIT_TOGGLED, payload);
    }

    // ---------------------------------------------------------------
    // Relics
    // ---------------------------------------------------------------
    private collectRelic(r: Phaser.Physics.Arcade.Sprite) {
        const id = r.getData('id') as string;
        if (this.phase !== 'PLAYING' || this.relics.has(id)) return;
        this.relics.add(id);
        r.disableBody(true, true);
        playSfx(this, 'sfx_collect');
        if (ITEMS[id]) EventBus.emit(EV.ITEM_COLLECTED, ITEMS[id]);
        this.persist();
        if (DIALOGUES[id]) this.startDialogue(DIALOGUES[id]);
    }

    private restoreRelic(id: string) {
        const sprite = this.built.relics.getChildren()
            .find(c => (c as Phaser.GameObjects.Sprite).getData('id') === id) as Phaser.Physics.Arcade.Sprite | undefined;
        if (!sprite || this.relics.has(id)) return;
        this.relics.add(id);
        sprite.disableBody(true, true);
        if (ITEMS[id]) EventBus.emit(EV.ITEM_COLLECTED, ITEMS[id]);
    }

    // ---------------------------------------------------------------
    // Dialogue
    // ---------------------------------------------------------------
    private startDialogue(d: DialoguePayload) {
        this.dialogue = d;
        this.dialogueIndex = 0;
        this.player.freeze();
        this.interactions.hide();
        this.setPhase('DIALOGUE');
        EventBus.emit(EV.DIALOGUE_START, d);
    }

    private advanceDialogue() {
        if (this.phase !== 'DIALOGUE' || !this.dialogue) return;
        playSfx(this, 'sfx_button');
        this.dialogueIndex++;
        if (this.dialogueIndex < this.dialogue.text.length) {
            EventBus.emit(EV.DIALOGUE_STEP, this.dialogueIndex);
            return;
        }
        const done = this.dialogue.onComplete;
        this.dialogue = null;
        this.player.freeze();
        this.setPhase('PLAYING');
        if (done) this.setFlag(done);
    }

    private tryInteract() {
        if (this.phase !== 'PLAYING') return;
        const key = this.interactions.dialogueFor(this.spirit.active);
        if (key && DIALOGUES[key]) this.startDialogue(DIALOGUES[key]);
    }

    // ---------------------------------------------------------------
    // Climax + ending
    // ---------------------------------------------------------------
    private triggerClimax() {
        if (this.endingStarted) return;
        this.endingStarted = true;
        this.player.freeze();
        this.setPhase('CUTSCENE');
        const cam = this.cameras.main;
        const { mask, hollowMan } = this.built;
        const { climax } = this.level;
        cam.shake(400, 0.008);
        cam.fadeOut(500, 0, 0, 0);
        cam.once('camerafadeoutcomplete', () => {
            mask.setVisible(true);
            hollowMan.setVisible(true);
            cam.fadeIn(900, 0, 0, 0);
            this.tweens.add({ targets: mask, alpha: 1, y: climax.mask.y, duration: 1800, ease: 'Sine.easeOut' });
            this.tweens.add({ targets: hollowMan, alpha: 0.85, duration: 2400, ease: 'Sine.easeOut' });
            this.tweens.add({ targets: mask, y: climax.mask.y + 12, duration: 2200, yoyo: true, repeat: -1, delay: 1800, ease: 'Sine.easeInOut' });
            for (let i = 0; i < 20; i++) {
                const x = climax.embersFromX + Math.random() * (climax.embersToX - climax.embersFromX);
                const e = this.add.image(x, above(Math.random() * 200), 'fx_glow').setAlpha(0).setDepth(9);
                this.tweens.add({ targets: e, alpha: 0.8, y: e.y - 120, duration: 2000 + Math.random() * 2000, delay: i * 120, yoyo: true, repeat: -1 });
            }
            this.time.delayedCall(2400, () => this.startDialogue(DIALOGUES.redmask));
        });
    }

    private triggerEnding() {
        this.setPhase('CUTSCENE');
        this.cameras.main.fadeOut(1400, 0, 0, 0);
        playSfx(this, 'sfx_win');
        clearSave();
        this.time.delayedCall(1600, () => {
            this.music.stop();
            this.setPhase('VISION_ENDING');
            EventBus.emit(EV.GAME_COMPLETED, { endingNote: ENDING_NOTE });
        });
    }

    // ---------------------------------------------------------------
    // HUD events
    // ---------------------------------------------------------------
    private emitObjective() {
        const next = this.level.objectives.find(o => !this.flags.has(o.untilFlag));
        EventBus.emit(EV.OBJECTIVE_CHANGED, next ? next.text : this.level.finalObjective);
    }

    private emitArea(x: number) {
        const area = [...this.level.areas].reverse().find(a => x >= a.fromX);
        if (area && !this.visitedAreas.has(area.name)) {
            this.visitedAreas.add(area.name);
            EventBus.emit(EV.LOCATION_ENTERED, { name: area.name, subtitle: area.subtitle });
        }
    }

    // ---------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------
    update(_time: number, delta: number) {
        const sx = this.cameras.main.scrollX;
        for (const p of this.built.parallax) p.obj.x = -sx * p.factor;

        if (this.phase !== 'PLAYING') {
            this.interactions.hide();
            return;
        }

        this.player.update(delta);

        if (Input.Keyboard.JustDown(this.keys.Q) || Input.Keyboard.JustDown(this.keys.SHIFT)) this.toggleSpiritSight();
        if (Input.Keyboard.JustDown(this.keys.E)) this.tryInteract();
        if (this.phase !== 'PLAYING') return; // an interaction may have started dialogue

        // Fell into a chasm
        if (this.player.y > WORLD_H + 60) {
            this.player.respawn(this.level.checkpoints[this.checkpoint], above(60));
            this.cameras.main.shake(200, 0.006);
            playSfx(this, 'sfx_jump');
            return;
        }

        this.interactions.update(this.player.x, this.player.y, { spirit: this.spirit.active, flags: this.flags });

        // Checkpoints only move forward; reaching one saves.
        const { checkpoints } = this.level;
        let cp = this.checkpoint;
        while (cp + 1 < checkpoints.length && this.player.x >= checkpoints[cp + 1]) cp++;
        if (cp !== this.checkpoint) {
            this.checkpoint = cp;
            this.persist();
        }

        this.emitArea(this.player.x);
    }
}
