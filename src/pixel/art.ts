/**
 * All the pixel art in the game. Everything is drawn at true pixel size and
 * scaled up on screen.
 */
import { PALETTE as P, fromRows, paint, shade } from './sprite';

/* ------------------------------------------------------------------
   Frames (9-slice). Used as border-image so panels, buttons and speech
   bubbles have crisp pixel edges at any size.
------------------------------------------------------------------- */

export function panelFrame(fill: string = P.white, key = 'panel'): string {
  return paint(`frame-${key}-${fill}`, 8, 8, (p) => {
    p.rect(1, 0, 6, 1, P.ink);
    p.rect(1, 7, 6, 1, P.ink);
    p.rect(0, 1, 1, 6, P.ink);
    p.rect(7, 1, 1, 6, P.ink);
    p.rect(1, 1, 6, 6, fill);
    p.rect(1, 6, 6, 1, shade(fill, -0.12));
  });
}

export function buttonFrame(face: string, pressed = false): string {
  return paint(`btn-${face}-${pressed}`, 8, 9, (p) => {
    const light = shade(face, 0.45);
    const dark = shade(face, -0.28);
    p.rect(1, 0, 6, 1, P.ink);
    p.rect(1, 8, 6, 1, P.ink);
    p.rect(0, 1, 1, 7, P.ink);
    p.rect(7, 1, 1, 7, P.ink);
    if (pressed) {
      p.rect(1, 1, 6, 7, face);
      p.rect(1, 1, 6, 1, dark);
      p.rect(1, 7, 6, 1, dark);
    } else {
      p.rect(1, 1, 6, 5, face);
      p.rect(1, 1, 6, 1, light);
      p.rect(1, 6, 6, 2, dark);
    }
  });
}

export function bubbleFrame(): string {
  return paint('bubble', 6, 6, (p) => {
    p.rect(1, 0, 4, 1, P.ink);
    p.rect(1, 5, 4, 1, P.ink);
    p.rect(0, 1, 1, 4, P.ink);
    p.rect(5, 1, 1, 4, P.ink);
    p.rect(1, 1, 4, 4, P.white);
  });
}

export const bubbleTail = () =>
  fromRows('bubble-tail', ['kwwwk', '.kwk.', '..k..'], { k: P.ink, w: P.white });

/** The dark bezel round a machine's screen. */
export function bezelFrame(): string {
  return paint('bezel', 10, 10, (p) => {
    p.rect(1, 0, 8, 10, P.ink);
    p.rect(0, 1, 10, 8, P.ink);
    p.rect(2, 2, 6, 6, '#3a3462');
    p.rect(3, 3, 4, 4, '#f4fbff');
  });
}

/** Front of a cabinet, used round the playing screen. */
export function cabinetFrame(body: string): string {
  return paint(`cabframe-${body}`, 12, 12, (p) => {
    p.rect(0, 0, 12, 12, P.ink);
    p.rect(1, 1, 10, 10, body);
    p.rect(1, 1, 2, 10, shade(body, -0.3));
    p.rect(9, 1, 2, 10, shade(body, -0.3));
    p.rect(3, 1, 1, 10, shade(body, 0.35));
  });
}

/** Marquee sign with light bulbs round the edge (repeats cleanly). */
export function marqueeFrame(band: string = P.red, fill: string = P.sun): string {
  return paint(`marquee-${band}-${fill}`, 12, 12, (p) => {
    p.rect(0, 0, 12, 12, P.ink);
    p.rect(1, 1, 10, 10, band);
    p.rect(3, 3, 6, 6, P.ink);
    p.rect(4, 4, 4, 4, fill);
    const bulb = (x: number, y: number) => {
      p.rect(x, y, 2, 2, '#fff6c9');
      p.px(x, y, P.white);
    };
    [1, 5, 9].forEach((x) => {
      bulb(x, 1);
      bulb(x, 9);
    });
    [5].forEach((y) => {
      bulb(1, y);
      bulb(9, y);
    });
  });
}

