import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const aliases = {
  'next/navigation': path.resolve('mcp/navigation.jsx'),
  'next/link': path.resolve('mcp/navigation.jsx'),
};
const snapshotImport = `import {getSnapshot} from ${JSON.stringify(path.resolve('mcp/runtime.mjs'))};`;
const registries = {
  'lib/user-journey/registry': `${snapshotImport}
    export const getAllJourneyTypes=()=>getSnapshot().journeyTypes;
    export const getAllPersonas=()=>getSnapshot().journeyPersonas;
    export const getAllPersonaVariants=()=>getAllPersonas().map(p=>({...p,personaSlug:p.slug}));
    export const getPersonaBySlug=slug=>getAllPersonas().find(p=>p.slug===slug);
    export const getAllJourneys=()=>getSnapshot().journeys;
    export const getJourneysByType=slug=>getAllJourneys().filter(j=>j.journeyTypeSlug===slug);
    export const getJourneyBySlug=slug=>getAllJourneys().find(j=>j.slug===slug);
    export const getJourneyTypeBySlug=slug=>getAllJourneyTypes().find(t=>t.slug===slug);
    export const journeyExists=async slug=>Boolean(getJourneyBySlug(slug));`,
  'lib/user-journey/load': `${snapshotImport} export const loadJourney=async(type,persona)=>getSnapshot().boards[type+'/'+persona];`,
  'lib/personas/registry': `${snapshotImport} export const getAllPersonas=()=>getSnapshot().personas; export const getPersonaBySlug=slug=>getAllPersonas().find(p=>p.slug===slug);`,
  'lib/user-flow/registry': `${snapshotImport} export const getAllFlowTypes=()=>getSnapshot().flowTypes; export const getFlowsByType=type=>getSnapshot().flows[type]||[]; export const getFlowTypeBySlug=slug=>getAllFlowTypes().find(t=>t.slug===slug);`,
  'lib/stories/registry': `${snapshotImport} export const getAllStories=()=>getSnapshot().stories; export const getStoryBySlug=slug=>getAllStories().find(s=>s.slug===slug);`,
};
await build({
  entryPoints:['mcp/app.mjs'], outfile:'mcp/app.bundle.js', bundle:true, format:'esm', platform:'browser', minify:true,
  jsx:'automatic', define:{'process.env.NODE_ENV':'"production"'}, alias:aliases,
  plugins:[{name:'native-workspace',setup(builder){
    builder.onResolve({filter:/^@\/(?:actions\/|app\/actions\/|lib\/)/},args=>{
      const key=args.path.slice(2);
      if (registries[key] || /^(?:app\/)?actions\//.test(key)) return {path:key,namespace:'workspace'};
    });
    builder.onLoad({filter:/.*/,namespace:'workspace'},args=>{
      if(registries[args.path]) return {contents:registries[args.path],loader:'js',resolveDir:process.cwd()};
      const source=fs.readFileSync(path.resolve('src',args.path+'.ts'),'utf8');
      const names=[...source.matchAll(/export async function (\w+)\(/g)].map(match=>match[1]);
      if(!names.length) throw new Error('No action exports found: '+args.path);
      return {contents:`import {nativeAction} from ${JSON.stringify(path.resolve('mcp/runtime.mjs'))};
`+names.map(name=>`export const ${name}=(...args)=>nativeAction(${JSON.stringify(name)},args);`).join('\n'),loader:'js',resolveDir:process.cwd()};
    });
    builder.onLoad({filter:/\.css$/},()=>({contents:'',loader:'js'}));
  }}],
});
const cssFiles=fs.readdirSync('.next/static',{recursive:true}).filter(file=>file.endsWith('.css')).sort();
if(!cssFiles.length) throw new Error('Build the Next app before bundling its production CSS.');
const css=cssFiles.map(file=>fs.readFileSync(path.join('.next/static',file),'utf8')).join('\n').replace(/url\((['"]?)\/fonts\/([^)'"\s]+)\1\)/g,(_match,_quote,file)=>`url(data:font/woff2;base64,${fs.readFileSync(path.join('public/fonts',file)).toString('base64')})`);
fs.writeFileSync('mcp/app.bundle.css',css);
await build({entryPoints:['bin/ux-planner-mcp.mjs'],outfile:'mcp/server.bundle.mjs',bundle:true,format:'esm',platform:'node',packages:'bundle',banner:{js:"import { createRequire as createBundleRequire } from 'node:module'; const require = createBundleRequire(import.meta.url);"}});
