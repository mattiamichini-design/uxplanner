# UX Planner design system

Journey, Persona, Flow and Story views share one shell, one set of semantic tokens and one component library.

## Shell

One 16 px rounded panel holds a 64 px primary icon rail, a 252 px contextual sidebar and a flexible white content surface. Journey, Persona, Flow and Story views share this structure. The shell primitives live in `src/components/ux-planner/studio-shell.tsx`: `StudioPrimaryRail`, `StudioWorkspace`, `StudioSidebar`, `StudioSidebarToggle`, `StudioSidebarLink`, `StudioSidebarButton` and `StudioSidebarLabel`.

## Tokens

`src/styles/tokens.css` declares the semantic `--ux-*` roles on `:root`: surfaces and text, borders and inputs, status, the journey board, diagrams, radius, type, font and motion. The app, the demo and the landing read this file, and component code uses only these roles for colour.

| Role | CSS variable | Value |
| --- | --- | --- |
| Canvas | `--ux-canvas` | `#f3f3f3` |
| Surface | `--ux-surface` | `#ffffff` |
| Context sidebar | `--ux-sidebar` | `#fafafa` |
| Selected item / border | `--ux-selected`, `--ux-border` | `#e4e4e7` |
| Text | `--ux-text` | `#101426` |
| Muted text | `--ux-muted` | `#5f606b` |
| Primary control | `--ux-primary` | `#18181b` |
| Text on primary | `--ux-on-primary` | `#ffffff` |
| Danger | `--ux-danger`, `--ux-danger-soft` | `#b42318`, `#fef3f2` |
| Recall action | `--ux-recall` | `#5f60cb` |

Geist is the interface font; Menlo is for file paths and source identifiers. Buttons use the 9 px `--ux-radius-button`, form controls the 10 px `--ux-radius-control`, badges the 8 px `--ux-radius-badge` and the panel the 16 px `--ux-radius-panel`. Small text uses `--ux-text-label` (13 px) and `--ux-text-micro` (11 px). Motion uses `--ux-duration-fast`, `-base` and `-slow` (150, 200 and 500 ms), separate open and close durations for popovers and sheets, and three easing curves.

`src/app/globals.css` maps the roles to Tailwind utilities such as `bg-ux-surface`, `text-ux-muted`, `rounded-ux-control` and `text-ux-label`. It also declares the layout sizes (`--container-ux-*`, `--spacing-ux-*`), the `ux-wide` breakpoint at 1440 px, the `ux-narrow` variant below 375 px and the stacking layers (`--z-ux-*`). `cn()` in `src/lib/utils.ts` registers the `ux` text, radius, container and spacing scales with tailwind-merge. Inside the app's `.dev-theme` scope, `src/app/ux-planner/theme.css` points the shadcn variables that `components/ui` uses, and the interface font, at the same roles. Mermaid diagrams read their colours from the tokens.

Journey phase headers repeat the three-step neutral scale A/B/C/B/A.

## Responsive behavior

- **1440 px and wider:** the full contextual sidebar is visible.
- **1024–1439 px:** the canvas takes focus and a 208 px compact sidebar toggles inline.
- **768–1023 px:** contextual navigation opens in a sheet; the primary rail stays visible.
- **Below 768 px:** a compact header opens primary and contextual navigation in the same sheet. Controls keep 44 px touch targets.

Pages use a bounded workspace: navigation and page identity stay visible while Journey notes, Persona attributes and Flow and Story documents scroll inside the content panel. Tables and diagrams scroll on their own; diagram coordinates and overlay positions are the exceptions to flex and grid layout.

## Components

- Journey actions put search first and CSV and add-column actions last; at compact widths CSV sits in an anchored menu.
- Desktop header controls share a 32 px height. The sidebar toggle has distinct open and close icons and remembers its state.
- Flow zoom and minimap share a bottom dock, with the minimap preview above it.
- Form editors and action sheets have a centered title between symmetric 44 px lanes, a circular close control and a full-width description. Bodies scroll; footer actions stay reachable.
- Inactive actions use white outline surfaces; delete actions use the danger-soft token.
- Selects use the shared Radix select with a styled popup, keyboard navigation and padded chevrons.

## Changing the design

Change colour, radius, type, font and motion values in `tokens.css`, and layout sizes and layers in `globals.css`. A new role also needs its utility mapping in `globals.css`, and a new radius, text, container or spacing role its entry in `cn()`. Check a Journey, Persona, Flow and Story screen at desktop and compact widths.

## Marketing site

`site/` is a single landing page. Its horizon gradients use oklab, with an sRGB fallback.

- **Layout:** the four document cards become 2×2 below 1180 px and stack below 720 px. The comparison tile splits into two cards below 960 px. The journey board keeps its 1184 px layout and scales as one picture below that width.
- **Tokens:** `site/app/landing.css` declares the landing's roles on `:root`: colours, elevation, a 4 px spacing scale, type roles that pair size and line height, radius, motion and layout constants. Its header comment lists the breakpoints. Scripts read durations and sizes from these properties through `site/components/motion.ts`. The journey board uses the product's `--ux-*` roles.
- **Hero image:** `site/public/brand/journey-board.webp` is a 2× capture of the demo at 1198 × 684 on the Getting started journey. Recapture it when the journey screen or the demo sample changes. The board, the hero image and the demo share one sample ("Getting started", Persona 1 and Persona 2).
- **Board:** phase headers are buttons that move focus between Discover, Sign up and First use; persona chips are labels.
- **Type:** Clash Display for headings (Semibold 600), the wordmark and card titles (Medium 500); Archivo for text and UI; JetBrains Mono for code. All three are self-hosted through `next/font`. Clash Display's licence allows self-hosting but not redistribution through a repository, so `npm run site:fonts` (run by `site:dev` and `site:build`) downloads the variable file from Fontshare into the git-ignored `site/app/fonts/` and checks its pinned SHA-256. The product and the demo use Geist.
- **Section bar:** a floating bar appears once the hero navigation scrolls away and marks the current section. A click moves its marker straight to the destination.
- **Demo:** "Try the demo" and the green light of the hero window open `/demo` in a dialog that grows from its trigger. Modified clicks and visits without JavaScript open `/demo` as a page.
- **Motion:** the hero enters once on load, sections reveal once as they enter the viewport, the Agents comparison plays plan → match → build → tests and the terminal types its commands. Animations play once. Reduced motion keeps only fades, and all content is visible without JavaScript.