/** Cubicle partition people pop up from behind. */
export function cubicleFrame(): string {
  return paint('cubicle', 8, 8, (p) => {
    p.rect(0, 0, 8, 8, P.ink);
    p.rect(1, 1, 6, 1, '#e7e3f2');
    p.rect(1, 2, 6, 1, P.grey);
    p.rect(1, 4, 6, 3, '#8fa3d9');
    p.rect(1, 6, 6, 1, '#7a8fc7');
  });
}

/* ------------------------------------------------------------------
   Room tiles
------------------------------------------------------------------- */

export const wallTile = () =>
  paint('wall', 16, 16, (p) => {
    p.rect(0, 0, 16, 16, P.cream);
    p.px(3, 3, P.creamDark);
    p.px(4, 3, P.creamDark);
    p.px(11, 11, P.creamDark);
    p.px(12, 11, P.creamDark);
  });

export const floorTile = () =>
  paint('floor', 16, 16, (p) => {
    p.rect(0, 0, 16, 16, '#efe8ff');
    p.rect(0, 0, 8, 8, '#d9ceff');
    p.rect(8, 8, 8, 8, '#d9ceff');
  });

export const screenTile = () =>
  paint('screen-scan', 4, 4, (p) => {
    p.rect(0, 0, 4, 4, '#f4fbff');
    p.rect(0, 3, 4, 1, '#e9f6ff');
  });

/* ------------------------------------------------------------------
   Arcade cabinet (40 × 66). Marquee and screen are left as flat areas so
   real text can sit on top of them.
------------------------------------------------------------------- */

export const CABINET = {
  w: 40,
  h: 66,
  marquee: { x: 5, y: 2, w: 30, h: 8 },
  screen: { x: 7, y: 14, w: 26, h: 20 },
  slot: { x: 20, y: 52 },
};

export function cabinet(body: string, lit = true): string {
  return paint(`cab-${body}-${lit}`, CABINET.w, CABINET.h, (p) => {
    const dark = shade(body, -0.3);
    const light = shade(body, 0.35);
    const K = P.ink;
    // silhouette
    p.rect(0, 0, 40, 66, K);
    p.rect(1, 1, 38, 64, body);
    // side panels
    p.rect(1, 1, 3, 64, dark);
    p.rect(36, 1, 3, 64, dark);
    p.rect(4, 1, 1, 64, light);
    // marquee
    p.rect(4, 1, 32, 10, K);
    p.rect(5, 2, 30, 8, lit ? '#fff3b0' : '#e2dccb');
    p.rect(1, 11, 38, 1, dark);
    // screen bezel
    p.rect(5, 12, 30, 24, K);
    p.rect(6, 13, 28, 22, '#3a3462');
    p.rect(7, 14, 26, 20, lit ? '#f4fbff' : '#cfd6e6');
    p.px(7, 14, P.white);
    // control panel (sticks out)
    p.rect(0, 36, 40, 1, K);
    p.rect(1, 37, 38, 1, light);
    p.rect(1, 38, 38, 5, body);
    p.rect(0, 43, 40, 1, K);
    p.rect(1, 42, 38, 1, dark);
    // joystick
    p.rect(11, 37, 3, 2, P.red);
    p.px(11, 37, shade(P.red, 0.5));
    p.rect(12, 39, 1, 2, K);
    p.rect(10, 41, 5, 1, K);
    // buttons
    [
      [22, P.sun],
      [26, P.mint],
      [30, P.coral],
    ].forEach(([x, c]) => {
      p.rect(x as number, 39, 3, 2, K);
      p.rect(x as number, 39, 2, 1, c as string);
    });
    // coin door
    p.rect(13, 47, 14, 12, K);
    p.rect(14, 48, 12, 10, dark);
    // one coin slot, lit when the machine is ready
    p.rect(17, 49, 6, 6, K);
    p.rect(18, 50, 4, 4, lit ? P.red : P.greyDark);
    p.px(18, 50, lit ? shade(P.red, 0.5) : P.grey);
    p.rect(19, 51, 2, 2, K);
    p.rect(19, 56, 2, 1, P.grey);
    // kick plate
    p.rect(1, 61, 38, 4, K);
    p.rect(5, 62, 30, 2, '#3a3462');
  });
}

