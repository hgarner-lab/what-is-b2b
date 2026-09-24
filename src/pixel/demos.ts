/**
 * Tiny "attract mode" loops for the arcade machine screens, like real
 * machines play while nobody is at them. Each is drawn on a 26×20 canvas
 * (the cabinet's screen size in art pixels) one frame per tick.
 */
import { PALETTE as P } from './sprite';

export const DEMO_W = 26;
export const DEMO_H = 20;
export const DEMO_TICK_MS = 160;

type Ctx = CanvasRenderingContext2D;

const rect = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};

function clear(c: Ctx, color = '#f4fbff') {
  rect(c, 0, 0, DEMO_W, DEMO_H, color);
}

/* ------------------------------------------------------------------
   Level 1: people pop up from behind cubicle walls, more and more of them
------------------------------------------------------------------- */
const HEADS = [
  { hair: P.coral, skin: '#ffd7b5', body: P.lilac },
  { hair: '#a8a3bd', skin: '#e8b48c', body: '#3a3f8f' },
  { hair: '#2b2233', skin: '#8d5a3b', body: P.sky },
  { hair: '#7a4a2a', skin: '#f2c29b', body: P.mint },
  { hair: '#f2c14e', skin: '#ffe0c7', body: '#4a4566' },
  { hair: '#ff8c3a', skin: '#e0a47a', body: P.sun },
];

function tinyPerson(c: Ctx, x: number, y: number, look: (typeof HEADS)[number], happy: boolean) {
  rect(c, x, y, 5, 1, look.hair);
  rect(c, x, y + 1, 5, 3, look.skin);
  rect(c, x, y + 1, 1, 1, look.hair);
  rect(c, x + 4, y + 1, 1, 1, look.hair);
  c.fillStyle = P.ink;
  c.fillRect(x + 1, y + 2, 1, 1);
  c.fillRect(x + 3, y + 2, 1, 1);
  if (happy) c.fillRect(x + 1, y + 3, 3, 1);
  rect(c, x, y + 4, 5, 3, look.body);
}

function demoBuyers(c: Ctx, t: number) {
  clear(c, '#fff8ea');
  const loop = 40;
  const f = t % loop;
  // who is up: one, then two, then everyone
  const slots = [2, 10, 18];
  const plan: [number, number, number][] = [
    // [slot, look, appear tick]
    [1, 0, 2],
    [0, 1, 10],
    [2, 2, 15],
    [0, 3, 21],
    [1, 4, 24],
    [2, 5, 27],
  ];
  for (const [slot, look, at] of plan) {
    const age = f - at;
    const next = plan.find(([s, , a]) => s === slot && a > at);
    if (age < 0 || (next && f >= next[2]) || f > 36) continue;
    const rise = Math.min(age, 4);
    const y = 13 - rise * 2 + 2;
    tinyPerson(c, slots[slot] + 1, y, HEADS[look], age > 3 && (look === 0 || f > 33));
    if (age >= 2 && age < 7 && !(look === 0 && age > 4)) {
      // question mark bubble
      rect(c, slots[slot] + 5, y - 5, 4, 4, P.white);
      c.fillStyle = P.ink;
      c.fillRect(slots[slot] + 6, y - 4, 2, 1);
      c.fillRect(slots[slot] + 7, y - 3, 1, 1);
      c.fillRect(slots[slot] + 6, y - 2, 1, 1);
    }
  }
  // cubicle walls
  slots.forEach((x) => {
    rect(c, x - 1, 15, 8, 5, P.ink);
    rect(c, x, 16, 6, 1, '#e7e3f2');
    rect(c, x, 17, 6, 3, '#8fa3d9');
  });
  // the buyers counter climbing
  const count = Math.min(7, 1 + plan.filter(([, , at]) => f >= at + 1).length);
  drawDigit(c, 21, 1, f > 36 ? 7 : Math.max(1, count - (f < 3 ? 1 : 0)));
}

const DIGITS: Record<number, string[]> = {
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'],
  7: ['###', '..#', '.#.', '.#.', '.#.'],
};

function drawDigit(c: Ctx, x: number, y: number, n: number) {
  rect(c, x - 1, y - 1, 5, 7, P.sun);
  c.fillStyle = P.ink;
  (DIGITS[n] ?? DIGITS[1]).forEach((row, dy) =>
    [...row].forEach((ch, dx) => {
      if (ch === '#') c.fillRect(x + dx, y + dy, 1, 1);
    }),
  );
}

