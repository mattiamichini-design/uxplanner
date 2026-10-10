# Contributing to UX Planner

Bug reports, fixes and small improvements are welcome. For a larger change, such as a new document type or a change to the file formats, open an issue first so we can agree on the approach before you write the code.

## Set up

You need Git and Node.js 22.15 or newer. `.nvmrc` pins the version for nvm and similar tools.

```sh
git clone https://github.com/mattiamichini-design/uxplanner.git
cd uxplanner
npm ci
npm run demo
```

`npm run demo` starts the development build on a temporary copy of the sample workspace and prints its URL and path. To work on a real project, run `npm run build` once, then `node bin/ux-planner.mjs start --root /path/to/project --dev`.

The repository holds two Next.js apps that share one `package.json` and lockfile: the product in `src/` and the landing in `site/`. [docs/architecture.md](docs/architecture.md) explains how they and the MCP server fit together, and [docs/design.md](docs/design.md) covers the design tokens and components. The Next.js version in this repository can differ from what you know: check `node_modules/next/dist/docs/` before you change Next.js APIs.

## Checks

Run these before you open a pull request. CI runs the same set on Linux.

```sh
npm run lint
npm run typecheck
npm test
npm run test:core
npm run build
npm run test:mcp
npm run test:routing
npm run pack:release
npm run verify:release
```

If you changed `site/`, also run `npm run site:typecheck` and `npm run site:build`. The site build downloads fonts, so it needs network access.

The MCP and release checks start local servers on ports 4327, 4331, 4355 and 4356. Set `UX_TEST_PORT`, `UX_MCP_TEST_PORT` or `UX_ROUTING_TEST_PORT` if those ports are taken.

## Pull requests

- Keep each pull request to one change, and explain what it changes and why.
- Open the pull request as a draft while you are still pushing changes. CI skips drafts; it runs when you mark the pull request ready for review and on each push after that.
- Add or update tests for behaviour you change. Tests use synthetic data; never commit real research or personal data.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, for example `fix(journeys): keep note order after a CSV import`.
- Update the README or the files in `docs/` when you change behaviour they describe. Write them in English and describe how things work now, not how they changed.
- For a visible UI change, add a screenshot to the pull request and check a Journey, Persona, Flow and Story screen at desktop and narrow widths.
- UX Planner is distributed through this GitHub repository only. Do not add publishing to a package registry.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE). Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
