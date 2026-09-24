/**
 * Free play progress, kept in this browser only. Storage can be blocked
 * (private windows, strict settings), so every read and write is guarded
 * and the game works without it.
 */
const UNLOCK_KEY = 'wib2b:freeplay';
const BEST_KEY = (game: number) => `wib2b:best:${game}`;

export function isFreePlayUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY) === 'yes';
  } catch {
    return false;
  }
}

export function unlockFreePlay() {
  try {
    localStorage.setItem(UNLOCK_KEY, 'yes');
  } catch {
    /* fine: free play is still open for this visit */
  }
}

export function getBest(game: number): number {
  try {
    return Number(localStorage.getItem(BEST_KEY(game))) || 0;
  } catch {
    return 0;
  }
}

/** Saves the score if it beats the best. Returns true for a new best. */
export function saveBest(game: number, score: number): boolean {
  const best = getBest(game);
  if (score <= best) return false;
  try {
    localStorage.setItem(BEST_KEY(game), String(score));
  } catch {
    /* ignore */
  }
  return true;
}

/** How each game's score is shown. Game 3 scores are in £k. */
export function formatScore(game: number, score: number): string {
  if (game !== 2) return String(score);
  if (!score) return '£0';
  if (score >= 1000) return `£${(score / 1000).toFixed(1)}m`;
  return `£${score}k`;
}
