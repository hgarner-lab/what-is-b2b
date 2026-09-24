import { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './components/ui';
import { ReducedMotionContext, useReducedMotion, useSoundPref } from './hooks/usePrefs';
import { Intro } from './screens/Intro';
import { FinalRecap } from './screens/FinalRecap';
import { LevelOneBuyingGroup } from './levels/level1/LevelOneBuyingGroup';
import { LevelTwoFunnelBlocks } from './levels/level2/LevelTwoFunnelBlocks';
import { LevelThreeRevenueBreakout } from './levels/level3/LevelThreeRevenueBreakout';

type Screen = 'intro' | 'level1' | 'level2' | 'level3' | 'final';

const LEVEL_OF: Record<Screen, number | null> = {
  intro: null,
  level1: 1,
  level2: 2,
  level3: 3,
  final: null,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [completed, setCompleted] = useState<number[]>([]);
  const [run, setRun] = useState(0); // bumps on replay so every level starts fresh
  const [soundOn, setSoundOn] = useSoundPref();
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLElement>(null);

  const go = useCallback((next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0 });
  }, []);

  const complete = useCallback((level: number) => {
    setCompleted((c) => (c.includes(level) ? c : [...c, level]));
  }, []);

  const playAgain = useCallback(() => {
    setCompleted([]);
    setRun((r) => r + 1);
    go('level1');
  }, [go]);

  // Move keyboard focus to the new screen so screen readers follow along.
  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, [screen]);

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
          {screen === 'intro' && <Intro onStart={() => go('level1')} />}
          {screen === 'level1' && (
            <LevelOneBuyingGroup
              key={`l1-${run}`}
              onComplete={() => complete(1)}
              onNext={() => go('level2')}
            />
          )}
          {screen === 'level2' && (
            <LevelTwoFunnelBlocks
              key={`l2-${run}`}
              onComplete={() => complete(2)}
              onNext={() => go('level3')}
            />
          )}
          {screen === 'level3' && (
            <LevelThreeRevenueBreakout
              key={`l3-${run}`}
              onComplete={() => complete(3)}
              onNext={() => go('final')}
            />
          )}
          {screen === 'final' && <FinalRecap onPlayAgain={playAgain} />}
        </main>
      </div>
    </ReducedMotionContext.Provider>
  );
}