/* ------------------------------------------------------------------
   Small things
------------------------------------------------------------------- */

export const coin = (gold = true) =>
  fromRows(
    `coin-${gold}`,
    ['..kkkk..', '.kyyyyk.', 'kyYyyyyk', 'kyYyyyDk', 'kyYyyyDk', 'kyyyyyDk', '.kyDDDk.', '..kkkk..'],
    gold
      ? { k: P.ink, y: P.sun, Y: '#fff1a8', D: P.sunDark }
      : { k: P.greyDark, y: '#e9e6f2', Y: P.white, D: P.grey },
  );

export const star = (c: string = P.sun) =>
  fromRows(
    `star-${c}`,
    ['...k...', '..kyk..', 'kkkyykk', 'kyyyyyk', '.kyyyk.', 'kykkkyk', 'kk...kk'],
    { k: P.ink, y: c },
  );

export const check = () =>
  fromRows('check', ['......k', '.....kk', 'k...kk.', 'kk.kk..', '.kkk...', '..k....'], { k: P.ink });

export const speaker = (on: boolean) =>
  fromRows(
    `speaker-${on}`,
    on
      ? ['...k....', '..kk..k.', 'kkkk.k.k', 'kkkk.k.k', 'kkkk.k.k', '..kk..k.', '...k....']
      : ['...k....', '..kk....', 'kkkk.k.k', 'kkkk..k.', 'kkkk.k.k', '..kk....', '...k....'],
    { k: P.ink },
  );

export const ball = () =>
  fromRows('ball', ['.kkkk.', 'kwrrrk', 'krrrrk', 'krrrrk', 'krrrrk', '.kkkk.'], {
    k: P.ink,
    w: '#ff8aa0',
    r: P.red,
  });

/** One square of a falling block, bevelled like a classic block game. */
export function block(color: string, size = 8): string {
  return paint(`block-${color}-${size}`, size, size, (p) => {
    const n = size;
    p.rect(0, 0, n, n, P.ink);
    p.rect(1, 1, n - 2, n - 2, color);
    p.rect(1, 1, n - 2, 1, shade(color, 0.5));
    p.rect(1, 1, 1, n - 2, shade(color, 0.5));
    p.rect(1, n - 2, n - 2, 1, shade(color, -0.3));
    p.rect(n - 2, 1, 1, n - 2, shade(color, -0.3));
    if (n >= 7) p.px(2, 2, P.white);
  });
}

export function ghostBlock(color: string): string {
  return paint(`ghost-${color}`, 8, 8, (p) => {
    for (let i = 0; i < 8; i += 2) {
      p.px(i, 0, color);
      p.px(i + 1, 7, color);
      p.px(0, i + 1, color);
      p.px(7, i, color);
    }
  });
}

/** Grey starter block in the falling-blocks level: not any kind of marketing. */
export const fillerBlock = () => block('#cfc9e0');

/** The empty board background, one tile per square. */
export const wellCell = () =>
  paint('well-cell', 8, 8, (p) => {
    p.rect(0, 0, 8, 8, '#ece6ff');
    p.rect(0, 0, 8, 1, '#ddd4ff');
    p.rect(0, 0, 1, 8, '#ddd4ff');
  });

/* ------------------------------------------------------------------
   People (22 × 20). Same body, different hair, colours and props.
------------------------------------------------------------------- */

