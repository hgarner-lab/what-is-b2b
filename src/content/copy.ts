/**
 * All the words in the game live here, so they can be edited
 * without touching any gameplay code.
 */

export const DEAL_VALUE = '£2.4m';

export const copy = {
  intro: {
    title: 'What even is B2B?',
    sub: 'Good question.',
    cta: 'Show me',
    note: 'Three tiny games. About three minutes.',
  },

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
    cta: 'Next: market to them',
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
    cta: 'Next: turn it into revenue',
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
    cta: 'So what is B2B?',
  },

  final: {
    title: 'What even is B2B?',
    statements: [
      { big: 'Many people.', small: 'Purchases are usually group decisions.' },
      {
        big: 'Many stages.',
        small: 'Marketing can run from awareness through demand, nurture, sales and conversion.',
      },
      { big: 'One commercial outcome.', small: 'Activity can connect to pipeline and revenue.' },
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
