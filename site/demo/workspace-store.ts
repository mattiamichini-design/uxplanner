import { demoFilesStorageKey, demoLocationStorageKey } from './storage';

// In-browser planning workspace: the same docs/ux file tree the product reads from disk, held in memory and
// mirrored to sessionStorage. The product's own registries and actions run against it through shims/node-fs.ts.
export const demoWorkspaceRoot = '/ux-planner-demo';

export type DemoSeed = { hash: string; files: Record<string, string> };

const files = new Map<string, string>();
const listeners = new Set<() => void>();
let version = 0;
let flushScheduled = false;
let seedHash = '';

export function subscribeWorkspace(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** 0 until the workspace is seeded, then increases after every committed change. */
export function getWorkspaceVersion() {
  return version;
}

export function workspaceFiles() {
  return files;
}

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  // One notification per completed operation: commitFiles stages and removes temporary files synchronously.
  queueMicrotask(() => {
    flushScheduled = false;
    persist();
    version += 1;
    listeners.forEach(listener => listener());
  });
}

export function touchWorkspace() {
  scheduleFlush();
}

function persist() {
  try {
    const snapshot: Record<string, string> = {};
    files.forEach((content, path) => { if (!path.endsWith('.tmp')) snapshot[path.slice(demoWorkspaceRoot.length + 1)] = content; });
    window.sessionStorage.setItem(demoFilesStorageKey, JSON.stringify({ hash: seedHash, files: snapshot } satisfies DemoSeed));
  } catch {
    // Edits keep working in memory when storage is full or blocked.
  }
}

function load(seed: DemoSeed): Record<string, string> {
  try {
    const stored = window.sessionStorage.getItem(demoFilesStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as DemoSeed;
      if (parsed.hash === seed.hash && parsed.files && typeof parsed.files === 'object') return parsed.files;
    }
    // A new sample replaces the session, so the last visited page may no longer exist: reopen on the default one.
    window.sessionStorage.removeItem(demoLocationStorageKey);
  } catch {
    // Fall back to the bundled corpus.
  }
  return seed.files;
}

/** Loads the stored session, or the bundled corpus when there is none or the corpus changed. Idempotent. */
export function initializeWorkspace(seed: DemoSeed) {
  if (version > 0) return;
  seedHash = seed.hash;
  files.clear();
  for (const [relative, content] of Object.entries(load(seed))) files.set(`${demoWorkspaceRoot}/${relative}`, content);
  version = 1;
  listeners.forEach(listener => listener());
}
