import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { sound } from '../../audio/sound';
import { EndCard, LevelTitle } from '../../components/ui';
import { copy } from '../../content/copy';
import { HOME_SLOT, SLOT_COUNT, STAKEHOLDERS, byId, type Stakeholder } from './stakeholders';
import './level1.css';

type Phase = 'title' | 'setup' | 'first' | 'twist' | 'chaos' | 'freeze' | 'reveal';

type Occupant = {
  personId: string;
  round: 1 | 2;
  status: 'up' | 'convinced' | 'leaving';
  key: number;
};

const L1 = copy.level1;

// Timings (ms). The first few arrive one by one, then they start to overlap.
const TWIST_SCHEDULE: { id: string; at: number; headline?: string }[] = [
  { id: 'cfo', at: 1100, headline: 'Wait. Who’s this?' },
  { id: 'cio', at: 3500, headline: 'Convince the buyers.' },
  { id: 'procurement', at: 5600 },
  { id: 'legal', at: 7200, headline: 'Convince… everyone?' },
  { id: 'user', at: 8500 },
  { id: 'ceo', at: 9600 },
];
const TWIST_END = 11600;
const CHAOS_LENGTH = 8500;
const CHAOS_EVERY = 620;
const ROUND1_LINGER = 6500;
const ROUND2_LINGER = 2300;

export function LevelOneBuyingGroup({
  onComplete,
  onNext,
}: {
  onComplete: () => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('title');
  const [headline, setHeadline] = useState<string>(L1.instruction);
  const [flash, setFlash] = useState<{ text: string; key: number } | null>(null);
  const [, render] = useReducer((x: number) => x + 1, 0);

  const game = useRef({
    slots: Array<Occupant | null>(SLOT_COUNT).fill(null),
    seen: [] as string[],
    keySeq: 0,
    lastAppeared: -1,
  });
  const boardRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Every timer goes through here so nothing fires after the level unmounts.
  const timers = useRef(new Set<number>());
  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
    return id;
  }, []);
  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((id) => window.clearTimeout(id));
      set.clear();
    };
  }, []);

  const leave = useCallback(
    (slot: number, key: number) => {
      const occ = game.current.slots[slot];
      if (!occ || occ.key !== key) return;
      occ.status = 'leaving';
      render();
      later(260, () => {
        if (game.current.slots[slot]?.key === key) {
          game.current.slots[slot] = null;
          render();
        }
      });
    },
    [later],
  );

  const appear = useCallback(
    (personId: string, slot: number, round: 1 | 2, linger?: number) => {
      const g = game.current;
      if (g.slots[slot]) return false;
      if (g.slots.some((o) => o?.personId === personId && o.status === 'up')) return false;
      const key = ++g.keySeq;
      g.slots[slot] = { personId, round, status: 'up', key };
      if (!g.seen.includes(personId)) g.seen.push(personId);
      g.lastAppeared = slot;
      sound.appear();
      render();
      if (linger) later(linger, () => leave(slot, key));
      return true;
    },
    [later, leave],
  );

  const convince = useCallback(
    (slot: number) => {
      const g = game.current;
      const occ = g.slots[slot];
      if (!occ || occ.status !== 'up') return;
      const p = phaseRef.current;
      if (p === 'freeze' || p === 'reveal') return;
      occ.status = 'convinced';
      sound.hit();
      const person = byId[occ.personId];
      if (p !== 'first') setFlash({ text: `${person.role} convinced.`, key: occ.key });
      render();
      const key = occ.key;
      later(p === 'first' ? 1400 : 700, () => leave(slot, key));

      if (p === 'first') {
        sound.success();
        setHeadline(`${person.role} convinced.`);
        setPhase('twist');
      }
    },
    [later, leave],
  );

  /* ---- Phase scripts ---- */
  useEffect(() => {
    if (phase === 'setup') {
      const id = window.setTimeout(() => {
        appear('cmo', HOME_SLOT.cmo, 1);
        setPhase('first');
      }, 1500);
      return () => window.clearTimeout(id);
    }

    if (phase === 'twist') {
      const ids = TWIST_SCHEDULE.map((step) =>
        window.setTimeout(() => {
          appear(step.id, HOME_SLOT[step.id], 1, ROUND1_LINGER);
          if (step.headline) setHeadline(step.headline);
        }, step.at),
      );
      ids.push(window.setTimeout(() => setPhase('chaos'), TWIST_END));
      return () => ids.forEach((id) => window.clearTimeout(id));
    }

    if (phase === 'chaos') {
      setHeadline('They’ve all got more questions.');
      const spawn = () => {
        const g = game.current;
        const free = g.slots.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
        const upIds = new Set(g.slots.filter(Boolean).map((o) => o!.personId));
        const candidates = STAKEHOLDERS.filter((s) => !upIds.has(s.id));
        if (!free.length || !candidates.length) return;
        const slot = free[Math.floor(Math.random() * free.length)];
        const person = candidates[Math.floor(Math.random() * candidates.length)];
        appear(person.id, slot, 2, ROUND2_LINGER);
      };
      spawn();
      const tick = window.setInterval(() => {
        spawn();
        if (Math.random() < 0.45) spawn(); // sometimes two at once
      }, CHAOS_EVERY);
      const end = window.setTimeout(() => setPhase('freeze'), CHAOS_LENGTH);
      return () => {
        window.clearInterval(tick);
        window.clearTimeout(end);
      };
    }

    if (phase === 'freeze') {
      // Everybody on the board at once, asking their first question.
      const g = game.current;
      STAKEHOLDERS.forEach((s) => {
        g.slots[HOME_SLOT[s.id]] = { personId: s.id, round: 1, status: 'up', key: ++g.keySeq };
        if (!g.seen.includes(s.id)) g.seen.push(s.id);
      });
      g.slots[5] = null;
      g.lastAppeared = -1;
      setFlash(null);
      setHeadline('Everyone’s here.');
      sound.milestone();
      render();
      const id = window.setTimeout(() => setPhase('reveal'), 1900);
      return () => window.clearTimeout(id);
    }

    if (phase === 'reveal') {
      onCompleteRef.current();
    }
  }, [phase, appear]);

  // Keyboard players: move focus to whoever just popped up, if they were already playing.
  useEffect(() => {
    const slot = game.current.lastAppeared;
    if (slot < 0 || !boardRef.current) return;
    const active = document.activeElement;
    const inBoard = active && boardRef.current.contains(active);
    const idle = !active || active === document.body || active.classList.contains('stage');
    if (inBoard || idle) {
      boardRef.current.querySelector<HTMLButtonElement>(`[data-slot="${slot}"] button`)?.focus({
        preventScroll: true,
      });
    }
    game.current.lastAppeared = -1;
  });

  const seenCount = game.current.seen.length;
  const hint =
    phase === 'first'
      ? L1.hint
      : phase === 'twist' || phase === 'chaos'
        ? L1.hintAfterFirst
        : '';

  if (phase === 'reveal') {
    return (
      <div className="screen l1 l1--reveal">
        <div className="center-stack">
          <Lineup />
          <EndCard
            headline={L1.endHeadline}
            score={L1.endScore(STAKEHOLDERS.length)}
            cta={L1.cta}
            tease={L1.tease}
            onNext={onNext}
          >
            <p className="lede">{L1.endBody}</p>
            <p className="l1__kicker">{L1.endKicker}</p>
          </EndCard>
        </div>
      </div>
    );
  }

  return (
    <div className="screen l1">
      {phase === 'title' && (
        <LevelTitle number={L1.number} title={L1.title} onDone={() => setPhase('setup')} />
      )}

      <div className="l1__head">
        <div className="l1__copy">
          <p className="l1__setup">{L1.setup}</p>
          <h2 className="display display--md l1__headline" key={headline} aria-live="polite">
            {phase === 'setup' ? L1.instruction : headline}
          </h2>
          <p className="l1__hint" aria-hidden={!hint}>
            {hint && (
              <>
                <span className="l1__hint-dot" /> {hint}
              </>
            )}
          </p>
        </div>
        <div className="l1__counter" aria-live="polite">
          <span className="eyebrow">{L1.counterLabel}</span>
          <span className="l1__count" key={seenCount}>
            {Math.max(1, seenCount)}
          </span>
        </div>
      </div>

      <div className={`l1__board ${phase === 'freeze' ? 'is-frozen' : ''}`} ref={boardRef}>
        {game.current.slots.map((occ, i) => (
          <div className="pod" key={i} data-slot={i}>
            {occ && (
              <Person
                key={occ.key}
                person={byId[occ.personId]}
                round={occ.round}
                status={occ.status}
                frozen={phase === 'freeze'}
                onClick={() => convince(i)}
              />
            )}
          </div>
        ))}
        {flash && phase !== 'freeze' && (
          <p className="l1__flash" key={flash.key} aria-hidden="true">
            ✓ {flash.text}
          </p>
        )}
      </div>
    </div>
  );
}

