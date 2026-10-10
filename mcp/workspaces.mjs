import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
// init and start record each project here so the MCP server can only reach repositories the user opted in.
export const registryDirectory=()=>path.resolve(process.env.UX_PLANNER_REGISTRY_DIR||path.join(process.env.XDG_DATA_HOME||path.join(os.homedir(),'.local/share'),'ux-planner','workspaces'));
export const workspaceId=root=>createHash('sha256').update(root).digest('hex');
export function canonicalWorkspace(root){
  if(!path.isAbsolute(root))throw new Error('Workspace root must be absolute.');
  const canonical=fs.realpathSync(root);
  if(canonical===path.parse(canonical).root)throw new Error('The filesystem root is not a planning repository.');
  for(const directory of [path.join(canonical,'docs'),path.join(canonical,'docs/ux')]){
    if(fs.lstatSync(directory).isSymbolicLink()||!fs.statSync(directory).isDirectory())throw new Error('Planning directories must be real directories.');
  }
  return canonical;
}
export function registerWorkspace(root){
  root=canonicalWorkspace(root);
  const directory=registryDirectory();fs.mkdirSync(directory,{recursive:true,mode:0o700});
  if(fs.lstatSync(directory).isSymbolicLink())throw new Error('Workspace registry cannot be a symbolic link.');
  const file=path.join(directory,workspaceId(root)+'.json'),temporary=file+'.'+randomUUID()+'.tmp';
  try{fs.writeFileSync(temporary,JSON.stringify({version:1,root})+'\n',{flag:'wx',mode:0o600});fs.renameSync(temporary,file);}
  finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
  return root;
}
export function registeredWorkspaces(){
  const directory=registryDirectory();
  if(!fs.existsSync(directory))return [];
  if(fs.lstatSync(directory).isSymbolicLink())throw new Error('Workspace registry cannot be a symbolic link.');
  const files=fs.readdirSync(directory).filter(name=>/^[a-f0-9]{64}\.json$/.test(name));
  if(files.length>1000)throw new Error('Workspace registry exceeds the 1000 project limit.');
  return files.flatMap(name=>{
    try{
      const file=path.join(directory,name);
      if(fs.lstatSync(file).isSymbolicLink()||fs.statSync(file).size>8192)return [];
      const record=JSON.parse(fs.readFileSync(file,'utf8'));
      if(record.version!==1||typeof record.root!=='string'||Object.keys(record).some(key=>!['version','root'].includes(key)))return [];
      const root=canonicalWorkspace(record.root),id=workspaceId(root);
      if(root!==record.root||name!==id+'.json')return [];
      return [{id,root,name:path.basename(root),registered:true}];
    }catch{return [];}
  }).sort((a,b)=>a.root.localeCompare(b.root));
}
export function runnerSession(root){
  try{
    const directory=path.join(root,'.ux-planner'),file=path.join(directory,'runner.lock');
    if(fs.lstatSync(directory).isSymbolicLink()||fs.lstatSync(file).isSymbolicLink()||fs.statSync(file).size>8192)throw new Error('Invalid runner lock.');
    const info=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!Number.isSafeInteger(info.pid)||info.pid<1||!Number.isInteger(info.port)||info.port<1024||info.port>65535||!/^[-a-f0-9]{36}$/.test(info.token))throw new Error('Invalid runner lock.');
    process.kill(info.pid,0);
    return {...info,origin:`http://127.0.0.1:${info.port}`};
  }catch{throw new Error('Start the UX Planner runner for this repository.');}
}
