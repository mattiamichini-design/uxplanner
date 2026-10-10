// Fetches Clash Display for the marketing site from Fontshare, its official source, before dev and build.
// The ITF Free Font License lets us self-host it on our own site but not redistribute it through a repository,
// so the file is downloaded here, unmodified, into a git-ignored folder instead of being committed.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fontsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/fonts');
const archiveUrl = 'https://api.fontshare.com/v2/fonts/download/clash-display';
const entries = {
  'ClashDisplay-Variable.woff2': {
    from: 'ClashDisplay_Complete/Fonts/WEB/fonts/ClashDisplay-Variable.woff2',
    // Pinned so an upstream change is reviewed (file and licence) before it reaches the site.
    sha256: 'dbe4b338d40d727ba0f342228d3c53d5429995264cf031fd975f6265a57da662',
  },
  'ClashDisplay-FFL.txt': { from: 'ClashDisplay_Complete/License/FFL.txt' },
};

const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
const isCurrent = ([name, entry]) => {
  const target = path.join(fontsDirectory, name);
  return existsSync(target) && (!entry.sha256 || sha256(readFileSync(target)) === entry.sha256);
};

if (Object.entries(entries).every(isCurrent)) process.exit(0);

const response = await fetch(archiveUrl);
if (!response.ok) throw new Error(`Could not download Clash Display from Fontshare (${response.status}). The site needs it to build.`);
const temporary = mkdtempSync(path.join(tmpdir(), 'clash-display-'));
try {
  const archive = path.join(temporary, 'clash-display.zip');
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  mkdirSync(fontsDirectory, { recursive: true });
  for (const [name, entry] of Object.entries(entries)) {
    const content = execFileSync('unzip', ['-p', archive, entry.from], { maxBuffer: 1 << 24 });
    if (entry.sha256 && sha256(content) !== entry.sha256) {
      throw new Error(`${name} from Fontshare no longer matches the pinned SHA-256. Review the new file and its licence, then update site/scripts/fetch-fonts.mjs.`);
    }
    writeFileSync(path.join(fontsDirectory, name), content);
  }
  console.log('Fetched Clash Display from Fontshare into site/app/fonts.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
