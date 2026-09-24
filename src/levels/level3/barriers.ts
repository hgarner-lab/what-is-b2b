export type Barrier = { label: string; fix: string };

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
    fill: '#f4f2ee',
    ink: '#111',
    barriers: [
      { label: 'Never heard of you', fix: 'Brand' },
      { label: 'Not relevant', fix: 'The right message' },
      { label: 'Don’t get it', fix: 'A clear story' },
      { label: 'Not on the list', fix: 'Reputation' },
    ],
  },
  {
    id: 'confidence',
    fill: '#c9c5bd',
    ink: '#111',
    barriers: [
      { label: 'Don’t trust you', fix: 'Reviews' },
      { label: 'Too risky', fix: 'Guarantees' },
      { label: 'Need proof', fix: 'Case studies' },
      { label: 'Why change?', fix: 'A sharp insight' },
    ],
  },
  {
    id: 'commercial',
    fill: '#948f87',
    ink: '#111',
    barriers: [
      { label: 'No business case', fix: 'ROI calculator' },
      { label: 'No urgency', fix: 'A reason to act now' },
      { label: 'No internal agreement', fix: 'Something for every stakeholder' },
      { label: 'Procurement', fix: 'Answers ready to go' },
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
