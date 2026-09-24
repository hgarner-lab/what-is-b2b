/**
 * Pure rules for the block-stacking level. No React, no DOM.
 */
import { BLOCKS, type BlockType } from './blocks';

export const COLS = 6;
export const ROWS = 12;

export type Cell = { type: BlockType; id: number } | null;
export type Board = Cell[][];
export type Shape = number[][];

export type Piece = {
  type: BlockType;
  shape: Shape;
  x: number;
  y: number;
  id: number;
};

/** Small, friendly shapes. Nothing awkward. */
export const SHAPES: Record<string, Shape> = {
  i2: [[1, 1]],
  i3: [[1, 1, 1]],
  l3: [
    [1, 0],
    [1, 1],
  ],
  o: [
    [1, 1],
    [1, 1],
  ],
  i4: [[1, 1, 1, 1]],
  l4: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  t4: [
    [0, 1, 0],
    [1, 1, 1],
  ],
};

const SHAPE_BAG = ['i2', 'i3', 'i3', 'l3', 'l3', 'o', 'i4', 'l4', 't4'];

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

export function rotate(shape: Shape): Shape {
  const h = shape.length;
  const w = shape[0].length;
  return Array.from({ length: w }, (_, r) => Array.from({ length: h }, (_, c) => shape[h - 1 - c][r]));
}

export function cellsOf(p: Pick<Piece, 'shape' | 'x' | 'y'>): [number, number][] {
  const out: [number, number][] = [];
  p.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) out.push([p.y + r, p.x + c]);
    }),
  );
  return out;
}

export function collides(board: Board, p: Pick<Piece, 'shape' | 'x' | 'y'>): boolean {
  return cellsOf(p).some(
    ([r, c]) => c < 0 || c >= COLS || r >= ROWS || (r >= 0 && board[r][c] !== null),
  );
}

/** Try to rotate, nudging sideways if it bumps a wall. */
export function tryRotate(board: Board, p: Piece): Piece | null {
  const shape = rotate(p.shape);
  for (const dx of [0, -1, 1, -2, 2]) {
    const next = { ...p, shape, x: p.x + dx };
    if (!collides(board, next)) return next;
  }
  return null;
}

export function dropDistance(board: Board, p: Piece): number {
  let d = 0;
  while (!collides(board, { ...p, y: p.y + d + 1 })) d++;
  return d;
}

export function merge(board: Board, p: Piece): Board {
  const next = board.map((row) => row.slice());
  cellsOf(p).forEach(([r, c]) => {
    if (r >= 0) next[r][c] = { type: p.type, id: p.id };
  });
  return next;
}

export function fullRows(board: Board): number[] {
  return board.map((row, i) => (row.every(Boolean) ? i : -1)).filter((i) => i >= 0);
}

export function removeRows(board: Board, rows: number[]): Board {
  const kept = board.filter((_, i) => !rows.includes(i));
  const fresh = Array.from({ length: rows.length }, () => Array<Cell>(COLS).fill(null));
  return [...fresh, ...kept];
}

export function spawn(type: BlockType, shapeKey: string, id: number): Piece {
  const shape = SHAPES[shapeKey];
  return { type, shape, id, x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
}

/**
 * Chooses the next piece. It opens with two flat Awareness pieces (which
 * neatly fill a row on their own) so the player feels the "awareness alone
 * isn't enough" moment, then leans towards the steps still missing.
 */
export function makeRandomiser() {
  const opening: [BlockType, string][] = [
    ['awareness', 'i3'],
    ['awareness', 'i3'],
    ['content', 'l3'],
  ];
  let n = 0;
  const dealt = new Map<BlockType, number>();
  const deal = (type: BlockType, shape: string): [BlockType, string] => {
    dealt.set(type, (dealt.get(type) ?? 0) + 1);
    return [type, shape];
  };
  const any = () => BLOCKS[Math.floor(Math.random() * BLOCKS.length)].type;

  return (lit: Set<BlockType>, urgent: boolean): [BlockType, string] => {
    if (n < opening.length) {
      const [type, shape] = opening[n++];
      return deal(type, shape);
    }
    n++;
    const shape = SHAPE_BAG[Math.floor(Math.random() * SHAPE_BAG.length)];
    // Steps not reached yet, least-dealt first (ties keep journey order).
    const missing = BLOCKS.map((b) => b.type)
      .filter((t) => !lit.has(t))
      .sort((a, b) => (dealt.get(a) ?? 0) - (dealt.get(b) ?? 0));
    if (!missing.length) return deal(any(), shape);
    const roll = Math.random();
    if (urgent || roll < 0.6) return deal(missing[0], shape);
    if (roll < 0.88) return deal(missing[Math.floor(Math.random() * missing.length)], shape);
    return deal(any(), shape);
  };
}
