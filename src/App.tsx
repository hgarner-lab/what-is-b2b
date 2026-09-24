import { useCallback, useEffect, useRef, useState } from 'react';
import { Machine } from './components/Machine';
import { TopBar } from './components/ui';
import { copy } from './content/copy';
import { ReducedMotionContext, useReducedMotion, useSoundPref } from './hooks/usePrefs';
import { ArcadeRoom, MACHINE_COLORS } from './screens/ArcadeRoom';
import { HighScores } from './screens/HighScores';
import { LevelOneBuyingGroup } from './levels/level1/LevelOneBuyingGroup';
import { LevelTwoFunnelBlocks } from './levels/level2/LevelTwoFunnelBlocks';
import { LevelThreeRevenueBreakout } from './levels/level3/LevelThreeRevenueBreakout';

type Screen = 'room' | 'level1' | 'level2' | 'level3' | 'final';

const LEVEL_OF: Record<Screen, number | null> = {
  room: null,
  level1: 1,
  level2: 2,
  level3: 3,
  final: null,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('room');
  const [next, setNext] = useState(0); // which machine is ready in the room
  const [completed, setCompleted] = useState<number[]>([]);
  const [run, setRun] = useState(0); // bumps on replay so every level starts fresh
  const [soundOn, setSoundOn] = useSoundPref();
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLElement>(null);

  const go = useCallback((to: Screen) => {
    setScreen(to);
    window.scrollTo({ top: 0 });
  }, []);

  const complete = useCallback((level: number) => {
    setCompleted((c) => (c.includes(level) ? c : [...c, level]));
  }, []);

  const backToRoom = useCallback(
    (nextMachine: number) => {
      setNext(nextMachine);
      go('room');
    },
    [go],
  );

  const playAgain = useCallback(() => {
    setCompleted([]);
    setRun((r) => r + 1);
    setNext(0);
    go('room');
  }, [go]);

  // Move keyboard focus to the new screen so screen readers follow along.
  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, [screen]);

  const machine = (i: number) => ({
    color: MACHINE_COLORS[i],
    number: i + 1,
    title: copy.machines[i].short,
  });

  return (
    <ReducedMotionContext.Provider value={reducedMotion}>
      <div className="app">
        <TopBar
          level={LEVEL_OF[screen]}
          completed={completed}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(!soundOn)}
        />
        <main className="stage" ref={stageRef} tabIndex={-1} style={{ outline: 'none' }}>
          {screen === 'room' && (
            <ArcadeRoom
              key={`room-${run}-${next}`}
              next={next}
              completed={completed}
              onEnter={(i) => go(`level${i + 1}` as Screen)}
            />
          )}
          {screen === 'level1' && (
            <Machine {...machine(0)}>
              <LevelOneBuyingGroup key={`l1-${run}`} onComplete={() => complete(1)} onNext={() => backToRoom(1)} />
            </Machine>
          )}
          {screen === 'level2' && (
            <Machine {...machine(1)}>
              <LevelTwoFunnelBlocks key={`l2-${run}`} onComplete={() => complete(2)} onNext={() => backToRoom(2)} />
            </Machine>
          )}
          {screen === 'level3' && (
            <Machine {...machine(2)}>
              <LevelThreeRevenueBreakout key={`l3-${run}`} onComplete={() => complete(3)} onNext={() => go('final')} />
            </Machine>
          )}
          {screen === 'final' && <HighScores onPlayAgain={playAgain} />}
        </main>
      </div>
    </ReducedMotionContext.Provider>
  );
}
