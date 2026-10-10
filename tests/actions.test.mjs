import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
// Node 22 strips TypeScript; resolve the same source aliases as Next for these server-unit checks.
registerHooks({resolve(specifier,context,next){
 if(specifier==='next/cache')return {url:'data:text/javascript,export function revalidatePath(){}',shortCircuit:true};
 if(specifier==='next/headers')return {url:'data:text/javascript,export async function headers(){return new Headers({host:process.env.TEST_HOST||%22127.0.0.1:4311%22,origin:process.env.TEST_ORIGIN||%22http://127.0.0.1:4311%22})}',shortCircuit:true};
 if(specifier==='server-only')return {url:'data:text/javascript,export {}',shortCircuit:true};
 if(specifier.startsWith('@/'))specifier=pathToFileURL(path.resolve('src',specifier.slice(2))).href;
 if(specifier.startsWith('.')||specifier.startsWith('file:')){
  const url=new URL(specifier,context.parentURL);
  if(!path.extname(url.pathname)&&fs.existsSync(fileURLToPath(url)+'.ts'))return next(url.href+'.ts',context);
 }
 return next(specifier,context);
}});
const {createPersona,updatePersona,deletePersona}=await import('../src/actions/user-persona.ts');
const {updateJourneyRow,deleteJourneyRow}=await import('../src/actions/user-journey.ts');
const {createNewJourney,updateJourneyType,deleteJourneyType}=await import('../src/app/actions/user-journey.ts');
const {createStory}=await import('../src/app/actions/user-story.ts');
const {getPersonaBySlug}=await import('../src/lib/personas/registry.ts');
const {initializeWorkspace,safePath}=await import('../src/lib/server/workspace.mjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ux-planner-actions-'));
process.env.UX_PLANNER_ROOT=root;process.env.UX_PLANNER_WRITE='1';initializeWorkspace();
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
test('local session rejects foreign origins and disabled writes without creating files',async()=>{
 process.env.TEST_ORIGIN='https://other.example';assert.equal((await createPersona('Blocked')).success,false);
 delete process.env.TEST_ORIGIN;process.env.UX_PLANNER_WRITE='0';assert.equal((await createPersona('Blocked')).success,false);
 process.env.UX_PLANNER_WRITE='1';assert.equal(fs.readdirSync(safePath('personas')).length,0);
});
test('persona updates preserve prefixed filenames, IDs, extension metadata and reject stale forms',async()=>{
 fs.writeFileSync(safePath('personas','02-chef.md'),'---\nid: P-002\nslug: chef\nname: Chef\nsource: study-01\nupdated: original\n---\nNotes\n');
 assert.equal((await updatePersona('chef',{name:'Chef',role:'Baker',content:'New notes'},'original')).success,true);
 const result=fs.readFileSync(safePath('personas','02-chef.md'),'utf8');assert.match(result,/id: P-002/);assert.match(result,/source: study-01/);
 assert.equal(fs.existsSync(safePath('personas','chef.md')),false);
 assert.equal((await updatePersona('chef',{name:'Chef',content:'stale'},'original')).success,false);
 assert.equal(getPersonaBySlug('chef').role,'Baker');
});
test('journey lifecycle is non-destructive across duplicate creation, legacy metadata and recreation',async()=>{
 assert.equal((await createNewJourney('Trial','',['chef'])).success,true);
 const original=fs.readFileSync(safePath('user-journeys','trial','chef.json'),'utf8');
 assert.equal((await createNewJourney('Trial','different',['chef'])).success,false);
 assert.equal(fs.readFileSync(safePath('user-journeys','trial','chef.json'),'utf8'),original);
 fs.unlinkSync(safePath('user-journeys','trial','meta.json'));
 assert.equal((await updateJourneyType('trial','Updated','Legacy')).success,true);
 assert.equal((await deletePersona('chef')).success,false);
 fs.writeFileSync(safePath('user-journeys','trial','notes.md'),'Keep');
 assert.equal((await deleteJourneyType('trial')).success,false);
 fs.unlinkSync(safePath('user-journeys','trial','notes.md'));
 assert.equal((await deleteJourneyType('trial')).success,true);
 assert.equal((await createNewJourney('Trial','',['chef'])).success,true);
});

