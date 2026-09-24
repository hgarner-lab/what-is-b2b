import { Button } from '../components/ui';
import { copy } from '../content/copy';
import './screens.css';

export function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen intro">
      <div className="center-stack">
        <h1 className="display display--xl intro__title">
          What even
          <br />
          is <span className="intro__b2b">B2B?</span>
        </h1>
        <p className="lede intro__sub">{copy.intro.sub}</p>
        <div className="intro__cta">
          <Button onClick={onStart} autoFocus>
            {copy.intro.cta}
          </Button>
          <p className="intro__note">{copy.intro.note}</p>
        </div>
      </div>
      <IntroShapes />
    </div>
  );
}

/** Three abstract shapes hinting at the three games: people, blocks, a ball. */
function IntroShapes() {
  return (
    <div className="intro__shapes" aria-hidden="true">
      <span className="shape shape--person" />
      <span className="shape shape--block" />
      <span className="shape shape--ball" />
    </div>
  );
}
