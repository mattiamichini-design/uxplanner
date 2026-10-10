import path from 'node:path';
import type { NextConfig } from 'next';

// The marketing site is a static export. It never shares the product runtime,
// its loopback proxy or its release archive.
//
// /demo renders the real product components against an in-browser workspace. The product's server-side
// modules (workspace files, registries, "use server" actions) are reused as they are; the aliases below
// point their Node and Next server dependencies at browser implementations under demo/shims.
const shim = (file: string) => `./demo/shims/${file}`;

const nextConfig: NextConfig = {
  output: 'export',
  reactCompiler: true,
  images: { unoptimized: true },
  env: { UX_PLANNER_ROOT: '/ux-planner-demo' },
  turbopack: {
    root: path.join(__dirname, '..'),
    resolveAlias: {
      '@/lib/server/local-session': shim('local-session.ts'),
      'node:fs': { browser: shim('node-fs.ts') },
      fs: { browser: shim('node-fs.ts') },
      'node:path': { browser: shim('node-path.ts') },
      path: { browser: shim('node-path.ts') },
    },
    rules: {
      '*': {
        condition: { path: /(^|\/)src\/(app\/actions|actions|lib\/server|components|context|hooks)\/.+\.(ts|tsx|mjs)$/ },
        loaders: [path.join(__dirname, 'demo/build/server-modules-loader.cjs')],
      },
    },
  },
};

export default nextConfig;
