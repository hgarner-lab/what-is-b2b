/**
 * Brand settings. Files live in /public/brand.
 *
 * The page is light, so the ink versions are used:
 * - mccann-logo-ink.png: the supplied McCann wordmark, recoloured to ink.
 * - truth-well-told-ink.png: the supplied Truth Well Told logo, trimmed
 *   and made transparent.
 * White versions are kept alongside in case a dark background comes back.
 *
 * Set any of these to null to hide it.
 */
export const brand: {
  logoSrc: string | null;
  logoAlt: string;
  taglineSrc: string | null;
  taglineAlt: string;
} = {
  logoSrc: '/brand/mccann-logo-ink.png',
  logoAlt: 'McCann',
  taglineSrc: '/brand/truth-well-told-ink.png',
  taglineAlt: 'Truth Well Told',
};
