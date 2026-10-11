import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ux-planner-mcp-test-'));
fs.cpSync('sample',path.join(root,'docs/ux'),{recursive:true});
const env={...process.env,UX_PLANNER_REGISTRY_DIR:path.join(root,'registry')};
const port=Number(process.env.UX_MCP_TEST_PORT||4331),base=`http://127.0.0.1:${port}`;
let log='',transport,client;
const runner=spawn(process.execPath,['bin/ux-planner.mjs','start','--root',root,'--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
runner.stdout.on('data',b=>log+=b);runner.stderr.on('data',b=>log+=b);
try {
  let ready=false;
  for(let i=0;i<100;i++){
    try{if((await fetch(base+'/api/integration')).ok){ready=true;break;}}catch{}
    if(runner.exitCode!==null)break;
    await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(ready,log);
  client=new Client({name:'UX Planner verification',version:'1.0.0'},{capabilities:{extensions:{'io.modelcontextprotocol/ui':{}}}});
  transport=new StdioClientTransport({command:process.execPath,args:[path.resolve('mcp/server.bundle.mjs')],cwd:root,env});
  await client.connect(transport);
  assert.ok(client.getServerCapabilities().extensions['io.modelcontextprotocol/ui']);
  const tools=(await client.listTools()).tools;
  assert.equal(tools.length,9);
  const open=tools.find(t=>t.name==='open_workspace');
  assert.deepEqual(open._meta['openai/ui'].entrypoints,[{type:'global'},{type:'thread'}]);
  assert.ok(tools.find(t=>t.name==='search_mentions')._meta['openai/extensions']['mentions/search']);
  const call=(name,args={})=>client.callTool({name,arguments:args});
  const opened=await call('open_workspace');assert.ok(!opened.isError,JSON.stringify(opened));
  const initialCatalog=(await call('list_documents')).structuredContent;
  const documents=initialCatalog.documents;
  for(const kind of ['journey','persona','flow','story'])assert.ok(documents.some(d=>d.kind===kind));
  const target=documents.find(d=>d.id==='user-journeys/onboarding/persona-2.json');assert.ok(target);
  const original=fs.readFileSync(path.join(root,'docs/ux',target.id),'utf8');
  const ui=(await client.readResource({uri:open._meta.ui.resourceUri})).contents[0];
  assert.equal(ui.mimeType,'text/html;profile=mcp-app');
  // Hosts can restore either saved entry point after an update or restart.
  for(const uri of ['ui://ux-planner/workspace-v2','ui://ux-planner/workspace-v3']) {
    const restored=(await client.readResource({uri})).contents[0];
    assert.equal(restored.uri,uri);assert.equal(restored.text,ui.text);
  }
  assert.ok(!/<iframe[^>]+src="http:/i.test(ui.text),'Desktop sandbox blocks HTTP frames');
  assert.ok(!ui.text.split('<script type="module">')[0].includes('<iframe'));
  assert.deepEqual(ui._meta.ui.csp,{connectDomains:[],resourceDomains:['data:','blob:'],frameDomains:[]});
  assert.deepEqual(tools.find(t=>t.name==='workspace_snapshot')._meta.ui.visibility,['app']);
  assert.ok(!tools.some(t=>t.name==='workspace_action'));
  const snapshot=(await call('workspace_snapshot',{path:'/ux-planner/user-journeys/onboarding?persona=persona-2'})).structuredContent;
  assert.deepEqual(Object.keys(snapshot.boards),['onboarding/persona-2']);
  assert.ok(snapshot.personas.every(p=>p.content===''));
  assert.ok(snapshot.stories.every(s=>s.content===''));
  assert.deepEqual(snapshot.flows,{});
  assert.ok((await call('workspace_snapshot',{path:'https://foreign.example/'})).isError);
  assert.equal((await fetch(base+'/api/integration',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'workspace_snapshot',path:'/ux-planner/user-journeys'})})).status,403);
  const resource=(await client.readResource({uri:target.uri})).contents[0];assert.equal(resource.text,original);
  const mentions=await call('search_mentions',{query:'onboarding'});assert.ok(mentions.structuredContent.items.some(d=>d.uri===target.uri));
  const read=await call('read_documents',{ids:[target.id]});const current=read.structuredContent.documents[0];
  const board=JSON.parse(current.content),row=board.rows[0].id,column=board.columns[0].id;
  const text='MCP verification item (disposable sample copy only)';
  const write={id:target.id,revision:current.revision,row,column,text};
  assert.equal((await fetch(base+'/api/integration',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'add_journey_item',...write})})).status,403);
  assert.equal((await fetch(base+'/api/integration',{headers:{Origin:'https://foreign.example'}})).status,403);
  assert.ok((await call('read_documents',{ids:['personas/../../secret.md']})).isError);
  const race=await Promise.all([call('add_journey_item',write),call('add_journey_item',write)]);
  assert.equal(race.filter(r=>!r.isError).length,1,'Only one write for the same revision may succeed');
  const after=(await call('read_documents',{ids:[target.id]})).structuredContent.documents[0];
  assert.notEqual(after.revision,current.revision);
  const data=JSON.parse(after.content),cell=data.rows[0].cells.find(c=>c.columnId===column);
  assert.equal(cell.items.filter(i=>i.text===text).length,1);
  assert.deepEqual(data.uxArtifact,board.uxArtifact);
  const index=cell.items.findIndex(i=>i.text===text);
  assert.ok(!(await call('update_journey_item',{id:target.id,revision:after.revision,row,column,index,item:{text:'Updated MCP verification item'}})).isError);
  assert.ok(!(await call('create_story',{title:'MCP verification story',category:'Synthetic test',journey:'onboarding'})).isError);
  assert.ok((await call('create_story',{title:'MCP verification story',category:'Synthetic test'})).isError);
  const catalog=await (await fetch(base+'/api/integration')).json();assert.notEqual(catalog.revision,initialCatalog.revision);assert.equal(catalog.revision,(await call('list_documents')).structuredContent.revision);
  for(const url of ['/ux-planner/user-journeys/onboarding?persona=persona-2','/ux-planner/user-personas/persona-2','/ux-planner/user-flows/account-setup','/ux-planner/user-stories','/ux-planner/user-stories/mcp-verification-story.story']){
    const response=await fetch(base+url);assert.equal(response.status,200,url);const html=await response.text();assert.ok(!html.includes('NEXT_ERROR_CODE'),url);
    if(url.includes('user-journeys'))assert.ok(html.includes('Updated MCP verification item'));
  }
  assert.equal(fs.readFileSync('sample/'+target.id,'utf8'),original,'Shipped sample stays unchanged');
  console.log('PASS: production localhost, MCP initialization/tools/resources/UI metadata, composer search, canonical reads, authorized add/edit/story creation, stale/concurrent writes, origin/path guards, shared file/UI synchronization, untouched source sample.');
}finally{
  await client?.close();
  if(runner.exitCode===null){const exit=once(runner,'exit');runner.kill('SIGTERM');await exit;}
  fs.rmSync(root,{recursive:true,force:true});
}
