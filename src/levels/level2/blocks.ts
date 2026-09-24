export type BlockType = 'awareness' | 'content' | 'demand' | 'leads' | 'nurture' | 'sales' | 'cro';

export type BlockInfo = {
  type: BlockType;
  /** Name of the marketing activity on the falling block. */
  name: string;
  /** Plain-English explanation shown while it falls. */
  what: string;
  /** Short code printed on each square, so colour is never the only cue. */
  code: string;
  /** The step of the buyer's journey this activity moves people through. */
  stage: string;
  /** What that step means for the buyer. */
  stageMeans: string;
  /** Shown the first time this step lights up. */
  message: string;
  color: string;
  ink: string;
  /** Which classic block shape carries this activity. */
  shape: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
};

/** In journey order. */
export const BLOCKS: BlockInfo[] = [
  {
    type: 'awareness',
    name: 'Awareness',
    what: 'Ads and brand. Getting noticed.',
    code: 'AW',
    stage: 'Awareness',
    stageMeans: 'They know you exist',
    message: 'People know you exist.',
    color: '#58c4ff',
    ink: '#262047',
    shape: 'I',
  },
  {
    type: 'content',
    name: 'Content',
    what: 'Articles, videos and ideas worth their time.',
    code: 'CT',
    stage: 'Interest',
    stageMeans: 'They want to know more',
    message: 'Now they’re curious.',
    color: '#ffcb3d',
    ink: '#262047',
    shape: 'O',
  },
  {
    type: 'demand',
    name: 'Demand gen',
    what: 'Showing why the problem is worth solving now.',
    code: 'DG',
    stage: 'Demand',
    stageMeans: 'They want a solution',
    message: 'Now they’re looking for a solution.',
    color: '#9c82ff',
    ink: '#262047',
    shape: 'T',
  },
  {
    type: 'leads',
    name: 'Lead gen',
    what: 'Giving people a reason to get in touch.',
    code: 'LG',
    stage: 'Leads',
    stageMeans: 'They put their hand up',
    message: 'Someone put their hand up.',
    color: '#48d597',
    ink: '#262047',
    shape: 'S',
  },
  {
    type: 'nurture',
    name: 'Nurture',
    what: 'Staying useful until they’re ready.',
    code: 'NU',
    stage: 'Nurture',
    stageMeans: 'You stay useful until they’re ready',
    message: 'Interest needs somewhere to go.',
    color: '#ff7b9c',
    ink: '#262047',
    shape: 'Z',
  },
  {
    type: 'sales',
    name: 'Sales enablement',
    what: 'Giving the sales team the right tools and stories.',
    code: 'SE',
    stage: 'Sales',
    stageMeans: 'Sales has what it needs',
    message: 'Now the sales team has something useful to work with.',
    color: '#4a6cf7',
    ink: '#fff',
    shape: 'J',
  },
  {
    type: 'cro',
    name: 'CRO',
    what: 'Making it easier to say yes. Fewer steps, less friction.',
    code: 'CR',
    stage: 'Conversion',
    stageMeans: 'They say yes',
    message: 'Less friction. More action.',
    color: '#ff9a3c',
    ink: '#262047',
    shape: 'L',
  },
];

export const BLOCK: Record<BlockType, BlockInfo> = Object.fromEntries(
  BLOCKS.map((b) => [b.type, b]),
) as Record<BlockType, BlockInfo>;

export const AWARENESS_ONLY_MESSAGE = 'People know you.\nThey still aren’t ready to buy.';
