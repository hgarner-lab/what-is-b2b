import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent } from 'react';
import { sound } from '../audio/sound';
import { GameOver, Hud, ReadyGo, Toast } from '../components/ui';
import { copy } from '../content/copy';
import { useCoarsePointer, useMotionReduced } from '../hooks/usePrefs';
import { ghostBlock } from '../pixel/art';
import { BLOCK, BLOCKS, type BlockType } from '../levels/level2/blocks';
import {
  COLS,
  ROWS,
  cellsOf,
  collides,
  dropDistance,
  emptyBoard,
  fullRows,
  merge,
  removeRows,
  spawn,
  tryRotate,
  type Board,
  type Piece,
} from '../levels/level2/engine';
import { LINE_CALLS, MiniPiece, PadButton, cellStyle } from '../levels/level2/LevelTwoFunnelBlocks';
import { formatScore, getBest } from './progress';
import '../levels/level2/level2.css';
import './freeplay.css';

const GAME = 1;
const F = copy.freePlay;
const G = F.games[GAME];
const CLEAR_MS = 320;
const LINE_POINTS = [0, 100, 300, 500, 800];
/** A line with at least this many kinds of marketing scores double. */
const FULL_FUNNEL = 5;

const gravityFor = (level: number) => Math.max(70, 760 * Math.pow(0.82, level - 1));

/** Classic "bag" randomiser: all seven shapes in random order, then again. */
function makeBag() {
  let bag: BlockType[] = [];
  return (): BlockType => {
    if (!bag.length) bag = BLOCKS.map((b) => b.type).sort(() => Math.random() - 0.5);
    return bag.pop()!;
  };
}

type State = {
  board: Board;
  piece: Piece | null;
  next: BlockType;
  clearing: number[];
  seq: number;
  lastFall: number;
  busy: boolean;
  score: number;
  lines: number;
  level: number;
  over: boolean;
};

function freshState(draw: () => BlockType): State {
  return {
    board: emptyBoard(),
    piece: null,
    next: draw(),
    clearing: [],
    seq: 0,
    lastFall: 0,
    busy: false,
    score: 0,
    lines: 0,
    level: 1,
    over: false,
  };
}

