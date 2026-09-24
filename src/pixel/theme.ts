import { PALETTE as P } from './sprite';
import {
  bezelFrame,
  bubbleFrame,
  buttonFrame,
  cubicleFrame,
  lightString,
  floorTile,
  marqueeFrame,
  panelFrame,
  screenTile,
  wallTile,
  wellCell,
} from './art';

/**
 * Paint the shared pixel frames and tiles once and expose them to CSS as
 * variables, e.g. `border-image-source: var(--px-panel)`.
 */
export function initPixelTheme() {
  const vars: Record<string, string> = {
    '--px-panel': panelFrame(P.white),
    '--px-panel-cream': panelFrame('#fffaf0', 'cream'),
    '--px-panel-sky': panelFrame(P.skyPale, 'sky'),
    '--px-panel-sun': panelFrame('#fff1b8', 'sun'),
    '--px-btn': buttonFrame(P.sun),
    '--px-btn-down': buttonFrame(P.sun, true),
    '--px-btn-red': buttonFrame(P.red),
    '--px-btn-red-down': buttonFrame(P.red, true),
    '--px-btn-ghost': buttonFrame(P.white),
    '--px-btn-ghost-down': buttonFrame(P.white, true),
    '--px-bubble': bubbleFrame(),
    '--px-bezel': bezelFrame(),
    '--px-marquee': marqueeFrame(P.red, P.sun),
    '--px-cubicle': cubicleFrame(),
    '--px-wall': wallTile(),
    '--px-lights': lightString(),
    '--px-floor': floorTile(),
    '--px-screen': screenTile(),
    '--px-well': wellCell(),
  };
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, `url("${v}")`));
}
