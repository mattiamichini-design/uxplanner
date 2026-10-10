import test from "node:test";
import assert from "node:assert/strict";

import {
  createUxPlannerShellState,
  deriveUxPlannerShellLayout,
  isUxPlannerMainNavVisible,
  reduceUxPlannerShellState,
} from "../src/index.js";

test("shows main nav by default when compact header is inactive", () => {
  const state = createUxPlannerShellState();

  assert.deepEqual(deriveUxPlannerShellLayout(state), {
    compactHeaderActive: false,
    mainNavVisible: true,
  });
  assert.equal(isUxPlannerMainNavVisible(state), true);
});

test("hides main nav whenever compact header becomes active", () => {
  const state = reduceUxPlannerShellState(createUxPlannerShellState(), {
    type: "compact-header:set",
    active: true,
  });

  assert.deepEqual(deriveUxPlannerShellLayout(state), {
    compactHeaderActive: true,
    mainNavVisible: false,
  });
});

test("restores nav visibility from the persisted nav-open state", () => {
  const compactState = reduceUxPlannerShellState(createUxPlannerShellState(), {
    type: "compact-header:set",
    active: true,
  });
  const restoredState = reduceUxPlannerShellState(compactState, {
    type: "compact-header:set",
    active: false,
  });

  assert.equal(isUxPlannerMainNavVisible(restoredState), true);
});

test("keeps nav hidden after compact mode ends when host closed it", () => {
  const state = reduceUxPlannerShellState(
    reduceUxPlannerShellState(createUxPlannerShellState(), {
      type: "compact-header:set",
      active: true,
    }),
    {
      type: "main-nav:set-open",
      open: false,
    },
  );
  const restoredState = reduceUxPlannerShellState(state, {
    type: "compact-header:set",
    active: false,
  });

  assert.deepEqual(restoredState, {
    compactHeaderActive: false,
    mainNavOpen: false,
  });
  assert.equal(isUxPlannerMainNavVisible(restoredState), false);
});

test("supports host-side state hydration through patch actions", () => {
  const state = reduceUxPlannerShellState(createUxPlannerShellState(), {
    type: "shell:patch",
    state: {
      compactHeaderActive: true,
      mainNavOpen: false,
    },
  });

  assert.deepEqual(state, {
    compactHeaderActive: true,
    mainNavOpen: false,
  });
  assert.deepEqual(deriveUxPlannerShellLayout(state), {
    compactHeaderActive: true,
    mainNavVisible: false,
  });
});
