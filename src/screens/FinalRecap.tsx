import { useState } from 'react';
import { Button } from '../components/ui';
import { brand } from '../content/brand';
import { copy } from '../content/copy';
import './screens.css';

export function FinalRecap({ onPlayAgain }: { onPlayAgain: () => void }) {
  const [showRecap, setShowRecap] = useState(false);

  if (showRecap) {
    return (
      <div className="screen final">
        <div className="center-stack">
          <h1 className="display display--md">{copy.recap.title}</h1>
          <ol className="recap">
            {copy.recap.items.map((item, i) => (
              <li key={item.level} className="recap__item" style={{ animationDelay: `${i * 140}ms` }}>
                <span className="eyebrow">{item.level}</span>
                <span className="display display--md recap__stat">{item.stat}</span>
                <p className="recap__text">{item.text}</p>
              </li>
            ))}
          </ol>
          <div className="final__actions">
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
    <div className="screen final">
      <div className="center-stack">
        <p className="eyebrow">{copy.final.title}</p>
        <ol className="statements">
          {copy.final.statements.map((s, i) => (
            <li key={s.big} className="statement" style={{ animationDelay: `${200 + i * 450}ms` }}>
              <span className="display display--md statement__big">{s.big}</span>
              <span className="statement__small">{s.small}</span>
            </li>
          ))}
        </ol>
        <div className="final__close" style={{ animationDelay: '1700ms' }}>
          <p className="display display--lg final__thats">{copy.final.thats}</p>
          <p className="lede final__line">{copy.final.line}</p>
        </div>
        <div className="final__actions" style={{ animationDelay: '2200ms' }}>
          <Button onClick={onPlayAgain} autoFocus>
            {copy.final.again}
          </Button>
          <Button variant="ghost" onClick={() => setShowRecap(true)}>
            {copy.final.recap}
          </Button>
        </div>
        {(brand.logoSrc || brand.credit) && (
          <div className="final__brand">
            {brand.logoSrc && <img src={brand.logoSrc} alt={brand.logoAlt} />}
            {brand.credit && <span>{brand.credit}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
