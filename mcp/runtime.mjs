import { App } from '@modelcontextprotocol/ext-apps';
export const app = new App({ name: 'UX Planner', version: '0.1.4' }, { availableDisplayModes: ['inline', 'fullscreen'] }, { autoResize: false });
let snapshot;
let workspace;
export function setWorkspace(project) {
  if (!project?.registered || !project?.running || !/^[a-f0-9]{64}$/.test(project.id) || typeof project.root !== 'string') throw new Error('Select a running registered workspace.');
  workspace = { id: project.id, root: project.root };
  snapshot = undefined;
}
export const getWorkspaceContext = () => callTool('open_workspace', {});
export function setSnapshot(value) { snapshot = value; }
export function getSnapshot() {
  if (!snapshot) throw new Error('Planning workspace has not loaded.');
  return snapshot;
}
export async function callTool(name, args) {
  const contextOnly = name === 'open_workspace';
  if (!contextOnly && !workspace) throw new Error('Choose a workspace before reading or changing documents.');
  const binding = workspace;
  const result = await app.callServerTool({ name, arguments: contextOnly ? args : { ...args, workspace: binding.id } });
  if (result.isError) throw new Error(result.content?.find(item => item.type === 'text')?.text || 'The planning action failed.');
  if (!result.structuredContent) throw new Error('The planning server returned no data.');
  const data = result.structuredContent;
  if (!contextOnly && (workspace !== binding || data.workspace?.id !== binding.id || data.workspace?.root !== binding.root)) throw new Error('Workspace changed or response belongs to another repository. Refresh the page.');
  return data;
}
export const bridge = {
  capabilities() { const caps = app.getHostCapabilities(); return { canAttach: Boolean(caps?.updateModelContext), canSend: Boolean(caps?.message) }; },
  catalog: () => callTool('list_documents', {}),
  readDocuments: ids => callTool('read_documents', { ids }),
  async deliver(send, prompt, documents) {
    if (!workspace || documents.some(doc => doc.workspace !== workspace.id || doc.workspaceRoot !== workspace.root)) throw new Error('Selected documents belong to another workspace. Re-select them in this panel.');
    const caps = bridge.capabilities();
    if (!(send ? caps.canSend : caps.canAttach)) throw new Error('This client does not support this conversation action.');
    const content = documents.map(d => ({ type: 'text', text: `UX Planner ${d.kind}: ${d.title}\nID: ${d.id}\nRevision: ${d.revision}\nWorkspace: ${d.workspaceRoot || workspace?.root}\nSource: docs/ux/${d.id}\n\n${d.content}`, _meta: { 'openai/title': d.title } }));
    const result = send
      ? await app.sendMessage({ role: 'user', content: [{ type: 'text', text: prompt.slice(0, 4000) || 'Analyze these selected UX Planner documents and suggest improvements.' }, ...content] })
      : await app.updateModelContext({ content });
    if (result?.isError) throw new Error('The client did not deliver this context.');
  },
};

export async function nativeAction(action, args) {
  try {
    if (action === 'createStory') return await callTool('create_story', { title: args[0], category: args[1], journey: args[2] || '' });
    if (action !== 'addJourneyItem' && action !== 'updateJourneyItem') return { success: false, error: 'This workflow is available in the local UX Planner app.' };
    const [type, persona, row, column] = args;
    const id = `user-journeys/${type}/${persona}.json`;
    const document = getSnapshot().catalog.documents.find(doc => doc.id === id);
    if (!document) throw new Error('Journey document not found. Refresh this page.');
    const common = { id, revision: document.revision, row, column };
    return action === 'addJourneyItem'
      ? await callTool('add_journey_item', { ...common, text: args[4] })
      : await callTool('update_journey_item', { ...common, index: args[4], item: args[5] });
  } catch (error) { return { success: false, error: error.message }; }
}
