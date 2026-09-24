import type { CSSProperties } from 'react';

/** A pixel-art image shown at a whole-number scale. */
export function Sprite({
  src,
  w,
  h,
  scale = 4,
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
      width={w * scale}
      height={h * scale}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`px ${className}`}
      style={style}
      draggable={false}
    />
  );
}
