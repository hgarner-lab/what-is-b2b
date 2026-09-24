import { DEAL_VALUE } from '../../content/copy';
import { LAYERS } from './barriers';
import type { World } from './engine';

const FONT = 'Archivo, "Helvetica Neue", Arial, sans-serif';
const RED = '#e4002b';

export function draw(
  ctx: CanvasRenderingContext2D,
  world: World,
  now: number,
  opts: { won: boolean; wonAt: number; showLaunchHint: boolean; reducedMotion: boolean },
) {
  const { w, h } = world;
  ctx.clearRect(0, 0, w, h);

  // backdrop
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, w, h);

  drawGoal(ctx, world, now, opts.won, opts.wonAt);

  // bricks
  for (const br of world.bricks) {
    if (!br.alive) continue;
    const layer = LAYERS[br.layer];
    ctx.fillStyle = layer.fill;
    roundRect(ctx, br.x, br.y, br.w, br.h, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(br.x + 4, br.y + br.h - 3, br.w - 8, 3);
    drawLabel(ctx, layer.barriers[br.index].label.toUpperCase(), br.x, br.y, br.w, br.h, layer.ink);
  }

  // sparks
  world.sparks = world.sparks.filter((s) => now - s.born < (s.life ?? 600));
  for (const s of world.sparks) {
    const t = (now - s.born) / (s.life ?? 600);
    if (t < 0) continue;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = s.color;
    const x = s.x + s.vx * t;
    const y = s.y + s.vy * t + 120 * t * t * ((s.life ?? 600) / 600);
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;

  // floaters: what knocked the barrier down
  world.floaters = world.floaters.filter((f) => now - f.born < 1100);
  for (const f of world.floaters) {
    const t = (now - f.born) / 1100;
    ctx.globalAlpha = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.55) / 0.45);
    ctx.font = `800 ${Math.max(13, Math.min(17, w * 0.022))}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const y = f.y - (opts.reducedMotion ? 0 : 26 * t);
    const text = `+ ${f.text}`;
    const tw = ctx.measureText(text).width + 18;
    ctx.fillStyle = RED;
    roundRect(ctx, f.x - tw / 2, y - 14, tw, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, f.x, y + 1);
  }
  ctx.globalAlpha = 1;

  // paddle
  const p = world.paddle;
  ctx.fillStyle = '#f4f2ee';
  roundRect(ctx, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, p.h / 2);
  ctx.fill();

  // ball
  if (!opts.won) {
    const b = world.ball;
    ctx.fillStyle = 'rgba(228,0,43,0.25)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.showLaunchHint && world.ball.stuck && !opts.won) {
    ctx.font = `700 13px ${FONT}`;
    ctx.fillStyle = '#a3a09a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('CLICK, TAP OR PRESS SPACE TO LAUNCH', w / 2, p.y - 34);
  }
}

function drawGoal(ctx: CanvasRenderingContext2D, world: World, now: number, won: boolean, wonAt: number) {
  const g = world.goal;
  const size = Math.max(14, Math.min(22, g.h * 0.42));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (won) {
    const t = Math.min(1, (now - wonAt) / 500);
    const grow = 1 + 0.06 * Math.sin(Math.min(1, t) * Math.PI);
    ctx.save();
    ctx.translate(g.x + g.w / 2, g.y + g.h / 2);
    ctx.scale(grow, grow);
    ctx.fillStyle = RED;
    roundRect(ctx, -g.w / 2, -g.h / 2, g.w, g.h, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.fillText(`WON · ${DEAL_VALUE.toUpperCase()} REVENUE`, 0, 1);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -(now / 60) % 12;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  roundRect(ctx, g.x + 1, g.y + 1, g.w - 2, g.h - 2, 10);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#f4f2ee';
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.fillText(`THE DEAL · ${DEAL_VALUE.toUpperCase()}`, g.x + g.w / 2, g.y + g.h / 2 + 1);
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
  const maxW = w - 16;
  let size = Math.min(17, h * 0.4);
  let lines = [text];
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (; size >= 9; size -= 0.5) {
    ctx.font = `900 ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxW) {
      lines = [text];
      break;
    }
    const words = text.split(' ');
    if (words.length > 1 && size * 2.2 <= h) {
      let best: string[] | null = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' ');
        const b = words.slice(i).join(' ');
        const width = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
        if (width <= maxW && (!best || width < Math.max(...best.map((l) => ctx.measureText(l).width)))) {
          best = [a, b];
        }
      }
      if (best) {
        lines = best;
        break;
      }
    }
  }

  const lh = size * 1.05;
  const startY = y + h / 2 - ((lines.length - 1) * lh) / 2 + 1;
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, startY + i * lh));
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