const BASE = [
  '................',
  '................',
  '....kkkkkkkk....',
  '...khhhhhhhhk...',
  '..khhhhhhhhhhk..',
  '..khhssssssshk..',
  '..kssssssssssk..',
  '..kssessssessk..',
  '..kpsssssssspk..',
  '..kssssmmssssk..',
  '...kssssssssk...',
  '....kkSSSSkk....',
  '..kccwwttwwcck..',
  '.kcccwwttwwccck.',
  '.kccccwttwcccck.',
  '.kcccccttccccck.',
  '.kcCcccttcccCck.',
  '.kcCccccccccCck.',
  '.ksCccccccccCsk.',
  '.kkcccccccccckk.',
];

const HAIR: Record<string, (rows: string[][]) => void> = {
  short: () => {},
  long: (g) => {
    for (let y = 6; y <= 11; y++) {
      g[y][1] = 'k';
      g[y][2] = 'h';
      g[y][13] = 'h';
      g[y][14] = 'k';
    }
  },
  bun: (g) => {
    g[0] = [...'......kkkk......'];
    g[1] = [...'.....khhhhk.....'];
  },
  curly: (g) => {
    g[2] = [...'...kkkkkkkkkk...'];
    g[3] = [...'..khhhhhhhhhhk..'];
    g[4] = [...'.khhhhhhhhhhhhk.'];
    g[5] = [...'.khhsssssssshhk.'];
  },
  shades: (g) => {
    g[3] = [...'...khhhhhhhhk...'];
    g[7] = [...'..kskkkssskkkk..'];
  },
  crown: (g) => {
    g[0] = [...'....y..yy..y....'];
    g[1] = [...'....yyyyyyyy....'];
  },
};

type Prop = { x: number; y: number; rows: string[] };

const PROPS: Record<string, Prop> = {
  megaphone: {
    x: 14,
    y: 6,
    rows: ['......kk', '....kkyk', 'kkkkyyyk', 'kaaayyyk', 'kkkkyyyk', '....kkyk', '......kk'],
  },
  calculator: {
    x: 14,
    y: 11,
    rows: ['kkkkkk', 'kTTTTk', 'kkkkkk', 'kbWbWk', 'kbbbbk', 'kbWbWk', 'kbbbbk', 'kkkkkk'],
  },
  laptop: {
    x: 13,
    y: 12,
    rows: ['.kkkkkkk', '.kqqqqqk', '.kqWqqqk', '.kqqqqqk', 'kkkkkkkk', 'kbbbbbbk', 'kkkkkkkk'],
  },
  clipboard: {
    x: 14,
    y: 10,
    rows: ['..kk..', 'kkyykk', 'knWWnk', 'knkknk', 'knWWnk', 'knkknk', 'knWWnk', 'kkkkkk'],
  },
  briefcase: {
    x: 13,
    y: 13,
    rows: ['..kkkk..', '..k..k..', 'kkkkkkkk', 'knnyynnk', 'knnnnnnk', 'knnnnnnk', 'kkkkkkkk'],
  },
  padlock: {
    x: 14,
    y: 9,
    rows: ['.kkkk.', 'k....k', 'k....k', 'kkkkkk', 'kyyyyk', 'kyykyk', 'kyykyk', 'kkkkkk'],
  },
  mug: {
    x: 14,
    y: 9,
    rows: ['v..v...', '.v..v..', 'kkkkk..', 'kWWWkkk', 'kWrWk.k', 'kWWWkkk', 'kkkkk..'],
  },
};

type Look = {
  hair: keyof typeof HAIR;
  prop?: keyof typeof PROPS;
  colors: { h: string; s: string; S: string; c: string; C: string; w: string; t: string };
};

