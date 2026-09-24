import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { sound } from '../audio/sound';
import { GameOver, Hud, Lives, ReadyGo, Toast } from '../components/ui';
import { copy } from '../content/copy';
import { useMotionReduced } from '../hooks/usePrefs';
import { readPx } from '../pixel/usePx';
import { LAYERS } from '../levels/level3/barriers';
import { draw, setPix } from '../levels/level3/draw';
import { createWorld, launch, layout, movePaddle, nextWave, step, type World } from '../levels/level3/engine';
import { formatScore, getBest } from './progress';
import '../levels/level3/level3.css';
import './freeplay.css';

const GAME = 2;
const F = copy.freePlay;
const G = F.games[GAME];
const BALLS = 3;
const AUTO_LAUNCH_MS = 1800;
const CONTINUE_MS = 2400;

export function EndlessBreakout({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [round, setRound] = useState(0);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const [, render] = useReducer((x: number) => x + 1, 0);
  const reduced = useMotionReduced();

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLCanvasElement>(null);
  const world = useRef<World | null>(null);
  const px = useRef(4);
  const game = useRef({ balls: BALLS, score: 0, wave: 1, stuckSince: 0, missedAt: 0, wonAt: 0 });
  const keys = useRef({ left: false, right: false });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const say = useCallback((text: string) => {
    const id = Date.now();
    setToast({ text, id });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2200);
  }, []);

  const shake = useCallback(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }, [reduced]);

  /* ---- Canvas sizing (same as the story level) ---- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const text = textRef.current;
    if (!wrap || !canvas || !text) return;
    const fit = () => {
      const w = Math.max(280, wrap.clientWidth);
      const h = Math.max(320, wrap.clientHeight);
      px.current = readPx();
      setPix(px.current);
      canvas.width = Math.round(w / px.current);
      canvas.height = Math.round(h / px.current);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1 / px.current, 0, 0, 1 / px.current, 0, 0);
        ctx.imageSmoothingEnabled = false;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      text.width = Math.round(w * dpr);
      text.height = Math.round(h * dpr);
      text.style.width = `${w}px`;
      text.style.height = `${h}px`;
      text.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!world.current) world.current = createWorld(w, h, px.current);
      else layout(world.current, w, h, px.current);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  /* ---- Game loop ---- */
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const tctx = textRef.current?.getContext('2d');
    if (!ctx || !tctx) return;
    const gs = game.current;
    let raf = 0;
    let last = performance.now();
    gs.stuckSince = last;
    let lastTick = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const wd = world.current;
      if (!wd) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const playing = phaseRef.current === 'play' && !gs.wonAt;

      if (playing) {
        const k = keys.current;
        if (k.left !== k.right) {
          movePaddle(wd, wd.paddle.x + (k.left ? -1 : 1) * Math.max(600, wd.w * 1.1) * dt);
        }
        const wait = gs.missedAt ? CONTINUE_MS : AUTO_LAUNCH_MS;
        if (wd.ball.stuck && now - gs.stuckSince > wait) {
          launch(wd);
          gs.missedAt = 0;
          sound.go();
        }
        if (wd.ball.stuck && gs.missedAt) {
          const tick = Math.floor((now - gs.missedAt) / 800);
          if (tick !== lastTick) {
            lastTick = tick;
            sound.countdown();
          }
        }

        const ev = step(wd, dt);
        if (ev.paddle) sound.wall();
        if (ev.missed) {
          gs.balls -= 1;
          shake();
          sound.uhoh();
          render();
          if (gs.balls <= 0) {
            window.setTimeout(() => setPhase('over'), 500);
          } else {
            gs.stuckSince = now;
            gs.missedAt = now;
            lastTick = -1;
          }
        }
        for (const br of ev.broke) {
          sound.brick(br.layer);
          gs.score += 100 * gs.wave;
          const barrier = LAYERS[br.layer].barriers[br.index];
          wd.floaters.push({ x: br.x + br.w / 2, y: br.y + br.h / 2, text: barrier.fix, born: now });
          if (!reduced) {
            for (let i = 0; i < 8; i++) {
              const a = Math.random() * Math.PI * 2;
              const v = 60 + Math.random() * 140;
              wd.sparks.push({
                x: br.x + Math.random() * br.w,
                y: br.y + br.h / 2,
                vx: Math.cos(a) * v,
                vy: Math.sin(a) * v,
                born: now,
                color: LAYERS[br.layer].fill,
              });
            }
          }
        }
        if (ev.broke.length) render();

        // Deal won: bank a bonus, then the next deal is harder.
        if (ev.broke.length && wd.bricks.every((b) => !b.alive)) {
          gs.wonAt = now;
          gs.score += 500 * gs.wave;
          sound.win();
          shake();
          render();
          window.setTimeout(() => {
            gs.wave += 1;
            gs.wonAt = 0;
            nextWave(wd, gs.wave, px.current);
            gs.stuckSince = performance.now();
            gs.missedAt = 0;
            say(`Deal ${gs.wave}: faster ball, smaller paddle.`);
            render();
          }, 1600);
        }
      }

      draw(ctx, tctx, wd, now, {
        won: !!gs.wonAt,
        wonAt: gs.wonAt,
        showLaunchHint: phaseRef.current === 'play' && !gs.missedAt,
        continueFrom: wd.ball.stuck && gs.missedAt ? now - gs.missedAt : -1,
        reducedMotion: reduced,
        goal: { label: `DEAL ${gs.wave}`, won: `DEAL ${gs.wave} WON!` },
      });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [round, reduced, say, shake]);

  /* ---- Controls ---- */
  useEffect(() => {
    if (phase !== 'play') return;
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.left = true;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.right = true;
      else if (e.code === 'Space' || e.code === 'ArrowUp') {
        if ((e.target as HTMLElement)?.closest?.('button')) return;
        if (world.current?.ball.stuck) {
          launch(world.current);
          game.current.missedAt = 0;
        }
      } else return;
      e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.right = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [phase]);

  const pointerTo = (clientX: number) => {
    const wd = world.current;
    const wrap = wrapRef.current;
    if (!wd || !wrap || phaseRef.current !== 'play') return;
    movePaddle(wd, clientX - wrap.getBoundingClientRect().left);
  };

  const restart = () => {
    game.current = { balls: BALLS, score: 0, wave: 1, stuckSince: performance.now(), missedAt: 0, wonAt: 0 };
    if (world.current) nextWave(world.current, 1, px.current);
    setToast(null);
    setRound((r) => r + 1);
    setPhase('ready');
  };

  const gs = game.current;
  return (
    <div className="screen l3 fp">
      {phase === 'ready' && (
        <ReadyGo
          key={round}
          number={3}
          eyebrow={F.status}
          title={G.title}
          note={G.rules}
          onDone={() => {
            game.current.stuckSince = performance.now();
            setPhase('play');
          }}
        />
      )}
      {phase === 'over' && (
        <GameOver game={GAME} score={gs.score} line={G.lost} onAgain={restart} onExit={onExit} />
      )}

      <div className="l3__layout">
        <div className="l3__main">
          <div
            className="l3__canvas-wrap"
            ref={wrapRef}
            onAnimationEnd={(e) => e.currentTarget.classList.remove('shake')}
            onPointerMove={(e) => pointerTo(e.clientX)}
            onPointerDown={(e) => {
              pointerTo(e.clientX);
              if (world.current?.ball.stuck && phaseRef.current === 'play' && !game.current.wonAt) {
                launch(world.current);
                game.current.missedAt = 0;
              }
            }}
          >
            <canvas ref={canvasRef} role="img" aria-label="Endless paddle and ball game." />
            <canvas ref={textRef} className="l3__text" aria-hidden="true" />
          </div>
        </div>

        <aside className="l3__panel fp__side" aria-live="polite">
          <Hud
            items={[
              { label: G.scoreLabel, value: formatScore(GAME, gs.score) },
              { label: 'Deal', value: gs.wave },
              { label: 'Balls', value: <Lives left={gs.balls} total={BALLS} /> },
              { label: F.best, value: getBest(GAME) ? formatScore(GAME, getBest(GAME)) : '—' },
            ]}
          />
          <Toast message={toast?.text ?? null} id={toast?.id ?? 0} />
          <p className="l3__keys">{copy.level3.hintKeys}</p>
        </aside>
      </div>
    </div>
  );
}
