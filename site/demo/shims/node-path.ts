// POSIX subset of node:path for the in-browser workspace.
function normalizeParts(path: string) {
  const out: string[] = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out;
}

export const sep = '/';
export function isAbsolute(path: string) { return path.startsWith('/'); }
export function normalize(path: string) {
  const joined = normalizeParts(path).join('/');
  return isAbsolute(path) ? `/${joined}` : joined || '.';
}
export function join(...parts: string[]) { return normalize(parts.filter(Boolean).join('/')); }
export function resolve(...parts: string[]) {
  let current = '';
  for (const part of parts) current = isAbsolute(part) ? part : `${current}/${part}`;
  return normalize(isAbsolute(current) ? current : `/${current}`);
}
export function dirname(path: string) {
  const parts = normalizeParts(path);
  parts.pop();
  return `${isAbsolute(path) ? '/' : ''}${parts.join('/')}` || '.';
}
export function basename(path: string) { return normalizeParts(path).pop() ?? ''; }
export function relative(from: string, to: string) {
  const a = normalizeParts(resolve(from));
  const b = normalizeParts(resolve(to));
  let shared = 0;
  while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared += 1;
  return [...a.slice(shared).map(() => '..'), ...b.slice(shared)].join('/');
}

const path = { sep, isAbsolute, normalize, join, resolve, dirname, basename, relative };
export default path;
