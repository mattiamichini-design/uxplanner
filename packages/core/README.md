# ux-planner-core

Internal workspace of the UX Planner application. It is built and used by the app in this repository; projects you plan in never install it.

The package provides shared journey types, CSV conversion and framework-independent shell state helpers. Routes, server actions, persistence and UI belong to the application.

CSV conversion keeps journey traceability fields. CSV is a board interchange format; use the canonical JSON and Markdown export when complete metadata and evidence must be kept.

From the repository root:

```sh
npm run build --workspace ux-planner-core
npm run test:core
```

The shell helpers are exported from `ux-planner-core/shell`: `createUxPlannerShellState`, `reduceUxPlannerShellState`, `deriveUxPlannerShellLayout`, and `isUxPlannerMainNavVisible`. A compact header always hides the main navigation. The application owns the React adapter and rendering.
