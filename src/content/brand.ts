/**
 * Brand settings. Files live in /public/brand.
 *
 * - mccann-logo-white.png: supplied McCann wordmark (white, transparent).
 * - truth-well-told-white.png: white, trimmed copy of the supplied
 *   truth-well-told-original.jpeg, so it sits on the dark background.
 *
 * Set any of these to null to hide it.
 */
export const brand: {
  logoSrc: string | null;
  logoAlt: string;
  taglineSrc: string | null;
  taglineAlt: string;
} = {
  logoSrc: '/brand/mccann-logo-white.png',
  logoAlt: 'McCann',
  taglineSrc: '/brand/truth-well-told-white.png',
  taglineAlt: 'Truth Well Told',
};
