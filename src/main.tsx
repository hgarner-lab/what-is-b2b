import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p';
import '@fontsource/pixelify-sans/500.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/800.css';
import App from './App';
import { ShareCard } from './dev/ShareCard';
import { SpriteSheet } from './dev/SpriteSheet';
import { initPixelTheme } from './pixel/theme';
import './styles/global.css';

initPixelTheme();

const params = new URLSearchParams(window.location.search);
const page = params.has('sprites') ? <SpriteSheet /> : params.has('card') ? <ShareCard /> : <App />;

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
