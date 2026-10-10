import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ux-routing-'));
const registry=path.join(temp,'registry'),unregistered=path.join(temp,'unregistered'), a=path.join(temp,'repo-a'),b=path.join(temp,'repo-b'),missing=path.join(temp,'missing');
const env={...process.env,UX_PLANNER_REGISTRY_DIR:registry};
fs.mkdirSync(registry);fs.mkdirSync(missing);
const id=root=>createHash('sha256').update(fs.realpathSync(root)).digest('hex');
for(const root of [a,b,unregistered])fs.cpSync('sample',path.join(root,'docs/ux'),{recursive:true});
const server=path.resolve('mcp/server.bundle.mjs'),cli=path.resolve('bin/ux-planner.mjs'),clients=[],runners=[];
const port=Number(process.env.UX_ROUTING_TEST_PORT||4355);
async function start(root,port){
  const runner=spawn(process.execPath,[cli,'start','--root',root,'--port',String(port)],{env,stdio:['ignore','pipe','pipe']});runners.push(runner);let log='';runner.stdout.on('data',d=>log+=d);runner.stderr.on('data',d=>log+=d);
  for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/integration`)).ok)return runner;}catch{}if(runner.exitCode!==null)break;await new Promise(r=>setTimeout(r,100));}throw new Error(log);
}
async function connect(cwd,roots){
  const client=new Client({name:'UX routing check',version:'1'},{capabilities:roots?{roots:{listChanged:true}}:{}});clients.push(client);
  if(roots)client.setRequestHandler(ListRootsRequestSchema,async()=>({roots:roots.map(root=>({uri:pathToFileURL(root).href}))}));
  await client.connect(new StdioClientTransport({command:process.execPath,args:[server],cwd,env}));return client;
}
const call=(client,name,args={})=>client.callTool({name,arguments:args});
try{
  await start(a,port);const runnerB=await start(b,port+1);
  const global=await connect('/');
  const opened=await call(global,'open_workspace');
  assert.ok(!opened.isError,'Global opening must show a picker even without a runner in cwd /: '+JSON.stringify(opened));
  assert.equal(opened.structuredContent.mode,'global');
  assert.equal(opened.structuredContent.projects.length,2,'Global picker lists only registered projects');
  assert.ok(!opened.structuredContent.projects.some(p=>p.id===id(unregistered)),'An unregistered repository is never listed');
  const record=path.join(registry,id(a)+'.json'),validRecord=fs.readFileSync(record,'utf8');
  fs.writeFileSync(record,JSON.stringify({version:1,root:a+'/.'}));assert.equal((await call(global,'open_workspace')).structuredContent.projects.length,1,'Registry root must equal canonical realpath');fs.writeFileSync(record,validRecord);

  assert.ok(!opened.structuredContent.documents,'Opening globally must not read documents before explicit choice');
  assert.ok((await call(global,'list_documents')).isError,'Global reads require explicit workspace');
  const unregisteredChat=await connect(unregistered);assert.equal((await call(unregisteredChat,'open_workspace')).structuredContent.projects.length,0,'An unregistered repository chat opens nothing');
  const ca=await connect(a,[a]),cb=await connect(b),wrong=await connect(b,[a]),none=await connect(missing);
  assert.equal((await call(ca,'open_workspace')).structuredContent.root,fs.realpathSync(a));
  assert.equal((await call(cb,'open_workspace')).structuredContent.root,fs.realpathSync(b));
  assert.ok((await call(wrong,'list_documents')).isError,'Conflicting MCP roots/cwd must fail closed');
  const absent=await call(none,'open_workspace');assert.equal(absent.structuredContent.mode,'repository');assert.equal(absent.structuredContent.projects.length,0);
  assert.ok((await call(none,'list_documents',{workspace:id(a)})).isError,'Missing repo may not fall back to another registered repo');
  assert.ok((await call(ca,'list_documents',{workspace:id(b)})).isError,'Repo A process must reject repo B');
  const catalog=(await call(ca,'list_documents')).structuredContent;
  assert.equal(catalog.workspace.id,id(a));
  const target='user-journeys/onboarding/persona-2.json';
  const read=(await call(ca,'read_documents',{ids:[target]})).structuredContent.documents[0];
  const data=JSON.parse(read.content),row=data.rows[0].id,column=data.columns[0].id;
  const beforeB=fs.readFileSync(path.join(b,'docs/ux',target),'utf8');
  const args={id:target,revision:read.revision,row,column,text:'ROUTING A ONLY'};
  for(const [name,input] of [['list_documents',{}],['read_documents',{ids:[target]}],['workspace_snapshot',{path:'/ux-planner/user-journeys'}],['add_journey_item',args]]){
    const denied=await call(global,name,{...input,workspace:id(unregistered)});assert.ok(denied.isError);assert.match(denied.content[0].text,/Registered workspace not found/,'An unregistered workspace ID never authorizes operations');
  }
  await assert.rejects(global.readResource({uri:'ux-planner://workspace/'+id(unregistered)+'/document/'+target}),/Registered workspace not found/);
  assert.ok((await call(ca,'add_journey_item',{...args,workspace:id(b)})).isError);
  assert.ok(!(await call(ca,'add_journey_item',args)).isError);
  assert.equal(fs.readFileSync(path.join(b,'docs/ux',target),'utf8'),beforeB);
  assert.ok(fs.readFileSync(path.join(a,'docs/ux',target),'utf8').includes('ROUTING A ONLY'));
  for(const root of [a,b]){
    const selected=(await call(global,'list_documents',{workspace:id(root)})).structuredContent;
    assert.equal(selected.workspace.id,id(root));assert.ok(selected.documents[0].uri.includes('/workspace/'+id(root)+'/'));
  }
  const fromA=(await global.readResource({uri:catalog.documents.find(d=>d.id===target).uri})).contents[0];assert.ok(fromA.text.includes('ROUTING A ONLY'));
  await assert.rejects(cb.readResource({uri:catalog.documents[0].uri}),/current repository|another repository|workspace/i);
  const lockA=JSON.parse(fs.readFileSync(path.join(a,'.ux-planner/runner.lock'),'utf8'));
  assert.equal((await fetch(`http://127.0.0.1:${port+1}/api/integration`,{method:'POST',headers:{Origin:`http://127.0.0.1:${port+1}`,'Content-Type':'application/json',Authorization:'Bearer '+lockA.token},body:JSON.stringify({action:'list_documents'})})).status,403,'A token cannot read B');
  const stopped=once(runnerB,'exit');runnerB.kill('SIGTERM');await stopped;
  const projects=(await call(global,'workspace_context')).structuredContent.projects;
  const inactive=projects.find(p=>p.id===id(b));assert.ok(inactive);assert.equal(inactive.running,false);assert.ok(inactive.startCommand);
  assert.ok((await call(global,'list_documents',{workspace:id(b)})).isError,'Stopped selection cannot silently read A');
  console.log('PASS: two localhost roots, registered-only global picker, non-canonical record rejection, unregistered access denied, global explicit selection, stopped discovery, per-chat cwd/MCP roots, missing/conflicting roots fail closed, isolated resources/reads/writes/tokens.');
}finally{
  for(const client of clients)await client.close();
  for(const runner of runners)if(runner.exitCode===null){const exit=once(runner,'exit');runner.kill('SIGTERM');await exit;}
  fs.rmSync(temp,{recursive:true,force:true});
}
