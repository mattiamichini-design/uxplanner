import assert from "node:assert/strict";
import test from "node:test";

import { getMinimapViewport, getWheelZoom } from "../src/lib/user-flow/canvas-viewport.ts";

test("flow canvas wheel zoom is continuous, direction-aware and bounded", () => {
  assert.equal(getWheelZoom(1, -10), 1.015);
  assert.equal(getWheelZoom(1, 10), 0.985);
  assert.equal(getWheelZoom(2, -100), 2);
  assert.equal(getWheelZoom(0.1, 100), 0.1);
  assert.ok(getWheelZoom(1, -1) < getWheelZoom(1, -10));
});

test("flow minimap clips the viewport to the actual diagram", () => {
  assert.deepEqual(
    getMinimapViewport({
      viewportWidth: 400,
      viewportHeight: 300,
      scrollLeft: 300,
      scrollTop: 250,
      surfaceLeft: 100,
      surfaceTop: 100,
      surfaceWidth: 800,
      surfaceHeight: 600,
    }),
    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
  );
  assert.deepEqual(
    getMinimapViewport({
      viewportWidth: 400,
      viewportHeight: 300,
      scrollLeft: 0,
      scrollTop: 0,
      surfaceLeft: 100,
      surfaceTop: 100,
      surfaceWidth: 800,
      surfaceHeight: 600,
    }),
    { x: 0, y: 0, width: 0.375, height: 1 / 3 },
  );
});
