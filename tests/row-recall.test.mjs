import assert from "node:assert/strict";
import test from "node:test";

import {
  getRecalledRowIds,
  getRecallOffset,
} from "../src/lib/user-journey/row-recall.ts";

test("recalls row headers as they reach the phase header without discarding older rows", () => {
  const rows = [
    { id: "actions", top: 80 },
    { id: "goals", top: 118.9 },
    { id: "needs", top: 119 },
    { id: "opportunities", top: 400 },
  ];

  assert.deepEqual(getRecalledRowIds(rows, 120), ["actions", "goals"]);
});

test("bounds the visual recall offset to four rows and accounts for board zoom", () => {
  assert.equal(getRecallOffset(2, 1), 96);
  assert.equal(getRecallOffset(8, 0.75), 144);
});

test("each next row recalls when it reaches the bottom of the recall stack", () => {
  const rows = [
    { id: "actions", top: 80 },
    { id: "goals", top: 160 },
    { id: "needs", top: 216 },
  ];

  assert.deepEqual(getRecalledRowIds(rows, 120, 48), ["actions", "goals"]);
});
