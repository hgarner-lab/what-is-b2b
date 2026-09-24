import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { sound } from '../../audio/sound';
import { EndCard, ReadyGo, Toast } from '../../components/ui';
import { copy } from '../../content/copy';
import { useCoarsePointer, useMotionReduced } from '../../hooks/usePrefs';
import { block, ghostBlock } from '../../pixel/art';
import { AWARENESS_ONLY_MESSAGE, BLOCK, BLOCKS, type BlockType } from './blocks';
import {
  COLS,
  ROWS,
  cellsOf,
  collides,
  dropDistance,
  emptyBoard,
  fullRows,
  makeRandomiser,
  merge,
  openingBoard,
  removeRows,
  shapeOf,
  spawn,
  tryRotate,
  type Board,
  type Piece,
} from './engine';
import './level2.css';

type Phase = 'title' | 'play' | 'finishing' | 'end';

const L2 = copy.level2;
const GRAVITY_MS = 720; // forgiving on purpose
const CLEAR_MS = 360;
const HELP_AFTER_MS = 40_000; // start feeding the missing steps harder
const WRAP_UP_AFTER_MS = 80_000; // never let the level drag on
const LINE_CALLS = ['', 'Line!', '2 lines!', '3 lines!', '4 lines!!'];

const cellStyle = (type: BlockType): CSSProperties => ({
  backgroundImage: `url("${block(BLOCK[type].color)}")`,
  color: BLOCK[type].ink,
});

