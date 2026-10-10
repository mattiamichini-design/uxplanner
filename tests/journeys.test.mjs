import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
// Node 22 strips TypeScript; resolve the same source aliases as Next for these server-unit checks.
registerHooks({resolve(specifier,context,next){
 if(specifier==='server-only')return {url:'data:text/javascript,export {}',shortCircuit:true};
 if(specifier.startsWith('@/'))specifier=pathToFileURL(path.resolve('src',specifier.slice(2))).href;
 if(specifier.startsWith('.')||specifier.startsWith('file:')){
  const url=new URL(specifier,context.parentURL);
  if(!path.extname(url.pathname)&&fs.existsSync(fileURLToPath(url)+'.ts'))return next(url.href+'.ts',context);
 }
 return next(specifier,context);
}});
const {parseJourneyData}=await import('../src/lib/server/user-journey-payload.ts');
const {editJourneys,requireCell}=await import('../src/lib/server/journey-store.ts');
const {initializeWorkspace,safePath,serialized}=await import('../src/lib/server/workspace.mjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ux-planner-journeys-'));process.env.UX_PLANNER_ROOT=root;initializeWorkspace();
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
const valid={title:'Trial',meta:{persona:'Chef'},columns:[{id:'first',label:'Start'}],rows:[{id:'actions',label:'Actions',cells:[{columnId:'first',items:[{text:'Plan'}]}]}]};
test('journey validation rejects invalid IDs, dangling cells and oversized payloads',()=>{
 assert.equal(parseJourneyData(valid).rows.length,1);
 for(const data of [{...valid,columns:[...valid.columns,...valid.columns]},{...valid,rows:[{...valid.rows[0],cells:[{columnId:'missing',items:[]}]}]},{...valid,title:'x'.repeat(501)},{...valid,rows:[{...valid.rows[0],cells:[{columnId:'first',items:[{text:'a',emphasis:'wrong'}]}]}]}])assert.throws(()=>parseJourneyData(data));
});
test('every sample journey satisfies the current schema',()=>{
 const base='sample/user-journeys';let count=0;
 for(const folder of fs.readdirSync(base,{withFileTypes:true}).filter(e=>e.isDirectory()))for(const name of fs.readdirSync(path.join(base,folder.name)).filter(n=>n.endsWith('.json')&&n!=='meta.json')){parseJourneyData(JSON.parse(fs.readFileSync(path.join(base,folder.name,name),'utf8')));count++;}
 assert.ok(count>=5);
});
test('multi-persona mutation validates every document before writes',()=>{
 fs.mkdirSync(safePath('user-journeys','trial'));for(const persona of ['chef','baker'])fs.writeFileSync(safePath('user-journeys','trial',`${persona}.json`),JSON.stringify(valid));
 assert.throws(()=>editJourneys('trial',['chef','baker'],([a,b])=>{a.title='should not persist';b.columns=[];}));
 assert.equal(JSON.parse(fs.readFileSync(safePath('user-journeys','trial','chef.json'),'utf8')).title,'Trial');
});
test('concurrent local edits preserve both changes',async()=>{
 await Promise.all(['One','Two'].map(text=>serialized(()=>editJourneys('trial',['chef'],([data])=>requireCell(data,'actions','first').items.push({text})))));
 assert.deepEqual(JSON.parse(fs.readFileSync(safePath('user-journeys','trial','chef.json'),'utf8')).rows[0].cells[0].items.map(i=>i.text),['Plan','One','Two']);
});
