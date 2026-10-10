# Architecture

UX Planner is one app repository with a shared core workspace, a local runner and project-owned data. The app brings its own fonts, styles and routes and runs independently of the target project's stack.

`packages/core` holds the journey types, CSV conversion and navigation helpers that the app and the MCP App share.

## Runtime

The CLI starts the built Next.js standalone runtime on 127.0.0.1 and passes the project through `UX_PLANNER_ROOT`. Every planning read and write resolves against that project's `docs/ux` folder. The build contains the traced runtime and static assets, so the project you plan in installs and builds nothing. `pack:release` packages the same runtime for release verification.

`demo` copies the sample workspace in `sample/` into a temporary project and runs the same app and persistence code. The sample is synthetic, and the landing's `/demo` uses the same files.

A process lock allows one runner per project. Its write queue validates and stages every document involved, checks current contents, replaces the files and rolls back on an I/O failure. Git keeps the revision history.

The UI creates and edits personas and journey boards, and creates stories. Flows and story content come from an editor or an agent and render in the app. `export` writes the Markdown and JSON documents with their paths, for agent-assisted handoff to design tools such as Figma through MCP.

The design tokens, shell and components are described in [design.md](design.md).

## MCP server

`bin/ux-planner-mcp.mjs` is a stdio MCP server, bundled with the MCP App (`mcp/app.mjs`) into `mcp/*.bundle.*` by `npm run build:mcp`. It never touches files itself: it sends each tool call to the runner of a registered project, authenticated with the token in that project's runner lock, and the runner applies the same validation and write queue as the app. [mcp.md](mcp.md) covers setup and routing.

## Marketing site and installable product

The landing and the product share one repository and use two hosts. The root Next application in `src/` is the product people clone and run; `site/` is a separate Next application for the landing. They share no routes, layout, proxy or build output; the landing imports the product's design tokens (`src/styles/tokens.css`) and its logo mark path.

- `npm run build` and `npm run pack:release` build and package the product. The release allowlist in `scripts/pack-release.mjs` lists product paths only, and `scripts/verify-release.mjs` checks that the installed archive has no `site/` directory and that the runtime root redirects to `/ux-planner`.
- `npm run site:build` writes a static export to `site/out/`. The site has no server code and can be hosted anywhere. It resolves dependencies from the root `node_modules`, with one package manifest and lockfile for both apps.
- GitHub is the only distribution channel: install calls to action point to the repository and document cloning and building.
- `/demo` is the interactive demo the landing opens in a dialog. It runs the product's own components: `site/app/(demo)/demo/page.tsx` bundles the sample workspace (`sample/`: two personas, three journeys, flows and story categories) at build time, the same files `ux-planner demo` copies. The product's registries and server actions run in the browser against an in-memory `docs/ux` workspace kept in `sessionStorage` (`site/demo/workspace-store.ts`).
- Only the site build applies the browser adapters: aliases for `fs`, `path` and `local-session` in `site/next.config.ts`, and a loader (`site/demo/build/server-modules-loader.cjs`) that strips `"use server"` and `server-only` and points `next/cache`, `next/navigation`, `next/link` and `node:crypto` at shims. `src/` imports no site code.
- Demo routing uses the URL hash. `site/demo/routes.tsx` mirrors the product's page files, so a change to a product page needs the same change there. Two root layouts keep the product stylesheet out of the landing; the demo loads it through `site/app/(demo)/tailwind.css`.
