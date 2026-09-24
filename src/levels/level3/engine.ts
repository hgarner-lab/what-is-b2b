/**
 * Ball-and-paddle rules for the revenue level. Works in CSS pixels of the
 * current canvas size and can be re-laid-out when the window resizes.
 */
import { LAYERS } from './barriers';

export type Brick = {
  layer: number;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
};

export type Floater = { x: number; y: number; text: string; born: number };
export type Spark = { x: number; y: number; vx: number; vy: number; born: number; color: string; life?: number };

export type World = {
  w: number;
  h: number;
  goal: { x: number; y: number; w: number; h: number };
  bricks: Brick[];
  paddle: { x: number; y: number; w: number; h: number };
  ball: { x: number; y: number; vx: number; vy: number; r: number; stuck: boolean };
  speed: number;
  assist: number; // 0 = none, grows gently over time
  floaters: Floater[];
  sparks: Spark[];
};

export type StepEvents = {
  broke: Brick[];
  wall: boolean;
  paddle: boolean;
  missed: boolean;
};

export function createWorld(w: number, h: number, pix = 4): World {
  const world: World = {
    w,
    h,
    goal: { x: 0, y: 0, w: 0, h: 0 },
    bricks: LAYERS.flatMap((layer, li) =>
      layer.barriers.map((_, bi) => ({ layer: li, index: bi, x: 0, y: 0, w: 0, h: 0, alive: true })),
    ),
    paddle: { x: w / 2, y: 0, w: 0, h: 0 },
    ball: { x: w / 2, y: 0, vx: 0, vy: 0, r: 8, stuck: true },
    speed: 0,
    assist: 0,
    floaters: [],
    sparks: [],
  };
  layout(world, w, h, pix);
  return world;
}

/** Positions everything for the given size, keeping game progress. */
/** `pix` is the size of one art pixel, so the ball and paddle match the art. */
export function layout(world: World, w: number, h: number, pix = 4) {
  const sx = world.w ? w / world.w : 1;
  const sy = world.h ? h / world.h : 1;
  world.w = w;
  world.h = h;

  const pad = Math.max(10, Math.min(20, w * 0.025));
  const cols = w < 520 ? 2 : 4;
  const gap = w < 520 ? 6 : 8;
  const layerGap = gap * 2.2;
  const brickH = Math.max(40, Math.min(60, h * 0.085));
  const brickW = (w - pad * 2 - gap * (cols - 1)) / cols;

  world.goal = { x: pad, y: pad, w: w - pad * 2, h: Math.max(40, Math.min(56, h * 0.08)) };

  // Deal at the top, then commercial, confidence and awareness nearest the paddle.
  let y = world.goal.y + world.goal.h + layerGap * 1.3;
  for (let li = LAYERS.length - 1; li >= 0; li--) {
    const perLayer = LAYERS[li].barriers.length;
    for (let bi = 0; bi < perLayer; bi++) {
      const brick = world.bricks.find((b) => b.layer === li && b.index === bi)!;
      const col = bi % cols;
      const row = Math.floor(bi / cols);
      brick.x = pad + col * (brickW + gap);
      brick.y = y + row * (brickH + gap);
      brick.w = brickW;
      brick.h = brickH;
    }
    const rows = Math.ceil(perLayer / cols);
    y += rows * brickH + (rows - 1) * gap + layerGap;
  }

  const base = Math.min(w, 900);
  world.paddle.w = Math.max(90, base * (0.19 + world.assist * 0.08));
  world.paddle.h = 4 * pix;
  world.paddle.y = h - 30;
  world.paddle.x = clamp(world.paddle.x * sx, world.paddle.w / 2, w - world.paddle.w / 2);

  world.ball.r = 3 * pix;
  world.speed = Math.max(340, Math.min(620, Math.min(w, h * 1.3) * 0.78));
  if (world.ball.stuck) {
    world.ball.x = world.paddle.x;
    world.ball.y = world.paddle.y - world.ball.r - 2;
  } else {
    world.ball.x *= sx;
    world.ball.y *= sy;
    setSpeed(world);
  }
}

export function setAssist(world: World, level: number) {
  world.assist = level;
  world.paddle.w = Math.max(90, Math.min(world.w, 900) * (0.19 + level * 0.08));
}

export function movePaddle(world: World, x: number) {
  world.paddle.x = clamp(x, world.paddle.w / 2, world.w - world.paddle.w / 2);
  if (world.ball.stuck) world.ball.x = world.paddle.x;
}

