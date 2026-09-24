import type { CSSProperties, ReactNode } from 'react';
import { cabinetFrame } from '../pixel/art';
import './machine.css';

/** The arcade machine each level is played on: lit sign, bezel, screen. */
export function Machine({
  color,
  number,
  title,
  label,
  children,
}: {
  color: string;
  number: number;
  title: string;
  /** Replaces "Level N" on the sign, e.g. "Free play". */
  label?: string;
  children: ReactNode;
}) {
  const style = { ['--cab' as string]: `url("${cabinetFrame(color)}")` } as CSSProperties;
  return (
    <div className="machine" style={style}>
      <div className="machine__marquee px-marquee">
        <span className="arcade">
          {label ?? `Level ${number}`} · {title}
        </span>
      </div>
      <div className="machine__bezel">
        <div className="machine__screen">{children}</div>
      </div>
    </div>
  );
}
