import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { initializeWorkspace, safePath, listFiles, commitFiles, readText, readJSON, serialized } from '../src/lib/server/workspace.mjs';
import { canonicalWorkspace } from '../mcp/workspaces.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ux-planner-test-'));
process.env.UX_PLANNER_ROOT=root;
process.env.UX_PLANNER_REGISTRY_DIR=path.join(root,'registry');
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
test('initialization preserves documents and works with arbitrary repository names',()=>{
 initializeWorkspace();const file=safePath('personas','chef.md');fs.writeFileSync(file,'# Original');initializeWorkspace();assert.equal(fs.readFileSync(file,'utf8'),'# Original');assert.equal(listFiles('user-journeys').length,0);
});
test('path traversal, dotfiles and symlink escapes are rejected',()=>{
 for(const segment of ['..','../secret','a/b','a\\b','.env','_private','C:escape',''])assert.throws(()=>safePath('personas',segment));
 fs.symlinkSync(os.tmpdir(),path.join(root,'docs/ux/user-flows/link'));assert.throws(()=>safePath('user-flows','link','external.md'),/Symbolic/);assert.equal(listFiles('user-flows').length,0);
});
test('atomic saves reject stale content and preserve original files',()=>{
 const segments=['personas','chef.md'];commitFiles([{segments,expected:'# Original',content:'# Updated'}]);assert.equal(readText(...segments),'# Updated');
 assert.throws(()=>commitFiles([{segments,expected:'# Original',content:'lost update'}]),/changed/);assert.equal(readText(...segments),'# Updated');
 assert.throws(()=>commitFiles([{segments,expected:null,content:'duplicate'}]),/changed/);
});
test('multi-file validation fails before replacing any file and cleans staging files',()=>{
 const segments=['personas','chef.md'];assert.throws(()=>commitFiles([{segments,expected:'# Updated',content:'bad'},{segments:['personas','other.md'],expected:'missing',content:'bad'}]),/changed/);
 assert.equal(readText(...segments),'# Updated');assert.deepEqual(listFiles('personas').map(f=>f.name),['chef.md']);
});
test('concurrent mutations serialize and the queue recovers after failure',async()=>{
 const result=[];await Promise.all([serialized(async()=>{await new Promise(r=>setTimeout(r,5));result.push(1);}),serialized(()=>{result.push(2);throw new Error('failed');}).catch(()=>{}),serialized(()=>result.push(3))]);assert.deepEqual(result,[1,2,3]);
});
test('CLI exports canonical JSON and Markdown, rejects mistakes, preserves init',()=>{
 const run=(...args)=>spawnSync(process.execPath,['bin/ux-planner.mjs',...args],{encoding:'utf8'});
 assert.equal(run('init','--root',root).status,0);const out=run('export','--root',root);assert.equal(out.status,0,out.stderr);assert.equal(JSON.parse(out.stdout).documents[0].content,'# Updated');assert.equal(JSON.parse(out.stdout).documents[0].path,'docs/ux/personas/chef.md');
 const large='Planning notes '.repeat(15000);fs.writeFileSync(safePath('user-stories','large.md'),large);
 const exported=JSON.parse(run('export','--root',root).stdout);assert.equal(exported.documents.find(d=>d.path.endsWith('large.md')).content,large);
 assert.equal(run('typo').status,1);assert.equal(run('start','--root',root,'--port','1').status,1);assert.equal(run('init','--oops').status,1);
});

test('malformed JSON identifies the document without changing it',()=>{
 const segments=['user-journeys','broken.json'];fs.writeFileSync(safePath(...segments),'{ invalid');
 assert.throws(()=>readJSON(...segments),/user-journeys\/broken.json/);
 assert.equal(readText(...segments),'{ invalid');
});

test('a replacement I/O failure rolls back already-saved documents',()=>{
 const changes=['rollback-a.md','rollback-b.md'].map(name=>({segments:['personas',name],expected:null,content:'original'}));
 commitFiles(changes);
 const rename=fs.renameSync;let writes=0;
 fs.renameSync=(...args)=>{if(++writes===2)throw Object.assign(new Error('Simulated disk failure'),{code:'EIO'});return rename(...args);};
 try {assert.throws(()=>commitFiles(changes.map(change=>({...change,expected:'original',content:'updated'}))),/disk failure/);}
 finally {fs.renameSync=rename;}
 for(const change of changes)assert.equal(readText(...change.segments),'original');
 assert.equal(listFiles('personas').some(file=>file.name.endsWith('.tmp')),false);
});

test('legacy workspaces require a manual move and only docs/ux is canonical',()=>{
 const legacy=fs.mkdtempSync(path.join(os.tmpdir(),'ux-legacy-'));
 const previous=process.env.UX_PLANNER_ROOT;
 try {
  fs.mkdirSync(path.join(legacy,'docs/02-design/personas'),{recursive:true});
  fs.writeFileSync(path.join(legacy,'docs/02-design/personas/old.md'),'legacy');
  process.env.UX_PLANNER_ROOT=legacy;
  assert.throws(()=>initializeWorkspace(),/move.*manually/);
  for(const command of ['init','start','export']) {
   const result=spawnSync(process.execPath,['bin/ux-planner.mjs',command,'--root',legacy],{encoding:'utf8'});
   assert.equal(result.status,1);assert.match(result.stderr,/move.*manually/);
  }
  assert.ok(!fs.existsSync(path.join(legacy,'docs/ux')));
  assert.throws(()=>canonicalWorkspace(legacy));
  fs.symlinkSync(os.tmpdir(),path.join(legacy,'docs/ux'));
  assert.throws(()=>canonicalWorkspace(legacy),/real directories/);
  assert.throws(()=>safePath('personas'),/Symbolic/);
  fs.unlinkSync(path.join(legacy,'docs/ux'));
  fs.mkdirSync(path.join(legacy,'docs/ux/personas'),{recursive:true});
  initializeWorkspace();assert.equal(canonicalWorkspace(legacy),fs.realpathSync(legacy));assert.deepEqual(listFiles('personas'),[]);
  assert.equal(fs.readFileSync(path.join(legacy,'docs/02-design/personas/old.md'),'utf8'),'legacy');
 } finally {process.env.UX_PLANNER_ROOT=previous;fs.rmSync(legacy,{recursive:true,force:true});}
});
