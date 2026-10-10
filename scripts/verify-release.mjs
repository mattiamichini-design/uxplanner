import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';

const archive = path.resolve(process.argv[2] || 'ux-planner-0.2.0.tgz');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-planner consumer '));
process.env.UX_PLANNER_REGISTRY_DIR=path.join(root,'registry');
const npm = process.platform === 'win32' ? process.execPath : 'npm';
const npmPrefix = process.platform === 'win32' ? [process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')] : [];
const port = process.env.UX_TEST_PORT || '4327';
let server;
let log = '';
try {
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"fresh-consumer","private":true}');
  execFileSync(npm, [...npmPrefix, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--save-dev', archive], { cwd: root, stdio: 'pipe' });
  const cli = path.join(root, 'node_modules/ux-planner/bin/ux-planner.mjs');
  const run = (...args) => execFileSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  run('init');
  const packageRoot = path.dirname(path.dirname(cli));
  assert.ok(!fs.existsSync(path.join(packageRoot, 'site')), 'The marketing site must not ship in the release');
  fs.cpSync(path.join(packageRoot, 'sample'), path.join(root, 'docs/ux'), { recursive: true });
  const original = fs.readFileSync(path.join(root, 'docs/ux/personas/persona-1.md'), 'utf8');
  run('init');
  execFileSync(npm, [...npmPrefix, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--save-dev', archive], { cwd: root, stdio: 'pipe' });
  assert.equal(fs.readFileSync(path.join(root, 'docs/ux/personas/persona-1.md'), 'utf8'), original);
  fs.mkdirSync(path.join(root, '.ux-planner'));
  fs.writeFileSync(path.join(root, '.ux-planner/runner.lock'), JSON.stringify({pid:2147483647}));
  server = spawn(process.execPath, [cli, 'start', '--port', port], { cwd: root });
  server.stdout.on('data', b => { log += b; }); server.stderr.on('data', b => { log += b; });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(base + '/ux-planner/user-stories')).ok) { ready = true; break; } } catch {}
    if (server.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, log);
  for (const route of ['user-journeys/onboarding', 'user-personas/persona-1', 'user-flows/account-setup', 'user-stories', 'user-stories/onboarding-first-result']) {
    const response = await fetch(base + '/ux-planner/' + route); assert.equal(response.status, 200, route);
    const html = await response.text(); assert.ok(!html.includes('NEXT_ERROR_CODE'), route);
    for (const asset of [...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css|woff2)(?:\?[^\"]*)?)"/g)].slice(0, 3)) {
      assert.equal((await fetch(new URL(asset[1].replaceAll('&amp;', '&'), base))).status, 200, asset[1]);
    }
  }
  assert.equal((await fetch(base + '/ux-planner', { headers: { Origin: 'https://foreign.example' } })).status, 403);
  const home = await fetch(base + '/', { redirect: 'manual' });
  assert.equal(home.headers.get('location'), '/ux-planner', 'The runtime root opens the application, not the landing');
  assert.throws(() => run('start', '--port', String(Number(port) + 1)), /already running/);
  const otherProject = path.join(root, 'another project');fs.mkdirSync(otherProject);run('init', '--root', otherProject);
  assert.throws(() => run('start', '--root', otherProject, '--port', port), /EADDRINUSE|address already in use/);
  assert.ok(!fs.existsSync(path.join(otherProject, '.ux-planner/runner.lock')));
  const handoff = JSON.parse(run('export')); assert.ok(handoff.documents.length > 20);
  assert.equal(handoff.project, path.basename(root));
  console.log('PASS: offline install/reinstall, no marketing site, root redirect, init preservation, five production routes, assets, origin guard, live/stale locks, port collision, JSON handoff.');
} finally {
  if (server && server.exitCode === null) { const closed = once(server, 'exit'); server.kill('SIGTERM'); await closed; }
  assert.ok(!fs.existsSync(path.join(root, '.ux-planner/runner.lock')), 'Session lock must be removed on shutdown');
  fs.rmSync(root, { recursive: true, force: true });
}
