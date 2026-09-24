import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { music, sound } from '../audio/sound';
import { Button } from '../components/ui';
import { copy } from '../content/copy';
import { useMotionReduced } from '../hooks/usePrefs';
import { CABINET, cabinet, check, coin } from '../pixel/art';
import { DEMO_H, DEMO_TICK_MS, DEMO_W, drawDemo, type DemoKind } from '../pixel/demos';
import { PALETTE } from '../pixel/sprite';
import { Sprite } from '../pixel/Sprite';
import './room.css';

export const MACHINE_COLORS = [PALETTE.sky, PALETTE.sun, PALETTE.mint];

const pct = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({
  left: `${(r.x / CABINET.w) * 100}%`,
  top: `${(r.y / CABINET.h) * 100}%`,
  width: `${(r.w / CABINET.w) * 100}%`,
  height: `${(r.h / CABINET.h) * 100}%`,
});

export function ArcadeRoom({
  next,
  completed,
  onEnter,
}: {
  next: number;
  completed: number[];
  onEnter: (index: number) => void;
}) {
  const reduced = useMotionReduced();
  const roomRef = useRef<HTMLDivElement>(null);
  const cabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coinRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const firstVisit = completed.length === 0;

  // Gentle music while you're in the arcade (starts after the first click).
  useEffect(() => {
    music.start();
    return () => music.stop();
  }, []);

  const insertCoin = (from?: HTMLElement | null) => {
    if (busy) return;
    setBusy(true);
    music.stop();
    sound.unlock();
    const cab = cabRefs.current[next];
    const room = roomRef.current;
    const flyer = coinRef.current;
    if (!cab || !room || !flyer || reduced) {
      sound.coin();
      window.setTimeout(() => onEnter(next), 250);
      return;
    }

    const cabRect = cab.getBoundingClientRect();
    const slot = {
      x: cabRect.left + (CABINET.slot.x / CABINET.w) * cabRect.width,
      y: cabRect.top + (CABINET.slot.y / CABINET.h) * cabRect.height,
    };
    const src = (from ?? cab).getBoundingClientRect();
    const start = { x: src.left + src.width / 2, y: src.top + src.height / 2 };
    const size = 24;

    flyer.style.display = 'block';
    const flight = flyer.animate(
      [
        { transform: `translate(${start.x - size / 2}px, ${start.y - size / 2}px) scale(1.4)` },
        {
          transform: `translate(${(start.x + slot.x) / 2 - size / 2}px, ${Math.min(start.y, slot.y) - 140}px) scale(1.2)`,
          offset: 0.5,
        },
        { transform: `translate(${slot.x - size / 2}px, ${slot.y - size / 2}px) scale(0.5)` },
      ],
      { duration: 450, easing: 'ease-in', fill: 'forwards' },
    );

    flight.onfinish = () => {
      flyer.style.display = 'none';
      sound.coin();
      setFlash(true);
      window.setTimeout(() => {
        sound.zoom();
        const roomRect = room.getBoundingClientRect();
        const screen = {
          x: cabRect.left - roomRect.left + ((CABINET.screen.x + CABINET.screen.w / 2) / CABINET.w) * cabRect.width,
          y: cabRect.top - roomRect.top + ((CABINET.screen.y + CABINET.screen.h / 2) / CABINET.h) * cabRect.height,
        };
        room.style.transformOrigin = `${screen.x}px ${screen.y}px`;
        const zoom = room.animate(
          [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(2.5)', opacity: 1, offset: 0.6 },
            { transform: 'scale(7)', opacity: 0 },
          ],
          { duration: 500, easing: 'ease-in', fill: 'forwards' },
        );
        zoom.onfinish = () => onEnter(next);
      }, 250);
    };
  };

  return (
    <div className="screen room" ref={roomRef}>
      <div className="room__lights" aria-hidden="true" />
      <div className="room__wall">
        <div className="room__sign px-marquee">
          <h1 className="arcade room__title">{copy.intro.title}</h1>
        </div>
        <p className="room__sub">{firstVisit ? copy.intro.sub : copy.room.afterLevel[next]}</p>

        <div className="room__row">
          {MACHINE_COLORS.map((color, i) => {
            const done = completed.includes(i + 1);
            const ready = i === next;
            const m = copy.machines[i];
            const status = done ? 'cleared' : ready ? 'ready' : 'locked';
            return (
              <div key={i} className={`cabwrap cabwrap--${status}`}>
                <div
                  ref={(el) => {
                    cabRefs.current[i] = el;
                  }}
                  className={`cab ${ready && flash ? 'cab--flash' : ''}`}
                  role={ready ? 'button' : undefined}
                  tabIndex={ready ? 0 : undefined}
                  aria-label={`Machine ${i + 1}, ${m.short} ${
                    ready ? 'Ready to play.' : done ? `Cleared: ${m.score}.` : 'Coming up.'
                  }`}
                  onClick={ready ? (e) => insertCoin(e.currentTarget) : undefined}
                  onKeyDown={
                    ready
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            insertCoin(e.currentTarget);
                          }
                        }
                      : undefined
                  }
                >
                  <img src={cabinet(color, status !== 'locked')} alt="" className="px cab__img" draggable={false} />
                  <div className="cab__marquee arcade" style={pct(CABINET.marquee)}>
                    Level {i + 1}
                  </div>
                  <div className="cab__screen" style={pct(CABINET.screen)}>
                    <DemoScreen kind={i as DemoKind} dim={status === 'locked'} />
                    {done ? (
                      <span className="cab__status arcade cab__status--done">
                        <Sprite src={check()} w={7} h={6} /> {m.score}
                      </span>
                    ) : ready ? (
                      <span className="cab__status arcade">
                        <span className="blink">{copy.room.playNow}</span>
                      </span>
                    ) : (
                      <span className="cab__status cab__status--locked arcade">{copy.room.comingUp}</span>
                    )}
                  </div>
                </div>
                <span className="cab__caption">{m.short}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="room__floor">
        {next < 3 && (
          <div className="room__cta">
            <Button
              variant="coin"
              autoFocus
              icon={<Sprite src={coin()} w={8} h={8} />}
              onClick={() => insertCoin(document.activeElement as HTMLElement)}
            >
              {copy.room.ready}
            </Button>
            {firstVisit && <p className="room__note">{copy.intro.note}</p>}
          </div>
        )}
      </div>

      <div className="coin-flyer" ref={coinRef} aria-hidden="true">
        <Sprite src={coin()} w={8} h={8} />
      </div>
    </div>
  );
}

/** The little demo loop playing on a machine's screen. */
function DemoScreen({ kind, dim }: { kind: DemoKind; dim: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useMotionReduced();
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    // Each machine starts at a different point so they don't move in step.
    let tick = kind * 7;
    drawDemo(c, kind, reduced ? 34 : tick);
    if (reduced) return;
    const id = window.setInterval(() => drawDemo(c, kind, ++tick), DEMO_TICK_MS);
    return () => window.clearInterval(id);
  }, [kind, reduced]);
  return (
    <canvas
      ref={ref}
      width={DEMO_W}
      height={DEMO_H}
      className={`cab__demo px ${dim ? 'cab__demo--dim' : ''}`}
      aria-hidden="true"
    />
  );
}