function Person({
  person,
  round,
  status,
  frozen,
  onClick,
}: {
  person: Stakeholder;
  round: 1 | 2;
  status: Occupant['status'];
  frozen: boolean;
  onClick: () => void;
}) {
  const question = round === 1 ? person.ask : person.again;
  const convinced = status === 'convinced';
  return (
    <div className={`person person--${status} ${frozen ? 'person--frozen' : ''}`}>
      <p className="person__bubble">{convinced ? '✓ Convinced' : question}</p>
      <button
        type="button"
        className="person__body"
        onPointerDown={(e) => {
          // Pointer down feels snappier than click for fast-moving targets.
          if (e.pointerType !== 'mouse' || e.button === 0) {
            e.preventDefault();
            onClick();
          }
        }}
        onClick={onClick}
        disabled={frozen || status !== 'up'}
        aria-label={`${person.role}: “${question}” Convince them.`}
      >
        <Avatar glyph={person.glyph} />
        <span className="person__role">{person.role}</span>
      </button>
    </div>
  );
}

function Avatar({ glyph }: { glyph: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="avatar__svg">
        <circle cx="32" cy="20" r="12" />
        <path d="M8 64c0-15 10.7-25 24-25s24 10 24 25z" />
      </svg>
      <span className="avatar__glyph">{glyph}</span>
    </span>
  );
}

function Lineup() {
  return (
    <ul className="lineup" aria-label="Everyone involved in the purchase">
      {STAKEHOLDERS.map((s, i) => (
        <li key={s.id} className="lineup__item" style={{ animationDelay: `${i * 60}ms` }}>
          <Avatar glyph={s.glyph} />
          <span className="lineup__role">{s.role}</span>
          <span className="lineup__ask">{s.id === 'cmo' ? 'Can you convince the CFO?' : s.ask}</span>
        </li>
      ))}
    </ul>
  );
}
