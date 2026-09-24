# What Even Is B2B?

Three tiny arcade games that explain B2B marketing to people who know B2C
advertising. It takes about three minutes to play.

You walk into a bright pixel-art arcade, insert a coin, and play three
machines in turn. Each one ends with a LEVEL CLEAR! screen that says what the
game just taught you, and the whole thing ends on a high-score board.

| Level | Game idea | What it shows |
| --- | --- | --- |
| 1. So who's the customer? | Click people as they pop up | There isn't one buyer. |
| 2. Now market to them | Classic falling blocks. Each of the seven shapes is a kind of marketing | Marketing works across the whole journey, not just getting noticed. |
| 3. Now turn it into revenue | Bounce a ball to break barriers | Marketing can be traced through to pipeline and revenue. |

Nobody can fail. If someone struggles, each level quietly helps them along
and still finishes.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

It runs entirely in the browser. There's no backend, no login and no tracking.

## Hosting

It's a standard Vite static site.

- **Vercel:** import the repo. Vercel detects Vite automatically (build `npm run build`, output `dist`).
- **Netlify:** import the repo. `netlify.toml` already sets the build command and output folder.

## Editing the words

All the copy lives in [`src/content/copy.ts`](src/content/copy.ts). The deal value
(£2.4m) is set once at the top as `DEAL_VALUE`.

Level-specific words live next to each game:

- People and their questions: `src/levels/level1/stakeholders.ts`
- Marketing blocks and journey steps: `src/levels/level2/blocks.ts`
- Barriers and what knocks them down: `src/levels/level3/barriers.ts`

## Branding

The supplied logos live in `public/brand/`. The page is light, so the game
uses ink-coloured versions made from the supplied files:

- `mccann-logo-ink.png` (from `mccann-logo-white.png`) in the top-left corner
  and on the high-score screen.
- `truth-well-told-ink.png` (from `truth-well-told-original.jpeg`) next to it
  on the high-score screen.

The white versions are kept in case they're needed. Paths are set in
[`src/content/brand.ts`](src/content/brand.ts).

## The look

- **Colours:** a bright daytime arcade: cream, sky blue, sunny yellow and
  mint, with deep indigo for text. McCann red is kept for coins, wins and the
  money moment. The colours live in `src/pixel/sprite.ts` (`PALETTE`) and at
  the top of `src/styles/global.css`.
- **Pixel art:** everything (the machines, the seven characters, blocks,
  coins, speech bubbles, buttons and frames) is real pixel art drawn in
  `src/pixel/art.ts` and shown scaled up with crisp edges. Open the site with
  `?sprites` on the end of the address to see all the artwork on one page.
- **Fonts:** Press Start 2P for arcade labels, Pixelify Sans for headlines,
  and Nunito for anything you need to read. They're bundled with the site
  (no calls to Google), so they work on locked-down meeting-room networks.

## Controls and accessibility

- **Arcade room:** click INSERT COIN (or the glowing machine).
- **Level 1:** click or tap people (or Tab + Enter). Quick clicks in a row
  build a combo.
- **Level 2:** arrow keys (← → move, ↑ rotate, ↓ faster, space drops). On touch
  screens there are on-screen buttons, and you can also drag, tap to rotate and
  swipe down to drop.
- **Level 3:** mouse, finger or ← →. Click, tap or space to launch (it also
  launches on its own). Miss the ball and a CONTINUE? countdown serves it
  again.
- Sound is made in the browser (no audio files) and can be turned off in the
  top right. The setting is remembered.
- Nothing relies on colour alone: blocks carry short codes, people show
  "✓ Convinced!", and progress lists use ticks.
- Honors "reduce motion": no screen shake, confetti, coin flight or zoom.

## How it's built

React + TypeScript + Vite, with plain CSS. Levels 1 and 2 are drawn with
normal page elements; Level 3 uses a canvas drawn at half resolution for a
chunky pixel look. The game rules for Levels 2 and 3 live in their own
`engine.ts` files, separate from the display code.

```
src/
  App.tsx                 arcade room → machine → back to the room → high scores
  pixel/                  pixel-art toolkit and all the artwork
  components/ui.tsx       buttons, top bar, READY?/GO!, LEVEL CLEAR!, confetti
  components/Machine.tsx  the arcade machine each level is played on
  content/                copy and brand settings
  audio/sound.ts          synthesised sound effects and jingles
  screens/                arcade room and high-score screen
  levels/level1-3/        one folder per game
```