export function LevelTwoFunnelBlocks({
  onComplete,
  onNext,
}: {
  onComplete: () => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('title');
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const [call, setCall] = useState<{ text: string; id: number } | null>(null);
  const [shake, setShake] = useState(0);
  const [, render] = useReducer((x: number) => x + 1, 0);
  const coarse = useCoarsePointer();
  const reduced = useMotionReduced();

  const nextPick = useRef(makeRandomiser());
  const g = useRef({
    board: openingBoard() as Board,
    piece: null as Piece | null,
    next: null as BlockType | null,
    lastType: null as BlockType | null,
    lit: new Set<BlockType>(),
    justLit: null as BlockType | null,
    clearing: [] as number[],
    seq: 0,
    playStart: 0,
    lastFall: 0,
    busy: false,
  });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const timers = useRef(new Set<number>());
  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);
  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((id) => window.clearTimeout(id));
      set.clear();
    };
  }, []);

  const say = useCallback(
    (text: string) => {
      const id = Date.now();
      setToast({ text, id });
      later(3000, () => setToast((t) => (t?.id === id ? null : t)));
    },
    [later],
  );

  /* ---- Core actions ---- */

  const finish = useCallback(() => {
    if (phaseRef.current !== 'play') return;
    g.current.piece = null;
    setPhase('finishing');
    sound.success();
    later(1500, () => {
      setPhase('end');
      onCompleteRef.current();
    });
  }, [later]);

  const spawnNext = useCallback(() => {
    const s = g.current;
    const urgent = performance.now() - s.playStart > HELP_AFTER_MS;
    const type = s.next ?? nextPick.current(s.lit, urgent);
    s.next = nextPick.current(s.lit, urgent);
    const piece = spawn(type, ++s.seq);
    s.lastType = type;
    if (collides(s.board, piece)) {
      // Stack reached the top. No game over: just make room and carry on.
      s.board = emptyBoard();
      say(L2.rescue);
      sound.uhoh();
    }
    s.piece = piece;
    s.lastFall = performance.now();
    render();
  }, [say]);

  const lightUp = useCallback(
    (rowsTypes: BlockType[][]) => {
      const s = g.current;
      const before = new Set(s.lit);
      rowsTypes.flat().forEach((t) => s.lit.add(t));
      const fresh = BLOCKS.filter((b) => s.lit.has(b.type) && !before.has(b.type));

      const awarenessOnly = rowsTypes.some((types) => types.every((t) => t === 'awareness'));
      if (fresh.length) {
        const furthest = fresh[fresh.length - 1];
        s.justLit = furthest.type;
        later(250, () => sound.milestone());
        say(awarenessOnly && furthest.type === 'awareness' ? AWARENESS_ONLY_MESSAGE : furthest.message);
      } else {
        const missing = BLOCKS.find((b) => !s.lit.has(b.type));
        if (awarenessOnly) say(AWARENESS_ONLY_MESSAGE);
        else if (missing) say(`Still missing: ${missing.stage.toLowerCase()}.`);
      }
      return s.lit.size === BLOCKS.length;
    },
    [later, say],
  );

  const lock = useCallback(() => {
    const s = g.current;
    if (!s.piece) return;
    s.board = merge(s.board, s.piece);
    s.piece = null;
    sound.land();
    const rows = fullRows(s.board);
    if (!rows.length) {
      spawnNext();
      return;
    }
    s.clearing = rows;
    s.busy = true;
    sound.lineClear();
    setCall({ text: LINE_CALLS[Math.min(rows.length, 4)], id: Date.now() });
    if (rows.length > 1) setShake((n) => n + 1);
    const rowsTypes = rows.map((r) => [...new Set(s.board[r].map((c) => c!.type))]);
    const allLit = lightUp(rowsTypes);
    render();
    later(CLEAR_MS, () => {
      s.board = removeRows(s.board, rows);
      s.clearing = [];
      s.busy = false;
      if (allLit) {
        render();
        finish();
      } else {
        spawnNext();
      }
    });
  }, [finish, later, lightUp, spawnNext]);

  const act = useCallback(
    (action: 'left' | 'right' | 'rotate' | 'down' | 'drop') => {
      const s = g.current;
      if (phaseRef.current !== 'play' || !s.piece || s.busy) return;
      const p = s.piece;
      if (action === 'left' || action === 'right') {
        const next = { ...p, x: p.x + (action === 'left' ? -1 : 1) };
        if (!collides(s.board, next)) {
          s.piece = next;
          sound.tick();
        }
      } else if (action === 'rotate') {
        const next = tryRotate(s.board, p);
        if (next) {
          s.piece = next;
          sound.rotate();
        }
      } else if (action === 'down') {
        const next = { ...p, y: p.y + 1 };
        if (collides(s.board, next)) lock();
        else {
          s.piece = next;
          s.lastFall = performance.now();
        }
      } else if (action === 'drop') {
        s.piece = { ...p, y: p.y + dropDistance(s.board, p) };
        lock();
        return;
      }
      render();
    },
    [lock],
  );

  /* ---- Start + game loop ---- */
  useEffect(() => {
    if (phase !== 'play') return;
    const s = g.current;
    s.playStart = performance.now();
    if (!s.piece) spawnNext();

    let raf = 0;
    let wrapping = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (s.busy || !s.piece) return;
      if (now - s.lastFall >= GRAVITY_MS) {
        s.lastFall = now;
        act('down');
      }
      // Safety net: if it's taking a long time, finish the journey for them.
      if (!wrapping && now - s.playStart > WRAP_UP_AFTER_MS) {
        wrapping = true;
        const missing = BLOCKS.filter((b) => !s.lit.has(b.type));
        say('You get the idea. Let’s fill in the rest.');
        missing.forEach((b, i) =>
          later(350 * (i + 1), () => {
            s.lit.add(b.type);
            s.justLit = b.type;
            sound.milestone();
            render();
          }),
        );
        later(350 * (missing.length + 1), finish);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, act, spawnNext, finish, later, say]);

  /* ---- Keyboard ---- */
  useEffect(() => {
    if (phase !== 'play') return;
    const map: Record<string, Parameters<typeof act>[0]> = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      ArrowUp: 'rotate',
      KeyW: 'rotate',
      KeyX: 'rotate',
      KeyZ: 'rotate',
      ArrowDown: 'down',
      KeyS: 'down',
      Space: 'drop',
    };
    const onKey = (e: KeyboardEvent) => {
      const a = map[e.code];
      if (!a) return;
      // Let Space/Enter work normally on focused buttons.
      if (e.code === 'Space' && (e.target as HTMLElement)?.closest?.('button')) return;
      e.preventDefault();
      act(a);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, act]);

  /* ---- Touch / mouse gestures on the board ---- */
  const gesture = useRef<{ x: number; y: number; t: number; moved: number; cell: number } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    sound.unlock();
    const rect = e.currentTarget.getBoundingClientRect();
    gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, cell: rect.width / COLS };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const gs = gesture.current;
    if (!gs) return;
    const steps = Math.trunc((e.clientX - gs.x) / gs.cell);
    while (gs.moved < steps) {
      act('right');
      gs.moved++;
    }
    while (gs.moved > steps) {
      act('left');
      gs.moved--;
    }
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const gs = gesture.current;
    gesture.current = null;
    if (!gs) return;
    const dx = e.clientX - gs.x;
    const dy = e.clientY - gs.y;
    const dt = performance.now() - gs.t;
    if (dy > gs.cell * 2 && Math.abs(dy) > Math.abs(dx)) act('drop');
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350) act('rotate');
  };

  /* ---- Render ---- */
  const s = g.current;
  const current = s.piece ? BLOCK[s.piece.type] : null;
  const shown = current ?? (s.lastType ? BLOCK[s.lastType] : null); // keep the card filled between pieces

  const view: ({ type: BlockType; live: boolean } | null)[][] = s.board.map((row) =>
    row.map((c) => (c ? { type: c.type, live: false } : null)),
  );
  const ghost = new Set<string>();
  if (s.piece) {
    const d = dropDistance(s.board, s.piece);
    cellsOf({ ...s.piece, y: s.piece.y + d }).forEach(([r, c]) => ghost.add(`${r}:${c}`));
    cellsOf(s.piece).forEach(([r, c]) => {
      if (r >= 0) view[r][c] = { type: s.piece!.type, live: true };
    });
  }

  if (phase === 'end') {
    return (
      <div className="screen l2 l2--end">
        <div className="center-stack">
          <EndCard headline={L2.endHeadline} score={L2.endScore} cta={L2.cta} tease={L2.tease} onNext={onNext}>
            <ol className="journey-reveal" aria-label="The commercial journey">
              {L2.endJourney.map((step, i) => (
                <li key={step} className="px-panel" style={{ animationDelay: `${500 + i * 110}ms` }}>
                  {step}
                </li>
              ))}
            </ol>
            <p className="lede">{L2.endBody}</p>
          </EndCard>
        </div>
      </div>
    );
  }

  return (
    <div className="screen l2">
      {phase === 'title' && <ReadyGo number={L2.number} title={L2.title} onDone={() => setPhase('play')} />}

      <div className="l2__layout">
        <aside className="l2__side l2__side--left">
          <p className="l2__setup">{L2.setup}</p>
          <div className="now px-panel" aria-live="polite">
            <span className="eyebrow">{L2.nowLabel}</span>
            {shown && (
              <div className="now__card" key={shown.type + (s.piece?.id ?? '')}>
                <MiniPiece type={shown.type} />
                <span className="now__name">{shown.name}</span>
                <span className="now__what">{shown.what}</span>
              </div>
            )}
          </div>
          <Toast message={toast?.text ?? null} id={toast?.id ?? 0} />
          {!coarse && <p className="l2__keys">{L2.controlsKeys}</p>}
        </aside>

        <div className="l2__center">
          <p className="l2__hint arcade">
            <span className="blink">▶ {L2.hint}</span>
          </p>
          <div className="well-wrap" key={shake}>
            <div
              className={`well ${phase === 'finishing' ? 'is-done' : ''} ${shake && !reduced ? 'shake' : ''}`}
              style={{ ['--cols' as string]: COLS, ['--rows' as string]: ROWS }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (gesture.current = null)}
              role="application"
              aria-label="Block stacking board. Use arrow keys to move and rotate, space to drop."
            >
              {view.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r}:${c}`;
                  if (cell) {
                    const clearing = s.clearing.includes(r);
                    return (
                      <div
                        key={key}
                        className={`cell cell--filled ${cell.live ? 'cell--live' : ''} ${clearing ? 'cell--clearing' : ''}`}
                        style={cellStyle(cell.type)}
                      >
                        {BLOCK[cell.type].code}
                      </div>
                    );
                  }
                  const isGhost = ghost.has(key) && current;
                  return (
                    <div
                      key={key}
                      className={`cell ${isGhost ? 'cell--ghost' : ''}`}
                      style={isGhost ? { backgroundImage: `url("${ghostBlock(current.color)}")` } : undefined}
                    />
                  );
                }),
              )}
            </div>
            {call && (
              <p className="l2__call arcade" key={call.id} aria-hidden="true">
                {call.text}
              </p>
            )}
          </div>

          {coarse && (
            <div className="pad" aria-label="Controls">
              <PadButton label="Move left" onPress={() => act('left')} repeat>
                ◀
              </PadButton>
              <PadButton label="Rotate" onPress={() => act('rotate')}>
                ⟳
              </PadButton>
              <PadButton label="Move right" onPress={() => act('right')} repeat>
                ▶
              </PadButton>
              <PadButton label="Drop" onPress={() => act('drop')} wide>
                Drop
              </PadButton>
            </div>
          )}
        </div>

        <aside className="l2__side l2__side--right">
          <div className="nextbox px-panel">
            <span className="eyebrow">Next</span>
            {s.next && <MiniPiece type={s.next} />}
          </div>
          <div className="journey-box px-panel">
            <span className="eyebrow">{L2.journeyLabel}</span>
            <ol className="journey">
              {BLOCKS.map((b) => {
                const lit = s.lit.has(b.type);
                return (
                  <li
                    key={b.type}
                    className={`journey__step ${lit ? 'is-lit' : ''} ${s.justLit === b.type ? 'is-new' : ''}`}
                  >
                    <span className="journey__chip" style={lit ? cellStyle(b.type) : undefined}>
                      {b.code}
                    </span>
                    <span className="journey__text">
                      <span className="journey__stage">{b.stage}</span>
                      <span className="journey__means">{b.stageMeans}</span>
                    </span>
                    <span className="journey__state arcade">
                      {lit ? '✓' : ''}
                      <span className="sr-only">{lit ? 'reached' : 'not yet'}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** A small drawing of a piece's shape, for the Now and Next boxes. */
function MiniPiece({ type }: { type: BlockType }) {
  const shape = shapeOf(type);
  return (
    <span
      className="mini"
      style={{ gridTemplateColumns: `repeat(${shape[0].length}, var(--mini))` }}
      aria-label={BLOCK[type].name}
      role="img"
    >
      {shape.flatMap((row, r) =>
        row.map((v, c) => <span key={`${r}-${c}`} className="mini__cell" style={v ? cellStyle(type) : undefined} />),
      )}
    </span>
  );
}

function PadButton({
  children,
  label,
  onPress,
  repeat,
  wide,
}: {
  children: ReactNode;
  label: string;
  onPress: () => void;
  repeat?: boolean;
  wide?: boolean;
}) {
  const timer = useRef<number | null>(null);
  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  return (
    <button
      type="button"
      className={`pbtn pad__btn ${wide ? 'pbtn--coin pad__btn--wide' : 'pbtn--ghost'}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        sound.unlock();
        onPress();
        if (repeat) {
          stop();
          timer.current = window.setInterval(onPress, 140);
        }
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPress();
      }}
    >
      {children}
    </button>
  );
}
