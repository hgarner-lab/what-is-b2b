import { useEffect, useState } from 'react';
import { music, sound } from '../audio/sound';
import { QrCode } from '../components/QrCode';
import { Button, Confetti } from '../components/ui';
import { useCoarsePointer } from '../hooks/usePrefs';
import { brand } from '../content/brand';
import { copy } from '../content/copy';
import { star } from '../pixel/art';
import { PALETTE } from '../pixel/sprite';
import { Sprite } from '../pixel/Sprite';
import './highscores.css';

const RANK_COLORS = [PALETTE.sun, PALETTE.sky, PALETTE.mint];

export function HighScores({ onPlayAgain }: { onPlayAgain: () => void }) {
  const [showRecap, setShowRecap] = useState(false);
  const coarse = useCoarsePointer();
  // Link to the game itself (no ?extras), for the audience to scan.
  const shareUrl = `${window.location.origin}${window.location.pathname}`;

  useEffect(() => {
    if (showRecap) return;
    const ids = [300, 750, 1200].map((t) => window.setTimeout(() => sound.milestone(), t));
    ids.push(window.setTimeout(() => sound.win(), 1800));
    ids.push(window.setTimeout(() => music.start(), 3400));
    return () => {
      ids.forEach((id) => window.clearTimeout(id));
      music.stop();
    };
  }, [showRecap]);

  if (showRecap) {
    return (
      <div className="screen hs">
        <div className="center-stack">
          <h1 className="display display--lg">{copy.recap.title}</h1>
          <ol className="recap">
            {copy.recap.items.map((item, i) => (
              <li key={item.level} className="recap__item px-panel" style={{ animationDelay: `${i * 140}ms` }}>
                <span className="eyebrow">{item.level}</span>
                <span className="display display--md">{item.stat}</span>
                <p className="recap__text">{item.text}</p>
              </li>
            ))}
          </ol>
          <div className="hs__actions">
            <Button onClick={onPlayAgain}>{copy.final.again}</Button>
            <Button variant="ghost" onClick={() => setShowRecap(false)} autoFocus>
              {copy.recap.back}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen hs">
      <Confetti count={160} />
      <div className="center-stack">
        <div className="hs__board px-panel">
          <p className="arcade hs__title">
            <Sprite src={star()} w={7} h={7} />
            {copy.final.title}
            <Sprite src={star()} w={7} h={7} />
          </p>
          <p className="eyebrow hs__subtitle">{copy.final.subtitle}</p>
          <ol className="hs__table">
            {copy.final.statements.map((s, i) => (
              <li key={s.big} className="hs__row" style={{ animationDelay: `${300 + i * 450}ms` }}>
                <span className="arcade hs__rank" style={{ color: RANK_COLORS[i] }}>
                  {s.rank}
                </span>
                <span className="hs__lesson">
                  <span className="display display--md">{s.big}</span>
                  <span className="hs__small">{s.small}</span>
                </span>
                <span className="arcade hs__score">{s.score}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="hs__bottom">
          <div className="hs__left">
            <div className="hs__close" style={{ animationDelay: '1700ms' }}>
              <p className="display display--xl hs__thats">{copy.final.thats}</p>
              <p className="hs__line">{copy.final.line}</p>
            </div>

            <div className="hs__actions" style={{ animationDelay: '2100ms' }}>
              <Button onClick={onPlayAgain} autoFocus>
                {copy.final.again}
              </Button>
              <Button variant="ghost" onClick={() => setShowRecap(true)}>
                {copy.final.recap}
              </Button>
            </div>

            {(brand.logoSrc || brand.taglineSrc) && (
              <div className="hs__brand" style={{ animationDelay: '2400ms' }}>
                {brand.logoSrc && <img src={brand.logoSrc} alt={brand.logoAlt} className="hs__logo" />}
                {brand.taglineSrc && <img src={brand.taglineSrc} alt={brand.taglineAlt} className="hs__tagline" />}
              </div>
            )}
          </div>
          {!coarse && (
            <figure className="hs__qr px-panel" style={{ animationDelay: '2000ms' }}>
              <QrCode url={shareUrl} label="QR code: play this game on your phone" />
              <figcaption className="arcade">{copy.final.scan}</figcaption>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
}
