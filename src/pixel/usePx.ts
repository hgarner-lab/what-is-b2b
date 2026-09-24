import { useEffect, useState } from 'react';

/** The current size of one art pixel in screen pixels (the CSS --px). */
export function readPx(): number {
  if (typeof window === 'undefined') return 4;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--px'));
  return Number.isFinite(v) && v > 0 ? v : 4;
}

export function usePx(): number {
  const [px, setPx] = useState(readPx);
  useEffect(() => {
    const onResize = () => setPx(readPx());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return px;
}
