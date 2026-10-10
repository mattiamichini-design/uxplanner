import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { DemoSeed } from './workspace-store';

// Build-time only: imported by the server component of /demo, never by client code.
// sample/ is the small, generic workspace shared with `ux-planner demo` (two personas, three journeys,
// flows and stories), mapped onto the same docs/ux tree the product reads.
const workingDirectory = /* turbopackIgnore: true */ process.cwd();
const repositoryRoot = workingDirectory.endsWith(`${path.sep}site`) ? path.dirname(workingDirectory) : workingDirectory;
const sources = [path.join(repositoryRoot, 'sample')];

function collect(root: string, directory = '', into: Record<string, string> = {}) {
  for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) collect(root, relative, into);
    else if (!entry.name.toLowerCase().endsWith('readme.md')) into[`docs/ux/${relative}`] = readFileSync(path.join(root, relative), 'utf8');
  }
  return into;
}

export function buildDemoSeed(): DemoSeed {
  const files = Object.assign({}, ...sources.map(source => collect(source))) as Record<string, string>;
  const hash = createHash('sha256').update(JSON.stringify(Object.entries(files).sort())).digest('hex').slice(0, 16);
  return { hash, files };
}
