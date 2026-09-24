/** `short` is used when the barriers are narrow (phones). */
export type Barrier = { label: string; short?: string; fix: string };

export type Layer = {
  id: 'awareness' | 'confidence' | 'commercial';
  barriers: Barrier[];
  fill: string;
  ink: string;
};

/**
 * Nearest the paddle first: the ball has to get through awareness,
 * then confidence, then the commercial blockers before it reaches the deal.
 * `fix` is the kind of marketing that knocks each one down.
 */
export const LAYERS: Layer[] = [
  {
    id: 'awareness',
    fill: '#58c4ff',
    ink: '#262047',
    barriers: [
      { label: 'Never heard of you', short: 'Who are you?', fix: 'Brand' },
      { label: 'Not relevant', fix: 'The right message' },
      { label: 'Don’t get it', fix: 'A clear story' },
      { label: 'Not on the list', short: 'Not listed', fix: 'Reputation' },
    ],
  },
  {
    id: 'confidence',
    fill: '#9c82ff',
    ink: '#262047',
    barriers: [
      { label: 'Don’t trust you', short: 'No trust', fix: 'Reviews' },
      { label: 'Too risky', fix: 'Guarantees' },
      { label: 'Need proof', fix: 'Case studies' },
      { label: 'Why change?', fix: 'A sharp insight' },
    ],
  },
  {
    id: 'commercial',
    fill: '#ff7b9c',
    ink: '#262047',
    barriers: [
      { label: 'No business case', short: 'No case', fix: 'ROI calculator' },
      { label: 'No urgency', fix: 'A reason to act now' },
      { label: 'No internal agreement', short: 'No agreement', fix: 'Something for every stakeholder' },
      { label: 'Procurement', short: 'Paperwork', fix: 'Answers ready to go' },
    ],
  },
];

/** What happens to the account as each layer falls. */
export const MILESTONES = [
  { id: 'awareness', text: 'Account awareness ↑', after: 'awareness' },
  { id: 'engagement', text: 'Engagement ↑', after: 'confidence-half' },
  { id: 'opportunity', text: 'Opportunity created', after: 'confidence' },
  { id: 'pipeline', text: 'Pipeline', after: 'confidence' },
  { id: 'won', text: 'Won', after: 'commercial' },
] as const;

export type MilestoneId = (typeof MILESTONES)[number]['id'];
