import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { sound } from '../audio/sound';
import { GameOver, Hud, Lives, ReadyGo } from '../components/ui';
import { copy } from '../content/copy';
import { useMotionReduced } from '../hooks/usePrefs';
import { PodDecor, Person, type Occupant } from '../levels/level1/LevelOneBuyingGroup';
import { SLOT_COUNT, STAKEHOLDERS, byId } from '../levels/level1/stakeholders';
import { formatScore, getBest } from './progress';
import '../levels/level1/level1.css';
import './freeplay.css';

const GAME = 0;
const F = copy.freePlay;
const G = F.games[GAME];
const LIVES = 3;

/** How hard it is after `s` seconds: it keeps getting faster, forever. */
function difficulty(s: number) {
  return {
    every: Math.max(340, 1150 - s * 14), // ms between arrivals
    linger: Math.max(950, 2900 - s * 28), // ms before they give up
    maxUp: Math.min(7, 1 + Math.floor(s / 8)), // how many at once
  };
}

export function EndlessBuyers({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [round, setRound] = useState(0);
  const [, render] = useReducer((x: number) => x + 1, 0);
  const [flash, setFlash] = useState<{ text: string; key: number; bad?: boolean } | null>(null);
  const [shake, setShake] = useState(0);
  const reduced = useMotionReduced();
  const boardRef = useRef<HTMLDivElement>(null);

  const g = useRef({
    slots: Array<Occupant | null>(SLOT_COUNT).fill(null),
    rounds: {} as Record<number, 1 | 2>,
    lives: LIVES,
    score: 0,
    keySeq: 0,
    start: 0,
  });

  const timers = useRef(new Set<number>());
  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const remove = useCallback(
    (slot: number, key: number) => {
      later(240, () => {
        if (g.current.slots[slot]?.key === key) {
          g.current.slots[slot] = null;
          render();
        }
      });
    },
    [later],
  );

  const giveUp = useCallback(
    (slot: number, key: number) => {
      const s = g.current;
      const occ = s.slots[slot];
      if (!occ || occ.key !== key || occ.status !== 'up' || phaseRef.current !== 'play') return;
      occ.status = 'leaving';
      s.lives -= 1;
      sound.uhoh();
      setShake((n) => n + 1);
      setFlash({ text: `${byId[occ.personId].role} gave up!`, key, bad: true });
      render();
      remove(slot, key);
      if (s.lives <= 0) {
        clearTimers();
        later(500, () => setPhase('over'));
      }
    },
    [clearTimers, later, remove],
  );

  const spawn = useCallback(() => {
    const s = g.current;
    if (phaseRef.current !== 'play') return;
    const secs = (performance.now() - s.start) / 1000;
    const d = difficulty(secs);
    const up = s.slots.filter((o) => o?.status === 'up').length;
    const free = s.slots.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
    const busy = new Set(s.slots.filter(Boolean).map((o) => o!.personId));
    const people = STAKEHOLDERS.filter((p) => !busy.has(p.id));
    if (up < d.maxUp && free.length && people.length) {
      const slot = free[Math.floor(Math.random() * free.length)];
      const person = people[Math.floor(Math.random() * people.length)];
      const key = ++s.keySeq;
      s.slots[slot] = { personId: person.id, round: 1, status: 'up', key };
      s.rounds[key] = Math.random() < 0.5 ? 1 : 2;
      sound.appear();
      render();
      later(d.linger, () => giveUp(slot, key));
    }
    later(d.every * (0.7 + Math.random() * 0.6), spawn);
  }, [giveUp, later]);

  const convince = useCallback(
    (slot: number) => {
      const s = g.current;
      const occ = s.slots[slot];
      if (!occ || occ.status !== 'up' || phaseRef.current !== 'play') return;
      occ.status = 'convinced';
      const points = occ.personId === 'ceo' ? 3 : 1;
      s.score += points;
      sound.hit();
      if (points > 1) {
        later(100, () => sound.combo(4));
        setFlash({ text: 'CEO! +3', key: occ.key });
      }
      render();
      const key = occ.key;
      later(450, () => {
        if (s.slots[slot]?.key === key) {
          s.slots[slot]!.status = 'leaving';
          render();
          remove(slot, key);
        }
      });
    },
    [later, remove],
  );

  // Start (and restart) a round
  useEffect(() => {
    if (phase !== 'play') return;
    const s = g.current;
    s.start = performance.now();
    later(400, spawn);
    return clearTimers;
  }, [phase, round, spawn, later, clearTimers]);

  const restart = () => {
    clearTimers();
    g.current = {
      slots: Array<Occupant | null>(SLOT_COUNT).fill(null),
      rounds: {},
      lives: LIVES,
      score: 0,
      keySeq: 0,
      start: 0,
    };
    setFlash(null);
    setRound((r) => r + 1);
    setPhase('ready');
  };

  // Replay the shake each time someone gives up.
  useEffect(() => {
    const el = boardRef.current;
    if (!el || !shake || reduced) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }, [shake, reduced]);

  const s = g.current;
  return (
    <div className="screen l1 fp">
      {phase === 'ready' && (
        <ReadyGo
          key={round}
          number={1}
          eyebrow={F.status}
          title={G.title}
          note={G.rules}
          onDone={() => setPhase('play')}
        />
      )}
      {phase === 'over' && (
        <GameOver game={GAME} score={s.score} line={G.lost} onAgain={restart} onExit={onExit} />
      )}

      <div className="fp__head">
        <Hud
          items={[
            { label: G.scoreLabel, value: s.score },
            { label: 'Deal', value: <Lives left={s.lives} total={LIVES} /> },
            { label: F.best, value: getBest(GAME) ? formatScore(GAME, getBest(GAME)) : '—' },
          ]}
        />
      </div>

      <div className="l1__board" ref={boardRef}>
        {s.slots.map((occ, i) => (
          <div className={`pod pod--${i % 3}`} key={i} data-slot={i}>
            <PodDecor slot={i} />
            {occ && (
              <Person
                key={occ.key}
                person={byId[occ.personId]}
                round={s.rounds[occ.key] ?? 1}
                status={occ.status}
                frozen={false}
                onClick={() => convince(i)}
              />
            )}
            <div className="pod__desk px-cubicle" aria-hidden="true" />
            {occ && (
              <span key={`name-${occ.key}`} className={`pod__name pod__name--${occ.status}`} aria-hidden="true">
                {byId[occ.personId].role}
              </span>
            )}
          </div>
        ))}
        {flash && (
          <p
            className={`l1__flash arcade px-panel-sun ${flash.bad ? 'fp__flash--bad' : ''}`}
            key={flash.key}
            aria-hidden="true"
          >
            {flash.text}
          </p>
        )}
      </div>
    </div>
  );
}