export function launch(world: World) {
  if (!world.ball.stuck) return;
  world.ball.stuck = false;
  const angle = (-90 + (Math.random() * 30 - 15)) * (Math.PI / 180);
  world.ball.vx = Math.cos(angle) * world.speed;
  world.ball.vy = Math.sin(angle) * world.speed;
}

function setSpeed(world: World) {
  const b = world.ball;
  const len = Math.hypot(b.vx, b.vy) || 1;
  b.vx = (b.vx / len) * world.speed;
  b.vy = (b.vy / len) * world.speed;
}

/** Advance the simulation by dt seconds. */
export function step(world: World, dt: number): StepEvents {
  const ev: StepEvents = { broke: [], wall: false, paddle: false, missed: false };
  const b = world.ball;
  if (b.stuck) {
    b.x = world.paddle.x;
    b.y = world.paddle.y - b.r - 2;
    return ev;
  }

  // Gentle homing towards the nearest barrier once the player needs help.
  if (world.assist >= 2 && b.vy < 0) {
    const target = nearestAlive(world, b.x, b.y);
    if (target) {
      const tx = target.x + target.w / 2 - b.x;
      b.vx += Math.sign(tx) * Math.min(Math.abs(tx), 1) * world.speed * 0.9 * dt;
      setSpeed(world);
    }
  }

  const dist = Math.hypot(b.vx, b.vy) * dt;
  const steps = Math.max(1, Math.ceil(dist / (b.r * 0.5)));
  const sdt = dt / steps;

  for (let i = 0; i < steps; i++) {
    b.x += b.vx * sdt;
    b.y += b.vy * sdt;

    // walls
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx);
      ev.wall = true;
    } else if (b.x + b.r > world.w) {
      b.x = world.w - b.r;
      b.vx = -Math.abs(b.vx);
      ev.wall = true;
    }
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy = Math.abs(b.vy);
      ev.wall = true;
    }

    // the deal band acts like a ceiling until it's unlocked
    const g = world.goal;
    if (b.vy < 0 && b.y - b.r < g.y + g.h && b.x > g.x && b.x < g.x + g.w) {
      b.y = g.y + g.h + b.r;
      b.vy = Math.abs(b.vy);
      ev.wall = true;
    }

    // paddle
    const p = world.paddle;
    if (
      b.vy > 0 &&
      b.y + b.r >= p.y - p.h / 2 &&
      b.y + b.r <= p.y + p.h &&
      b.x >= p.x - p.w / 2 - b.r &&
      b.x <= p.x + p.w / 2 + b.r
    ) {
      const hit = clamp((b.x - p.x) / (p.w / 2), -1, 1);
      const angle = (-90 + hit * 60) * (Math.PI / 180);
      b.vx = Math.cos(angle) * world.speed;
      b.vy = Math.sin(angle) * world.speed;
      b.y = p.y - p.h / 2 - b.r;
      ev.paddle = true;
    }

    // bricks: at most one per sub-step
    for (const brick of world.bricks) {
      if (!brick.alive) continue;
      const cx = clamp(b.x, brick.x, brick.x + brick.w);
      const cy = clamp(b.y, brick.y, brick.y + brick.h);
      const dx = b.x - cx;
      const dy = b.y - cy;
      if (dx * dx + dy * dy > b.r * b.r) continue;

      brick.alive = false;
      ev.broke.push(brick);
      const overlapX = Math.min(b.x + b.r - brick.x, brick.x + brick.w - (b.x - b.r));
      const overlapY = Math.min(b.y + b.r - brick.y, brick.y + brick.h - (b.y - b.r));
      if (overlapX < overlapY) b.vx = -b.vx;
      else b.vy = -b.vy;
      break;
    }

    // missed: no penalty, just serve again
    if (b.y - b.r > world.h) {
      b.stuck = true;
      b.vx = 0;
      b.vy = 0;
      b.x = world.paddle.x;
      b.y = world.paddle.y - b.r - 2;
      ev.missed = true;
      break;
    }
  }

  // Avoid boringly flat angles.
  if (!b.stuck && Math.abs(b.vy) < world.speed * 0.25) {
    b.vy = Math.sign(b.vy || -1) * world.speed * 0.25;
    setSpeed(world);
  }

  return ev;
}

export function nearestAlive(world: World, x: number, y: number): Brick | null {
  let best: Brick | null = null;
  let bestD = Infinity;
  for (const br of world.bricks) {
    if (!br.alive) continue;
    const d = Math.hypot(br.x + br.w / 2 - x, br.y + br.h / 2 - y);
    if (d < bestD) {
      bestD = d;
      best = br;
    }
  }
  return best;
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
