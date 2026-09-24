/**
 * Pure rules for the block-stacking level. No React, no DOM.
 */
import { BLOCK, BLOCKS, type BlockType } from './blocks';

export const COLS = 10;
export const ROWS = 18;

/** 'filler' is the grey starter block: it isn't any kind of marketing. */
export type CellType = BlockType | 'filler';
export type Cell = { type: CellType; id: number } | null;
export type Board = Cell[][];
export type Shape = number[][];

export type Piece = {
  type: BlockType;
  shape: Shape;
  x: number;
  y: number;
  id: number;
};

/** The seven classic shapes. */
export const SHAPES: Record<string, Shape> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

export const shapeOf = (type: BlockType): Shape => SHAPES[BLOCK[type].shape];

/** Where the opening Awareness bar drops in to finish the bottom row. */
export const OPENING_GAP = { x: 3, w: 4 };

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

/**
 * The board starts with a row of Awareness missing four squares, and two
 * grey rows above it with a few gaps. The first piece is an Awareness bar
 * that fits the bottom gap exactly, so the first line cleared is all
 * awareness. The grey rows then clear quickly with a mix of marketing,
 * which gets the journey moving early.
 */
export function openingBoard(): Board {
  const board = emptyBoard();
  const gap = (c: number) => c >= OPENING_GAP.x && c < OPENING_GAP.x + OPENING_GAP.w;
  for (let c = 0; c < COLS; c++) {
    if (!gap(c)) board[ROWS - 1][c] = { type: 'awareness', id: -1 };
    if (!gap(c) && c !== 0) board[ROWS - 2][c] = { type: 'filler', id: -2 };
    if (!gap(c) && c !== 0 && c !== COLS - 1) board[ROWS - 3][c] = { type: 'filler', id: -3 };
  }
  return board;
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
  return cellsOf(p).some(([r, c]) => c < 0 || c >= COLS || r >= ROWS || (r >= 0 && board[r][c] !== null));
}

/** Try to rotate, nudging sideways or up if it bumps something. */
export function tryRotate(board: Board, p: Piece): Piece | null {
  const shape = rotate(p.shape);
  for (const [dx, dy] of [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
  ]) {
    const next = { ...p, shape, x: p.x + dx, y: p.y + dy };
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

export function spawn(type: BlockType, id: number, x?: number): Piece {
  const shape = shapeOf(type);
  return { type, shape, id, x: x ?? Math.floor((COLS - shape[0].length) / 2), y: 0 };
}

/**
 * Chooses the next piece. After the opening Awareness bar it leans towards
 * the steps of the journey that haven't lit up yet, so every kind of
 * marketing turns up, but it still feels random.
 */
export function makeRandomiser() {
  let n = 0;
  const dealt = new Map<BlockType, number>();
  const deal = (type: BlockType) => {
    dealt.set(type, (dealt.get(type) ?? 0) + 1);
    return type;
  };
  const any = () => BLOCKS[Math.floor(Math.random() * BLOCKS.length)].type;
  let last: BlockType | null = null;

  return (lit: Set<BlockType>, urgent: boolean): BlockType => {
    if (n++ === 0) return (last = deal('awareness'));
    const missing = BLOCKS.map((b) => b.type)
      .filter((t) => !lit.has(t) && t !== last)
      .sort((a, b) => (dealt.get(a) ?? 0) - (dealt.get(b) ?? 0));
    let pick: BlockType;
    const roll = Math.random();
    if (!missing.length) pick = any();
    else if (urgent || roll < 0.5) pick = missing[0];
    else if (roll < 0.8) pick = missing[Math.floor(Math.random() * missing.length)];
    else pick = any();
    if (pick === last) pick = any();
    return (last = deal(pick));
  };
}