export const LOOKS: Record<string, Look> = {
  cmo: {
    hair: 'long',
    prop: 'megaphone',
    colors: { h: P.coral, s: '#ffd7b5', S: '#e9b48c', c: P.lilac, C: P.lilacDark, w: P.white, t: P.sun },
  },
  cfo: {
    hair: 'short',
    prop: 'calculator',
    colors: { h: '#a8a3bd', s: '#e8b48c', S: '#c98f66', c: '#3a3f8f', C: '#2a2d6b', w: P.white, t: P.sun },
  },
  cio: {
    hair: 'short',
    prop: 'laptop',
    colors: { h: '#2b2233', s: '#8d5a3b', S: '#6e4128', c: P.sky, C: P.skyDark, w: P.sky, t: P.white },
  },
  procurement: {
    hair: 'short',
    prop: 'clipboard',
    colors: { h: '#7a4a2a', s: '#f2c29b', S: '#d9a077', c: P.mint, C: P.mintDark, w: P.white, t: P.mintDark },
  },
  legal: {
    hair: 'bun',
    prop: 'briefcase',
    colors: { h: '#f2c14e', s: '#ffe0c7', S: '#e8b99a', c: '#4a4566', C: '#332f4d', w: P.white, t: P.red },
  },
  user: {
    hair: 'curly',
    prop: 'mug',
    colors: { h: '#ff8c3a', s: '#e0a47a', S: '#c07f55', c: P.sun, C: P.sunDark, w: P.sun, t: P.orange },
  },
  security: {
    hair: 'shades',
    prop: 'padlock',
    colors: { h: '#1f1a2e', s: '#c98a5e', S: '#a86c43', c: '#5b5680', C: '#433f63', w: P.white, t: P.mint },
  },
  ceo: {
    hair: 'crown',
    colors: { h: '#dcdcec', s: '#6b4028', S: '#4f2c1b', c: '#3b3561', C: '#2a254a', w: P.white, t: P.red },
  },
};

export function person(id: string, happy = false): string {
  const look = LOOKS[id];
  const grid = BASE.map((r) => [...r.padEnd(22, '.')]);
  HAIR[look.hair](grid);
  grid.forEach((row, y) => (grid[y] = [...row.join('').padEnd(22, '.')]));
  if (happy) {
    // big open smile
    const row = grid[9].join('').replace('smms', 'mmmm');
    grid[9] = [...row];
  }
  const prop = look.prop ? PROPS[look.prop] : null;
  if (prop) {
    prop.rows.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (ch !== '.') grid[prop.y + dy][prop.x + dx] = ch;
      }),
    );
  }
  return fromRows(
    `person-${id}-${happy}`,
    grid.map((r) => r.join('')),
    {
      k: P.ink,
      e: P.ink,
      m: '#8a2a3a',
      p: '#ffa3b1',
      y: P.sun,
      a: P.coral,
      b: P.grey,
      W: P.white,
      T: '#b8f5d6',
      q: P.skyPale,
      n: '#8a5a33',
      r: P.red,
      v: P.grey,
      ...look.colors,
    },
  );
}

export const PERSON_SIZE = { w: 22, h: 20 };

/* ------------------------------------------------------------------
   Office decor for the Level 1 cubicles
------------------------------------------------------------------- */

export type WindowView = 'clouds' | 'city' | 'sun';

export function officeWindow(view: WindowView): string {
  return paint(`win-${view}`, 16, 11, (p) => {
    p.rect(0, 0, 16, 11, P.ink);
    p.rect(1, 1, 14, 9, P.white);
    p.rect(2, 2, 12, 7, '#bfe9ff');
    if (view === 'clouds') {
      p.rect(3, 4, 4, 1, P.white);
      p.rect(4, 3, 2, 1, P.white);
      p.rect(9, 6, 4, 1, P.white);
      p.rect(10, 5, 2, 1, P.white);
    } else if (view === 'city') {
      p.rect(2, 6, 3, 3, '#8fa3d9');
      p.rect(5, 4, 2, 5, '#6f84c4');
      p.rect(7, 5, 3, 4, '#8fa3d9');
      p.rect(10, 3, 2, 6, '#6f84c4');
      p.rect(12, 6, 2, 3, '#8fa3d9');
      p.px(5, 5, P.sun);
      p.px(10, 4, P.sun);
      p.px(11, 6, P.sun);
    } else {
      p.rect(9, 3, 3, 3, P.sun);
      p.px(10, 2, P.sun);
      p.px(8, 4, P.sun);
      p.px(12, 4, P.sun);
      p.px(10, 6, P.sun);
      p.rect(2, 8, 12, 1, P.mint);
    }
    p.rect(7, 1, 2, 9, P.white); // window bar
    p.rect(0, 10, 16, 1, P.ink);
  });
}

