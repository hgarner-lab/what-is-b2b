# What Even Is B2B?

Three tiny browser games that explain B2B marketing to people who know B2C
advertising. It takes about three minutes to play.

| Level | Game idea | What it shows |
| --- | --- | --- |
| 1. So who's the customer? | Click people as they pop up | There isn't one buyer. |
| 2. Now market to them | Stack falling blocks into rows | Marketing works across the whole journey, not just getting noticed. |
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

There are no official McCann files in the repo yet, so no logo is shown.
To add one, put the approved file in `public/brand/` and set `logoSrc` in
[`src/content/brand.ts`](src/content/brand.ts). The red accent is one CSS
variable, `--red`, in `src/styles/global.css`. Swap it for the official
value when you have it.

## Controls and accessibility

- **Level 1:** click or tap people (or Tab + Enter).
- **Level 2:** arrow keys (← → move, ↑ rotate, ↓ faster, space drops). On touch
  screens there are on-screen buttons, and you can also drag, tap to rotate and
  swipe down to drop.
- **Level 3:** mouse, finger or ← →. Click, tap or space to launch (it also
  launches on its own).
- Sound is made in the browser (no audio files) and can be turned off in the
  top right. The setting is remembered.
- Honors the "reduce motion" system setting.
- Nothing relies on colour alone: blocks carry short codes, people show
  "✓ Convinced", and progress lists use ticks.

## How it's built

React + TypeScript + Vite, with plain CSS. Level 1 and 2 are drawn with
normal page elements; Level 3 uses a canvas. The game rules for Levels 2 and 3
live in their own `engine.ts` files, separate from the display code.

```
src/
  App.tsx                 screen flow and progress
  components/ui.tsx       buttons, top bar, title cards, end cards, messages
  content/                copy and brand settings
  audio/sound.ts          synthesised sound effects
  screens/                intro and final screens
  levels/level1-3/        one folder per game
```
