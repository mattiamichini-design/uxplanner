import { demoWorkspaceRoot, touchWorkspace, workspaceFiles } from '../workspace-store';

// Subset of node:fs used by the product's workspace layer, backed by the in-browser workspace.
// Anything outside the demo workspace root does not exist.
type NodeError = Error & { code: string };

function fail(code: string, path: string): never {
  const error = new Error(`${code}: ${path}`) as NodeError;
  error.code = code;
  throw error;
}

function clean(path: string) {
  return path.replace(/\/+$/, '') || '/';
}

function isDirectory(path: string) {
  const prefix = `${clean(path)}/`;
  if (clean(path) === demoWorkspaceRoot || clean(path) === '/') return true;
  for (const key of workspaceFiles().keys()) if (key.startsWith(prefix)) return true;
  return false;
}

function kind(path: string): 'file' | 'directory' | null {
  if (workspaceFiles().has(clean(path))) return 'file';
  return isDirectory(path) ? 'directory' : null;
}

export function existsSync(path: string) { return kind(path) !== null; }
export function realpathSync(path: string) { return path; }

export function lstatSync(path: string) {
  const type = kind(path);
  if (!type) fail('ENOENT', path);
  return { isSymbolicLink: () => false, isFile: () => type === 'file', isDirectory: () => type === 'directory' };
}

export function statSync(path: string) {
  const type = kind(path);
  if (!type) fail('ENOENT', path);
  return { size: workspaceFiles().get(clean(path))?.length ?? 0, isFile: () => type === 'file', isDirectory: () => type === 'directory' };
}

export function readFileSync(path: string, _encoding?: string) {
  void _encoding;
  const content = workspaceFiles().get(clean(path));
  if (content === undefined) fail(isDirectory(path) ? 'EISDIR' : 'ENOENT', path);
  return content;
}

export function readdirSync(path: string, _options?: { withFileTypes?: boolean }) {
  void _options;
  if (kind(path) !== 'directory') fail('ENOENT', path);
  const prefix = `${clean(path)}/`;
  const entries = new Map<string, boolean>();
  for (const key of workspaceFiles().keys()) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const slash = rest.indexOf('/');
    if (slash === -1) entries.set(rest, entries.get(rest) ?? false);
    else entries.set(rest.slice(0, slash), true);
  }
  return [...entries].map(([name, directory]) => ({
    name,
    isFile: () => !directory,
    isDirectory: () => directory,
    isSymbolicLink: () => false,
  }));
}

export function mkdirSync(_path: string, _options?: unknown) { void _path; void _options; }

export function writeFileSync(path: string, content: string, options?: { flag?: string }) {
  const target = clean(path);
  if (options?.flag === 'wx' && workspaceFiles().has(target)) fail('EEXIST', path);
  workspaceFiles().set(target, String(content));
  touchWorkspace();
}

export function renameSync(from: string, to: string) {
  const content = workspaceFiles().get(clean(from));
  if (content === undefined) fail('ENOENT', from);
  workspaceFiles().delete(clean(from));
  workspaceFiles().set(clean(to), content);
  touchWorkspace();
}

export function unlinkSync(path: string) {
  if (!workspaceFiles().delete(clean(path))) fail('ENOENT', path);
  touchWorkspace();
}

const fs = { existsSync, realpathSync, lstatSync, statSync, readFileSync, readdirSync, mkdirSync, writeFileSync, renameSync, unlinkSync };
export default fs;