export function EndlessBlocks({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [round, setRound] = useState(0);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const [call, setCall] = useState<{ text: string; id: number } | null>(null);
  const [, render] = useReducer((x: number) => x + 1, 0);
  const coarse = useCoarsePointer();
  const reduced = useMotionReduced();
  const wellRef = useRef<HTMLDivElement>(null);

  const draw = useRef(makeBag());
  const g = useRef<State>(freshState(draw.current));
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

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
    return () => set.forEach((id) => window.clearTimeout(id));
  }, []);

  const say = useCallback(
    (text: string) => {
      const id = Date.now();
      setToast({ text, id });
      later(2200, () => setToast((t) => (t?.id === id ? null : t)));
    },
    [later],
  );

  const shake = useCallback(() => {
    const el = wellRef.current;
    if (!el || reduced) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }, [reduced]);

  const spawnNext = useCallback(() => {
    const s = g.current;
    const piece = spawn(s.next, ++s.seq);
    s.next = draw.current();
    if (collides(s.board, piece)) {
      s.over = true;
      s.piece = null;
      sound.land();
      render();
      later(600, () => setPhase('over'));
      return;
    }
    s.piece = piece;
    s.lastFall = performance.now();
    render();
  }, [later]);

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
    const kinds = rows.map((r) => new Set(s.board[r].map((c) => c!.type)).size);
    const funnel = kinds.some((k) => k >= FULL_FUNNEL);
    const points = LINE_POINTS[Math.min(4, rows.length)] * s.level * (funnel ? 2 : 1);
    s.score += points;
    s.lines += rows.length;
    const newLevel = 1 + Math.floor(s.lines / 10);
    s.clearing = rows;
    s.busy = true;
    sound.lineClear();
    setCall({ text: funnel ? 'Full funnel ×2!' : LINE_CALLS[Math.min(4, rows.length)], id: Date.now() });
    if (rows.length > 1 || funnel) shake();
    if (newLevel > s.level) {
      s.level = newLevel;
      later(300, () => sound.milestone());
      say(`Level ${newLevel}! Faster now.`);
    }
    render();
    later(CLEAR_MS, () => {
      s.board = removeRows(s.board, rows);
      s.clearing = [];
      s.busy = false;
      spawnNext();
    });
  }, [later, say, shake, spawnNext]);

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
      } else {
        const d = dropDistance(s.board, p);
        s.score += d * 2;
        s.piece = { ...p, y: p.y + d };
        lock();
        return;
      }
      render();
    },
    [lock],
  );

  /* ---- Game loop ---- */
  useEffect(() => {
    if (phase !== 'play') return;
    const s = g.current;
    if (!s.piece && !s.over) spawnNext();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (s.busy || !s.piece) return;
      if (now - s.lastFall >= gravityFor(s.level)) {
        s.lastFall = now;
        act('down');
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, round, act, spawnNext]);

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
      if (e.code === 'Space' && (e.target as HTMLElement)?.closest?.('button')) return;
      e.preventDefault();
      act(a);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, act]);

  /* ---- Touch / mouse gestures ---- */
  const gesture = useRef<{ x: number; y: number; t: number; moved: number; cell: number } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
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
    if (dy > gs.cell * 2 && Math.abs(dy) > Math.abs(dx)) act('drop');
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && performance.now() - gs.t < 350) act('rotate');
  };

  const restart = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
    draw.current = makeBag();
    g.current = freshState(draw.current);
    setToast(null);
    setCall(null);
    setRound((r) => r + 1);
    setPhase('ready');
  };

  /* ---- Render ---- */
  const s = g.current;
  const current = s.piece ? BLOCK[s.piece.type] : null;
  const view = s.board.map((row) => row.map((c) => c));
  const ghost = new Set<string>();
  const live = new Set<string>();
  if (s.piece) {
    const d = dropDistance(s.board, s.piece);
    cellsOf({ ...s.piece, y: s.piece.y + d }).forEach(([r, c]) => ghost.add(`${r}:${c}`));
    cellsOf(s.piece).forEach(([r, c]) => {
      if (r >= 0) {
        view[r][c] = { type: s.piece!.type, id: s.piece!.id };
        live.add(`${r}:${c}`);
      }
    });
  }

  return (
    <div className="screen l2 fp">
      {phase === 'ready' && (
        <ReadyGo
          key={round}
          number={2}
          eyebrow={F.status}
          title={G.title}
          note={G.rules}
          onDone={() => setPhase('play')}
        />
      )}
      {phase === 'over' && (
        <GameOver game={GAME} score={s.score} line={G.lost} onAgain={restart} onExit={onExit} />
      )}

      <div className="l2__layout">
        <aside className="l2__side l2__side--left">
          <div className="now px-panel">
            <span className="eyebrow">{F.status}</span>
            {current && (
              <div className="now__card" key={s.piece?.id}>
                <MiniPiece type={current.type} />
                <span className="now__name">{current.name}</span>
              </div>
            )}
          </div>
          <Toast message={toast?.text ?? null} id={toast?.id ?? 0} />
          {!coarse && <p className="l2__keys">{copy.level2.controlsKeys}</p>}
        </aside>

        <div className="l2__center">
          <div className="well-wrap">
            <div
              ref={wellRef}
              className="well"
              style={{ ['--cols' as string]: COLS, ['--rows' as string]: ROWS }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (gesture.current = null)}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('shake')}
              role="application"
              aria-label="Endless block stacking. Arrow keys to move and rotate, space to drop."
            >
              {view.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r}:${c}`;
                  if (cell) {
                    return (
                      <div
                        key={key}
                        className={`cell cell--filled ${live.has(key) ? 'cell--live' : ''} ${s.clearing.includes(r) ? 'cell--clearing' : ''}`}
                        style={cellStyle(cell.type)}
                      >
                        {cell.type === 'filler' ? '' : BLOCK[cell.type].code}
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

        <aside className="l2__side l2__side--right fp__side">
          <div className="nextbox px-panel">
            <span className="eyebrow">Next</span>
            <MiniPiece type={s.next} />
          </div>
          <Hud
            items={[
              { label: G.scoreLabel, value: s.score },
              { label: 'Lines', value: s.lines },
              { label: 'Level', value: s.level },
              { label: F.best, value: getBest(GAME) ? formatScore(GAME, getBest(GAME)) : '—' },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
