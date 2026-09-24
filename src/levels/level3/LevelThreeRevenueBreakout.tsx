import { useCallback, useEffect, useRef, useState } from 'react';
import { sound } from '../../audio/sound';
import { EndCard, ReadyGo, Toast } from '../../components/ui';
import { DEAL_VALUE, copy } from '../../content/copy';
import { useMotionReduced } from '../../hooks/usePrefs';
import { LAYERS, MILESTONES, type MilestoneId } from './barriers';
import { PIX, draw } from './draw';
import { createWorld, launch, layout, movePaddle, setAssist, step, type World } from './engine';
import './level3.css';

type Phase = 'title' | 'play' | 'won' | 'end';

const L3 = copy.level3;
const AUTO_LAUNCH_MS = 2200;
const CONTINUE_MS = 2400; // the CONTINUE? 3-2-1 after a miss
const ASSIST_1_MS = 30_000; // wider paddle
const ASSIST_2_MS = 50_000; // ball leans towards the barriers
const WRAP_UP_MS = 80_000; // knock the rest down for them

export function LevelThreeRevenueBreakout({
  onComplete,
  onNext,
}: {
  onComplete: () => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('title');
  const [reached, setReached] = useState<MilestoneId[]>([]);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const reducedMotion = useMotionReduced();

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useRef<World | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const reachedRef = useRef<MilestoneId[]>([]);
  const wonAt = useRef(0);
  const keys = useRef({ left: false, right: false });
  const stuckSince = useRef(0);
  const missedAt = useRef(0);
  const [shake, setShake] = useState(0);

  const say = useCallback((text: string) => {
    const id = Date.now();
    setToast({ text, id });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2400);
  }, []);

  const reach = useCallback((id: MilestoneId) => {
    if (reachedRef.current.includes(id)) return;
    reachedRef.current = [...reachedRef.current, id];
    setReached(reachedRef.current);
    if (id === 'won') sound.win();
    else sound.milestone();
  }, []);

  /* ---- Canvas sizing ---- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const fit = () => {
      // Layout size, not on-screen size: the screen's switch-on animation
      // squashes it for a moment and would give the wrong numbers.
      const w = Math.max(280, wrap.clientWidth);
      const h = Math.max(320, wrap.clientHeight);
      // Drawn at half resolution and scaled up, for chunky pixels.
      canvas.width = Math.round(w / PIX);
      canvas.height = Math.round(h / PIX);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1 / PIX, 0, 0, 1 / PIX, 0, 0);
        ctx.imageSmoothingEnabled = false;
      }
      if (!world.current) world.current = createWorld(w, h);
      else layout(world.current, w, h);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  /* ---- Game loop ---- */
  useEffect(() => {
    if (phase !== 'play' && phase !== 'won' && phase !== 'title') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    const start = last;
    stuckSince.current = last;
    let assist = 0;
    let wrapping = false;
    let lastTick = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const wd = world.current;
      if (!wd) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (phaseRef.current === 'play') {
        // keyboard paddle
        const k = keys.current;
        if (k.left !== k.right) {
          movePaddle(wd, wd.paddle.x + (k.left ? -1 : 1) * Math.max(600, wd.w * 1.1) * dt);
        }

        // quiet help for anyone finding it tricky
        const elapsed = now - start;
        const wantAssist = elapsed > ASSIST_2_MS ? 2 : elapsed > ASSIST_1_MS ? 1 : 0;
        if (wantAssist !== assist) {
          assist = wantAssist;
          setAssist(wd, assist);
        }
        if (!wrapping && elapsed > WRAP_UP_MS) {
          wrapping = true;
          say('Nearly there. Let’s close it.');
        }

        const wait = missedAt.current ? CONTINUE_MS : AUTO_LAUNCH_MS;
        if (wd.ball.stuck && now - stuckSince.current > wait) {
          launch(wd);
          missedAt.current = 0;
          sound.go();
        }
        if (wd.ball.stuck && missedAt.current) {
          const tick = Math.floor((now - missedAt.current) / 800);
          if (tick !== lastTick) {
            lastTick = tick;
            sound.countdown();
          }
        }

        const ev = step(wd, dt);
        if (wrapping && Math.random() < dt * 3) {
          const next = wd.bricks.find((b) => b.alive);
          if (next) {
            next.alive = false;
            ev.broke.push(next);
          }
        }

        if (ev.paddle) sound.wall();
        if (ev.missed) {
          stuckSince.current = now;
          missedAt.current = now;
          lastTick = -1;
          sound.uhoh();
          setShake((n) => n + 1);
        }
        for (const br of ev.broke) {
          sound.brick(br.layer);
          const barrier = LAYERS[br.layer].barriers[br.index];
          wd.floaters.push({ x: br.x + br.w / 2, y: br.y + br.h / 2, text: barrier.fix, born: now });
          if (!reducedMotion) {
            for (let i = 0; i < 10; i++) {
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
        if (ev.broke.length) checkProgress(wd, now);
      }

      draw(ctx, wd, now, {
        won: phaseRef.current === 'won',
        wonAt: wonAt.current,
        showLaunchHint: phaseRef.current === 'play' && !missedAt.current,
        continueFrom: wd.ball.stuck && missedAt.current ? now - missedAt.current : -1,
        reducedMotion,
      });
    };

    const checkProgress = (wd: World, now: number) => {
      const alive = (layer: number) => wd.bricks.filter((b) => b.layer === layer && b.alive).length;
      if (alive(0) === 0) reach('awareness');
      if (alive(1) <= 2) reach('engagement');
      if (alive(1) === 0) {
        reach('opportunity');
        window.setTimeout(() => reach('pipeline'), 450);
      }
      if (wd.bricks.every((b) => !b.alive)) {
        wonAt.current = now;
        setPhase('won');
        setShake((n) => n + 1);
        window.setTimeout(() => reach('won'), 300);
        if (!reducedMotion) celebrate(wd, now);
        window.setTimeout(() => {
          setPhase('end');
          onCompleteRef.current();
        }, 3200);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, reach, reducedMotion, say]);

  // Replay the shake each time something big happens.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !shake || reducedMotion) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }, [shake, reducedMotion]);

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
          missedAt.current = 0;
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

  const pipelineShown = reached.includes('pipeline');
  const won = reached.includes('won');

  if (phase === 'end') {
    return (
      <div className="screen l3 l3--end">
        <div className="center-stack">
          <p className="l3__payoff" aria-hidden="true">
            <span className="arcade l3__payoff-label">Won</span>
            <span className="display l3__payoff-value">{DEAL_VALUE}</span>
          </p>
          <EndCard headline={L3.endHeadline} size="md" cta={L3.cta} onNext={onNext}>
            <p className="l3__ladder">{L3.endBody}</p>
          </EndCard>
        </div>
      </div>
    );
  }

  return (
    <div className="screen l3">
      {phase === 'title' && <ReadyGo number={L3.number} title={L3.title} onDone={() => setPhase('play')} />}

      <div className="l3__layout">
        <div className="l3__main">
          <div className="l3__head">
            <p className="l3__setup">{L3.setup}</p>
            <p className="l3__hint arcade">
              <span className="blink">▶ {L3.hint}</span>
            </p>
          </div>
          <div
            className="l3__canvas-wrap"
            onAnimationEnd={(e) => e.currentTarget.classList.remove('shake')}
            ref={wrapRef}
            onPointerMove={(e) => pointerTo(e.clientX)}
            onPointerDown={(e) => {
              sound.unlock();
              pointerTo(e.clientX);
              if (world.current?.ball.stuck && phaseRef.current === 'play') {
                launch(world.current);
                missedAt.current = 0;
              }
            }}
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Paddle and ball game. Break the barriers between you and the deal. Move with the mouse, a finger or the arrow keys."
            />
          </div>
        </div>

        <aside className="l3__panel" aria-live="polite">
          <div className={`money px-panel ${won ? 'money--won' : ''}`}>
            <span className="eyebrow">{won ? 'Revenue won' : 'Pipeline'}</span>
            <span className="money__value">
              {pipelineShown ? <CountUp to={2.4} key={won ? 'won' : 'pipe'} /> : '£0'}
            </span>
          </div>
          <ol className="ticker px-panel">
            {MILESTONES.map((m) => {
              const done = reached.includes(m.id);
              const text = m.id === 'pipeline' ? `Pipeline ${DEAL_VALUE}` : m.id === 'won' ? `Won · ${DEAL_VALUE}` : m.text;
              return (
                <li key={m.id} className={`ticker__item ${done ? 'is-done' : ''}`}>
                  <span className="ticker__mark" aria-hidden="true">
                    {done ? '✓' : ''}
                  </span>
                  <span>{text}</span>
                  <span className="sr-only">{done ? 'done' : 'not yet'}</span>
                </li>
              );
            })}
          </ol>
          <Toast message={toast?.text ?? null} id={toast?.id ?? 0} />
          <p className="l3__keys">{L3.hintKeys}</p>
        </aside>
      </div>
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(0);
  const reduced = useMotionReduced();
  useEffect(() => {
    if (reduced) {
      setV(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setV(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, reduced]);
  return <>£{v.toFixed(1)}m</>;
}

function celebrate(wd: World, now: number) {
  const colors = ['#e4002b', '#f4f2ee', '#ff1f47', '#c9c5bd'];
  for (let i = 0; i < 90; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    const v = 200 + Math.random() * 420;
    wd.sparks.push({
      x: wd.goal.x + Math.random() * wd.goal.w,
      y: wd.goal.y + wd.goal.h,
      vx: Math.cos(a) * v * 0.6,
      vy: -Math.sin(a) * v * 0.5 + 60,
      born: now + Math.random() * 400,
      color: colors[i % colors.length],
      life: 1600,
    });
  }
}
