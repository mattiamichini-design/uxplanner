import { getAllPersonas, personaFilename } from '../personas/registry';
import { getAllJourneys, getAllJourneyTypes, getAllPersonas as journeyPersonas } from '../user-journey/registry';
import { getAllFlowTypes, getFlowsByType } from '../user-flow/registry';
import { getAllStories } from '../stories/registry';
import { readText, revision } from './workspace.mjs';
import { parseJourneyData } from './user-journey-payload';

// ponytail: reuse registry scans per poll; cache by file revision only if large workspaces make polling expensive.
export function integrationDocuments() {
  const documents = [
    ...getAllPersonas().map(p => ({id:`personas/${personaFilename(p.slug)!}`,kind:'persona',title:p.name,url:`/ux-planner/user-personas/${encodeURIComponent(p.slug)}`})),
    ...getAllJourneys().map(j => ({id:`user-journeys/${j.journeyTypeSlug}/${j.personaSlug}.json`,kind:'journey',title:`${j.title} · ${j.persona}`,url:`/ux-planner/user-journeys/${encodeURIComponent(j.journeyTypeSlug)}?persona=${encodeURIComponent(j.personaSlug)}`})),
    ...getAllFlowTypes().flatMap(t => getFlowsByType(t.slug).map(f => ({id:`user-flows/${t.slug}/${f.slug}.md`,kind:'flow',title:f.title,url:`/ux-planner/user-flows/${encodeURIComponent(t.slug)}?persona=${encodeURIComponent(f.slug)}`}))),
    ...getAllStories().map(s => ({id:s.sourcePath.replace('docs/ux/',''),kind:'story',title:s.title,url:`/ux-planner/user-stories/${encodeURIComponent(s.slug)}`})),
  ].map(d => ({...d,uri:`ux-planner://document/${d.id.split('/').map(encodeURIComponent).join('/')}`,revision:revision(readText(...d.id.split('/')))}));
  return {documents,revision:revision(JSON.stringify(documents))};
}
export function readIntegrationDocuments(ids: string[]) {
  const catalog=integrationDocuments().documents;
  const documents=[...new Set(ids)].map(id=>{
    const doc=catalog.find(d=>d.id===id);
    if(!doc)throw new Error('UX document not found');
    const content=readText(...id.split('/'));
    if(doc.kind==='journey')parseJourneyData(JSON.parse(content));
    return {...doc,content,revision:revision(content)};
  });
  if(documents.reduce((n,d)=>n+Buffer.byteLength(d.content),0)>300_000)throw new Error('Select fewer documents: context is limited to 300 KB.');
  return {documents};
}

// Page bodies are scoped to the opened page; other documents contribute navigation metadata only.
export function integrationWorkspace(path:string) {
  const page=new URL(path,'http://localhost');
  const [, ,section,encodedSlug]=page.pathname.split('/');
  const slug=encodedSlug?decodeURIComponent(encodedSlug):undefined;
  const journeyTypes=getAllJourneyTypes(),journeys=getAllJourneys(),personas=getAllPersonas(),flowTypes=getAllFlowTypes();
  const candidates=section==='user-journeys'?journeys.filter(j=>j.journeyTypeSlug===slug):[];
  const requested=page.searchParams.get('compare')==='true'&&page.searchParams.get('personas')?page.searchParams.get('personas')!.split(','):[page.searchParams.get('persona')];
  let selected=candidates.filter(j=>requested.includes(j.personaSlug));
  if(!selected.length&&candidates.length) {
    const first=personas.find(p=>candidates.some(j=>j.personaSlug===p.slug));
    selected=[candidates.find(j=>j.personaSlug===first?.slug)??candidates[0]];
  }
  if(selected.length>12)throw new Error('Select at most 12 journey variants.');
  const snapshot={
    journeyTypes,journeyPersonas:journeyPersonas(),journeys,
    boards:Object.fromEntries(selected.map(j=>[`${j.journeyTypeSlug}/${j.personaSlug}`,parseJourneyData(JSON.parse(readText('user-journeys',j.journeyTypeSlug,`${j.personaSlug}.json`)))])),
    personas:personas.map(p=>({...p,content:section==='user-personas'&&p.slug===slug?p.content:''})),
    flowTypes,flows:section==='user-flows'&&flowTypes.some(t=>t.slug===slug)?{[slug!]:getFlowsByType(slug!)}:{},
    stories:getAllStories().map(s=>({...s,content:section==='user-stories'&&s.slug===slug?s.content:''})),
    catalog:integrationDocuments(),
  };
  if(Buffer.byteLength(JSON.stringify(snapshot))>2_000_000)throw new Error('This page exceeds the 2 MB embedded view limit. Open it in localhost.');
  return snapshot;
}
