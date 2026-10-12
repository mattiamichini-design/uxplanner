import type { MetadataRoute } from 'next';

// Icons come from scripts/generate-icons.mjs. The colors match --ux-canvas in tokens.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UX Planner',
    short_name: 'UX Planner',
    description: 'Plan personas, journeys, flows, and stories alongside your project.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f3f3',
    theme_color: '#f3f3f3',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
