import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Link previews (Slack, Teams, email) need the full web address of the
 * preview image. Set SITE_URL yourself, or it's picked up from Vercel or
 * Netlify when they build the site. Without one, the path is left relative.
 */
function siteUrl(): string {
  const env = process.env;
  const url =
    env.SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (env.VERCEL_URL && `https://${env.VERCEL_URL}`) ||
    env.URL || // Netlify
    '';
  return url.replace(/\/$/, '');
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl()),
    },
  ],
});
