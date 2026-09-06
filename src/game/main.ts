import { AUTO, Events, Game as PhaserGame, Input, Scale, Scene } from 'phaser';
import { generateAllTextures } from '../sprites/textures';
import {
    WORLD_W, WORLD_H, GRAVITY_Y, MOVE_SPEED, JUMP_VELOCITY, GROUND_TOP,
    SPIRIT, EV, COLORS,
    type GamePhase, type DialoguePayload, type ItemPayload, type LocationPayload,
    DIALOGUES, ENDING_NOTE,
} from './utils';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const EventBus = new Events.EventEmitter();

// ---------------------------------------------------------------------------
// Phaser bootstrap
// ---------------------------------------------------------------------------
const StartGame = (parent: string) => {
    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent,
        backgroundColor: '#120a1e',
        scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
        physics: {
            default: 'arcade',
            arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false },
        },
        scene: [Game],
    };
    const game = new PhaserGame(config);
    if (typeof window !== 'undefined') {
        (window as any).__PHASER_GAME__ = game;
        (window as any).__PHASER_EVENT_BUS__ = EventBus;
    }
    return game;
};

interface InteractTarget { id: string; label: string; kind: string; }

// ---------------------------------------------------------------------------
// The Game scene — full narrative world
// ---------------------------------------------------------------------------
export class Game extends Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private spiritPlatforms!: Phaser.Physics.Arcade.StaticGroup;
    private thornWalls: Phaser.Physics.Arcade.Image[] = [];
    private barrier!: Phaser.Physics.Arcade.Sprite;
    private relics!: Phaser.Physics.Arcade.Group;
    private interactables!: Phaser.GameObjects.Sprite[];
    private bellSprite!: Phaser.Physics.Arcade.Sprite;
    private bellVisual!: Phaser.GameObjects.Image;
    private maskSprite!: Phaser.GameObjects.Image;
    private hollowSprite!: Phaser.GameObjects.Image;
    private promptText!: Phaser.GameObjects.Text;
    private walkFrame = 0;
    private walkTimer = 0;
    private vignette!: Phaser.GameObjects.Image;
    private fronds!: Phaser.GameObjects.Image;
    private sky!: Phaser.GameObjects.Image;
    private hillsFar!: Phaser.GameObjects.Image;
    private hillsMid!: Phaser.GameObjects.Image;
    private groundTiles!: Phaser.GameObjects.Image;
    private groundSpiritTiles!: Phaser.GameObjects.Image;
    private mushroomTiles: Phaser.GameObjects.Image[] = [];
    private bgm!: Phaser.Sound.BaseSound;

    private phase: GamePhase = 'MENU';
    private spiritSight = false;
    private bellRung = false;
    private endingStarted = false;
    private visitedLocations = new Set<string>();
    private collectedItems = new Set<string>();
    private pendingDialogue: DialoguePayload | null = null;
    private dialogueIndex = 0;
    private activeInteract: InteractTarget | null = null;
    private touchInput = { left: false, right: false, jump: false, interact: false, spirit: false };
    private spiritTintOverlay!: Phaser.GameObjects.Rectangle;
    private checkpointX = 120;

    constructor() { super('Game'); }

    // ---------------------------------------------------------------
    preload() {
    this.load.audio("bgm","assets/audio/bgm_chill.mp3");
    this.load.audio("sfx_button","assets/audio/sfx_button.mp3");
    this.load.audio("sfx_jump","assets/audio/sfx_jump.mp3");
    this.load.audio("sfx_powerup","assets/audio/sfx_powerup.mp3");
    this.load.audio("sfx_collect","assets/audio/sfx_collect.mp3");
    this.load.audio("sfx_win","assets/audio/sfx_win.mp3");
        // Audio and fx image assets are not bundled in this sandbox.
        // safePlay() guards audio; fx textures are generated in create().
    }

    // ---------------------------------------------------------------
    create() {
        generateAllTextures(this);

        // Generate fx textures that were previously loaded from files
        if (!this.textures.exists('fx_glow')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xE0F7FA, 0.7); g.fillCircle(12, 12, 10);
            g.fillStyle(0xffffff, 0.9); g.fillCircle(12, 12, 5);
            g.generateTexture('fx_glow', 24, 24); g.destroy();
        }
        if (!this.textures.exists('fx_spark')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0xF7B32B, 0.9); g.fillCircle(4, 4, 3);
            g.generateTexture('fx_spark', 8, 8); g.destroy();
        }
        if (!this.textures.exists('fx_smoke')) {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x888888, 0.4); g.fillCircle(16, 16, 14);
            g.generateTexture('fx_smoke', 32, 32); g.destroy();
        }

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H + 120);
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        // Sky + parallax layers (manual parallax in update)
        this.sky = this.add.image(0, 0, 'sky_living').setOrigin(0, 0).setScrollFactor(0).setDepth(-50);
        this.hillsFar = this.add.image(0, 280, 'hills_far').setOrigin(0, 1).setScrollFactor(0).setDepth(-40);
        this.hillsMid = this.add.image(0, 470, 'hills_mid').setOrigin(0, 1).setScrollFactor(0).setDepth(-30);

        // Ground visuals — tiled images across the world (two variants)
        this.groundTiles = this.add.image(WORLD_W / 2, GROUND_TOP + 35, 'ground').setDepth(-20);
        this.groundTiles.setDisplaySize(WORLD_W, 70);
        this.groundSpiritTiles = this.add.image(WORLD_W / 2, GROUND_TOP + 35, 'ground_spirit').setDepth(-19).setVisible(false);
        this.groundSpiritTiles.setDisplaySize(WORLD_W, 70);

        // Static groups
        this.platforms = this.physics.add.staticGroup();
        this.spiritPlatforms = this.physics.add.staticGroup();

        // Ground colliders split around the chasm (x 1900 - 2140)
        const gL = this.physics.add.staticImage(950, GROUND_TOP + 35, '__body');
        gL.setVisible(false); gL.setSize(1900, 70).refreshBody();
        this.platforms.add(gL);
        const gR = this.physics.add.staticImage(2990, GROUND_TOP + 35, '__body');
        gR.setVisible(false); gR.setSize(1700, 70).refreshBody();
        this.platforms.add(gR);

        // ---- Area 1: The Village of Umueze (x 0-1200) ----
        this.add.image(140, GROUND_TOP - 90, 'hut').setDepth(5);
        this.add.image(420, GROUND_TOP - 55, 'yam_barn').setDepth(5);
        this.add.image(620, GROUND_TOP - 26, 'hearth').setDepth(5);
        this.add.image(260, GROUND_TOP - 100, 'palm').setDepth(4);
        this.add.image(760, GROUND_TOP - 75, 'banana').setDepth(4);
        this.add.image(920, GROUND_TOP - 100, 'palm').setDepth(4);
        this.add.image(1040, GROUND_TOP - 85, 'totem').setDepth(5);

        // Mbe the tortoise on a carved log
        const log = this.physics.add.staticImage(340, GROUND_TOP - 10, '__body');
        log.setVisible(false); log.setSize(90, 20).refreshBody();
        this.platforms.add(log);
        this.add.image(340, GROUND_TOP - 30, 'mbe').setDepth(6);
        this.add.text(340, GROUND_TOP - 72, 'Mbe', {
            fontFamily: 'Georgia', fontSize: '14px', color: '#F7B32B', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(6);

        // Interactable zones
        this.interactables = [];
        const mkZone = (x: number, y: number, id: string, label: string, kind: string) => {
            const z = this.add.sprite(x, y, '__zone').setVisible(false).setDepth(6);
            z.setData('id', id); z.setData('label', label); z.setData('kind', kind);
            this.interactables.push(z);
            return z;
        };
        mkZone(340, GROUND_TOP - 30, 'mbe', 'Speak with Mbe', 'dialogue');
        mkZone(620, GROUND_TOP - 30, 'hearth', 'Inspect the communal hearth', 'dialogue');
        mkZone(420, GROUND_TOP - 30, 'barn', 'Inspect the yam barn', 'dialogue');
        mkZone(1040, GROUND_TOP - 40, 'totem', 'Inspect the totem post', 'dialogue');
        mkZone(1600, GROUND_TOP - 60, 'pillar', 'Touch the whispering Okpesi stone', 'dialogue');
        mkZone(3400, GROUND_TOP - 60, 'shrine', 'Approach the Alusi altar', 'dialogue');

        // Relics in village
        this.relics = this.physics.add.group({ allowGravity: false, immovable: true });
        this.spawnRelic(520, 'cowrie', 'relic_cowrie');
        this.spawnRelic(880, 'ofo', 'relic_ofo');

        // ---- Area 2: The Forest Path (x 1200-2500) ----
        this.add.image(1380, GROUND_TOP - 210, 'iroko').setDepth(4);
        this.add.image(1720, GROUND_TOP - 210, 'iroko').setDepth(4);
        this.add.image(2300, GROUND_TOP - 210, 'iroko_spirit').setDepth(4);
        this.add.image(1500, GROUND_TOP - 100, 'palm').setDepth(4);
        this.add.image(1820, GROUND_TOP - 75, 'banana').setDepth(4);

        // Okpesi pillar
        this.add.image(1600, GROUND_TOP - 75, 'pillar').setDepth(6);

        // Thorn wall blocking the path at x=2200 (dispelled by the ogene bell)
        const thorn = this.physics.add.staticImage(2200, GROUND_TOP - 60, '__body');
        thorn.setVisible(false); thorn.setSize(20, 120).refreshBody();
        this.platforms.add(thorn);
        this.thornWalls.push(thorn);
        for (let i = 0; i < 5; i++) {
            this.add.rectangle(2200, GROUND_TOP - 110 + i * 22, 20, 20, 0x2A1608).setDepth(5);
        }

        // Spirit root platforms over the chasm (solid only in Spirit Sight)
        const root1 = this.physics.add.staticImage(1920, GROUND_TOP - 20, 'spirit_root');
        root1.setSize(160, 26).refreshBody();
        this.spiritPlatforms.add(root1);
        const root2 = this.physics.add.staticImage(2060, GROUND_TOP - 55, 'spirit_root');
        root2.setSize(160, 26).refreshBody();
        this.spiritPlatforms.add(root2);
        const root3 = this.physics.add.staticImage(2185, GROUND_TOP - 20, 'spirit_root');
        root3.setSize(140, 26).refreshBody();
        this.spiritPlatforms.add(root3);

        // Spirit barrier at x=2400 (solid in Spirit Sight until the bell is rung)
        this.barrier = this.physics.add.staticSprite(2400, GROUND_TOP - 110, 'barrier');
        this.barrier.setSize(26, 220);
        this.barrier.refreshBody();

        // Ogene bell — tangible only in Spirit Sight
        this.bellSprite = this.physics.add.sprite(2280, GROUND_TOP - 140, '__zone');
        (this.bellSprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.bellSprite.setVisible(false);
        this.bellSprite.setData('id', 'bell');
        this.bellSprite.setData('label', 'Strike the Ogene Spirit Bell');
        this.bellSprite.setData('kind', 'bell');
        this.interactables.push(this.bellSprite);
        this.bellVisual = this.add.image(2280, GROUND_TOP - 140, 'bell').setDepth(6).setVisible(false);

        // Relic in forest
        this.spawnRelic(2050, 'seed', 'relic_seed');

        // ---- Area 3: The Ancient Alusi Shrine (x 2500-3840) ----
        this.add.image(2700, GROUND_TOP - 210, 'iroko_spirit').setDepth(4);
        this.add.image(3100, GROUND_TOP - 210, 'iroko').setDepth(4);
        this.add.image(3560, GROUND_TOP - 210, 'iroko_spirit').setDepth(4);
        this.add.image(3400, GROUND_TOP - 130, 'shrine').setDepth(6);
        this.add.image(2620, GROUND_TOP - 85, 'totem').setDepth(5);
        this.add.image(3680, GROUND_TOP - 85, 'totem').setDepth(5);
        for (let i = 0; i < 4; i++) {
            this.add.rectangle(2800 + i * 210, GROUND_TOP - 160, 6, 120, 0xB02A1E).setDepth(5);
            this.add.rectangle(2800 + i * 210, GROUND_TOP - 100, 30, 4, 0xE5A93C).setDepth(5);
        }

        // Spirit mushrooms (visible only in Spirit Sight)
        for (let i = 0; i < 14; i++) {
            const mx = 1280 + i * 180 + (i % 3) * 40;
            const my = GROUND_TOP - 20 - (i % 2) * 60;
            const m = this.add.image(mx, my, 'mushroom').setDepth(5).setVisible(false);
            this.mushroomTiles.push(m);
        }

        // Ambient particles (fireflies / spirit embers)
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * WORLD_W;
            const y = 120 + Math.random() * 320;
            const spark = this.add.image(x, y, 'fx_spark').setAlpha(0.6).setDepth(8);
            this.tweens.add({
                targets: spark,
                y: y - 30 - Math.random() * 40,
                alpha: { from: 0.2, to: 0.9 },
                duration: 2000 + Math.random() * 3000,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        }

        // Smoke wisps from the hearth
        for (let i = 0; i < 3; i++) {
            const smoke = this.add.image(620, GROUND_TOP - 50, 'fx_smoke').setAlpha(0.35).setDepth(7);
            this.tweens.add({
                targets: smoke,
                y: GROUND_TOP - 120,
                alpha: 0,
                scale: 1.6,
                duration: 3200 + i * 600,
                repeat: -1,
                delay: i * 900,
                ease: 'Sine.easeOut',
            });
        }

        // ---- PLAYER ----
        this.player = this.physics.add.sprite(120, GROUND_TOP - 40, 'chima_idle');
        this.player.setCollideWorldBounds(true);
        this.player.body!.setSize(28, 56);
        this.player.body!.setOffset(8, 8);
        this.player.setDepth(10);


        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.spiritPlatforms, undefined, () => this.spiritSight, this);
        this.physics.add.collider(this.player, this.barrier, undefined, () => this.spiritSight && !this.bellRung, this);
        this.physics.add.overlap(this.player, this.relics, (_p, r) => {
            this.collectRelic(r as Phaser.Physics.Arcade.Sprite);
        }, undefined, this);

        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(140, 80);

        // UI overlays
        this.promptText = this.add.text(0, 0, ' ', {
            fontFamily: 'Georgia', fontSize: '15px', color: '#F7E7B3',
            backgroundColor: 'rgba(20,10,5,0.85)', padding: { x: 10, y: 6 },
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(20).setVisible(false);

        this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0, 0).setScrollFactor(0).setDepth(15).setAlpha(0.55);
        this.fronds = this.add.image(0, 0, 'fronds').setOrigin(0, 0).setScrollFactor(0).setDepth(14).setAlpha(0.85);

        this.spiritTintOverlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, SPIRIT.violet, 0.18)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(13).setVisible(false);

        // Red mask + Hollow Man (hidden until the shrine climax)
        this.maskSprite = this.add.image(3400, GROUND_TOP - 300, 'red_mask').setDepth(9).setVisible(false).setAlpha(0);
        this.hollowSprite = this.add.image(3120, GROUND_TOP - 140, 'hollow_man').setDepth(8).setVisible(false).setAlpha(0);

        // Input
        this.keys = this.input.keyboard!.addKeys('A,D,W,S,E,Q,SHIFT,SPACE,ESC,ENTER') as Record<string, Phaser.Input.Keyboard.Key>;
        this.cursors = this.input.keyboard!.createCursorKeys();

        this.input.keyboard!.on('keydown-ESC', () => {
            if (this.phase === 'PLAYING' || this.phase === 'DIALOGUE') {
                EventBus.emit(EV.TOGGLE_PAUSE);
            }
        });
        this.input.keyboard!.on('keydown-SPACE', () => {
            if (this.phase === 'DIALOGUE') EventBus.emit(EV.DIALOGUE_ADVANCE);
        });
        this.input.keyboard!.on('keydown-ENTER', () => {
            if (this.phase === 'DIALOGUE') EventBus.emit(EV.DIALOGUE_ADVANCE);
            else if (this.phase === 'PLAYING') this.tryInteract();
        });

        // Click-to-interact on the canvas
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.phase === 'DIALOGUE') { EventBus.emit(EV.DIALOGUE_ADVANCE); return; }
            if (this.phase === 'PLAYING' && this.activeInteract) this.tryInteract();
            void pointer;
        });

        // EventBus listeners (React -> scene)
        EventBus.on(EV.DIALOGUE_ADVANCE, this.advanceDialogue, this);
        EventBus.on(EV.RESTART_GAME, this.restartGame, this);
        EventBus.on('touch-input', this.onTouchInput, this);
        EventBus.on('begin-journey', this.beginJourney, this);
        EventBus.on('spirit-toggle', this.toggleSpiritSight, this);
        EventBus.on('interact', this.tryInteract, this);
        EventBus.on('toggle-pause', this.handlePauseToggle, this);

        this.events.once('shutdown', () => {
            this.time.removeAllEvents();
            this.tweens.killAll();
            this.input.keyboard?.removeAllListeners();
            EventBus.off(EV.DIALOGUE_ADVANCE, this.advanceDialogue, this);
            EventBus.off(EV.RESTART_GAME, this.restartGame, this);
            EventBus.off('touch-input', this.onTouchInput, this);
            EventBus.off('begin-journey', this.beginJourney, this);
            EventBus.off('spirit-toggle', this.toggleSpiritSight, this);
            EventBus.off('interact', this.tryInteract, this);
            EventBus.off('toggle-pause', this.handlePauseToggle, this);
            if (this.bgm) this.bgm.stop();
        });

        this.setPhase('MENU');
        EventBus.emit(EV.SCENE_READY, this);
    }

    // ---------------------------------------------------------------
    // Phase machine + pause
    // ---------------------------------------------------------------
    private setPhase(p: GamePhase) {
        this.phase = p;
        EventBus.emit(EV.PHASE_CHANGED, p);
    }

    private handlePauseToggle() {
        if (this.phase === 'PLAYING') {
            this.setPhase('PAUSED');
            this.physics.world.pause();
            this.tweens.pauseAll();
            if (this.bgm) this.bgm.pause();
        } else if (this.phase === 'PAUSED') {
            this.setPhase('PLAYING');
            this.physics.world.resume();
            this.tweens.resumeAll();
            if (this.bgm) this.bgm.resume();
        }
    }

    private beginJourney() {
        if (this.phase !== 'MENU') return;
        this.setPhase('PLAYING');
        this.touchInput = { left: false, right: false, jump: false, interact: false, spirit: false };
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.player.setVelocity(0, 0);
        this.player.setTexture('chima_idle');
        this.safePlay('sfx_button');
        if (this.bgm) this.bgm.stop();
        this.bgm = this.cache.audio.exists('bgm') ? this.sound.add('bgm', { loop: true, volume: 0.35 }) : this.sound.add('bgm');
        this.bgm.play();
        this.emitLocation(120);
    }

    private restartGame() {
        this.spiritSight = false;
        this.bellRung = false;
        this.endingStarted = false;
        this.visitedLocations.clear();
        this.collectedItems.clear();
        this.pendingDialogue = null;
        this.checkpointX = 120;
        this.touchInput = { left: false, right: false, jump: false, interact: false, spirit: false };
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.player.setPosition(120, GROUND_TOP - 40);
        this.player.setVelocity(0, 0);
        this.player.setTexture('chima_idle');
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.maskSprite.setVisible(false).setAlpha(0).setY(GROUND_TOP - 300);
        this.hollowSprite.setVisible(false).setAlpha(0);
        this.relics.getChildren().forEach((c) => {
            const s = c as Phaser.Physics.Arcade.Sprite;
            s.enableBody(true, s.x, GROUND_TOP - 40, true, true);
        });
        this.thornWalls.forEach((t) => { t.enableBody(true, t.x, t.y, true, true); });
        this.applySpiritSight();
        this.setPhase('PLAYING');
        if (this.physics.world.isPaused) this.physics.world.resume();
        this.tweens.resumeAll();
        if (this.bgm) { this.bgm.stop(); }
        this.bgm = this.cache.audio.exists('bgm') ? this.sound.add('bgm', { loop: true, volume: 0.35 }) : this.sound.add('bgm');
        this.bgm.play();
    }

    private respawnPlayer() {
        this.touchInput = { left: false, right: false, jump: false, interact: false, spirit: false };
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.player.setPosition(this.checkpointX, GROUND_TOP - 60);
        this.player.setVelocity(0, 0);
        this.player.setTexture('chima_idle');
        this.cameras.main.shake(200, 0.006);
        this.safePlay('sfx_jump');
    }

    // ---------------------------------------------------------------
    // Spirit Sight mechanic
    // ---------------------------------------------------------------
    private toggleSpiritSight() {
        if (this.phase !== 'PLAYING') return;
        this.spiritSight = !this.spiritSight;
        this.applySpiritSight();
        this.safePlay('sfx_powerup');
        EventBus.emit(EV.SPIRIT_TOGGLED, { active: this.spiritSight });
    }

    private applySpiritSight() {
        this.sky.setTexture(this.spiritSight ? 'sky_spirit' : 'sky_living');
        this.hillsFar.setTexture(this.spiritSight ? 'hills_far_s' : 'hills_far');
        this.hillsMid.setTexture(this.spiritSight ? 'hills_mid_s' : 'hills_mid');
        this.groundTiles.setVisible(!this.spiritSight);
        this.groundSpiritTiles.setVisible(this.spiritSight);
        this.spiritTintOverlay.setVisible(this.spiritSight);
        this.spiritPlatforms.getChildren().forEach((c) => {
            const s = c as Phaser.Physics.Arcade.Image;
            s.setVisible(this.spiritSight);
            s.body!.enable = this.spiritSight;
        });
        this.barrier.setVisible(this.spiritSight && !this.bellRung);
        this.barrier.body!.enable = this.spiritSight && !this.bellRung;
        this.bellVisual.setVisible(this.spiritSight);
        this.mushroomTiles.forEach((m) => m.setVisible(this.spiritSight));
        this.thornWalls.forEach((t) => {
            t.body!.enable = !this.bellRung;
        });
    }

    // ---------------------------------------------------------------
    // Relics
    // ---------------------------------------------------------------
    private spawnRelic(x: number, id: string, texture: string) {
        const r = this.physics.add.sprite(x, GROUND_TOP - 40, texture);
        r.body!.setAllowGravity(false);
        r.setDepth(7);
        r.setData('id', id);
        this.tweens.add({ targets: r, y: GROUND_TOP - 54, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.relics.add(r, true);
    }

    private collectRelic(r: Phaser.Physics.Arcade.Sprite) {
        const id = r.getData('id') as string;
        if (this.collectedItems.has(id)) return;
        this.collectedItems.add(id);
        r.disableBody(true, true);
        this.safePlay('sfx_collect');
        const meta: Record<string, ItemPayload> = {
            cowrie: { id: 'cowrie', name: 'Ancient Cowrie', icon: 'shell', description: 'Shell-currency of the old markets.' },
            ofo: { id: 'ofo', name: 'Ofo Fragment', icon: 'staff', description: 'Carved piece of the sacred truth-staff.' },
            seed: { id: 'seed', name: 'Sacred Kola', icon: 'kola', description: 'Five-lobed kola seed of ancestor rites.' },
        };
        const payload = meta[id];
        if (payload) {
            EventBus.emit(EV.ITEM_COLLECTED, payload);
            const d = DIALOGUES[id];
            if (d) this.startDialogue(d);
        }
    }

    // ---------------------------------------------------------------
    // Dialogue
    // ---------------------------------------------------------------
    private startDialogue(d: DialoguePayload) {
        this.pendingDialogue = d;
        this.dialogueIndex = 0;
        this.setPhase('DIALOGUE');
        this.touchInput = { left: false, right: false, jump: false, interact: false, spirit: false };
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.player.setVelocity(0, 0);
        this.player.setTexture('chima_idle');
        EventBus.emit(EV.DIALOGUE_START, d);
    }

    private advanceDialogue() {
        if (this.phase !== 'DIALOGUE' || !this.pendingDialogue) return;
        this.safePlay('sfx_button');
        this.dialogueIndex++;
        if (this.dialogueIndex >= this.pendingDialogue.text.length) {
            const done = this.pendingDialogue.onComplete;
            this.pendingDialogue = null;
            this.setPhase('PLAYING');
            if (done === 'pillar-touched') {
                EventBus.emit(EV.SPIRIT_TOGGLED, { active: false, hint: 'Press Q or the Talisman button to see the Spirit World.' });
            }
            if (done === 'bell-rang') {
                this.bellRung = true;
                this.barrier.body!.enable = false;
                this.tweens.add({ targets: this.barrier, alpha: 0, duration: 600 });
                this.thornWalls.forEach((t) => { t.enableBody(false, 0, 0, true, false); });
            }
            if (done === 'shrine-touched') this.triggerClimax();
            if (done === 'mask-spoke') this.triggerEnding();
        }
    }

    // ---------------------------------------------------------------
    // Interactions
    // ---------------------------------------------------------------
    private tryInteract() {
        if (this.phase !== 'PLAYING' || !this.activeInteract) return;
        const { id, kind } = this.activeInteract;
        if (kind === 'dialogue') {
            const d = DIALOGUES[id];
            if (d) this.startDialogue(d);
        } else if (kind === 'bell') {
            if (!this.spiritSight) {
                this.startDialogue({
                    speaker: 'Chima', avatarKey: 'chima',
                    text: ['The bell is there... but I cannot reach it. Only the Spirit World reveals the true path.'],
                });
                return;
            }
            const d = DIALOGUES.bell;
            if (d) this.startDialogue(d);
        }
    }

    // ---------------------------------------------------------------
    // Climax / Ending
    // ---------------------------------------------------------------
    private triggerClimax() {
        if (this.endingStarted) return;
        this.endingStarted = true;
        this.cameras.main.shake(400, 0.008);
        this.cameras.main.fade(800, 0, 0, 0);
        this.time.delayedCall(900, () => {
            this.maskSprite.setVisible(true);
            this.hollowSprite.setVisible(true);
            this.tweens.add({ targets: this.maskSprite, alpha: 1, y: GROUND_TOP - 280, duration: 1800, ease: 'Sine.easeOut' });
            this.tweens.add({ targets: this.hollowSprite, alpha: 0.85, duration: 2400, ease: 'Sine.easeOut' });
            this.tweens.add({ targets: this.maskSprite, y: GROUND_TOP - 268, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            for (let i = 0; i < 20; i++) {
                const e = this.add.image(3100 + Math.random() * 500, GROUND_TOP - Math.random() * 200, 'fx_glow').setAlpha(0).setDepth(9);
                this.tweens.add({ targets: e, alpha: 0.8, y: e.y - 120, duration: 2000 + Math.random() * 2000, delay: i * 120, yoyo: true, repeat: -1 });
            }
            this.time.delayedCall(2400, () => {
                this.startDialogue(DIALOGUES.redmask);
            });
        });
    }

    private triggerEnding() {
        this.cameras.main.fade(1400, 0, 0, 0);
        this.safePlay('sfx_win');
        this.time.delayedCall(1600, () => {
            this.setPhase('VISION_ENDING');
            EventBus.emit(EV.GAME_COMPLETED, { endingNote: ENDING_NOTE });
        });
    }

    // ---------------------------------------------------------------
    // Touch input (from React HUD)
    // ---------------------------------------------------------------
    private onTouchInput(payload: Partial<typeof this.touchInput>) {
        Object.assign(this.touchInput, payload);
        if (payload.interact) this.tryInteract();
        if (payload.spirit) this.toggleSpiritSight();
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    private safePlay(key: string) {
        if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.6 });
    }

    private emitLocation(x: number) {
        let loc: LocationPayload | null = null;
        if (x < 1200) loc = { name: 'The Village of Umueze', subtitle: 'Red earth, thatch smoke, evening drums.' };
        else if (x < 2500) loc = { name: 'The Sacred Forest Path', subtitle: 'The Iroko grove. Even the crickets have gone quiet.' };
        else loc = { name: 'The Ancient Alusi Shrine', subtitle: 'Older than the village. Older than memory.' };
        if (loc && !this.visitedLocations.has(loc.name)) {
            this.visitedLocations.add(loc.name);
            EventBus.emit(EV.LOCATION_ENTERED, loc);
        }
    }

    // ---------------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------------
    update(_time: number, delta: number) {
        // Manual parallax — always active
        const sx = this.cameras.main.scrollX;
        this.hillsFar.x = -sx * 0.85;
        this.hillsMid.x = -sx * 0.6;
        this.fronds.x = -sx * 0.05;

        if (this.phase !== 'PLAYING') {
            this.promptText.setVisible(false);
            // Kill-plane check is consolidated below the phase guard so it can
            // never run during MENU / PAUSED / DIALOGUE transitions.
            return;
        }

        const left = this.keys.A.isDown || this.cursors.left.isDown || this.touchInput.left;
        const right = this.keys.D.isDown || this.cursors.right.isDown || this.touchInput.right;
        const jump = this.keys.W.isDown || this.cursors.up.isDown || this.keys.SPACE.isDown || this.touchInput.jump;
        const onGround = this.player.body!.blocked.down;

        // Strict horizontal velocity resolution: zero out when neither or both
        // horizontal inputs are active so the player can never coast.
        const isMovingHoriz = (left && !right) || (right && !left);
        if (left && !right) {
            this.player.setVelocityX(-MOVE_SPEED);
            this.player.setFlipX(true);
        } else if (right && !left) {
            this.player.setVelocityX(MOVE_SPEED);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        if (jump && onGround) {
            this.player.setVelocityY(JUMP_VELOCITY);
            this.safePlay('sfx_jump');
        }

        // Animation state — walk cycle only plays when grounded AND actually
        // moving horizontally (velocity magnitude > 10). Idle is restored
        // immediately when horizontal motion ceases.
        if (!onGround) {
            this.player.setTexture('chima_jump');
            this.walkTimer = 0;
            this.walkFrame = 0;
        } else if (isMovingHoriz && Math.abs(this.player.body!.velocity.x) > 10) {
            this.walkTimer += delta;
            if (this.walkTimer >= 110) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
            }
            this.player.setTexture('chima_walk' + this.walkFrame);
        } else {
            this.walkFrame = 0;
            this.walkTimer = 0;
            this.player.setTexture('chima_idle');
        }

        // Kill plane — fell into the chasm (consolidated into update() so no
        // redundant scene event listener can stack and cause respawn loops).
        if (this.player.y > WORLD_H + 60) {
            this.respawnPlayer();
        }

        // Q / Shift toggles spirit sight (edge-triggered)
        if (Input.Keyboard.JustDown(this.keys.Q) || Input.Keyboard.JustDown(this.keys.SHIFT)) {
            this.toggleSpiritSight();
        }
        // E interact
        if (Input.Keyboard.JustDown(this.keys.E)) {
            this.tryInteract();
        }

        // Proximity to interactables
        let nearest: (InteractTarget & { dist: number }) | null = null;
        for (const s of this.interactables) {
            if (!s.visible && s !== this.bellSprite) continue;
            if (s === this.bellSprite && !this.spiritSight) continue;
            const d = Math.hypot(this.player.x - s.x, this.player.y - s.y);
            if (d < 80 && (!nearest || d < nearest.dist)) {
                nearest = { id: s.getData('id'), label: s.getData('label'), kind: s.getData('kind'), dist: d };
            }
        }
        this.activeInteract = nearest ? { id: nearest.id, label: nearest.label, kind: nearest.kind } : null;
        if (this.activeInteract) {
            this.promptText.setText(`[E] ${this.activeInteract.label}`);
            this.promptText.setPosition(this.player.x, this.player.y - 60);
            this.promptText.setVisible(true);
        } else {
            this.promptText.setVisible(false);
        }

        // Checkpoints + location banners
        if (this.player.x > 2450) this.checkpointX = 2450;
        else if (this.player.x > 1150) this.checkpointX = 1150;
        else this.checkpointX = 120;
        this.emitLocation(this.player.x);
    }
}

export default StartGame;