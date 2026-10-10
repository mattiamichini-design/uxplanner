// The demo compiles the product's own modules for a static export that has no server and no Next router.
// Source files stay untouched in src/; this loader changes only module markers and import specifiers at build time:
//  - "use server" and `import "server-only"` are removed, so the server actions and the workspace layer behind them
//    run as ordinary client modules against the in-browser workspace (demo/shims/node-fs.ts);
//  - next/cache, next/link, next/navigation and node:crypto are redirected to demo/shims. Next rejects next/cache in
//    client modules and ignores resolveAlias for the others (it ships its own browser polyfills), so the specifier is
//    rewritten here.
const shimFor = { 'next/cache': 'next-cache', 'next/link': 'next-link', 'next/navigation': 'next-navigation', 'node:crypto': 'node-crypto' };

module.exports = function serverModulesToClient(source) {
  return source
    .replace(/^\s*(['"])use server\1;?/, '')
    .replace(/^\s*import\s+(['"])server-only\1;?/gm, '')
    .replace(/from\s+(['"])(next\/(?:cache|link|navigation)|node:crypto)\1/g, (_match, _quote, specifier) => `from '@site/demo/shims/${shimFor[specifier]}'`);
};
