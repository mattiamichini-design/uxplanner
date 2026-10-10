// Absolute origin for canonical, Open Graph, robots and sitemap URLs, resolved at build time. Set NEXT_PUBLIC_SITE_URL
// for a custom domain; Vercel builds fall back to the project's production domain, and local builds to the dev server.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : 'http://localhost:3100'));
