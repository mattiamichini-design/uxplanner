import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { anchoredOverlayMotion, modalContentMotion, overlayBackdropMotion, sheetContentMotion } from "../src/components/ui/overlay-motion.ts";

const globals = ["../src/app/globals.css", "../src/styles/tokens.css"]
  .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
  .join("\n");
const token = (name) => Number(globals.match(new RegExp(`${name}:\\s*(\\d+)ms`))?.[1]);

test("overlay exits retain their final frame and stay within the UI motion budget", () => {
  for (const classes of [anchoredOverlayMotion, modalContentMotion, overlayBackdropMotion, sheetContentMotion]) {
    assert.ok(classes.includes("fill-mode-both"));
    assert.ok(classes.includes("motion-overlay-reduced"));
    assert.ok(classes.includes("data-[state=closed]:animate-out"));
    const duration = (state) => token(classes.match(new RegExp(`data-\\[state=${state}\\]:duration-\\((--[a-z-]+)\\)`))?.[1]);
    assert.ok(duration("open") < 300);
    assert.ok(duration("closed") < duration("open"));
  }
});
