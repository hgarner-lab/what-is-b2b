/** Hidden page for checking the artwork: open the site with ?sprites */
import { CABINET, LOOKS, ball, block, cabinet, check, coin, person, speaker, star } from '../pixel/art';
import { PALETTE as P } from '../pixel/sprite';

const img = (src: string, w: number, h: number, scale: number) => (
  <img key={src} src={src} width={w * scale} height={h * scale} className="px" alt="" />
);

export function SpriteSheet() {
  return (
    <div style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
      {[P.sky, P.sun, P.mint].map((c) => img(cabinet(c), CABINET.w, CABINET.h, 4))}
      {img(cabinet(P.sky, false), CABINET.w, CABINET.h, 4)}
      {Object.keys(LOOKS).map((id) => (
        <span key={id}>
          {img(person(id), 22, 20, 6)}
          {img(person(id, true), 22, 20, 6)}
        </span>
      ))}
      {[P.sky, P.sun, P.lilac, P.mint, P.coral, P.blue, P.orange].map((c) => img(block(c), 10, 10, 4))}
      {img(coin(), 8, 8, 6)}
      {img(coin(false), 8, 8, 6)}
      {img(star(), 7, 7, 6)}
      {img(check(), 7, 6, 6)}
      {img(speaker(true), 8, 7, 6)}
      {img(speaker(false), 8, 7, 6)}
      {img(ball(), 6, 6, 6)}
      <div className="px-panel" style={{ width: 240, padding: 16 }}>Panel</div>
      <div className="px-bubble" style={{ padding: 10 }}>Speech bubble</div>
      <div className="px-marquee" style={{ padding: '14px 24px' }}>MARQUEE</div>
      <div className="px-cubicle" style={{ width: 200, height: 40 }} />
    </div>
  );
}
