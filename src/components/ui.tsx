import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sound } from '../audio/sound';
import { brand } from '../content/brand';
import { useMotionReduced } from '../hooks/usePrefs';
import { coin, speaker, star } from '../pixel/art';
import { PALETTE } from '../pixel/sprite';
import { Sprite } from '../pixel/Sprite';
import { readPx } from '../pixel/usePx';
import './ui.css';

/* ---------------------------------------------------------------
   Button: chunky pixel button that presses down
---------------------------------------------------------------- */
export function Button({
  children,
  onClick,
  variant = 'sun',
  autoFocus,
  icon,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'sun' | 'coin' | 'ghost';
  autoFocus?: boolean;
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  return (
    <button
      ref={ref}
      type="button"
      className={`pbtn pbtn--${variant}`}
      onClick={() => {
        sound.unlock();
        sound.click();
        onClick();
      }}
    >
      {icon}
      <span className="pbtn__label">{children}</span>
      {variant !== 'ghost' && !icon && (
        <span className="pbtn__arrow" aria-hidden="true">
          ▶
        </span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------------
   Top bar: logo, three coins for progress, sound toggle
---------------------------------------------------------------- */
export function TopBar({
  level,
  completed,
  soundOn,
  onToggleSound,
}: {
  level: number | null;
  completed: number[];
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        {brand.logoSrc ? (
          <img src={brand.logoSrc} alt={brand.logoAlt} className="topbar__logo" />
        ) : (
          <span className="topbar__wordmark">What even is B2B?</span>
        )}
      </div>

      <ol className="topbar__progress" aria-label="Progress">
        {[1, 2, 3].map((n) => {
          const done = completed.includes(n);
          const current = level === n;
          return (
            <li key={n} className={`coinpip ${current ? 'coinpip--current' : ''}`} aria-current={current ? 'step' : undefined}>
              <Sprite src={coin(done)} w={8} h={8} />
              <span className="sr-only">
                Level {n}
                {done ? ', complete' : current ? ', playing' : ''}
              </span>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="sound-toggle"
        aria-pressed={soundOn}
        onClick={() => {
          if (!soundOn) sound.unlock();
          onToggleSound();
        }}
      >
        <Sprite src={speaker(soundOn)} w={8} h={7} />
        <span className="sound-toggle__label">{soundOn ? 'Sound on' : 'Sound off'}</span>
      </button>
    </header>
  );
}

/* ---------------------------------------------------------------
   READY? ... GO!  (starts every level; click to skip)
---------------------------------------------------------------- */
export function ReadyGo({ number, title, onDone }: { number: number; title: string; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  const [go, setGo] = useState(false);

  useEffect(() => {
    sound.ready();
    const t1 = window.setTimeout(() => sound.ready(), 380);
    const t2 = window.setTimeout(() => {
      setGo(true);
      sound.go();
    }, 850);
    const t3 = window.setTimeout(() => done.current(), 1300);
    // Any key skips straight in.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        done.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      [t1, t2, t3].forEach((t) => window.clearTimeout(t));
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <button type="button" className="readygo" onClick={() => done.current()}>
      <span className="arcade readygo__level">Level {number}</span>
      <span className="display display--lg readygo__title">{title}</span>
      <span className={`arcade readygo__call ${go ? 'readygo__call--go' : 'blink'}`}>{go ? 'GO!' : 'READY?'}</span>
    </button>
  );
}

/* ---------------------------------------------------------------
   Score strip: "1 BUYER ▶ 7 PEOPLE"
---------------------------------------------------------------- */
export function ScoreStrip({ from, to }: { from: string; to: string }) {
  return (
    <p className="score-strip arcade">
      <span className="score-strip__from">{from}</span>
      <span className="score-strip__arrow" aria-hidden="true">
        ▶
      </span>
      <span className="sr-only">became</span>
      <span className="score-strip__to px-panel-sun">{to}</span>
    </p>
  );
}

/* ---------------------------------------------------------------
   Level clear card: celebrate, state the truth, point to what's next
---------------------------------------------------------------- */
export function EndCard({
  headline,
  children,
  score,
  tease,
  cta,
  onNext,
  size = 'lg',
  banner = 'Level clear!',
}: {
  headline: ReactNode;
  children?: ReactNode;
  score?: readonly [string, string];
  tease?: string;
  cta: string;
  onNext: () => void;
  size?: 'lg' | 'md';
  banner?: string;
}) {
  useEffect(() => {
    sound.levelClear();
  }, []);

  return (
    <section className="end-card" aria-live="polite">
      <Confetti />
      <p className="end-card__banner arcade">
        <Sprite src={star()} w={7} h={7} />
        <span>{banner}</span>
        <Sprite src={star()} w={7} h={7} />
      </p>
      {score && <ScoreStrip from={score[0]} to={score[1]} />}
      <h2 className={`display display--${size} end-card__headline`}>{headline}</h2>
      {children}
      {tease && <p className="end-card__tease">{tease}</p>}
      <div className="end-card__cta">
        <Button onClick={onNext} autoFocus>
          {cta}
        </Button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Toast: a short message in a pixel speech bubble
---------------------------------------------------------------- */
export function Toast({ message, id }: { message: string | null; id: number }) {
  return (
    <div className="toast-slot" aria-live="polite">
      {message && (
        <p key={id} className="toast px-bubble">
          {message}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Confetti: square pixel confetti that rains once
---------------------------------------------------------------- */
const CONFETTI_COLORS = [PALETTE.sun, PALETTE.sky, PALETTE.mint, PALETTE.coral, PALETTE.lilac, PALETTE.red];

export function Confetti({ count = 110 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useMotionReduced();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduced) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = readPx();
    canvas.width = Math.ceil(w / scale);
    canvas.height = Math.ceil(h / scale);
    const ctx = canvas.getContext('2d')!;
    const bits = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.6,
      vx: (Math.random() - 0.5) * 20,
      vy: 20 + Math.random() * 40,
      size: Math.random() < 0.3 ? 2 : 1,
      c: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      wob: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    const start = performance.now();
    let last = start;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bits.forEach((b) => {
        b.wob += dt * 6;
        b.x += (b.vx + Math.sin(b.wob) * 8) * dt;
        b.y += b.vy * dt;
        ctx.fillStyle = b.c;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size + (Math.sin(b.wob) > 0 ? 1 : 0));
      });
      if (now - start < 3200) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [count, reduced]);

  return <canvas ref={ref} className="confetti px" aria-hidden="true" />;
}