export const plant = () =>
  fromRows(
    'plant',
    ['...g.g..', '..gGgG..', '.gGgGgg.', 'gGg.gGgG', '.gGgGg..', '..gGg...', '...g....', 'kkkkkkkk', 'kccccCck', '.kccccCk', '.kccccCk', '..kkkkk.'],
    { g: P.mint, G: P.mintDark, k: P.ink, c: P.coral, C: '#d94a72' },
  );

export const clock = () =>
  fromRows('clock', ['.kkkkk.', 'kwwkwwk', 'kwwkwwk', 'kwwkkwk', 'kwwwwwk', 'kwwwwwk', '.kkkkk.'], {
    k: P.ink,
    w: P.white,
  });

export function poster(kind: 'chart' | 'star' | 'target'): string {
  return paint(`poster-${kind}`, 10, 12, (p) => {
    p.rect(0, 0, 10, 12, P.ink);
    p.rect(1, 1, 8, 10, kind === 'star' ? '#fff1b8' : P.white);
    if (kind === 'chart') {
      p.rect(2, 7, 1, 3, P.sky);
      p.rect(4, 5, 1, 5, P.mint);
      p.rect(6, 3, 1, 7, P.coral);
      p.rect(2, 10, 6, 1, P.inkSoft);
    } else if (kind === 'star') {
      [
        [4, 2], [5, 2], [3, 4], [4, 3], [5, 3], [6, 4], [2, 4], [7, 4], [3, 5], [4, 5], [5, 5], [6, 5],
        [3, 6], [6, 6], [3, 7], [6, 7], [4, 4], [5, 4],
      ].forEach(([x, y]) => p.px(x, y, P.sunDark));
      p.rect(2, 9, 6, 1, P.inkSoft);
    } else {
      p.rect(2, 3, 6, 6, P.red);
      p.rect(3, 4, 4, 4, P.white);
      p.rect(4, 5, 2, 2, P.red);
    }
  });
}

export const DECOR_SIZES = {
  window: { w: 16, h: 11 },
  plant: { w: 8, h: 12 },
  clock: { w: 7, h: 7 },
  poster: { w: 10, h: 12 },
};

/** A string of party lights for the top of the arcade wall. Two frames
 *  stacked (top: frame A, bottom: frame B) so CSS can make them twinkle. */
export function lightString(): string {
  const bulbs = [P.red, P.sun, P.sky, P.mint];
  return paint('lights', 32, 20, (p) => {
    for (const frame of [0, 1]) {
      const oy = frame * 10;
      // sagging wire
      const wire = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 2, 2];
      for (let x = 0; x < 32; x++) p.px(x, oy + wire[x % 16], P.ink);
      [3, 11, 19, 27].forEach((x, i) => {
        const y = oy + wire[x % 16] + 1;
        const lit = (i + frame) % 2 === 0;
        const c = bulbs[i];
        p.rect(x, y, 2, 1, P.inkSoft);
        p.rect(x - 1, y + 1, 4, 3, lit ? c : shade(c, -0.35));
        p.rect(x, y + 4, 2, 1, lit ? c : shade(c, -0.35));
        if (lit) p.px(x - 1, y + 1, P.white);
      });
    }
  });
}

/** A life in free play. */
export const heart = (full = true) =>
  fromRows(
    `heart-${full}`,
    ['.kk.kk.', 'krrkrrk', 'krwrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'],
    full ? { k: P.ink, r: P.red, w: '#ff8aa0' } : { k: P.greyDark, r: '#e9e6f2', w: '#e9e6f2' },
  );
