export type Stakeholder = {
  id: string;
  role: string;
  glyph: string;
  /** What they ask the first time they appear. */
  ask: string;
  /** What they ask when they pop back up. */
  again: string;
};

/** In the order they turn up. The CMO is the "obvious" buyer. */
export const STAKEHOLDERS: Stakeholder[] = [
  { id: 'cmo', role: 'CMO', glyph: '✦', ask: 'Sounds great.', again: 'Can you convince the CFO?' },
  { id: 'cfo', role: 'CFO', glyph: '£', ask: 'What’s the return?', again: 'Can we pay less?' },
  { id: 'cio', role: 'CIO', glyph: '⚙', ask: 'Will it work with our systems?', again: 'Who fixes it when it breaks?' },
  { id: 'procurement', role: 'Procurement', glyph: '⚖', ask: 'Why should we choose you?', again: 'Have you filled in the 40-page form?' },
  { id: 'legal', role: 'Legal', glyph: '§', ask: 'Where does the data go?', again: 'Who’s liable if it goes wrong?' },
  { id: 'user', role: 'End user', glyph: '☺', ask: 'Is this going to make my job easier?', again: 'Do I have to learn something new?' },
  { id: 'ceo', role: 'CEO', glyph: '★', ask: 'Why now?', again: 'What does the board think?' },
];

export const byId = Object.fromEntries(STAKEHOLDERS.map((s) => [s.id, s])) as Record<string, Stakeholder>;

/** Where each person first appears (slot index in a 4×2 / 2×4 grid). */
export const HOME_SLOT: Record<string, number> = {
  cmo: 1,
  cfo: 6,
  cio: 3,
  procurement: 4,
  legal: 2,
  user: 7,
  ceo: 0,
};

export const SLOT_COUNT = 8;
