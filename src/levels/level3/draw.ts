import { DEAL_VALUE } from '../../content/copy';
import { ball as ballArt } from '../../pixel/art';
import { PALETTE as P, shade } from '../../pixel/sprite';
import { LAYERS } from './barriers';
import type { World } from './engine';

/**
 * Two layers:
 * - the pixel layer is a low-resolution canvas (one canvas pixel per art
 *   pixel) scaled up, for the chunky shapes;
 * - the text layer is full resolution, so words stay sharp.
 * Both are drawn in CSS-pixel coordinates.
 */

/** Size of one art pixel in CSS pixels. Set from --px when the canvas is sized. */
let PIX = 4;
export function setPix(px: number) {
  PIX = px;
}

const PIXEL_FONT = '"Pixelify Sans", "Trebuchet MS", sans-serif';
const ARCADE_FONT = '"Press Start 2P", "Courier New", monospace';

/** Snap to the pixel grid so edges stay crisp. */
const S = (v: number) => Math.round(v / PIX) * PIX;

let ballImg: HTMLImageElement | null = null;
function getBall() {
  if (!ballImg) {
    ballImg = new Image();
    ballImg.src = ballArt();
  }
  return ballImg;
}

/** A bevelled box with a one-art-pixel outline and cut corners. */
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  x = S(x);
  y = S(y);
  w = S(w);
  h = S(h);
  const b = PIX;
  ctx.fillStyle = P.ink;
  ctx.fillRect(x + b, y, w - b * 2, h);
  ctx.fillRect(x, y + b, w, h - b * 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x + b, y + b, w - b * 2, h - b * 2);
  ctx.fillStyle = shade(fill, 0.45);
  ctx.fillRect(x + b, y + b, w - b * 2, b);
  ctx.fillStyle = shade(fill, -0.25);
  ctx.fillRect(x + b, y + h - b * 2, w - b * 2, b);
}

/** A pale city skyline along the bottom, so the play area isn't empty. */
function skyline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const base = h;
  let x = 0;
  let i = 0;
  while (x < w) {
    const bw = S(PIX * (6 + ((i * 7) % 5) * 2));
    const bh = S(h * (0.07 + (((i * 13) % 7) / 7) * 0.1));
    ctx.fillStyle = i % 2 ? '#dcefff' : '#d2e9ff';
    ctx.fillRect(x, S(base - bh), bw, bh);
    // windows
    ctx.fillStyle = '#eef8ff';
    for (let wy = base - bh + PIX * 2; wy < base - PIX * 2; wy += PIX * 3) {
      for (let wx = x + PIX * 2; wx < x + bw - PIX * 2; wx += PIX * 3) {
        if ((wx + wy + i) % 7 > 2) ctx.fillRect(S(wx), S(wy), PIX, PIX);
      }
    }
    x += bw;
    i++;
  }
}

