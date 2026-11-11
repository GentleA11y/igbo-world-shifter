// ---------------------------------------------------------------------------
// Chima: movement, jumping and walk animation.
//
// Jump feel:
// - Coyote time: you can still jump for a moment after running off an edge.
// - Jump buffer: a jump pressed just before landing still happens on landing.
// - Variable height: let go of jump early for a shorter hop.
// ---------------------------------------------------------------------------
import type { Scene } from 'phaser';
import { JUMP_VELOCITY, MOVE_SPEED } from '../utils';

const COYOTE_MS = 80;
const JUMP_BUFFER_MS = 120;
/** Upward speed is multiplied by this when jump is released early. */
const JUMP_CUT = 0.45;
const WALK_FRAME_MS = 110;

export class PlayerController {
    readonly sprite: Phaser.Physics.Arcade.Sprite;
    /** Held state of the on-screen touch buttons. */
    readonly touch = { left: false, right: false, jump: false };
    /** Called when a jump starts (for sound). */
    onJump?: () => void;

    private keys: Record<'A' | 'D' | 'W' | 'SPACE', Phaser.Input.Keyboard.Key>;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private coyoteMs = 0;
    private bufferMs = 0;
    private rising = false;
    private prevJumpHeld = true;
    private walkFrame = 0;
    private walkTimer = 0;

    constructor(scene: Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'chima_idle');
        this.sprite.setCollideWorldBounds(true);
        this.sprite.body!.setSize(28, 56);
        this.sprite.body!.setOffset(8, 8);
        this.sprite.setDepth(10);

        const kb = scene.input.keyboard!;
        this.keys = kb.addKeys('A,D,W,SPACE') as PlayerController['keys'];
        this.cursors = kb.createCursorKeys();
    }

    get body() { return this.sprite.body as Phaser.Physics.Arcade.Body; }
    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }

    update(delta: number) {
        const left = this.keys.A.isDown || this.cursors.left.isDown || this.touch.left;
        const right = this.keys.D.isDown || this.cursors.right.isDown || this.touch.right;
        const jumpHeld = this.keys.W.isDown || this.cursors.up.isDown || this.keys.SPACE.isDown || this.touch.jump;
        const onGround = this.body.blocked.down;

        // Horizontal: no coasting when neither or both directions are held.
        const dir = (right ? 1 : 0) - (left ? 1 : 0);
        this.sprite.setVelocityX(dir * MOVE_SPEED);
        if (dir !== 0) this.sprite.setFlipX(dir < 0);

        // Jump timers
        if (jumpHeld && !this.prevJumpHeld) this.bufferMs = JUMP_BUFFER_MS;
        else this.bufferMs = Math.max(0, this.bufferMs - delta);
        this.prevJumpHeld = jumpHeld;
        this.coyoteMs = onGround ? COYOTE_MS : Math.max(0, this.coyoteMs - delta);

        if (this.bufferMs > 0 && this.coyoteMs > 0) {
            this.sprite.setVelocityY(JUMP_VELOCITY);
            this.bufferMs = 0;
            this.coyoteMs = 0;
            this.rising = true;
            this.onJump?.();
        }
        if (this.rising && !jumpHeld && this.body.velocity.y < 0) {
            this.sprite.setVelocityY(this.body.velocity.y * JUMP_CUT);
            this.rising = false;
        }
        if (this.body.velocity.y >= 0) this.rising = false;

        // Animation
        if (!onGround) {
            this.sprite.setTexture('chima_jump');
            this.walkFrame = 0;
            this.walkTimer = 0;
        } else if (dir !== 0) {
            this.walkTimer += delta;
            if (this.walkTimer >= WALK_FRAME_MS) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
            }
            this.sprite.setTexture('chima_walk' + this.walkFrame);
        } else {
            this.idle();
        }
    }

    /** Stop moving and stand still (dialogue, pause, respawn). */
    freeze() {
        this.touch.left = this.touch.right = this.touch.jump = false;
        this.sprite.setVelocity(0, 0);
        this.idle();
        // Require a fresh jump press afterwards (Space also advances dialogue).
        this.prevJumpHeld = true;
        this.bufferMs = 0;
        this.rising = false;
    }

    respawn(x: number, y: number) {
        this.sprite.setPosition(x, y);
        this.freeze();
    }

    private idle() {
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.sprite.setTexture('chima_idle');
    }
}
