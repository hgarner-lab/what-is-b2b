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

Nobody can fail the story. If someone struggles, each level quietly helps
them along and still finishes.

## Free play

Finishing the story unlocks **Free play**: endless versions of the three
games that keep getting harder, with lives, a score, GAME OVER and a best
score saved in the browser.

| Game | How it gets harder | Scoring |
| --- | --- | --- |
| Convince everyone | People arrive faster, give up sooner and more appear at once. Lose three and the deal is off. | 1 per person, CEO worth 3 |
| Full-funnel blocks | Classic falling blocks. Speeds up every 10 lines. | Classic line scores × level. A line with 5 or more kinds of marketing scores double |
| Revenue rush | Every deal you win brings a faster ball and a smaller paddle. Three balls. | £100k per barrier and a bonus per deal, both growing with each deal |

Free play is on the high-score screen, in the arcade room once it's been
unlocked in this browser, and on the **P** key. The code lives in
`src/freeplay/`.

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
- **Pixel art:** everything (the machines, the eight characters, the office
  decor, blocks, coins, speech bubbles, buttons and frames) is real pixel art
  drawn in `src/pixel/art.ts` and shown scaled up with crisp edges. Open the
  site with `?sprites` on the end of the address to see it all on one page.
- **One pixel size:** every piece of art uses the same size of pixel on
  screen (the `--px` setting in `src/styles/global.css`: 3, 4 or 5 screen
  pixels depending on the screen), so it all looks like one game.
- **Demo loops:** the machines in the arcade room play little animated
  previews of their games, like real arcade machines do (`src/pixel/demos.ts`).
- **Fonts:** Press Start 2P for arcade labels, Pixelify Sans for headlines,
  and Nunito for anything you need to read. They're bundled with the site
  (no calls to Google), so they work on locked-down meeting-room networks.

## Presenting it

Keyboard shortcuts for whoever's running it in a meeting (press **?** to
see them on screen):

| Key | Does |
| --- | --- |
| 1, 2, 3 | Jump straight to a level |
| H | Jump to the high scores |
| P | Free play (endless mode) |
| R | Start again |
| F | Full screen |

The high-score screen shows a QR code so the room can play it on their
phones. It links to whatever address the game is running on, so it's most
useful once it's hosted.

## Link preview

When the link is shared in Slack, Teams or email it shows
`public/og-image.png`. To remake that picture after changing the art, run the
site, open it with `?card` on the end of the address in a 1200×630 window and
take a screenshot.

Previews need the site's full web address. On Vercel and Netlify it's filled
in automatically when the site is built. Anywhere else, set `SITE_URL` (for
example `SITE_URL=https://b2b.example.com npm run build`).

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
  top right. The setting is remembered. There's gentle background music in
  the arcade room and on the high-score screen only. It starts after the
  first click and follows the same sound button.
- Nothing relies on colour alone: blocks carry short codes, people show
  "✓ Convinced!", and progress lists use ticks.
- Honors "reduce motion": no screen shake, confetti, coin flight, zoom or
  demo animations.

## How it's built

React + TypeScript + Vite, with plain CSS. Levels 1 and 2 are drawn with
normal page elements; Level 3 uses a canvas drawn at half resolution for a
chunky pixel look. The game rules for Levels 2 and 3 live in their own
`engine.ts` files, separate from the display code.

```
src/
  App.tsx                 arcade room → machine → back to the room → high scores,
                          plus presenter shortcuts
  pixel/                  pixel-art toolkit, all the artwork and the demo loops
  components/ui.tsx       buttons, top bar, READY?/GO!, LEVEL CLEAR!, confetti
  components/Machine.tsx  the arcade machine each level is played on
  components/QrCode.tsx   pixel-art QR code for the high-score screen
  dev/                    ?sprites and ?card helper pages
  content/                copy and brand settings
  audio/sound.ts          synthesised sound effects and jingles
  screens/                arcade room and high-score screen
  levels/level1-3/        one folder per game
```
