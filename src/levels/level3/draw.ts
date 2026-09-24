import { DEAL_VALUE } from '../../content/copy';
import { ball as ballArt } from '../../pixel/art';
import { PALETTE as P, shade } from '../../pixel/sprite';
import { LAYERS } from './barriers';
import type { World } from './engine';

/** Each canvas pixel covers PIX×PIX screen pixels, for a chunky look. */
export const PIX = 2;

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

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  x = S(x);
  y = S(y);
  w = S(w);
  h = S(h);
  const b = PIX * 2; // outline thickness
  ctx.fillStyle = P.ink;
  ctx.fillRect(x + b, y, w - b * 2, h);
  ctx.fillRect(x, y + b, w, h - b * 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x + b, y + b, w - b * 2, h - b * 2);
  ctx.fillStyle = shade(fill, 0.45);
  ctx.fillRect(x + b, y + b, w - b * 2, PIX);
  ctx.fillStyle = shade(fill, -0.25);
  ctx.fillRect(x + b, y + h - b - PIX * 2, w - b * 2, PIX * 2);
}

export function draw(
  ctx: CanvasRenderingContext2D,
  world: World,
  now: number,
  opts: { won: boolean; wonAt: number; showLaunchHint: boolean; continueFrom: number; reducedMotion: boolean },
) {
  const { w, h } = world;
  ctx.clearRect(0, 0, w, h);

  // bright screen with a faint dot grid
  ctx.fillStyle = '#eef8ff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#d9efff';
  for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) ctx.fillRect(S(x), S(y), PIX, PIX);

  drawGoal(ctx, world, now, opts.won, opts.wonAt);

  // barriers
  for (const br of world.bricks) {
    if (!br.alive) continue;
    const layer = LAYERS[br.layer];
    box(ctx, br.x, br.y, br.w, br.h, layer.fill);
    drawLabel(ctx, layer.barriers[br.index].label.toUpperCase(), br.x, br.y, br.w, br.h, layer.ink);
  }

  // sparks
  world.sparks = world.sparks.filter((s) => now - s.born < (s.life ?? 600));
  for (const s of world.sparks) {
    const t = (now - s.born) / (s.life ?? 600);
    if (t < 0) continue;
    const x = s.x + s.vx * t;
    const y = s.y + s.vy * t + 120 * t * t * ((s.life ?? 600) / 600);
    ctx.fillStyle = s.color;
    const size = t < 0.6 ? PIX * 3 : PIX * 2;
    ctx.fillRect(S(x), S(y), size, size);
  }

  // what knocked each barrier down
  world.floaters = world.floaters.filter((f) => now - f.born < 1200);
  for (const f of world.floaters) {
    const t = (now - f.born) / 1200;
    if (t > 0.8 && Math.floor(now / 80) % 2) continue; // blink out
    const y = f.y - (opts.reducedMotion ? 0 : 28 * Math.min(1, t * 2));
    const size = Math.max(16, Math.min(22, w * 0.026));
    ctx.font = `700 ${size}px ${PIXEL_FONT}`;
    const text = `+ ${f.text}`;
    const tw = ctx.measureText(text).width + 20;
    const x = Math.max(4, Math.min(w - tw - 4, f.x - tw / 2));
    box(ctx, x, y - size, tw, size * 1.9, P.white);
    ctx.fillStyle = P.mintDark;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, S(x + 10), S(y - size + size * 0.95));
  }

  // paddle
  const p = world.paddle;
  box(ctx, p.x - p.w / 2, p.y - p.h / 2 - PIX, p.w, p.h + PIX * 2, P.sun);
  ctx.fillStyle = P.red;
  ctx.fillRect(S(p.x - p.w / 2 + PIX * 2), S(p.y - p.h / 2 + PIX), PIX * 4, S(p.h - PIX * 2));
  ctx.fillRect(S(p.x + p.w / 2 - PIX * 6), S(p.y - p.h / 2 + PIX), PIX * 4, S(p.h - PIX * 2));

  // ball
  if (!opts.won) {
    const b = world.ball;
    const img = getBall();
    const size = S(b.r * 2.4);
    if (img.complete) ctx.drawImage(img, S(b.x - size / 2), S(b.y - size / 2), size, size);
  }

  ctx.textAlign = 'center';
  if (opts.continueFrom >= 0 && !opts.won) {
    const n = Math.max(1, 3 - Math.floor(opts.continueFrom / 800));
    const cy = h * 0.72;
    const big = Math.min(64, w * 0.1);
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(big * 0.4)}px ${ARCADE_FONT}`;
    ctx.fillStyle = P.ink;
    ctx.fillText('CONTINUE?', S(w / 2), S(cy - big * 0.8));
    ctx.font = `${Math.round(big)}px ${ARCADE_FONT}`;
    ctx.fillStyle = P.ink;
    ctx.fillText(String(n), S(w / 2) + PIX * 2, S(cy + big * 0.35) + PIX * 2);
    ctx.fillStyle = P.red;
    ctx.fillText(String(n), S(w / 2), S(cy + big * 0.35));
  } else if (opts.showLaunchHint && world.ball.stuck && !opts.won) {
    ctx.font = `${Math.max(10, Math.min(14, w * 0.016))}px ${ARCADE_FONT}`;
    ctx.fillStyle = P.inkSoft;
    ctx.textBaseline = 'bottom';
    if (Math.floor(now / 500) % 2) ctx.fillText('CLICK, TAP OR SPACE TO LAUNCH', S(w / 2), S(p.y - 40));
  }
}

function drawGoal(ctx: CanvasRenderingContext2D, world: World, now: number, won: boolean, wonAt: number) {
  const g = world.goal;
  const size = Math.max(12, Math.min(22, g.h * 0.36, g.w / 22));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (won) {
    const flash = Math.floor((now - wonAt) / 150) % 2 === 0;
    box(ctx, g.x, g.y, g.w, g.h, flash ? P.red : P.sun);
    ctx.fillStyle = flash ? P.white : P.ink;
    ctx.font = `${size}px ${ARCADE_FONT}`;
    ctx.fillText(`WON! ${DEAL_VALUE.toUpperCase()}`, S(g.x + g.w / 2), S(g.y + g.h / 2) + PIX);
    return;
  }

  box(ctx, g.x, g.y, g.w, g.h, '#fff1b8');
  // little lights chasing along the top and bottom edge
  const step = 24;
  const phase = Math.floor(now / 180) % 2;
  for (let x = g.x + 12; x < g.x + g.w - 12; x += step) {
    const on = (Math.floor((x - g.x) / step) + phase) % 2 === 0;
    ctx.fillStyle = on ? P.red : P.sunDark;
    ctx.fillRect(S(x), S(g.y + PIX * 3), PIX * 2, PIX * 2);
    ctx.fillRect(S(x), S(g.y + g.h - PIX * 7), PIX * 2, PIX * 2);
  }
  ctx.fillStyle = P.ink;
  ctx.font = `${size}px ${ARCADE_FONT}`;
  ctx.fillText(`THE DEAL · ${DEAL_VALUE.toUpperCase()}`, S(g.x + g.w / 2), S(g.y + g.h / 2) + PIX);
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
  const startY = y + h / 2 - ((lines.length - 1) * lh) / 2 - PIX;
  lines.forEach((line, i) => ctx.fillText(line, S(x + w / 2), S(startY + i * lh)));
}
