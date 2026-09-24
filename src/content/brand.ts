/**
 * Brand slot.
 *
 * No official logo files are in the repo yet, so none is shown.
 * To add one: put the supplied file in /public/brand (for example
 * /public/brand/logo.svg) and set `logoSrc` to '/brand/logo.svg'.
 * It appears small in the top-left corner and on the final screen.
 */
export const brand: { logoSrc: string | null; logoAlt: string; credit: string | null } = {
  logoSrc: null,
  logoAlt: 'McCann',
  // Optional small text credit on the final screen, e.g. 'A McCann experience'.
  credit: null,
};
