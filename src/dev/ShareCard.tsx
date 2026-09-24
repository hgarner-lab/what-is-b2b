/**
 * The picture shown when the link is shared in Slack, Teams, email etc.
 * Open the site with ?card at 1200×630 and screenshot it to
 * public/og-image.png (see README).
 */
import { useEffect, useRef } from 'react';
import { brand } from '../content/brand';
import { CABINET, cabinet, coin } from '../pixel/art';
import { DEMO_H, DEMO_W, drawDemo, type DemoKind } from '../pixel/demos';
import { PALETTE as P } from '../pixel/sprite';
import { Sprite } from '../pixel/Sprite';

export function ShareCard() {
  useEffect(() => {
    document.documentElement.style.setProperty('--px', '4px');
  }, []);
  return (
    <div className="card">
      <div className="room__lights" />
      <div className="card__body">
        <div className="card__left">
          <div className="px-marquee card__sign">
            <p className="arcade">
              What even
              <br />
              is B2B?
            </p>
          </div>
          <p className="card__line">Three tiny arcade games. About three minutes.</p>
          <p className="card__coin arcade">
            <Sprite src={coin()} w={8} h={8} /> Insert coin
          </p>
          {brand.logoSrc && <img src={brand.logoSrc} alt="" className="card__logo" />}
        </div>
        <div className="card__cabs">
          {[P.sky, P.sun, P.mint].map((c, i) => (
            <CardCabinet key={c} color={c} kind={i as DemoKind} />
          ))}
        </div>
      </div>
      <div className="card__floor" />
    </div>
  );
}

function CardCabinet({ color, kind }: { color: string; kind: DemoKind }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (c) drawDemo(c, kind, [30, 24, 30][kind]);
  }, [kind]);
  const s = CABINET.screen;
  return (
    <div style={{ position: 'relative' }}>
      <Sprite src={cabinet(color)} w={CABINET.w} h={CABINET.h} />
      <canvas
        ref={ref}
        width={DEMO_W}
        height={DEMO_H}
        className="px"
        style={{
          position: 'absolute',
          left: `calc(${s.x} * var(--px))`,
          top: `calc(${s.y} * var(--px))`,
          width: `calc(${s.w} * var(--px))`,
          height: `calc(${s.h} * var(--px))`,
        }}
      />
    </div>
  );
}
