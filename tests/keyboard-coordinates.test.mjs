import test from "node:test";
import assert from "node:assert/strict";

const { getHorizontalCellCoordinates } = await import(
  "../src/lib/ux-planner/keyboard-coordinates.ts"
);

const activeId = "first-journey::tester::actions::discover::0";
const collisionRect = { left: 260, top: 140, width: 200, height: 80 };
const rect = (left, top = 120, width = 280, height = 160) => ({
  left,
  top,
  width,
  height,
});

function coordinates(code, candidates) {
  return getHorizontalCellCoordinates({ code, activeId, collisionRect, candidates });
}

test("ArrowRight centers the note in the adjacent empty cell", () => {
  assert.deepEqual(
    coordinates("ArrowRight", [
      { id: "cell::first-journey::tester::actions::discover", rect: rect(240) },
      { id: "cell::first-journey::tester::actions::decide", rect: rect(520) },
    ]),
    { x: 560, y: 160 },
  );
});

test("ArrowLeft returns to the source cell after moving right", () => {
  assert.deepEqual(
    getHorizontalCellCoordinates({
      code: "ArrowLeft",
      activeId,
      collisionRect: { left: 560, top: 160, width: 200, height: 80 },
      candidates: [
        { id: "cell::first-journey::tester::actions::discover", rect: rect(240) },
        { id: "cell::first-journey::tester::actions::decide", rect: rect(520) },
      ],
    }),
    { x: 280, y: 160 },
  );
});

test("horizontal movement stays in the active journey row", () => {
  assert.equal(
    coordinates("ArrowRight", [
      { id: "cell::first-journey::tester::goals::decide", rect: rect(500, 300) },
    ]),
    undefined,
  );
});

test("horizontal movement can cross to an adjacent persona in compare mode", () => {
  assert.deepEqual(
    coordinates("ArrowRight", [
      { id: "cell::first-journey::second-persona::actions::discover", rect: rect(800) },
    ]),
    { x: 840, y: 160 },
  );
});

test("trash is ignored even when it is the nearest target on the right", () => {
  assert.deepEqual(
    coordinates("ArrowRight", [
      { id: "trash-drop-zone", rect: rect(470) },
      { id: "cell::first-journey::tester::actions::decide", rect: rect(520) },
    ]),
    { x: 560, y: 160 },
  );
});

test("missing rectangles are skipped in favor of the next measurable cell", () => {
  assert.deepEqual(
    coordinates("ArrowRight", [
      { id: "cell::first-journey::tester::actions::decide" },
      { id: "cell::first-journey::tester::actions::finish", rect: rect(800) },
    ]),
    { x: 840, y: 160 },
  );
});
