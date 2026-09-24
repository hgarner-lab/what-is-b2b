import { useEffect, useRef, type ReactNode } from 'react';
import { sound } from '../audio/sound';
import { brand } from '../content/brand';
import './ui.css';

/* ---------------------------------------------------------------
   Button
---------------------------------------------------------------- */
export function Button({
  children,
  onClick,
  variant = 'primary',
  autoFocus,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  return (
    <button
      ref={ref}
      type="button"
      className={`btn btn--${variant}`}
      onClick={() => {
        sound.unlock();
        sound.click();
        onClick();
      }}
    >
      <span className="btn__label">{children}</span>
      {variant === 'primary' && (
        <span className="btn__arrow" aria-hidden="true">
          →
        </span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------------
   Top bar: brand slot, level progress, sound toggle
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
            <li
              key={n}
              className={`pip ${done ? 'pip--done' : ''} ${current ? 'pip--current' : ''}`}
              aria-current={current ? 'step' : undefined}
            >
              <span className="pip__num">{n}</span>
              <span className="sr-only">
                Level {n}
                {done ? ', complete' : current ? ', in progress' : ''}
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
        <SoundIcon on={soundOn} />
        <span className="sound-toggle__label">{soundOn ? 'Sound on' : 'Sound off'}</span>
      </button>
    </header>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {on ? (
        <path
          d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------
   Level title card: shows briefly, then gets out of the way
---------------------------------------------------------------- */
export function LevelTitle({
  number,
  title,
  onDone,
  duration = 1700,
}: {
  number: number;
  title: string;
  onDone: () => void;
  duration?: number;
}) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const id = window.setTimeout(() => done.current(), duration);
    return () => window.clearTimeout(id);
  }, [duration]);

  return (
    <button type="button" className="level-title" onClick={() => done.current()}>
      <span className="eyebrow">Level {number}</span>
      <span className="display display--lg level-title__text">{title}</span>
      <span className="level-title__bar" style={{ animationDuration: `${duration}ms` }} />
    </button>
  );
}

/* ---------------------------------------------------------------
   Score strip: "1 buyer → 7 people"
---------------------------------------------------------------- */
export function ScoreStrip({ from, to }: { from: string; to: string }) {
  return (
    <p className="score-strip">
      <span className="score-strip__from">{from}</span>
      <span className="score-strip__arrow" aria-hidden="true">
        →
      </span>
      <span className="sr-only">became</span>
      <span className="score-strip__to">{to}</span>
    </p>
  );
}

/* ---------------------------------------------------------------
   End card: what happened, the B2B truth, what's next
---------------------------------------------------------------- */
export function EndCard({
  headline,
  children,
  score,
  tease,
  cta,
  onNext,
  size = 'lg',
}: {
  size?: 'lg' | 'md';
  headline: ReactNode;
  children?: ReactNode;
  score?: readonly [string, string];
  tease?: string;
  cta: string;
  onNext: () => void;
}) {
  return (
    <section className="end-card" aria-live="polite">
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
   Toast: short educational message that never blocks play
---------------------------------------------------------------- */
export function Toast({ message, id }: { message: string | null; id: number }) {
  return (
    <div className="toast-slot" aria-live="polite">
      {message && (
        <p key={id} className="toast">
          {message}
        </p>
      )}
    </div>
  );
}
