import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

export const collections = ['personas', 'user-journeys', 'user-flows', 'user-stories'];
export function workspaceRoot() {
  const root = process.env.UX_PLANNER_ROOT;
  if (!root || !path.isAbsolute(root)) throw new Error('Start UX Planner through its CLI with an absolute workspace root');
  if (!fs.existsSync(path.join(root, 'docs/ux')) && fs.existsSync(path.join(root, 'docs/02-design'))) throw new Error('Planning files belong in docs/ux: move personas, user-stories, user-journeys and user-flows from docs/02-design to docs/ux manually, then run ux-planner init.');
  return root;
}
export function assertSegment(value) {
  if (typeof value !== 'string' || !value || value.startsWith('.') || value.startsWith('_') || /[\\/\x00-\x1f\x7f:]/.test(value)) throw new Error('Invalid path segment');
  return value;
}
export function safePath(...segments) {
  let current = fs.realpathSync(workspaceRoot());
  for (const segment of ['docs', 'ux', ...segments]) {
    assertSegment(segment);
    current = path.join(current, segment);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symbolic links are not allowed in planning files'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}
export function listFiles(...segments) {
  try { return fs.readdirSync(safePath(...segments), { withFileTypes: true }).filter(e => !e.isSymbolicLink() && !e.name.startsWith('.') && !e.name.startsWith('_')).sort((a,b) => a.name.localeCompare(b.name)); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
export function readText(...segments) {
  const target = safePath(...segments);
  if (fs.statSync(target).size > 2_000_000) throw new Error('Planning file exceeds 2 MB');
  return fs.readFileSync(target, 'utf8');
}
export function revision(content) { return createHash('sha256').update(content).digest('hex'); }
export function readJSON(...segments) {
  const content = readText(...segments);
  try { return JSON.parse(content); }
  catch { throw new Error(`Invalid JSON in docs/ux/${segments.join('/')}`); }
}
export function initializeWorkspace(root = workspaceRoot()) {
  const previous = process.env.UX_PLANNER_ROOT;
  process.env.UX_PLANNER_ROOT = root;
  try { for (const collection of collections) fs.mkdirSync(safePath(collection), { recursive: true }); }
  finally { if (previous === undefined) delete process.env.UX_PLANNER_ROOT; else process.env.UX_PLANNER_ROOT = previous; }
}

// ponytail: one queue per local runner; split by document only if local write throughput matters.
let queue = Promise.resolve();
/** @template T @param {() => T | Promise<T>} operation @returns {Promise<T>} */
export function serialized(operation) {
  const next = queue.then(operation);
  queue = next.catch(() => {});
  return next;
}

// Stage all contents before replacement; rollback completed replacements on an I/O failure.
// Git remains the durable history. No directory deletion or recursive overwrite is used.
export function commitFiles(changes) {
  const staged = [];
  const applied = [];
  try {
    for (const change of changes) {
      const target = safePath(...change.segments);
      const before = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
      if (change.expected !== undefined && before !== change.expected) throw new Error('This file changed. Reload before saving.');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const temporary = `${target}.${randomUUID()}.tmp`;
      if (change.content !== null) fs.writeFileSync(temporary, change.content, { flag: 'wx', mode: 0o600 });
      staged.push({ ...change, target, before, temporary });
    }
    for (const change of staged) {
      safePath(...change.segments);
      const current = fs.existsSync(change.target) ? fs.readFileSync(change.target, 'utf8') : null;
      if (current !== change.before) throw new Error('This file changed. Reload before saving.');
      if (change.content === null) fs.unlinkSync(change.target);
      else fs.renameSync(change.temporary, change.target);
      applied.push(change);
    }
  } catch (error) {
    for (const change of applied.reverse()) {
      if (change.before === null) fs.unlinkSync(change.target);
      else { fs.writeFileSync(change.temporary, change.before); fs.renameSync(change.temporary, change.target); }
    }
    throw error;
  } finally {
    for (const change of staged) { try { fs.unlinkSync(change.temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  }
}
