// The one channel between React (App.tsx) and Phaser. Event names live in EV (utils.ts).
import { Events } from 'phaser';

export const EventBus = new Events.EventEmitter();