/* ------------------------------------------------------------------
   Level 2: little blocks fall, stack and a line clears
------------------------------------------------------------------- */
const BLOCK_COLORS = [P.sky, P.sun, P.lilac, P.mint, P.coral, P.blue, P.orange];

// Each drop: column, colour, and the cells it fills (relative, 2x2 art cells)
const DROPS: { x: number; color: number; cells: [number, number][] }[] = [
  { x: 0, color: 0, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { x: 4, color: 1, cells: [[0, 0], [1, 0], [0, -1], [1, -1]] },
  { x: 6, color: 6, cells: [[0, 0], [1, 0], [2, 0], [2, -1]] },
  { x: 0, color: 3, cells: [[0, -1], [1, -1], [1, -2], [2, -2]] },
  { x: 2, color: 2, cells: [[0, -1], [1, -1], [1, -2], [2, -2]] },
  { x: 7, color: 4, cells: [[0, -1], [0, -2], [1, -2], [1, -3]] },
];

function demoBlocks(c: Ctx, t: number) {
  clear(c, '#ece6ff');
  const COLS = 9;
  const ROWS = 9;
  const ox = 4;
  const oy = 1;
  const cell = 2;
  const fallTicks = 6;
  const loop = DROPS.length * fallTicks + 10;
  const f = t % loop;
  const settled: { x: number; y: number; color: string }[] = [];
  const bottom = ROWS - 1;

  DROPS.forEach((d, i) => {
    const start = i * fallTicks;
    const progress = Math.min(1, Math.max(0, (f - start) / fallTicks));
    if (f < start) return;
    const landed = progress >= 1;
    const dy = landed ? 0 : Math.round((1 - progress) * -6);
    d.cells.forEach(([cx, cy]) => {
      settled.push({ x: d.x + cx, y: bottom + cy + dy, color: BLOCK_COLORS[d.color] });
    });
  });

  const allLanded = f >= DROPS.length * fallTicks;
  const bottomFull = settled.filter((s) => s.y === bottom).length >= COLS;
  const flashing = allLanded && bottomFull && f < DROPS.length * fallTicks + 5;
  const cleared = allLanded && f >= DROPS.length * fallTicks + 5;

  // well outline
  rect(c, ox - 1, oy - 1, COLS * cell + 2, ROWS * cell + 2, P.ink);
  rect(c, ox, oy, COLS * cell, ROWS * cell, '#ece6ff');

  settled.forEach((s) => {
    let y = s.y;
    if (cleared) {
      if (y === bottom) return;
      y += 1;
    }
    if (y < 0) return;
    const color = flashing && s.y === bottom && Math.floor(f / 1) % 2 ? P.white : s.color;
    rect(c, ox + s.x * cell, oy + y * cell, cell, cell, color);
  });
}

/* ------------------------------------------------------------------
   Level 3: a ball bouncing, knocking out bricks
------------------------------------------------------------------- */
function demoBreak(c: Ctx, t: number) {
  clear(c, '#eef8ff');
  const loop = 60;
  const f = t % loop;
  const colors = [P.coral, P.lilac, P.sky];
  // deal band
  rect(c, 1, 1, 24, 2, P.sun);
  // bricks: 3 rows x 4, knocked out in a fixed order
  const order = [9, 10, 8, 11, 5, 6, 4, 7, 1, 2, 0, 3];
  const gone = new Set(order.slice(0, Math.floor(f / 4.5)));
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 4; k++) {
      const id = r * 4 + k;
      if (gone.has(id)) continue;
      rect(c, 1 + k * 6, 5 + r * 3, 5, 2, colors[r]);
    }
  }
  if (gone.size === 12) {
    rect(c, 1, 1, 24, 2, Math.floor(f / 2) % 2 ? P.red : P.sun);
  }
  // ball: zig-zag path
  const px = 1 + Math.abs(((f * 2) % 44) - 22);
  const py = 5 + Math.abs(((f * 1.5) % 24) - 12);
  const paddleX = Math.max(1, Math.min(18, px - 3));
  rect(c, paddleX, 18, 7, 1, P.sunDark);
  rect(c, Math.round(px), Math.round(py), 2, 2, P.red);
}

export type DemoKind = 0 | 1 | 2;

export function drawDemo(c: Ctx, kind: DemoKind, tick: number) {
  if (kind === 0) demoBuyers(c, tick);
  else if (kind === 1) demoBlocks(c, tick);
  else demoBreak(c, tick);
}
