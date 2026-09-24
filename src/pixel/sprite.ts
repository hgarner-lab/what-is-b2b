/**
 * Tiny pixel-art toolkit.
 *
 * Art is drawn at its true pixel size (e.g. 16×20) onto a small canvas and
 * turned into an image. The page then shows it scaled up with
 * `image-rendering: pixelated`, so every pixel stays crisp and square.
 */

export const PALETTE = {
  ink: '#262047',
  inkSoft: '#5b5680',
  white: '#ffffff',
  cream: '#fff3dc',
  creamDark: '#f6dfb4',
  sky: '#58c4ff',
  skyDark: '#2a8fd6',
  skyPale: '#ddf3ff',
  sun: '#ffcb3d',
  sunDark: '#e89b12',
  mint: '#48d597',
  mintDark: '#1fa36a',
  coral: '#ff7b9c',
  coralDark: '#d94a72',
  lilac: '#9c82ff',
  lilacDark: '#6a4fe0',
  blue: '#4a6cf7',
  orange: '#ff9a3c',
  red: '#e4002b',
  redDark: '#a3001f',
  grey: '#b9b4cc',
  greyDark: '#8a84a3',
} as const;

const cache = new Map<string, string>();

export type Painter = {
  px: (x: number, y: number, color: string) => void;
  rect: (x: number, y: number, w: number, h: number, color: string) => void;
};

/** Paint a sprite with code. Result is cached by key. */
export function paint(key: string, w: number, h: number, draw: (p: Painter) => void): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rect = (x: number, y: number, rw: number, rh: number, color: string) => {
    if (color === 'transparent') {
      ctx.clearRect(x, y, rw, rh);
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, rw, rh);
  };
  draw({ px: (x, y, c) => rect(x, y, 1, 1, c), rect });
  const url = canvas.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

/**
 * Paint a sprite from rows of characters. Each character is looked up in
 * `colors`; '.' is transparent.
 */
export function fromRows(key: string, rows: string[], colors: Record<string, string>): string {
  const w = Math.max(...rows.map((r) => r.length));
  return paint(key, w, rows.length, (p) => {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '.' || ch === ' ') return;
        const c = colors[ch];
        if (!c && import.meta.env.DEV) console.warn(`sprite ${key}: no colour for "${ch}"`);
        if (c) p.px(x, y, c);
      }),
    );
  });
}

/** Mix a hex colour towards white (amt > 0) or black (amt < 0). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)),
  );
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
