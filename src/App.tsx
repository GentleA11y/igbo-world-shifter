import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import StartGame, { EventBus } from './game/main';
import {
    EV, ENDING_NOTE, GLOSSARY,
    type GamePhase, type DialoguePayload, type ItemPayload, type LocationPayload,
} from './game/utils';

interface DialogueState {
    speaker: string;
    avatarKey: string;
    lines: string[];
    index: number;
}

function Avatar({ k }: { k: string }) {
    const base: React.CSSProperties = {
        width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid rgba(232,178,58,0.7)', background: '#241018',
    };
    if (k === 'chima') return (
        <div style={{ ...base, background: 'radial-gradient(circle at 40% 35%, #6E4122, #3A1E0C)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#E8B23A" strokeWidth="2">
                <circle cx="12" cy="8" r="4" /><path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
            </svg>
        </div>
    );
    if (k === 'mbe') return (
        <div style={{ ...base, background: 'radial-gradient(circle at 40% 35%, #7A5223, #2A1B0C)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8B23A" strokeWidth="2">
                <path d="M4 14a8 6 0 0 1 16 0" /><path d="M4 14h16" /><circle cx="20" cy="12" r="2" />
            </svg>
        </div>
    );
    if (k === 'mask') return (
        <div style={{ ...base, background: 'radial-gradient(circle at 40% 35%, #B0201A, #3A0A0A)', border: '2px solid #F7B32B' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F2EFE6" strokeWidth="2">
                <path d="M12 3c5 0 7 3 7 7 0 6-4 11-7 11S5 16 5 10c0-4 2-7 7-7z" />
                <circle cx="9.5" cy="10" r="1" fill="#F7B32B" /><circle cx="14.5" cy="10" r="1" fill="#F7B32B" />
            </svg>
        </div>
    );
    return (
        <div style={{ ...base, background: 'radial-gradient(circle at 40% 35%, #3A1B5E, #12081F)', border: '2px solid #4DF2D6' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4DF2D6" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1" />
            </svg>
        </div>
    );
}

function Icon({ name }: { name: string }) {
    const p: React.SVGProps<SVGSVGElement> = {
        width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    };
    switch (name) {
        case 'shell': return (<svg {...p}><path d="M12 3c5 0 8 4 8 9s-4 9-8 9-8-4-8-9 3-9 8-9z" /><path d="M9 8h6M8 12h8M9 16h6" /></svg>);
        case 'staff': return (<svg {...p}><path d="M12 3v18" /><circle cx="12" cy="6" r="3" /><path d="M9 12h6M9 16h6" /></svg>);
        case 'kola': return (<svg {...p}><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="6" rx="3" ry="4" /><ellipse cx="17" cy="10" rx="3" ry="4" /><ellipse cx="15" cy="16" rx="3" ry="4" /><ellipse cx="9" cy="16" rx="3" ry="4" /><ellipse cx="7" cy="10" rx="3" ry="4" /></svg>);
        default: return null;
    }
}

export default function App() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phaserRef = useRef<any>(null);
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [dialogue, setDialogue] = useState<DialogueState | null>(null);
    const [items, setItems] = useState<ItemPayload[]>([]);
    const [spirit, setSpirit] = useState(false);
    const [location, setLocation] = useState<LocationPayload | null>(null);
    const [endingNote, setEndingNote] = useState(ENDING_NOTE);
    const [muted, setMuted] = useState(false);
    const [showJournal, setShowJournal] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [typed, setTyped] = useState('');
    const touchRef = useRef({ left: false, right: false, jump: false });

    // Mount Phaser exactly once — DO NOT remove this bridge.
    useLayoutEffect(() => {
        if (phaserRef.current === null) {
            const game = StartGame('game-container');
            phaserRef.current = { game, scene: null };
        }
        const handler = (scene: unknown) => {
            if (phaserRef.current) phaserRef.current.scene = scene;
        };
        EventBus.on(EV.SCENE_READY, handler);
        return () => {
            EventBus.removeListener(EV.SCENE_READY, handler);
            if (phaserRef.current) {
                phaserRef.current.game?.destroy(true);
                phaserRef.current = null;
            }
        };
    }, []);

    // EventBus subscriptions
    useEffect(() => {
        const onPhase = (p: GamePhase) => setPhase(p);
        const onDialogue = (d: DialoguePayload) => {
            setDialogue({ speaker: d.speaker, avatarKey: d.avatarKey, lines: d.text, index: 0 });
        };
        const onItem = (it: ItemPayload) => setItems(prev => (prev.some(i => i.id === it.id) ? prev : [...prev, it]));
        const onSpirit = (payload: { active: boolean; hint?: string }) => {
            setSpirit(payload.active);
            if (payload.hint) { setHint(payload.hint); window.setTimeout(() => setHint(null), 6000); }
        };
        const onLocation = (loc: LocationPayload) => { setLocation(loc); window.setTimeout(() => setLocation(null), 4200); };
        const onCompleted = (payload: { endingNote: string }) => setEndingNote(payload.endingNote);

        EventBus.on(EV.PHASE_CHANGED, onPhase);
        EventBus.on(EV.DIALOGUE_START, onDialogue);
        EventBus.on(EV.ITEM_COLLECTED, onItem);
        EventBus.on(EV.SPIRIT_TOGGLED, onSpirit);
        EventBus.on(EV.LOCATION_ENTERED, onLocation);
        EventBus.on(EV.GAME_COMPLETED, onCompleted);
        return () => {
            EventBus.removeListener(EV.PHASE_CHANGED, onPhase);
            EventBus.removeListener(EV.DIALOGUE_START, onDialogue);
            EventBus.removeListener(EV.ITEM_COLLECTED, onItem);
            EventBus.removeListener(EV.SPIRIT_TOGGLED, onSpirit);
            EventBus.removeListener(EV.LOCATION_ENTERED, onLocation);
            EventBus.removeListener(EV.GAME_COMPLETED, onCompleted);
        };
    }, []);

    // Typewriter for dialogue
    useEffect(() => {
        if (!dialogue) { setTyped(''); return; }
        const line = dialogue.lines[dialogue.index] ?? '';
        setTyped('');
        let i = 0;
        const id = window.setInterval(() => {
            i += 2;
            setTyped(line.slice(0, i));
            if (i >= line.length) window.clearInterval(id);
        }, 18);
        return () => window.clearInterval(id);
    }, [dialogue?.index, dialogue?.speaker]);

    const advance = () => EventBus.emit(EV.DIALOGUE_ADVANCE);
    const begin = () => EventBus.emit('begin-journey');
    const togglePause = () => EventBus.emit(EV.TOGGLE_PAUSE);
    const restart = () => { setItems([]); setDialogue(null); EventBus.emit(EV.RESTART_GAME); };
    const toggleSpirit = () => EventBus.emit('spirit-toggle');
    const toggleMute = () => {
        setMuted(m => {
            const g = phaserRef.current?.game;
            if (g) g.sound.mute = !m;
            return !m;
        });
    };

    // Keyboard: Space/Enter advance dialogue (ESC handled in scene)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (phase === 'DIALOGUE' && (e.code === 'Space' || e.code === 'Enter')) {
                e.preventDefault();
                advance();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [phase]);

    const setTouch = (k: 'left' | 'right' | 'jump', v: boolean) => {
        touchRef.current[k] = v;
        EventBus.emit('touch-input', { ...touchRef.current });
    };

    const playing = phase === 'PLAYING' || phase === 'DIALOGUE' || phase === 'PAUSED';
    const dialogueLine = dialogue ? (typed || dialogue.lines[dialogue.index] || '') : '';

    return (
        <div id="app">
            <div id="game-container"></div>

            <div id="hud">
                {/* ============ MENU ============ */}
                {phase === 'MENU' && (
                    <div className="screen menu-screen">
                        <div className="uli-band" />
                        <h1 className="game-title">Echoes of the Ancestors</h1>
                        <p className="folklore-quote">
                            &ldquo;Until the lion learns how to write, every story will
                            glorify the hunter.&rdquo;
                        </p>
                        <p className="menu-sub">
                            A 2D narrative adventure through the village of Umueze and the
                            sacred Iroko grove. Walk, speak, gather relics, and awaken
                            <em> Spirit Sight</em> to see what the living have forgotten.
                        </p>
                        <button className="btn btn-primary" onClick={begin}>Begin Journey</button>
                        <div className="controls-card">
                            <h3>Controls</h3>
                            <div className="controls-grid">
                                <span><kbd>A</kbd><kbd>D</kbd> / <kbd>&larr;</kbd><kbd>&rarr;</kbd> Walk</span>
                                <span><kbd>W</kbd> / <kbd>Space</kbd> Jump</span>
                                <span><kbd>E</kbd> Interact</span>
                                <span><kbd>Q</kbd> Spirit Sight</span>
                                <span><kbd>Esc</kbd> Pause</span>
                                <span>Touch controls on mobile</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ HUD (playing) ============ */}
                {playing && (
                    <>
                        <div className="topbar">
                            <div className="amulet" data-spirit={spirit ? 'true' : 'false'} onClick={toggleSpirit} title="Toggle Spirit Sight (Q)">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                                </svg>
                                <span>{spirit ? 'Spirit World' : 'Living World'} <kbd>Q</kbd></span>
                            </div>
                            <div className="spacer" />
                            <button className="icon-btn" onClick={() => setShowJournal(j => !j)} title="Quest journal">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z" /><path d="M9 7h6M9 11h6" />
                                </svg>
                            </button>
                            <button className="icon-btn" onClick={toggleMute} title="Mute">
                                {muted ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 5 6 9H3v6h3l5 4z" /><path d="M22 9l-6 6M16 9l6 6" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                                    </svg>
                                )}
                            </button>
                            <button className="icon-btn" onClick={togglePause} title="Pause (Esc)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 5v14M15 5v14" />
                                </svg>
                            </button>
                        </div>

                        <div className="inv-bar">
                            <h4>Relics</h4>
                            {items.length === 0 && <p className="inv-empty">None yet — explore and gather.</p>}
                            {items.map(it => (
                                <div key={it.id} className="inv-item" title={it.description}>
                                    <Icon name={it.icon} />
                                    <span>{it.name}</span>
                                </div>
                            ))}
                        </div>

                        {location && (
                            <div className="loc-banner">
                                <h2>{location.name}</h2>
                                <p>{location.subtitle}</p>
                            </div>
                        )}

                        {hint && <div className="hint-banner">{hint}</div>}

                        {/* Dialogue box */}
                        {phase === 'DIALOGUE' && dialogue && (
                            <div className="dialogue-box" onClick={advance}>
                                <Avatar k={dialogue.avatarKey} />
                                <div className="dlg-body">
                                    <div className="dlg-speaker">{dialogue.speaker}</div>
                                    <div className="dlg-text">{dialogueLine}<span className="caret" /></div>
                                </div>
                                <div className="dlg-next">
                                    <span>Space / Tap</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Touch controls */}
                        <div className="touch-controls">
                            <div className="tc-left">
                                <button
                                    className="tc-btn"
                                    onPointerDown={() => setTouch('left', true)}
                                    onPointerUp={() => setTouch('left', false)}
                                    onPointerLeave={() => setTouch('left', false)}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
                                </button>
                                <button
                                    className="tc-btn"
                                    onPointerDown={() => setTouch('right', true)}
                                    onPointerUp={() => setTouch('right', false)}
                                    onPointerLeave={() => setTouch('right', false)}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                                </button>
                            </div>
                            <div className="tc-right">
                                <button className="tc-btn tc-jump" onPointerDown={() => setTouch('jump', true)} onPointerUp={() => setTouch('jump', false)} onPointerLeave={() => setTouch('jump', false)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                                </button>
                                <button className="tc-btn" onClick={toggleSpirit} title="Spirit Sight">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>
                                </button>
                                <button className="tc-btn" onClick={() => EventBus.emit('interact')}>
                                    <span style={{ fontWeight: 700 }}>E</span>
                                </button>
                            </div>
                        </div>

                        {/* Pause overlay */}
                        {phase === 'PAUSED' && (
                            <div className="screen pause-screen">
                                <div className="panel">
                                    <h2>Journey Paused</h2>
                                    <p className="pause-sub">The grove waits. The ancestors are patient.</p>
                                    <div className="journal-list">
                                        <h3>Relics Gathered</h3>
                                        {items.length === 0 && <p>None yet.</p>}
                                        {items.map(it => <p key={it.id}><Icon name={it.icon} /> {it.name} — <em>{it.description}</em></p>)}
                                        <h3>Current Task</h3>
                                        <p>Follow Mbe&rsquo;s counsel: reach the Ancient Alusi Shrine beyond the Sacred Iroko Grove.</p>
                                    </div>
                                    <div className="btn-row">
                                        <button className="btn btn-primary" onClick={togglePause}>Resume</button>
                                        <button className="btn" onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
                                        <button className="btn" onClick={restart}>Restart</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Journal quick-view */}
                        {showJournal && phase !== 'PAUSED' && (
                            <div className="screen journal-screen" onClick={() => setShowJournal(false)}>
                                <div className="panel" onClick={e => e.stopPropagation()}>
                                    <h2>Quest Journal</h2>
                                    <div className="journal-list">
                                        <h3>Relics Gathered</h3>
                                        {items.length === 0 && <p>None yet — explore the village and grove.</p>}
                                        {items.map(it => <p key={it.id}><Icon name={it.icon} /> {it.name} — <em>{it.description}</em></p>)}
                                        <h3>Folklore Glossary</h3>
                                        {GLOSSARY.map(g => <p key={g.term}><strong>{g.term}</strong> — {g.def}</p>)}
                                    </div>
                                    <button className="btn" onClick={() => setShowJournal(false)}>Close</button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ============ ENDING ============ */}
                {(phase === 'VISION_ENDING' || phase === 'FINISHED') && (
                    <div className="screen ending-screen">
                        <div className="ending-embers" />
                        <h1 className="ending-title">{endingNote}</h1>
                        <p className="ending-sub">
                            Chima returns to Umueze carrying the vision of the Hollow Man.
                            The prototype&rsquo;s journey ends — the story is just waking.
                        </p>
                        <div className="panel glossary-panel">
                            <h3>Folklore Glossary</h3>
                            {GLOSSARY.map(g => <p key={g.term}><strong>{g.term}</strong> — {g.def}</p>)}
                        </div>
                        <div className="btn-row">
                            <button className="btn btn-primary" onClick={restart}>Walk the Path Again</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}