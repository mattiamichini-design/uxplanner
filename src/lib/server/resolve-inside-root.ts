import "server-only";

import path from "node:path";

const PATH_SEPARATOR_PATTERN = /[\\/]/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function resolveInsideRoot(root: string, ...segments: string[]): string {
  const resolvedRoot = path.resolve(root);

  for (const segment of segments) {
    assertSafePathSegment(segment);
  }

  const resolvedPath = path.resolve(resolvedRoot, ...segments);
  const relativePath = path.relative(resolvedRoot, resolvedPath);

  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Resolved path must stay inside its configured root");
  }

  return resolvedPath;
}

export function assertSafePathSegment(segment: string): void {
  if (
    segment.length === 0 ||
    segment === "." ||
    segment === ".." ||
    path.isAbsolute(segment) ||
    PATH_SEPARATOR_PATTERN.test(segment) ||
    CONTROL_CHARACTER_PATTERN.test(segment)
  ) {
    throw new Error("Invalid path segment");
  }
}
