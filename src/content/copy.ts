/**
 * All the words in the game live here, so they can be edited
 * without touching any gameplay code.
 */

export const DEAL_VALUE = '£2.4m';

export const copy = {
  intro: {
    title: 'What even is B2B?',
    sub: 'Good question.',
    cta: 'Insert coin',
    note: 'Three tiny games. About three minutes.',
  },

  /** The arcade room between levels. */
  room: {
    afterLevel: ['', 'Now try marketing to all of them.', 'Now turn it into revenue.'],
    ready: 'Insert coin',
    comingUp: 'Coming up',
    playNow: 'Insert coin',
    cleared: 'Cleared!',
  },

  /** The three machines, in order. */
  machines: [
    { short: 'Who’s the customer?', score: '8 people' },
    { short: 'Market to them', score: '7 stages' },
    { short: 'Turn it into revenue', score: `${DEAL_VALUE} won` },
  ],

  level1: {
    number: 1,
    title: "So who's the customer?",
    setup: `You're selling a ${DEAL_VALUE} technology platform.`,
    instruction: 'Convince the buyer.',
    hint: 'Click the buyer',
    hintAfterFirst: 'Click them as they appear',
    counterLabel: 'Buyers',
    endHeadline: "There isn't one buyer.",
    endKicker: "And they don't all want the same thing.",
    endScore: (n: number) => ['1 buyer', `${n} people`] as const,
    cta: 'Next machine',
  },

  level2: {
    number: 2,
    title: 'Now market to them',
    setup: 'Every block is a different kind of marketing.',
    hint: 'Complete rows to move buyers along',
    controlsKeys: '← → move · ↑ rotate · ↓ faster · space drop',
    nowLabel: 'Now falling',
    journeyLabel: 'The journey',
    rescue: "Let's make some room.",
    endHeadline: "B2B doesn't stop at awareness.",
    endJourney: ['Brand', 'Demand', 'Leads', 'Nurture', 'Sales', 'Conversion'],
    endBody: 'B2B marketing can work across the entire commercial journey.',
    endScore: ['1 impression', 'the full journey'] as const,
    cta: 'Next machine',
  },

  level3: {
    number: 3,
    title: 'Now turn it into revenue',
    setup: 'These are the reasons a business doesn’t buy.',
    hint: 'Break through to the deal',
    hintKeys: 'Move with mouse, finger or ← →',
    launch: 'Click, tap or press space to launch',
    missed: 'Deal stalled. Go again.',
    goal: 'The deal',
    endHeadline: 'B2B marketing can connect activity to commercial outcomes.',
    endBody: 'Accounts. Opportunities. Pipeline. Revenue.',
    cta: 'See high scores',
  },

  final: {
    title: 'High scores',
    subtitle: 'What even is B2B?',
    statements: [
      {
        rank: '1st',
        big: 'Many people.',
        small: 'Purchases are usually group decisions.',
        score: '8 people',
      },
      {
        rank: '2nd',
        big: 'Many stages.',
        small: 'Marketing can run from awareness through demand, nurture, sales and conversion.',
        score: '7 stages',
      },
      {
        rank: '3rd',
        big: 'One commercial outcome.',
        small: 'Activity can connect to pipeline and revenue.',
        score: DEAL_VALUE,
      },
    ],
    thats: "That's B2B.",
    line: 'Marketing to people who have to convince other people too.',
    again: 'Play again',
    recap: 'See what you just did',
    scan: 'Play on your phone',
  },

  /** Endless versions of the three games, unlocked after the story. */
  freePlay: {
    button: 'Free play',
    roomTitle: 'Free play',
    roomSub: 'Endless mode. How long can you last?',
    status: 'Free play',
    best: 'Best',
    story: 'Story mode',
    gameOver: 'Game over',
    newBest: 'New best!',
    again: 'Play again',
    exit: 'Back to the arcade',
    games: [
      {
        title: 'Convince everyone',
        rules: 'Click people before they give up on you. Lose three and the deal is off. It gets faster.',
        lost: 'Too many people said no.',
        scoreLabel: 'Convinced',
      },
      {
        title: 'Full-funnel blocks',
        rules: 'Classic rules. It speeds up every 10 lines. A line with 5 or more kinds of marketing scores double.',
        lost: 'The funnel filled up.',
        scoreLabel: 'Score',
      },
      {
        title: 'Revenue rush',
        rules: 'Break every barrier to win the deal. Each new deal is faster, with a smaller paddle. Three balls.',
        lost: 'Out of chances.',
        scoreLabel: 'Revenue won',
      },
    ],
  },

  recap: {
    title: 'What you just did',
    items: [
      {
        level: 'Level 1',
        stat: '8 people',
        text: 'You set out to convince one buyer. Eight people turned up: leadership, finance, technology, security, procurement, legal and the people who’d actually use it. Each had different questions, and any of them could slow the deal down.',
      },
      {
        level: 'Level 2',
        stat: '7 stages',
        text: 'Getting noticed only lit up the first step. You needed a mix of marketing to take people from “never heard of you” to “ready to sign”.',
      },
      {
        level: 'Level 3',
        stat: `${DEAL_VALUE} won`,
        text: 'Each barrier you broke moved one specific account closer to a deal, and you could see the money it turned into.',
      },
    ],
    back: 'Back',
  },
};
