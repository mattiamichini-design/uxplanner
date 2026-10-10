import fs from 'node:fs';
import { workspaceRoot } from '@/lib/server/workspace.mjs';
import { timingSafeEqual } from 'node:crypto';
import { addJourneyItem, updateJourneyItem } from '@/actions/user-journey';
import { createStory } from '@/app/actions/user-story';
import { integrationDocuments, readIntegrationDocuments, integrationWorkspace } from '@/lib/server/integration';
import { integrationTools, workspaceViewSchema } from '@/lib/server/integration-schemas.mjs';

export const dynamic='force-dynamic';
const bound=(data:Record<string,unknown>,status=200)=>Response.json({...data,workspaceRoot:fs.realpathSync(workspaceRoot())},{status});
function authenticated(request:Request) {
  const expected=process.env.UX_PLANNER_MCP_TOKEN;
  const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'');
  return Boolean(expected && supplied && supplied.length===expected.length && timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)));
}
export async function GET() {
  try { return Response.json(integrationDocuments(),{headers:{'Cache-Control':'no-store'}}); }
  catch(error){ return Response.json({error:error instanceof Error?error.message:'Could not read workspace'},{status:400}); }
}
export async function POST(request:Request) {
  try {
    const host=request.headers.get('host');
    if(!host || request.headers.get('origin')!==`http://${host}`)return Response.json({error:'Local origin required'},{status:403});
    if(Number(request.headers.get('content-length'))>350_000)return Response.json({error:'Request too large'},{status:413});
    const raw=await request.text();
    if(Buffer.byteLength(raw)>350_000)return Response.json({error:'Request too large'},{status:413});
    const {action,...args}=JSON.parse(raw);
    if(action==='read') {
      const input=integrationTools.read_documents.schema.parse(args);
      return Response.json(readIntegrationDocuments(input.ids));
    }
    if(!authenticated(request))return Response.json({error:'Local MCP session authorization required'},{status:403});
    if(action==='workspace_identity')return bound({});
    if(action==='list_documents'){integrationTools.list_documents.schema.parse(args);return bound(integrationDocuments());}
    if(action==='read_documents')return bound(readIntegrationDocuments(integrationTools.read_documents.schema.parse(args).ids));
    if(action==='workspace_snapshot')return bound(integrationWorkspace(workspaceViewSchema.parse(args).path));
    let result;
    if(action==='create_story') {
      const input=integrationTools.create_story.schema.parse(args);
      result=await createStory(input.title,input.category,input.journey);
    } else if(action==='add_journey_item'||action==='update_journey_item') {
      const doc=integrationDocuments().documents.find(d=>d.id===args.id && d.kind==='journey');
      if(!doc)throw new Error('Journey not found');
      const [,type,filename]=doc.id.split('/');const persona=filename.slice(0,-5);
      if(action==='add_journey_item') {
        const data=integrationTools.add_journey_item.schema.parse(args);
        result=await addJourneyItem(type,persona,data.row,data.column,data.text,data.revision);
      } else {
        const data=integrationTools.update_journey_item.schema.parse(args);
        result=await updateJourneyItem(type,persona,data.row,data.column,data.index,data.item,data.revision);
      }
    } else throw new Error('Unsupported operation');
    return bound(result,result.success?200:409);
  } catch(error) { return Response.json({error:error instanceof Error?error.message:'Could not complete operation'},{status:400}); }
}
