import type { CSSProperties } from 'react';

/**
 * A pixel-art image drawn at the shared pixel size (--px), so every sprite
 * in the game has the same size pixels. `scale` is for rare cases (such as
 * a big trophy) that deliberately show art at a whole multiple.
 */
export function Sprite({
  src,
  w,
  h,
  scale = 1,
  className = '',
  style,
  alt = '',
}: {
  src: string;
  w: number;
  h: number;
  scale?: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`px ${className}`}
      style={{
        width: `calc(${w * scale} * var(--px))`,
        height: `calc(${h * scale} * var(--px))`,
        ...style,
      }}
      draggable={false}
    />
  );
}
