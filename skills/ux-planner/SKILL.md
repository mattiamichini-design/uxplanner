---
name: ux-planner
description: Author and maintain repository-owned personas, user stories, journeys and flows for UX Planner.
---

Read existing planning files and product decisions before editing. Never invent research evidence or validation results. Keep documents in the current project's `docs/ux/`, not in the installed application.

- `personas/*.md`: YAML frontmatter with stable `slug`, `name`, optional `role`, `summary`, `updated`, followed by Markdown.
- `user-stories/*.story.md`: user stories and testable acceptance criteria, using the project's existing IDs.
- `user-journeys/<type>/meta.json`: `title`, `description`, `icon` (Lucide name).
- `user-journeys/<type>/<persona>.json`: `title`, `meta` with `persona`, `journeyType`, `updatedAt`; `columns` with unique `id`, `label`, optional `subtitle`; `rows` with unique `id`, `label`, optional `description`, `cells` containing `columnId` and `items` with `text`, optional `emoji`, and `emphasis` (`positive`, `neutral`, `negative`). Cells must reference an existing column. Optional `notes`, `actors`, `content`.
- `user-flows/<type>/*.md`: optional frontmatter, Mermaid fenced diagram, and Markdown narrative. Use stable filenames.

Preserve source links and connect story IDs to journey steps, flow nodes and acceptance scenarios. Record happy paths, empty states, failures and recovery where relevant. Never overwrite concurrent edits; re-read before saving. Preserve unrelated files and IDs.

Use `node /path/to/uxplanner/bin/ux-planner.mjs init --root /path/to/project` to initialize folders, `node /path/to/uxplanner/bin/ux-planner.mjs start --root /path/to/project` to review, and `node /path/to/uxplanner/bin/ux-planner.mjs export --root /path/to/project > ux-planner-handoff.json` for a JSON/Markdown handoff. A design agent reads that handoff and builds the Figma nodes itself through its own Figma MCP connection.