export function draw(
  ctx: CanvasRenderingContext2D,
  tctx: CanvasRenderingContext2D,
  world: World,
  now: number,
  opts: {
    won: boolean;
    wonAt: number;
    showLaunchHint: boolean;
    continueFrom: number;
    reducedMotion: boolean;
    /** Free play: what the deal band says instead of the story's £2.4m. */
    goal?: { label: string; won: string };
  },
) {
  const { w, h } = world;
  ctx.clearRect(0, 0, w, h);
  tctx.clearRect(0, 0, w, h);

  // bright screen, faint dots, city at the bottom
  ctx.fillStyle = '#eef8ff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#d9efff';
  for (let y = PIX * 4; y < h; y += PIX * 8) for (let x = PIX * 4; x < w; x += PIX * 8) ctx.fillRect(S(x), S(y), PIX, PIX);
  skyline(ctx, w, h);

  drawGoal(ctx, tctx, world, now, opts.won, opts.wonAt, opts.goal);

  // barriers
  for (const br of world.bricks) {
    if (!br.alive) continue;
    const layer = LAYERS[br.layer];
    box(ctx, br.x, br.y, br.w, br.h, layer.fill);
    drawLabel(tctx, layer.barriers[br.index].label.toUpperCase(), br.x, br.y, br.w, br.h, layer.ink);
  }

  // sparks
  world.sparks = world.sparks.filter((s) => now - s.born < (s.life ?? 600));
  for (const s of world.sparks) {
    const t = (now - s.born) / (s.life ?? 600);
    if (t < 0) continue;
    const x = s.x + s.vx * t;
    const y = s.y + s.vy * t + 120 * t * t * ((s.life ?? 600) / 600);
    ctx.fillStyle = s.color;
    const size = t < 0.6 ? PIX * 2 : PIX;
    ctx.fillRect(S(x), S(y), size, size);
  }

  // what knocked each barrier down
  world.floaters = world.floaters.filter((f) => now - f.born < 1200);
  for (const f of world.floaters) {
    const t = (now - f.born) / 1200;
    if (t > 0.8 && Math.floor(now / 80) % 2) continue; // blink out
    const y = f.y - (opts.reducedMotion ? 0 : 28 * Math.min(1, t * 2));
    const size = Math.max(16, Math.min(22, w * 0.026));
    tctx.font = `700 ${size}px ${PIXEL_FONT}`;
    const text = `+ ${f.text}`;
    const tw = tctx.measureText(text).width + PIX * 6;
    const x = Math.max(4, Math.min(w - tw - 4, f.x - tw / 2));
    const bh = S(size + PIX * 4);
    box(ctx, x, y - bh / 2, tw, bh, P.white);
    tctx.fillStyle = P.mintDark;
    tctx.textAlign = 'left';
    tctx.textBaseline = 'middle';
    tctx.fillText(text, S(x) + PIX * 3, S(y - bh / 2) + bh / 2);
  }

  // paddle
  const p = world.paddle;
  box(ctx, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, P.sun);
  ctx.fillStyle = P.red;
  ctx.fillRect(S(p.x - p.w / 2) + PIX, S(p.y - p.h / 2) + PIX, PIX * 2, S(p.h) - PIX * 2);
  ctx.fillRect(S(p.x + p.w / 2) - PIX * 3, S(p.y - p.h / 2) + PIX, PIX * 2, S(p.h) - PIX * 2);

  // ball: the 6×6 art at one art pixel per canvas pixel
  if (!opts.won) {
    const b = world.ball;
    const img = getBall();
    const size = PIX * 6;
    if (img.complete) ctx.drawImage(img, S(b.x - size / 2), S(b.y - size / 2), size, size);
  }

  tctx.textAlign = 'center';
  if (opts.continueFrom >= 0 && !opts.won) {
    const n = Math.max(1, 3 - Math.floor(opts.continueFrom / 800));
    // Middle of the open space between the lowest barrier and the paddle.
    const bricksBottom = Math.max(...world.bricks.map((b) => b.y + b.h));
    const cy = (bricksBottom + p.y) / 2;
    const big = PIX * 12;
    tctx.textBaseline = 'middle';
    tctx.font = `${PIX * 4}px ${ARCADE_FONT}`;
    tctx.fillStyle = P.ink;
    tctx.fillText('CONTINUE?', w / 2, cy - big * 0.9);
    tctx.font = `${big}px ${ARCADE_FONT}`;
    tctx.fillText(String(n), w / 2 + PIX, cy + big * 0.3 + PIX);
    tctx.fillStyle = P.red;
    tctx.fillText(String(n), w / 2, cy + big * 0.3);
  } else if (opts.showLaunchHint && world.ball.stuck && !opts.won) {
    tctx.font = `${Math.max(10, PIX * 3)}px ${ARCADE_FONT}`;
    tctx.fillStyle = P.inkSoft;
    tctx.textBaseline = 'bottom';
    if (Math.floor(now / 500) % 2) tctx.fillText('CLICK, TAP OR SPACE TO LAUNCH', w / 2, p.y - PIX * 10);
  }
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  tctx: CanvasRenderingContext2D,
  world: World,
  now: number,
  won: boolean,
  wonAt: number,
  labels?: { label: string; won: string },
) {
  const g = world.goal;
  const size = Math.max(12, Math.min(22, g.h * 0.36, g.w / 22));
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.font = `${size}px ${ARCADE_FONT}`;

  if (won) {
    const flash = Math.floor((now - wonAt) / 150) % 2 === 0;
    box(ctx, g.x, g.y, g.w, g.h, flash ? P.red : P.sun);
    tctx.fillStyle = flash ? P.white : P.ink;
    tctx.fillText(labels?.won ?? `WON! ${DEAL_VALUE.toUpperCase()}`, g.x + g.w / 2, g.y + g.h / 2 + 1);
    return;
  }

  box(ctx, g.x, g.y, g.w, g.h, '#fff1b8');
  // little lights chasing along the top and bottom edge
  const step = PIX * 6;
  const phase = Math.floor(now / 180) % 2;
  for (let x = g.x + PIX * 3; x < g.x + g.w - PIX * 3; x += step) {
    const on = (Math.round((x - g.x) / step) + phase) % 2 === 0;
    ctx.fillStyle = on ? P.red : P.sunDark;
    ctx.fillRect(S(x), S(g.y) + PIX * 2, PIX, PIX);
    ctx.fillRect(S(x), S(g.y + g.h) - PIX * 4, PIX, PIX);
  }
  tctx.fillStyle = P.ink;
  tctx.fillText(labels?.label ?? `THE DEAL · ${DEAL_VALUE.toUpperCase()}`, g.x + g.w / 2, g.y + g.h / 2 + 1);
}

/** Draws a label that fits inside the brick, wrapping onto two lines if needed. */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
) {
  const maxW = w - 20;
  let size = Math.min(24, h * 0.46);
  let lines = [text];
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (; size >= 11; size -= 1) {
    ctx.font = `700 ${size}px ${PIXEL_FONT}`;
    if (ctx.measureText(text).width <= maxW) {
      lines = [text];
      break;
    }
    const words = text.split(' ');
    if (words.length > 1 && size * 2.1 <= h - 8) {
      let best: string[] | null = null;
      let bestW = Infinity;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' ');
        const b = words.slice(i).join(' ');
        const width = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
        if (width <= maxW && width < bestW) {
          best = [a, b];
          bestW = width;
        }
      }
      if (best) {
        lines = best;
        break;
      }
    }
  }

  const lh = size * 1.0;
  const startY = y + h / 2 - ((lines.length - 1) * lh) / 2 - 1;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, startY + i * lh));
}