test('story creation round-trips quoted categories and rejects multiline titles',async()=>{
 const category='Review: follow-up';
 const created=await createStory('Review summary',category,'activities');
 assert.equal(created.success,true);
 const source=fs.readFileSync(safePath('user-stories','review-summary.story.md'),'utf8');
 const {default:matter}=await import('gray-matter');
 const parsed=matter(source);
 assert.equal(parsed.data.category,category);
 assert.equal(parsed.data.journey,'activities');
 assert.match(parsed.content,/^# Review summary/m);
 assert.equal((await createStory('Bad\ntitle','Review')).success,false);
 assert.equal(fs.existsSync(safePath('user-stories','bad-title.story.md')),false);
});

test('standard and custom journey rows share rename and delete persistence across personas',async()=>{
 const folder=safePath('user-journeys','editable-rows');fs.mkdirSync(folder);
 const rows=[
  {id:'goals',label:'Goals',description:'Original',cells:[{columnId:'first',items:[{text:'Keep until deleted'}]}]},
  {id:'custom',label:'Custom',description:'Remain',cells:[{columnId:'first',items:[{text:'Keep'}]}]},
 ];
 for(const persona of ['chef','baker'])fs.writeFileSync(path.join(folder,`${persona}.json`),JSON.stringify({title:persona,meta:{persona,journeyType:'editable-rows',updatedAt:'original'},columns:[{id:'first',label:'Start'}],rows}));

 assert.equal((await updateJourneyRow('editable-rows','chef','goals','Outcomes','Value sought',true)).success,true);
 for(const persona of ['chef','baker']){
  const reloaded=JSON.parse(fs.readFileSync(path.join(folder,`${persona}.json`),'utf8'));
  assert.deepEqual(reloaded.rows.find(row=>row.id==='goals'),{id:'goals',label:'Outcomes',description:'Value sought',cells:[{columnId:'first',items:[{text:'Keep until deleted'}]}]});
 }

 const bakerPath=path.join(folder,'baker.json');
 const baker=JSON.parse(fs.readFileSync(bakerPath,'utf8'));baker.rows=baker.rows.filter(row=>row.id!=='goals');fs.writeFileSync(bakerPath,JSON.stringify(baker));
 assert.equal((await updateJourneyRow('editable-rows','chef','goals','Revised outcomes','Revised value',true)).success,true);
 assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'chef.json'),'utf8')).rows.find(row=>row.id==='goals').label,'Revised outcomes');
 assert.equal(JSON.parse(fs.readFileSync(bakerPath,'utf8')).rows.some(row=>row.id==='goals'),false);

 assert.equal((await deleteJourneyRow('editable-rows','chef','goals',true)).success,true);
 for(const persona of ['chef','baker']){
  const reloaded=JSON.parse(fs.readFileSync(path.join(folder,`${persona}.json`),'utf8'));
  assert.equal(reloaded.rows.some(row=>row.id==='goals'),false);
  assert.deepEqual(reloaded.rows.find(row=>row.id==='custom'),rows[1]);
 }
});

test('CSV batch import rejects a stale second persona without saving the first and preserves each identity',async()=>{
 const {importJourneyBoards}=await import('../src/actions/user-journey.ts');
 const folder=safePath('user-journeys','csv-batch');fs.mkdirSync(folder);
 const docs=['chef','baker'].map((persona,index)=>({title:persona,meta:{persona,journeyType:'csv-batch',updatedAt:'original',summary:`Summary ${persona}`},notes:[`Notes ${persona}`],uxArtifact:{id:`J-${index}`,canonicalRecord:`${persona}.md`,role:'projection',stepIds:['one']},columns:[{id:'one',label:'Start'}],rows:[{id:'actions',label:'Actions',cells:[]}]}));
 docs.forEach((doc)=>fs.writeFileSync(path.join(folder,`${doc.title}.json`),JSON.stringify(doc)));
 const entries=docs.map(doc=>({persona:doc.title,expectedUpdatedAt:'original',data:{columns:[{id:'two',label:'Imported'}],rows:[]}}));
 entries[1].expectedUpdatedAt='stale';
 assert.equal((await importJourneyBoards('csv-batch',entries)).success,false);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(folder,'chef.json'),'utf8')),docs[0]);
 entries[1].expectedUpdatedAt='original';assert.equal((await importJourneyBoards('csv-batch',entries)).success,true);
 docs.forEach(doc=>{const saved=JSON.parse(fs.readFileSync(path.join(folder,`${doc.title}.json`),'utf8'));assert.equal(saved.columns[0].id,'two');assert.equal(saved.meta.persona,doc.meta.persona);assert.equal(saved.meta.summary,doc.meta.summary);assert.deepEqual(saved.uxArtifact,doc.uxArtifact);assert.deepEqual(saved.notes,doc.notes);});
 assert.equal((await importJourneyBoards('csv-batch',[entries[0],entries[0]])).success,false);
});
