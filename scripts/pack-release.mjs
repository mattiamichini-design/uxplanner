import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// The release contains the traced runtime; consumers never install build dependencies.
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-planner-release-'));
const source = JSON.parse(fs.readFileSync('package.json', 'utf8'));
try {
  for (const entry of ['bin', 'mcp', 'src/lib/server/workspace.mjs', '.next/standalone', 'sample', 'README.md', 'LICENSE', 'docs', 'skills']) {
    if (fs.existsSync(entry)) fs.cpSync(entry, path.join(staging, entry), { recursive: true });
  }
  fs.writeFileSync(path.join(staging, 'package.json'), JSON.stringify({
    name: source.name, version: source.version, private: true,
    description: source.description, license: source.license,
    bin: source.bin, engines: source.engines,
    files: ['bin', 'mcp', 'src', '.next', 'sample', 'README.md', 'LICENSE', 'docs', 'skills'],
  }, null, 2));
  const args = ['pack', staging, '--pack-destination', process.cwd()];
  const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  execFileSync(process.platform === 'win32' ? process.execPath : 'npm', process.platform === 'win32' ? [npmCli, ...args] : args, { stdio: 'inherit' });
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
