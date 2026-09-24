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
    afterLevel: ['', 'One down. Two to go.', 'Nearly there. One machine left.'],
    ready: 'Insert coin',
    comingUp: 'Coming up',
    playNow: 'Insert coin',
    cleared: 'Cleared!',
  },

  /** The three machines, in order. */
  machines: [
    { short: 'Who’s the customer?', score: '7 people' },
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
    endBody:
      'A B2B purchase can involve people across leadership, finance, technology, procurement, legal and the teams who actually use the product.',
    endKicker: "And they don't all want the same thing.",
    endScore: (n: number) => ['1 buyer', `${n} people`] as const,
    tease: 'Now try marketing to all of them.',
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
    tease: 'Attention was only the start. Now turn it into revenue.',
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
        score: '7 people',
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
  },

  recap: {
    title: 'What you just did',
    items: [
      {
        level: 'Level 1',
        stat: '7 people',
        text: 'You set out to convince one buyer. Seven people turned up with questions, and each one could slow the deal down or stop it.',
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
