import test from "node:test";
import assert from "node:assert/strict";

const {
  compactSidebarStorageKey,
  readCompactSidebarPreference,
  writeCompactSidebarPreference,
} = await import("../src/lib/ux-planner/compact-sidebar-preference.ts");

test("compact sidebar preference persists and falls back when storage is unavailable", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(readCompactSidebarPreference(storage), false);
  assert.equal(writeCompactSidebarPreference(storage, true), true);
  assert.equal(values.get(compactSidebarStorageKey), "true");
  assert.equal(readCompactSidebarPreference(storage), true);

  const blockedStorage = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
  };
  assert.equal(readCompactSidebarPreference(blockedStorage, true), true);
  assert.equal(writeCompactSidebarPreference(blockedStorage, false), false);
});
