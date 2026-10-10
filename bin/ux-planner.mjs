#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { registerWorkspace } from '../mcp/workspaces.mjs';
import { collections, initializeWorkspace, listFiles, readText, safePath } from '../src/lib/server/workspace.mjs';
const packageRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const help=`UX Planner — planning files in your repository\n\n  ux-planner init [--root path]      Create empty planning folders (preserves files)\n  ux-planner start [--root path]     Open your local workspace\n  ux-planner demo                    Edit a disposable copy of the sample workspace\n  ux-planner export [--root path]    Write a JSON handoff to stdout\n\nOptions: --port 4311, --dev (source checkout), --help\nNode.js 22.15 or newer. The server binds to 127.0.0.1 only.\n`;
function main() {
try {
  const {values,positionals}=parseArgs({options:{root:{type:'string'},port:{type:'string',default:'4311'},help:{type:'boolean'},dev:{type:'boolean'}},allowPositionals:true});
  const command=positionals[0];
  if(values.help || !command){console.log(help);return;}
  if(positionals.length!==1 || !['init','start','demo','export'].includes(command))throw new Error('Unknown command. Use --help.');
  const [major,minor]=process.versions.node.split('.').map(Number);
  if(major<22 || (major===22 && minor<15))throw new Error('Node.js 22.15 or newer is required.');
  let root=path.resolve(values.root || process.cwd());
  if(command==='demo') {root=fs.mkdtempSync(path.join(os.tmpdir(),'ux-planner-demo-'));fs.cpSync(path.join(packageRoot,'sample'),path.join(root,'docs/ux'),{recursive:true});}
  if(!fs.statSync(root).isDirectory())throw new Error('Workspace root must be a directory');
  process.env.UX_PLANNER_ROOT=root;
  if(command==='init') {initializeWorkspace();registerWorkspace(root);console.log(`Planning folders ready: ${path.join(root,'docs/ux')}`);return;}
  if(command==='export') {
    const documents=[];
    function visit(collection,segments=[]) {
      for(const entry of listFiles(collection,...segments)) {
        if(entry.isDirectory())visit(collection,[...segments,entry.name]);
        else if(entry.isFile() && /\.(json|md)$/.test(entry.name)) {
          const content=readText(collection,...segments,entry.name);
          documents.push({path:['docs','ux',collection,...segments,entry.name].join('/'),format:entry.name.endsWith('.json')?'json':'markdown',content:entry.name.endsWith('.json')?JSON.parse(content):content});
        }
      }
    }
    for(const collection of collections)visit(collection);
    console.log(JSON.stringify({version:1,application:'ux-planner',project:path.basename(root),documents},null,2));return;
  }
  if(!fs.existsSync(safePath()))throw new Error('No planning folder found. Run ux-planner init first.');
  registerWorkspace(root);
  const port=Number(values.port);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Port must be an integer from 1024 to 65535.');
  const server=path.join(packageRoot,'.next/standalone/server.js');
  if(!values.dev && !fs.existsSync(server))throw new Error('Runtime is not built. In the UX Planner source checkout run npm install && npm run build.');
  const lockDir=path.join(root,'.ux-planner');
  if(fs.existsSync(lockDir) && fs.lstatSync(lockDir).isSymbolicLink())throw new Error('Workspace lock directory cannot be a symbolic link');
  fs.mkdirSync(lockDir,{recursive:true});
  const lockPath=path.join(lockDir,'runner.lock');
  if(fs.existsSync(lockPath)) {
    if(fs.lstatSync(lockPath).isSymbolicLink())throw new Error('Invalid runner lock');
    const owner=JSON.parse(fs.readFileSync(lockPath,'utf8'));
    if(!Number.isSafeInteger(owner.pid)||owner.pid<1)throw new Error('Invalid runner lock; check .ux-planner/runner.lock manually');
    try {process.kill(owner.pid,0);throw new Error('A UX Planner session is already running for this repository.');}
    catch(error) {if(error.code!=='ESRCH')throw error;fs.unlinkSync(lockPath);}
  }
  const token=randomUUID();
  fs.writeFileSync(lockPath,JSON.stringify({pid:process.pid,port,token}),{flag:'wx',mode:0o600});
  const cleanup=()=>{try {if(JSON.parse(fs.readFileSync(lockPath,'utf8')).pid===process.pid)fs.unlinkSync(lockPath);}catch{}};
  process.on('exit',cleanup);
  const args=values.dev ? [path.join(packageRoot,'node_modules/next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port',String(port)] : [server];
  const child=spawn(process.execPath,args,{cwd:packageRoot,stdio:'inherit',env:{...process.env,UX_PLANNER_ROOT:root,UX_PLANNER_WRITE:'1',UX_PLANNER_MCP_TOKEN:token,HOSTNAME:'127.0.0.1',PORT:String(port)}});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
  child.on('error',error=>{console.error(error.message);process.exit(1);});
  child.on('exit',code=>{cleanup();process.exit(code ?? 0);});
  console.log(`UX Planner: http://127.0.0.1:${port}/ux-planner\nWorkspace: ${root}${command==='demo'?' (disposable demo copy)':''}`);
} catch(error) {console.error(`UX Planner: ${error.message}`);process.exitCode=1;}

}
main();
