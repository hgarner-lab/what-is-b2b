import { createContext, useContext, useEffect, useState } from 'react';
import { sound } from '../audio/sound';

const SOUND_KEY = 'wib2b:sound';

function readSoundPref(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function useSoundPref() {
  const [soundOn, setSoundOn] = useState(readSoundPref);

  useEffect(() => {
    sound.setEnabled(soundOn);
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
    } catch {
      /* storage can be unavailable; the toggle still works for this visit */
    }
  }, [soundOn]);

  return [soundOn, setSoundOn] as const;
}

export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function useCoarsePointer(): boolean {
  const query = '(pointer: coarse)';
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return coarse;
}

export const ReducedMotionContext = createContext(false);
export const useMotionReduced = () => useContext(ReducedMotionContext);
