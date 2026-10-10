import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'ux-planner-stories-'));
process.env.UX_PLANNER_ROOT=root;
const {initializeWorkspace,safePath}=await import('../src/lib/server/workspace.mjs');
const {getAllStories}=await import('../src/lib/stories/registry.ts');
initializeWorkspace();
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));

test('story frontmatter exposes category and journey with a safe fallback',()=>{
  fs.writeFileSync(safePath('user-stories','categorized.md'),'---\ncategory: Activities\njourney: activities\n---\n# Categorized\n');
  fs.writeFileSync(safePath('user-stories','legacy.md'),'# Legacy\n');
  assert.deepEqual(getAllStories().map(({slug,title,category,journey})=>({slug,title,category,journey})),[
    {slug:'categorized',title:'Categorized',category:'Activities',journey:'activities'},
    {slug:'legacy',title:'Legacy',category:'Uncategorized',journey:undefined},
  ]);
});
